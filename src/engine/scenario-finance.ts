import type { SimulationInputs, ScenarioResult, MonthlySnapshot, InvestmentState } from "./types";
import { generateSACSchedule, generatePriceSchedule } from "./amortization";
import { monthlyGrossRate, advanceInvestment, netInvestmentValue } from "./investment";
import { calculateCapitalGainsTax } from "./taxes";

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

  // The financer starts with the same capital as a cash buyer.
  // They save on escritura but pay bank appraisal (taxaAvaliacao).
  const escrituraSaved = inputs.propertyValue * inputs.escrituraRate;
  const initialInvestment = loanAmount + escrituraSaved - inputs.taxaAvaliacao;

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

  const investmentRate = monthlyGrossRate(inputs.ipcaRate, inputs.tesouroSpread);
  let investment: InvestmentState = {
    grossBalance: initialInvestment,
    totalContributed: initialInvestment,
    months: 0,
  };

  let currentPropertyValue = inputs.propertyValue;
  let currentCondominio = inputs.condominioMonthly;
  let currentIptu = inputs.propertyValue * inputs.iptuRate;
  let currentBudget = monthlyBudget;
  let totalSpent = upfrontTotal;
  const snapshots: MonthlySnapshot[] = [];
  const monthlyAppreciation =
    Math.pow(1 + inputs.propertyAppreciationRate + inputs.ipcaRate, 1 / 12) - 1;

  for (let m = 1; m <= totalMonths; m++) {
    // Annual adjustments
    if (m > 1 && (m - 1) % 12 === 0) {
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
      currentPropertyValue
    );
    const netInvestment = netInvestmentValue(investment);
    const netWealth =
      currentPropertyValue - outstandingDebt - capitalGainsTax + netInvestment;
    const deflator = Math.pow(1 + inputs.ipcaRate / 12, m);

    snapshots.push({
      month: m,
      year: Math.ceil(m / 12),
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

  const last = snapshots[snapshots.length - 1];
  const deflator = Math.pow(1 + inputs.ipcaRate / 12, totalMonths);

  return {
    name: "FINANCIAR",
    label: "Financiar",
    monthlySnapshots: snapshots,
    yearlySnapshots: snapshots.filter((s) => s.month % 12 === 0),
    finalWealth: last.totalWealth,
    finalWealthReal: last.totalWealthReal,
    totalSpent: last.totalSpent,
    totalSpentReal: last.totalSpent / deflator,
    effectiveMonthlyAvgCost: last.totalSpent / totalMonths,
    effectiveMonthlyAvgCostReal: last.totalSpent / deflator / totalMonths,
    totalInterestPaid: schedule.reduce((sum, row) => sum + row.interest, 0),
    upfrontCost: upfrontTotal,
  };
}
