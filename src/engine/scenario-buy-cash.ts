import type { SimulationInputs, ScenarioResult, MonthlySnapshot, InvestmentState } from "./types";
import { calculateCapitalGainsTax } from "./taxes";
import { monthlyGrossRate, advanceInvestment, netInvestmentValue } from "./investment";

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

  // Total capital = what a full-price buyer would spend (fair comparison base)
  const totalCapital =
    inputs.propertyValue +
    inputs.propertyValue * inputs.itbiRate +
    inputs.propertyValue * inputs.escrituraRate +
    inputs.propertyValue * inputs.registroRate;

  // Savings from discount are invested
  const investmentSeed = totalCapital - upfrontCost;

  const investmentRate = monthlyGrossRate(inputs.ipcaRate, inputs.tesouroSpread);
  let investment: InvestmentState = {
    grossBalance: investmentSeed,
    totalContributed: investmentSeed,
    months: 0,
  };

  let currentPropertyValue = inputs.propertyValue;
  let currentCondominio = inputs.condominioMonthly;
  let currentIptuAnnual = inputs.propertyValue * inputs.iptuRate;
  let currentBudget = monthlyBudget;
  let totalSpent = upfrontCost;
  const snapshots: MonthlySnapshot[] = [];

  // Nominal appreciation = real + inflation compounded
  const monthlyAppreciation =
    Math.pow(1 + inputs.propertyAppreciationRate + inputs.ipcaRate, 1 / 12) - 1;

  for (let m = 1; m <= totalMonths; m++) {
    // Annual adjustments
    if (m > 1 && (m - 1) % 12 === 0) {
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
      currentPropertyValue
    );
    const netInvestment = netInvestmentValue(investment);
    const netWealth = currentPropertyValue - capitalGainsTax + netInvestment;
    const deflator = Math.pow(1 + inputs.ipcaRate / 12, m);

    snapshots.push({
      month: m,
      year: Math.ceil(m / 12),
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
    });
  }

  const last = snapshots[snapshots.length - 1];
  const deflator = Math.pow(1 + inputs.ipcaRate / 12, totalMonths);

  return {
    name: "COMPRAR_VISTA",
    label: "Comprar à Vista",
    monthlySnapshots: snapshots,
    yearlySnapshots: snapshots.filter((s) => s.month % 12 === 0),
    finalWealth: last.totalWealth,
    finalWealthReal: last.totalWealthReal,
    totalSpent: last.totalSpent,
    totalSpentReal: last.totalSpent / deflator,
    effectiveMonthlyAvgCost: last.totalSpent / totalMonths,
    effectiveMonthlyAvgCostReal: last.totalSpent / deflator / totalMonths,
    totalInterestPaid: 0,
    upfrontCost: upfrontCost,
  };
}
