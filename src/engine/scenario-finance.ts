import type { SimulationInputs, ScenarioResult, MonthlySnapshot, InvestmentState } from "./types";
import { generateSACSchedule, generatePriceSchedule } from "./amortization";
import { monthlyGrossRate, advanceInvestment, netInvestmentValue } from "./investment";
import { calculateCapitalGainsTax } from "./taxes";
import { calculateSavingsPhase } from "./savings-phase";

export function calculateFinanceScenario(
  inputs: SimulationInputs,
  monthlyBudget: number
): ScenarioResult {
  const totalMonths = inputs.timeHorizonYears * 12;

  // Down payment and financing
  const downPayment = inputs.propertyValue * inputs.downPaymentPercent;
  const fgtsApplied = inputs.useFGTS ? inputs.fgtsAmount : 0;
  const effectiveDownPayment = downPayment + fgtsApplied;
  const loanAmount = Math.max(
    0,
    inputs.propertyValue - effectiveDownPayment
  );
  const financingMonths = inputs.financingTermYears * 12;

  // Upfront costs (financing does NOT require escritura — bank contract replaces it)
  const itbiCost = inputs.propertyValue * inputs.itbiRate;
  const registro = inputs.propertyValue * inputs.registroRate;
  const upfrontTotal = effectiveDownPayment + itbiCost + registro + inputs.taxaAvaliacao;

  const investmentRate = monthlyGrossRate(inputs.ipcaRate, inputs.tesouroSpread);

  // ─── SAVINGS PHASE ──────────────────────────────────────────
  const savingsResult = calculateSavingsPhase(
    inputs.currentCapital,
    inputs.currentRent,
    monthlyBudget,
    upfrontTotal,
    investmentRate,
    inputs.ipcaRate,
    totalMonths,
    inputs.rentAdjustmentRate,
  );

  const savingsMonths = savingsResult.months;
  const remainingMonths = totalMonths - savingsMonths;

  // If never reached target, return savings-only result
  if (remainingMonths <= 0) {
    const last = savingsResult.snapshots[savingsResult.snapshots.length - 1];
    const deflator = Math.pow(1 + inputs.ipcaRate / 12, totalMonths);

    return {
      name: "FINANCIAR",
      label: "Financiar",
      monthlySnapshots: savingsResult.snapshots,
      yearlySnapshots: savingsResult.snapshots.filter((s) => s.month % 12 === 0),
      finalWealth: last.totalWealth,
      finalWealthReal: last.totalWealthReal,
      totalSpent: last.totalSpent,
      totalSpentReal: last.totalSpent / deflator,
      effectiveMonthlyAvgCost: last.totalSpent / totalMonths,
      effectiveMonthlyAvgCostReal: last.totalSpent / deflator / totalMonths,
      totalInterestPaid: 0,
      upfrontCost: 0,
      savingsPhaseMonths: savingsMonths,
    };
  }

  // ─── FINANCING PHASE ────────────────────────────────────────
  // Capital after buying: whatever's left from savings minus upfront costs
  const capitalAtPurchase = netInvestmentValue(savingsResult.finalInvestment);
  const initialInvestment = capitalAtPurchase - upfrontTotal;

  // Generate amortization schedule
  const schedule =
    inputs.amortizationType === "SAC"
      ? generateSACSchedule(
          loanAmount,
          inputs.financingRate,
          financingMonths,
          inputs.propertyValue,
          inputs.mipRate,
          inputs.dfiRate,
          inputs.taxaAdministracao
        )
      : generatePriceSchedule(
          loanAmount,
          inputs.financingRate,
          financingMonths,
          inputs.propertyValue,
          inputs.mipRate,
          inputs.dfiRate,
          inputs.taxaAdministracao
        );

  let investment: InvestmentState = {
    grossBalance: Math.max(0, initialInvestment),
    totalContributed: Math.max(0, initialInvestment),
    months: 0,
  };

  let currentPropertyValue = inputs.propertyValue;
  let currentCondominio = inputs.condominioMonthly;
  let currentIptu = inputs.propertyValue * inputs.iptuRate;
  let currentBudget = monthlyBudget;
  let totalSpent = savingsResult.totalRentPaid + upfrontTotal;

  // Advance budget/costs to the year of purchase
  const yearsElapsed = Math.floor(savingsMonths / 12);
  for (let y = 0; y < yearsElapsed; y++) {
    currentCondominio *= 1 + inputs.igpmRate;
    currentIptu *= 1 + inputs.ipcaRate;
    currentBudget *= 1 + inputs.ipcaRate;
  }

  // Nominal appreciation = (1 + real) × (1 + inflation) - 1, compounded monthly
  const monthlyAppreciation =
    Math.pow((1 + inputs.propertyAppreciationRate) * (1 + inputs.ipcaRate), 1 / 12) - 1;

  // Appreciate property through savings phase months
  for (let m = 0; m < savingsMonths; m++) {
    currentPropertyValue *= 1 + monthlyAppreciation;
  }

  const financingSnapshots: MonthlySnapshot[] = [];

  for (let m = 1; m <= remainingMonths; m++) {
    const absoluteMonth = savingsMonths + m;

    // Annual adjustments (relative to absolute timeline)
    if (absoluteMonth > 1 && (absoluteMonth - 1) % 12 === 0) {
      currentCondominio *= 1 + inputs.igpmRate;
      currentIptu *= 1 + inputs.ipcaRate;
      currentBudget *= 1 + inputs.ipcaRate;
    }

    currentPropertyValue *= 1 + monthlyAppreciation;

    // Mortgage payment (0 if past financing term)
    const amortRow = m <= financingMonths ? schedule[m - 1] : null;
    const mortgagePayment = amortRow?.payment ?? 0;
    const outstandingDebt = amortRow?.outstandingBalance ?? 0;

    // Ownership costs
    const monthlyIptu = currentIptu / 12;
    const ownershipCost = currentCondominio + monthlyIptu;

    const totalMonthlyOutflow = mortgagePayment + ownershipCost;
    totalSpent += totalMonthlyOutflow;

    // Invest surplus (budget - housing cost)
    const surplus = currentBudget - totalMonthlyOutflow;
    investment = advanceInvestment(investment, investmentRate, surplus);

    // Net wealth = property - debt - capital gains tax + investment
    const nominalGain = currentPropertyValue - inputs.propertyValue;
    const capitalGainsTax = calculateCapitalGainsTax(
      nominalGain,
      currentPropertyValue,
      true, // Simulator only models one property — always the sole property
    );
    const netInvestment = netInvestmentValue(investment);
    const netWealth =
      currentPropertyValue - outstandingDebt - capitalGainsTax + netInvestment;
    const deflator = Math.pow(1 + inputs.ipcaRate / 12, absoluteMonth);

    financingSnapshots.push({
      month: absoluteMonth,
      year: Math.ceil(absoluteMonth / 12),
      rentPaid: 0,
      mortgagePayment,
      principalPaid: amortRow?.principal ?? 0,
      interestPaid: amortRow?.interest ?? 0,
      insurancePaid: amortRow?.insurance ?? 0,
      condominioPayment: currentCondominio,
      iptuPayment: monthlyIptu,
      investmentBalance: netInvestment,
      investmentContribution: surplus,
      propertyValue: currentPropertyValue,
      outstandingDebt,
      totalWealth: netWealth,
      totalSpent,
      totalWealthReal: netWealth / deflator,
    });
  }

  // Compose: savings snapshots + financing snapshots
  const allSnapshots = [...savingsResult.snapshots, ...financingSnapshots];
  const last = allSnapshots[allSnapshots.length - 1];
  const deflator = Math.pow(1 + inputs.ipcaRate / 12, totalMonths);

  // Only count interest from amortization rows actually used
  const usedScheduleMonths = Math.min(remainingMonths, financingMonths);
  const totalInterestPaid = schedule
    .slice(0, usedScheduleMonths)
    .reduce((sum, row) => sum + row.interest, 0);

  return {
    name: "FINANCIAR",
    label: "Financiar",
    monthlySnapshots: allSnapshots,
    yearlySnapshots: allSnapshots.filter((s) => s.month % 12 === 0),
    finalWealth: last.totalWealth,
    finalWealthReal: last.totalWealthReal,
    totalSpent: last.totalSpent,
    totalSpentReal: last.totalSpent / deflator,
    effectiveMonthlyAvgCost: last.totalSpent / totalMonths,
    effectiveMonthlyAvgCostReal: last.totalSpent / deflator / totalMonths,
    totalInterestPaid,
    upfrontCost: upfrontTotal,
    savingsPhaseMonths: savingsMonths,
  };
}
