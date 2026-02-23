import type { SimulationInputs, ScenarioResult, MonthlySnapshot, InvestmentState } from "./types";
import { calculateCapitalGainsTax } from "./taxes";
import { monthlyGrossRate, advanceInvestment, netInvestmentValue } from "./investment";
import { calculateSavingsPhase } from "./savings-phase";

export function calculateBuyCashScenario(
  inputs: SimulationInputs,
  monthlyBudget: number
): ScenarioResult {
  const totalMonths = inputs.timeHorizonYears * 12;

  // Cash discount: buyer pays less than list price
  const effectivePrice = inputs.propertyValue * (1 - inputs.cashDiscountPercent);
  const itbiCost = effectivePrice * inputs.itbiRate;
  const escritura = effectivePrice * inputs.escrituraRate;
  const registro = effectivePrice * inputs.registroRate;
  const upfrontCost = effectivePrice + itbiCost + escritura + registro;

  const investmentRate = monthlyGrossRate(inputs.ipcaRate, inputs.tesouroSpread);

  // ─── SAVINGS PHASE ──────────────────────────────────────────
  const savingsResult = calculateSavingsPhase(
    inputs.currentCapital,
    inputs.currentRent,
    monthlyBudget,
    upfrontCost,
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

    return {
      name: "COMPRAR_VISTA",
      label: "Comprar à Vista",
      monthlySnapshots: savingsResult.snapshots,
      yearlySnapshots: savingsResult.snapshots.filter((s) => s.month % 12 === 0),
      finalWealth: last.totalWealth,
      finalWealthReal: last.totalWealthReal,
      totalSpent: last.totalSpent,
      totalSpentReal: last.totalSpentReal,
      effectiveMonthlyAvgCost: last.totalSpent / totalMonths,
      effectiveMonthlyAvgCostReal: last.totalSpentReal / totalMonths,
      totalInterestPaid: 0,
      upfrontCost: 0,
      savingsPhaseMonths: savingsMonths,
    };
  }

  // ─── OWNERSHIP PHASE ────────────────────────────────────────
  // Capital after buying: whatever's left from savings minus purchase costs
  const capitalAtPurchase = netInvestmentValue(savingsResult.finalInvestment);
  const investmentSeed = capitalAtPurchase - upfrontCost;

  let investment: InvestmentState = {
    grossBalance: Math.max(0, investmentSeed),
    totalContributed: Math.max(0, investmentSeed),
    months: 0,
  };

  let currentPropertyValue = inputs.propertyValue;
  let currentCondominio = inputs.condominioMonthly;
  let currentIptuAnnual = inputs.propertyValue * inputs.iptuRate;
  let currentBudget = monthlyBudget;
  let totalSpent = savingsResult.totalRentPaid + upfrontCost;
  const upfrontDeflator = Math.pow(1 + inputs.ipcaRate / 12, savingsMonths);
  let totalSpentReal = savingsResult.totalSpentReal + upfrontCost / upfrontDeflator;

  // Advance budget/costs to the year of purchase
  const yearsElapsed = Math.floor(savingsMonths / 12);
  for (let y = 0; y < yearsElapsed; y++) {
    currentCondominio *= 1 + inputs.igpmRate;
    currentIptuAnnual *= 1 + inputs.ipcaRate;
    currentBudget *= 1 + inputs.ipcaRate;
  }

  // Nominal appreciation = (1 + real) × (1 + inflation) - 1, compounded monthly
  const monthlyAppreciation =
    Math.pow((1 + inputs.propertyAppreciationRate) * (1 + inputs.ipcaRate), 1 / 12) - 1;

  // Appreciate property through savings phase months
  for (let m = 0; m < savingsMonths; m++) {
    currentPropertyValue *= 1 + monthlyAppreciation;
  }

  const ownershipSnapshots: MonthlySnapshot[] = [];

  for (let m = 1; m <= remainingMonths; m++) {
    const absoluteMonth = savingsMonths + m;

    // Annual adjustments (relative to absolute timeline)
    if (absoluteMonth > 1 && (absoluteMonth - 1) % 12 === 0) {
      currentCondominio *= 1 + inputs.igpmRate;
      currentIptuAnnual *= 1 + inputs.ipcaRate;
      currentBudget *= 1 + inputs.ipcaRate;
    }

    currentPropertyValue *= 1 + monthlyAppreciation;

    const monthlyIptu = currentIptuAnnual / 12;
    const monthlyCost = currentCondominio + monthlyIptu;

    totalSpent += monthlyCost;

    // Invest surplus (budget - housing cost)
    const surplus = currentBudget - monthlyCost;
    investment = advanceInvestment(investment, investmentRate, surplus);

    const nominalGain = currentPropertyValue - inputs.propertyValue;
    const capitalGainsTax = calculateCapitalGainsTax(
      nominalGain,
      currentPropertyValue,
      true, // Simulator only models one property — always the sole property
    );
    const netInvestment = netInvestmentValue(investment);
    const netWealth = currentPropertyValue - capitalGainsTax + netInvestment;
    const deflator = Math.pow(1 + inputs.ipcaRate / 12, absoluteMonth);
    totalSpentReal += monthlyCost / deflator;

    ownershipSnapshots.push({
      month: absoluteMonth,
      year: Math.ceil(absoluteMonth / 12),
      rentPaid: 0,
      mortgagePayment: 0,
      principalPaid: 0,
      interestPaid: 0,
      insurancePaid: 0,
      condominioPayment: currentCondominio,
      iptuPayment: monthlyIptu,
      investmentBalance: netInvestment,
      investmentContribution: surplus,
      propertyValue: currentPropertyValue,
      outstandingDebt: 0,
      totalWealth: netWealth,
      totalSpent,
      totalWealthReal: netWealth / deflator,
      totalSpentReal,
    });
  }

  // Compose: savings snapshots + ownership snapshots
  const allSnapshots = [...savingsResult.snapshots, ...ownershipSnapshots];
  const last = allSnapshots[allSnapshots.length - 1];

  return {
    name: "COMPRAR_VISTA",
    label: "Comprar à Vista",
    monthlySnapshots: allSnapshots,
    yearlySnapshots: allSnapshots.filter((s) => s.month % 12 === 0),
    finalWealth: last.totalWealth,
    finalWealthReal: last.totalWealthReal,
    totalSpent: last.totalSpent,
    totalSpentReal: last.totalSpentReal,
    effectiveMonthlyAvgCost: last.totalSpent / totalMonths,
    effectiveMonthlyAvgCostReal: last.totalSpentReal / totalMonths,
    totalInterestPaid: 0,
    upfrontCost,
    savingsPhaseMonths: savingsMonths,
  };
}
