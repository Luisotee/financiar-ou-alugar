import { describe, it, expect } from "vitest";
import { runSimulation } from "@/engine/simulator";
import { DEFAULT_INPUTS } from "@/engine/constants";

describe("runSimulation", () => {
  // Use high currentCapital so savings phase = 0 (simulates "already has money")
  const wealthyInputs = {
    ...DEFAULT_INPUTS,
    currentCapital:
      DEFAULT_INPUTS.propertyValue *
      (1 + DEFAULT_INPUTS.itbiRate + DEFAULT_INPUTS.escrituraRate + DEFAULT_INPUTS.registroRate),
    currentRent: 0,
    monthlySavings: 5_000,
  };
  const results = runSimulation(wealthyInputs);

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
      ...wealthyInputs,
      cashDiscountPercent: 0,
    });
    const withDiscount = runSimulation({
      ...wealthyInputs,
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

  it("all scenarios have savingsPhaseMonths = 0 when capital is sufficient", () => {
    expect(results.rent.savingsPhaseMonths).toBe(0);
    expect(results.buyCash.savingsPhaseMonths).toBe(0);
    expect(results.finance.savingsPhaseMonths).toBe(0);
  });
});

describe("runSimulation with savings phase", () => {
  const savingInputs = {
    ...DEFAULT_INPUTS,
    currentCapital: 30_000,
    currentRent: 800,
    monthlySavings: 3_000,
  };
  const results = runSimulation(savingInputs);

  it("rent scenario has no savings phase", () => {
    expect(results.rent.savingsPhaseMonths).toBe(0);
  });

  it("finance scenario has savings phase when capital < entry", () => {
    // Entry ~= downPayment + ITBI + registro + taxaAvaliacao
    // = 100k + 15k + 4k + 3k = 122k. With 30k capital, needs saving
    expect(results.finance.savingsPhaseMonths).toBeGreaterThan(0);
  });

  it("buy-cash scenario has longer savings phase than finance", () => {
    // Cash needs full property value + costs, finance only needs entry
    expect(results.buyCash.savingsPhaseMonths).toBeGreaterThan(
      results.finance.savingsPhaseMonths
    );
  });

  it("all scenarios have correct total snapshot count", () => {
    const totalMonths = savingInputs.timeHorizonYears * 12;
    expect(results.rent.monthlySnapshots).toHaveLength(totalMonths);
    expect(results.buyCash.monthlySnapshots).toHaveLength(totalMonths);
    expect(results.finance.monthlySnapshots).toHaveLength(totalMonths);
  });

  it("startingCapital equals currentCapital", () => {
    expect(results.startingCapital).toBe(30_000);
  });

  it("chart year 0 starts at currentCapital", () => {
    expect(results.chartData[0].alugar).toBe(30_000);
    expect(results.chartData[0].comprarVista).toBe(30_000);
    expect(results.chartData[0].financiar).toBe(30_000);
  });

  it("monthlySavings is exposed in results", () => {
    expect(results.monthlySavings).toBe(3_000);
  });
});

describe("budget constraint fairness", () => {
  it("budget equals currentRent + monthlySavings (no inflation)", () => {
    const inputs = {
      ...DEFAULT_INPUTS,
      currentRent: 2_000,
      monthlySavings: 1_000,
    };
    const results = runSimulation(inputs);
    expect(results.monthlyBudget).toBe(3_000);
  });

  it("budget is NOT inflated when rent exceeds savings capacity", () => {
    // monthlyRent + condo + IPTU + insurance > currentRent + savings
    const inputs = {
      ...DEFAULT_INPUTS,
      currentRent: 0,
      monthlySavings: 1_000,
      monthlyRent: 3_000,
      condominioMonthly: 800,
      propertyValue: 500_000,
      iptuRate: 0.008,
    };
    const results = runSimulation(inputs);
    // Budget should be exactly 1,000, NOT inflated to rent cost
    expect(results.monthlyBudget).toBe(1_000);
  });

  it("renter has negative surplus when rent exceeds budget", () => {
    const inputs = {
      ...DEFAULT_INPUTS,
      currentRent: 0,
      monthlySavings: 1_000,
      monthlyRent: 2_000,
      condominioMonthly: 500,
      currentCapital: 100_000,
    };
    const results = runSimulation(inputs);
    // Renter's first-month cost > budget → negative surplus → investment decreases
    const firstMonth = results.rent.monthlySnapshots[0];
    expect(firstMonth.investmentContribution).toBeLessThan(0);
  });

  it("capital gains exemption applied for sole property under R$440k", () => {
    const inputs = {
      ...DEFAULT_INPUTS,
      propertyValue: 200_000,
      currentCapital: 300_000,
      currentRent: 0,
      monthlySavings: 3_000,
      timeHorizonYears: 1, // Short horizon so property stays under R$440k
      cashDiscountPercent: 0,
    };
    const results = runSimulation(inputs);
    // With only 1 year of appreciation on a R$200k property,
    // sale price should be well under R$440k → no capital gains tax
    const lastBuyCash = results.buyCash.monthlySnapshots.at(-1)!;
    // If exemption works: wealth = propertyValue + investments (no tax deducted)
    const netInvestments = lastBuyCash.investmentBalance;
    const expectedWealth = lastBuyCash.propertyValue + netInvestments;
    expect(lastBuyCash.totalWealth).toBeCloseTo(expectedWealth, 0);
  });
});
