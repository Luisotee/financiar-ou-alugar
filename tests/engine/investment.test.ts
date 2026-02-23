import { describe, it, expect } from "vitest";
import {
  monthlyGrossRate,
  advanceInvestment,
  netInvestmentValue,
  getIRRate,
} from "@/engine/investment";

describe("monthlyGrossRate", () => {
  it("calculates correct rate for IPCA 4.5% + spread 6%", () => {
    const monthly = monthlyGrossRate(0.045, 0.06);
    // Annual = (1.045)(1.06) - 1 = 0.1077
    const expectedAnnual = 1.045 * 1.06 - 1;
    const expectedMonthly = Math.pow(1 + expectedAnnual, 1 / 12) - 1;
    expect(monthly).toBeCloseTo(expectedMonthly, 10);
  });
});

describe("getIRRate", () => {
  it("returns 22.5% for < 180 days", () => {
    expect(getIRRate(90)).toBe(0.225);
  });

  it("returns 20% for 180-360 days", () => {
    expect(getIRRate(270)).toBe(0.2);
  });

  it("returns 17.5% for 360-720 days", () => {
    expect(getIRRate(540)).toBe(0.175);
  });

  it("returns 15% for > 720 days", () => {
    expect(getIRRate(1000)).toBe(0.15);
  });
});

describe("advanceInvestment", () => {
  it("grows balance by monthly rate", () => {
    const state = { grossBalance: 100_000, totalContributed: 100_000, months: 0 };
    const rate = 0.008; // ~0.8%/month
    const next = advanceInvestment(state, rate);
    expect(next.grossBalance).toBeCloseTo(100_800, 0);
    expect(next.months).toBe(1);
  });

  it("adds contribution", () => {
    const state = { grossBalance: 100_000, totalContributed: 100_000, months: 0 };
    const next = advanceInvestment(state, 0.008, 5_000);
    expect(next.grossBalance).toBeCloseTo(105_800, 0);
    expect(next.totalContributed).toBe(105_000);
  });
});

describe("netInvestmentValue", () => {
  it("returns full balance when no gain", () => {
    const state = { grossBalance: 100_000, totalContributed: 100_000, months: 12 };
    expect(netInvestmentValue(state)).toBe(100_000);
  });

  it("deducts IR from gains for long-term holding", () => {
    const state = { grossBalance: 200_000, totalContributed: 100_000, months: 120 };
    // Average holding = 60 months = 1800 days → 15% IR
    const gain = 100_000;
    const irTax = gain * 0.15;
    // Custody fee on full balance (no exemption for IPCA+), using avg balance
    const avgBalance = (100_000 + 200_000) / 2;
    const custodyFee = avgBalance * 0.002 * (120 / 12);
    const expected = 200_000 - irTax - custodyFee;
    expect(netInvestmentValue(state)).toBeCloseTo(expected, 0);
  });
});
