import type { InvestmentState } from "./types";
import { IR_REGRESSIVE_TABLE } from "./constants";

export function monthlyGrossRate(ipca: number, spread: number): number {
  const annualGross = (1 + ipca) * (1 + spread) - 1;
  return Math.pow(1 + annualGross, 1 / 12) - 1;
}

export function advanceInvestment(
  state: InvestmentState,
  monthlyRate: number,
  contribution: number = 0
): InvestmentState {
  const grossGrowth = state.grossBalance * monthlyRate;
  return {
    grossBalance: state.grossBalance + grossGrowth + contribution,
    totalContributed: state.totalContributed + contribution,
    months: state.months + 1,
  };
}

export function getIRRate(holdingDays: number): number {
  for (const bracket of IR_REGRESSIVE_TABLE) {
    if (holdingDays <= bracket.maxDays) return bracket.rate;
  }
  return 0.15;
}

export function netInvestmentValue(state: InvestmentState): number {
  const grossGain = state.grossBalance - state.totalContributed;
  if (grossGain <= 0) return state.grossBalance;

  // Average holding period: contributions spread over time, avg = total/2
  const avgHoldingDays = (state.months / 2) * 30;
  const irRate = getIRRate(avgHoldingDays);

  // B3 custody fee: 0.2%/year on full balance (exemption only applies to Tesouro Selic)
  // Use average balance as approximation since fee accrues daily on current balance
  const custodyFeeAnnual = 0.002;
  const avgBalance = (state.totalContributed + state.grossBalance) / 2;
  const custodyFee = avgBalance * custodyFeeAnnual * (state.months / 12);

  const taxOnGains = grossGain * irRate;
  return state.grossBalance - taxOnGains - custodyFee;
}
