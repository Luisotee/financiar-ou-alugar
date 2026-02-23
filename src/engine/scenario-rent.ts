import type { SimulationInputs, ScenarioResult, MonthlySnapshot } from "./types";
import { monthlyGrossRate, advanceInvestment, netInvestmentValue } from "./investment";
import type { InvestmentState } from "./types";

export function calculateRentScenario(inputs: SimulationInputs, monthlyBudget: number): ScenarioResult {
  const totalMonths = inputs.timeHorizonYears * 12;
  const rate = monthlyGrossRate(inputs.ipcaRate, inputs.tesouroSpread);

  // The renter invests their current capital
  const initialInvestment = inputs.currentCapital;

  let investment: InvestmentState = {
    grossBalance: initialInvestment,
    totalContributed: initialInvestment,
    months: 0,
  };

  let currentRent = inputs.monthlyRent;
  let currentCondominio = inputs.condominioMonthly;
  let currentIptu = inputs.propertyValue * inputs.iptuRate;
  let currentBudget = monthlyBudget;
  let totalSpent = 0;
  const snapshots: MonthlySnapshot[] = [];

  for (let m = 1; m <= totalMonths; m++) {
    // Annual adjustments (at start of year 2, 3, ...)
    if (m > 1 && (m - 1) % 12 === 0) {
      currentRent *= 1 + inputs.rentAdjustmentRate;
      currentCondominio *= 1 + inputs.igpmRate;
      currentIptu *= 1 + inputs.ipcaRate;
      currentBudget *= 1 + inputs.ipcaRate;
    }

    const monthlyIptu = currentIptu / 12;
    const monthlyCost =
      currentRent +
      currentCondominio +
      monthlyIptu +
      inputs.renterInsuranceMonthly;

    totalSpent += monthlyCost;

    // Invest surplus (budget - housing cost)
    const surplus = currentBudget - monthlyCost;
    investment = advanceInvestment(investment, rate, surplus);

    const netWealth = netInvestmentValue(investment);
    const deflator = Math.pow(1 + inputs.ipcaRate / 12, m);

    snapshots.push({
      month: m,
      year: Math.ceil(m / 12),
      rentPaid: currentRent,
      mortgagePayment: 0,
      principalPaid: 0,
      interestPaid: 0,
      insurancePaid: inputs.renterInsuranceMonthly,
      condominioPayment: currentCondominio,
      iptuPayment: monthlyIptu,
      investmentBalance: netWealth,
      investmentContribution: surplus,
      propertyValue: 0,
      outstandingDebt: 0,
      totalWealth: netWealth,
      totalSpent,
      totalWealthReal: netWealth / deflator,
    });
  }

  const last = snapshots[snapshots.length - 1];
  const deflator = Math.pow(1 + inputs.ipcaRate / 12, totalMonths);

  return {
    name: "ALUGAR",
    label: "Alugar",
    monthlySnapshots: snapshots,
    yearlySnapshots: snapshots.filter((s) => s.month % 12 === 0),
    finalWealth: last.totalWealth,
    finalWealthReal: last.totalWealthReal,
    totalSpent: last.totalSpent,
    totalSpentReal: last.totalSpent / deflator,
    effectiveMonthlyAvgCost: last.totalSpent / totalMonths,
    effectiveMonthlyAvgCostReal: last.totalSpent / deflator / totalMonths,
    totalInterestPaid: 0,
    upfrontCost: 0,
    savingsPhaseMonths: 0,
  };
}
