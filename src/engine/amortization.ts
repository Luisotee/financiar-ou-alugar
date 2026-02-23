import type { AmortizationRow } from "./types";

function annualToMonthlyRate(annual: number): number {
  return Math.pow(1 + annual, 1 / 12) - 1;
}

export function generateSACSchedule(
  loanAmount: number,
  annualRate: number,
  termMonths: number,
  propertyValue: number,
  mipRate: number,
  dfiRate: number,
  adminFee: number
): AmortizationRow[] {
  const monthlyRate = annualToMonthlyRate(annualRate);
  const fixedAmortization = loanAmount / termMonths;
  let balance = loanAmount;
  const schedule: AmortizationRow[] = [];

  for (let m = 1; m <= termMonths; m++) {
    const interest = balance * monthlyRate;
    const mip = balance * mipRate;
    const dfi = propertyValue * dfiRate;
    const insurance = mip + dfi;
    const payment = fixedAmortization + interest + insurance + adminFee;

    balance -= fixedAmortization;
    balance = Math.max(balance, 0);

    schedule.push({
      month: m,
      payment,
      principal: fixedAmortization,
      interest,
      insurance,
      adminFee,
      outstandingBalance: balance,
    });
  }

  return schedule;
}

export function generatePriceSchedule(
  loanAmount: number,
  annualRate: number,
  termMonths: number,
  propertyValue: number,
  mipRate: number,
  dfiRate: number,
  adminFee: number
): AmortizationRow[] {
  const monthlyRate = annualToMonthlyRate(annualRate);
  const basePMT =
    loanAmount *
    ((monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1));

  let balance = loanAmount;
  const schedule: AmortizationRow[] = [];

  for (let m = 1; m <= termMonths; m++) {
    const interest = balance * monthlyRate;
    const principal = basePMT - interest;
    const mip = balance * mipRate;
    const dfi = propertyValue * dfiRate;
    const insurance = mip + dfi;
    const payment = basePMT + insurance + adminFee;

    balance -= principal;
    balance = Math.max(balance, 0);

    schedule.push({
      month: m,
      payment,
      principal,
      interest,
      insurance,
      adminFee,
      outstandingBalance: balance,
    });
  }

  return schedule;
}
