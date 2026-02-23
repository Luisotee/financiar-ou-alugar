import type { InvestmentState, MonthlySnapshot } from "./types";
import { advanceInvestment, netInvestmentValue } from "./investment";

export interface SavingsPhaseResult {
  months: number;
  finalInvestment: InvestmentState;
  snapshots: MonthlySnapshot[];
  totalRentPaid: number;
}

/**
 * Simulates a savings phase where the person pays currentRent and invests
 * the surplus (monthlyBudget - currentRent) into Tesouro IPCA+ each month.
 * Stops when net investment value reaches targetAmount or maxMonths is hit.
 */
export function calculateSavingsPhase(
  currentCapital: number,
  currentRent: number,
  monthlyBudget: number,
  targetAmount: number,
  investmentRate: number,
  ipcaRate: number,
  maxMonths: number,
  rentAdjustmentRate?: number,
): SavingsPhaseResult {
  const rentGrowthRate = rentAdjustmentRate ?? ipcaRate;
  // If already have enough, return immediately
  if (currentCapital >= targetAmount) {
    return {
      months: 0,
      finalInvestment: {
        grossBalance: currentCapital,
        totalContributed: currentCapital,
        months: 0,
      },
      snapshots: [],
      totalRentPaid: 0,
    };
  }

  let investment: InvestmentState = {
    grossBalance: currentCapital,
    totalContributed: currentCapital,
    months: 0,
  };

  let rent = currentRent;
  let budget = monthlyBudget;
  let totalRentPaid = 0;
  let totalSpent = 0;
  const snapshots: MonthlySnapshot[] = [];

  for (let m = 1; m <= maxMonths; m++) {
    // Annual adjustments (at start of year 2, 3, ...)
    if (m > 1 && (m - 1) % 12 === 0) {
      rent *= 1 + rentGrowthRate;
      budget *= 1 + ipcaRate;
    }

    totalRentPaid += rent;
    totalSpent += rent;

    // Invest surplus
    const surplus = budget - rent;
    investment = advanceInvestment(investment, investmentRate, surplus);

    const netWealth = netInvestmentValue(investment);
    const deflator = Math.pow(1 + ipcaRate / 12, m);

    snapshots.push({
      month: m,
      year: Math.ceil(m / 12),
      rentPaid: rent,
      mortgagePayment: 0,
      principalPaid: 0,
      interestPaid: 0,
      insurancePaid: 0,
      condominioPayment: 0,
      iptuPayment: 0,
      investmentBalance: netWealth,
      investmentContribution: surplus,
      propertyValue: 0,
      outstandingDebt: 0,
      totalWealth: netWealth,
      totalSpent,
      totalWealthReal: netWealth / deflator,
    });

    // Check if target reached
    if (netWealth >= targetAmount) {
      return {
        months: m,
        finalInvestment: investment,
        snapshots,
        totalRentPaid,
      };
    }
  }

  // Never reached target within maxMonths
  return {
    months: maxMonths,
    finalInvestment: investment,
    snapshots,
    totalRentPaid,
  };
}
