import { describe, it, expect } from "vitest";
import { calculateCapitalGainsTax } from "@/engine/taxes";

describe("calculateCapitalGainsTax", () => {
  it("returns 0 for no gain", () => {
    expect(calculateCapitalGainsTax(-10_000, 500_000)).toBe(0);
  });

  it("returns 0 for zero gain", () => {
    expect(calculateCapitalGainsTax(0, 500_000)).toBe(0);
  });

  it("exempts if sale <= R$440k and only property", () => {
    expect(calculateCapitalGainsTax(100_000, 400_000, true)).toBe(0);
  });

  it("does NOT exempt if not only property", () => {
    expect(calculateCapitalGainsTax(100_000, 400_000, false)).toBe(15_000);
  });

  it("calculates 15% for gain under R$5M", () => {
    expect(calculateCapitalGainsTax(200_000, 700_000)).toBe(30_000);
  });

  it("applies progressive rates for large gains", () => {
    const gain = 7_000_000;
    // First 5M at 15% = 750,000
    // Next 2M at 17.5% = 350,000
    const expected = 750_000 + 350_000;
    expect(calculateCapitalGainsTax(gain, 10_000_000)).toBeCloseTo(
      expected,
      0
    );
  });
});
