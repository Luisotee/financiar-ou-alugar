import { describe, it, expect } from "vitest";
import { runSimulation } from "@/engine/simulator";
import { DEFAULT_INPUTS } from "@/engine/constants";

describe("runSimulation", () => {
  const results = runSimulation(DEFAULT_INPUTS);

  it("returns all three scenarios", () => {
    expect(results.rent.name).toBe("ALUGAR");
    expect(results.buyCash.name).toBe("COMPRAR_VISTA");
    expect(results.finance.name).toBe("FINANCIAR");
  });

  it("has correct number of monthly snapshots", () => {
    const expected = DEFAULT_INPUTS.timeHorizonYears * 12;
    expect(results.rent.monthlySnapshots).toHaveLength(expected);
    expect(results.buyCash.monthlySnapshots).toHaveLength(expected);
    expect(results.finance.monthlySnapshots).toHaveLength(expected);
  });

  it("has yearly chart data", () => {
    // Year 0 + timeHorizonYears
    expect(results.chartData).toHaveLength(
      DEFAULT_INPUTS.timeHorizonYears + 1
    );
    expect(results.chartData[0].year).toBe(0);
    expect(
      results.chartData[results.chartData.length - 1].year
    ).toBe(DEFAULT_INPUTS.timeHorizonYears);
  });

  it("all final wealth values are positive", () => {
    expect(results.rent.finalWealth).toBeGreaterThan(0);
    expect(results.buyCash.finalWealth).toBeGreaterThan(0);
    expect(results.finance.finalWealth).toBeGreaterThan(0);
  });

  it("winner is one of the three scenarios", () => {
    expect(["ALUGAR", "COMPRAR_VISTA", "FINANCIAR"]).toContain(results.winner);
  });

  it("advantage is positive", () => {
    expect(results.advantage).toBeGreaterThan(0);
  });

  it("total spent is positive for all scenarios", () => {
    expect(results.rent.totalSpent).toBeGreaterThan(0);
    expect(results.buyCash.totalSpent).toBeGreaterThan(0);
    expect(results.finance.totalSpent).toBeGreaterThan(0);
  });

  it("real wealth is less than nominal for positive inflation", () => {
    expect(results.rent.finalWealthReal).toBeLessThan(results.rent.finalWealth);
    expect(results.buyCash.finalWealthReal).toBeLessThan(results.buyCash.finalWealth);
    expect(results.finance.finalWealthReal).toBeLessThan(results.finance.finalWealth);
  });

  it("cash discount increases buy-cash final wealth", () => {
    const noDiscount = runSimulation({
      ...DEFAULT_INPUTS,
      cashDiscountPercent: 0,
    });
    const withDiscount = runSimulation({
      ...DEFAULT_INPUTS,
      cashDiscountPercent: 0.1,
    });
    expect(withDiscount.buyCash.finalWealth).toBeGreaterThan(
      noDiscount.buyCash.finalWealth
    );
  });

  it("finance scenario reports total interest paid", () => {
    expect(results.finance.totalInterestPaid).toBeGreaterThan(0);
  });

  it("rent and buy-cash have zero total interest paid", () => {
    expect(results.rent.totalInterestPaid).toBe(0);
    expect(results.buyCash.totalInterestPaid).toBe(0);
  });
});
