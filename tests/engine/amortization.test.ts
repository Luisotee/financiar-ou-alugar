import { describe, it, expect } from "vitest";
import {
  generateSACSchedule,
  generatePriceSchedule,
} from "@/engine/amortization";

const LOAN = 400_000;
const ANNUAL_RATE = 0.0999;
const TERM = 360; // 30 years
const PROPERTY_VALUE = 500_000;
const MIP = 0.0003;
const DFI = 0.00015;
const ADMIN = 25;

describe("SAC Schedule", () => {
  const schedule = generateSACSchedule(
    LOAN, ANNUAL_RATE, TERM, PROPERTY_VALUE, MIP, DFI, ADMIN
  );

  it("generates correct number of rows", () => {
    expect(schedule).toHaveLength(TERM);
  });

  it("ends with zero balance", () => {
    const last = schedule[schedule.length - 1];
    expect(last.outstandingBalance).toBeCloseTo(0, 2);
  });

  it("has constant amortization", () => {
    const expected = LOAN / TERM;
    for (const row of schedule) {
      expect(row.principal).toBeCloseTo(expected, 2);
    }
  });

  it("has decreasing total payments", () => {
    expect(schedule[0].payment).toBeGreaterThan(
      schedule[schedule.length - 1].payment
    );
  });

  it("sum of principal equals loan amount", () => {
    const totalPrincipal = schedule.reduce((sum, r) => sum + r.principal, 0);
    expect(totalPrincipal).toBeCloseTo(LOAN, 0);
  });
});

describe("Price Schedule", () => {
  const schedule = generatePriceSchedule(
    LOAN, ANNUAL_RATE, TERM, PROPERTY_VALUE, MIP, DFI, ADMIN
  );

  it("generates correct number of rows", () => {
    expect(schedule).toHaveLength(TERM);
  });

  it("ends with near-zero balance", () => {
    const last = schedule[schedule.length - 1];
    expect(last.outstandingBalance).toBeCloseTo(0, 0);
  });

  it("has increasing principal portion", () => {
    expect(schedule[0].principal).toBeLessThan(
      schedule[schedule.length - 1].principal
    );
  });

  it("has decreasing interest portion", () => {
    expect(schedule[0].interest).toBeGreaterThan(
      schedule[schedule.length - 1].interest
    );
  });

  it("sum of principal equals loan amount", () => {
    const totalPrincipal = schedule.reduce((sum, r) => sum + r.principal, 0);
    expect(totalPrincipal).toBeCloseTo(LOAN, 0);
  });
});
