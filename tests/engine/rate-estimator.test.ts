import { describe, it, expect } from "vitest";
import { estimateFinancingRate } from "@/engine/rate-estimator";

describe("estimateFinancingRate", () => {
  it("returns MCMV Faixa 1 for low income and cheap property", () => {
    const result = estimateFinancingRate({
      monthlyIncome: 2_000,
      propertyValue: 200_000,
      employmentType: "CLT",
      isFirstProperty: true,
    });
    expect(result.rate).toBe(0.0425);
    expect(result.description).toContain("MCMV");
  });

  it("returns MCMV Faixa 2 for mid-low income", () => {
    const result = estimateFinancingRate({
      monthlyIncome: 3_500,
      propertyValue: 250_000,
      employmentType: "CLT",
      isFirstProperty: true,
    });
    expect(result.rate).toBe(0.06);
    expect(result.description).toContain("MCMV");
  });

  it("returns MCMV Faixa 3 for mid income and eligible property", () => {
    const result = estimateFinancingRate({
      monthlyIncome: 7_000,
      propertyValue: 300_000,
      employmentType: "CLT",
      isFirstProperty: true,
    });
    expect(result.rate).toBe(0.0766);
    expect(result.description).toContain("MCMV");
  });

  it("does not qualify for MCMV if property too expensive", () => {
    const result = estimateFinancingRate({
      monthlyIncome: 5_000,
      propertyValue: 500_000,
      employmentType: "CLT",
      isFirstProperty: true,
    });
    expect(result.description).not.toContain("MCMV");
    expect(result.description).toContain("SBPE");
  });

  it("does not qualify for MCMV if income too high", () => {
    const result = estimateFinancingRate({
      monthlyIncome: 15_000,
      propertyValue: 200_000,
      employmentType: "CLT",
      isFirstProperty: true,
    });
    expect(result.description).toContain("SBPE");
  });

  it("gives CLT first-property discount", () => {
    const result = estimateFinancingRate({
      monthlyIncome: 15_000,
      propertyValue: 500_000,
      employmentType: "CLT",
      isFirstProperty: true,
    });
    // Base 10.5% - CLT 0.5% - 1st property 0.5% = 9.5%
    expect(result.rate).toBeCloseTo(0.095);
    expect(result.description).toContain("CLT");
    expect(result.description).toContain("1ª casa");
  });

  it("applies PJ premium", () => {
    const result = estimateFinancingRate({
      monthlyIncome: 15_000,
      propertyValue: 500_000,
      employmentType: "PJ",
      isFirstProperty: false,
    });
    // Base 10.5% + PJ 0.5% = 11%
    expect(result.rate).toBeCloseTo(0.11);
    expect(result.description).toContain("PJ");
  });

  it("PJ with first property", () => {
    const result = estimateFinancingRate({
      monthlyIncome: 15_000,
      propertyValue: 500_000,
      employmentType: "PJ",
      isFirstProperty: true,
    });
    // Base 10.5% + PJ 0.5% - 1st 0.5% = 10.5%
    expect(result.rate).toBeCloseTo(0.105);
  });
});
