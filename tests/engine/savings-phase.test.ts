import { describe, it, expect } from "vitest";
import { calculateSavingsPhase } from "@/engine/savings-phase";
import { monthlyGrossRate } from "@/engine/investment";

const ipcaRate = 0.045;
const tesouroSpread = 0.07;
const investmentRate = monthlyGrossRate(ipcaRate, tesouroSpread);

describe("calculateSavingsPhase", () => {
  it("returns immediately when capital already sufficient", () => {
    const result = calculateSavingsPhase(
      100_000, // currentCapital
      0, // currentRent
      5_000, // monthlyBudget
      80_000, // target
      investmentRate,
      ipcaRate,
      240,
    );

    expect(result.months).toBe(0);
    expect(result.snapshots).toHaveLength(0);
    expect(result.totalRentPaid).toBe(0);
    expect(result.finalInvestment.grossBalance).toBe(100_000);
  });

  it("returns immediately when capital equals target", () => {
    const result = calculateSavingsPhase(
      100_000,
      0,
      5_000,
      100_000,
      investmentRate,
      ipcaRate,
      240,
    );

    expect(result.months).toBe(0);
    expect(result.snapshots).toHaveLength(0);
  });

  it("calculates savings months for insufficient capital", () => {
    const result = calculateSavingsPhase(
      30_000, // currentCapital
      800, // currentRent
      3_800, // monthlyBudget (800 rent + 3000 savings)
      100_000, // target (entry amount)
      investmentRate,
      ipcaRate,
      240,
    );

    // Should take some months to reach 100k from 30k saving 3k/month
    expect(result.months).toBeGreaterThan(0);
    expect(result.months).toBeLessThan(30); // ~23 months at 3k/month + returns
    expect(result.snapshots).toHaveLength(result.months);
    expect(result.totalRentPaid).toBeGreaterThan(0);
  });

  it("saves faster with no current rent (living with parents)", () => {
    const withRent = calculateSavingsPhase(
      0,
      2_000, // pays rent
      5_000,
      100_000,
      investmentRate,
      ipcaRate,
      240,
    );

    const noRent = calculateSavingsPhase(
      0,
      0, // lives with parents
      5_000,
      100_000,
      investmentRate,
      ipcaRate,
      240,
    );

    expect(noRent.months).toBeLessThan(withRent.months);
    expect(noRent.totalRentPaid).toBe(0);
  });

  it("investment returns accelerate accumulation", () => {
    // With investment returns
    const withReturns = calculateSavingsPhase(
      0,
      0,
      3_000,
      100_000,
      investmentRate, // ~0.9%/month
      ipcaRate,
      240,
    );

    // Without investment returns (rate = 0)
    const noReturns = calculateSavingsPhase(
      0,
      0,
      3_000,
      100_000,
      0, // no returns
      ipcaRate,
      240,
    );

    expect(withReturns.months).toBeLessThan(noReturns.months);
  });

  it("returns maxMonths when target never reached", () => {
    const result = calculateSavingsPhase(
      0,
      4_000, // high rent
      4_500, // barely any savings (500/month)
      500_000, // huge target
      investmentRate,
      ipcaRate,
      60, // only 5 years
    );

    expect(result.months).toBe(60);
    expect(result.snapshots).toHaveLength(60);
  });

  it("generates correct snapshots", () => {
    const result = calculateSavingsPhase(
      10_000,
      500,
      3_500, // 3000 savings
      50_000,
      investmentRate,
      ipcaRate,
      240,
    );

    expect(result.snapshots.length).toBe(result.months);

    // First snapshot
    const first = result.snapshots[0];
    expect(first.month).toBe(1);
    expect(first.year).toBe(1);
    expect(first.rentPaid).toBe(500);
    expect(first.mortgagePayment).toBe(0);
    expect(first.investmentContribution).toBe(3_000);
    expect(first.investmentBalance).toBeGreaterThan(10_000);
    expect(first.totalWealth).toBeGreaterThan(10_000);

    // Last snapshot
    const last = result.snapshots[result.snapshots.length - 1];
    expect(last.month).toBe(result.months);
    expect(last.totalWealth).toBeGreaterThanOrEqual(50_000);
  });

  it("adjusts rent and budget annually with IPCA", () => {
    const result = calculateSavingsPhase(
      0,
      1_000,
      4_000,
      200_000, // takes >1 year
      investmentRate,
      ipcaRate,
      240,
    );

    // After year 1, rent should have increased
    expect(result.months).toBeGreaterThan(12);
    const month12 = result.snapshots[11]; // month 12
    const month13 = result.snapshots[12]; // month 13

    // Rent increases at month 13 (start of year 2)
    expect(month13.rentPaid).toBeGreaterThan(month12.rentPaid);
    expect(month13.rentPaid).toBeCloseTo(1_000 * (1 + ipcaRate), 0);
  });
});

describe("savings phase with simulator integration", () => {
  it("savings phase snapshots have continuous month numbering", () => {
    const result = calculateSavingsPhase(
      0,
      800,
      3_800,
      100_000,
      investmentRate,
      ipcaRate,
      240,
    );

    for (let i = 0; i < result.snapshots.length; i++) {
      expect(result.snapshots[i].month).toBe(i + 1);
    }
  });

  it("wealth grows monotonically during savings", () => {
    const result = calculateSavingsPhase(
      10_000,
      0,
      5_000,
      200_000,
      investmentRate,
      ipcaRate,
      240,
    );

    for (let i = 1; i < result.snapshots.length; i++) {
      expect(result.snapshots[i].totalWealth).toBeGreaterThan(
        result.snapshots[i - 1].totalWealth
      );
    }
  });
});
