import { describe, it, expect } from "vitest";
import { CITY_DEFAULTS, CITY_OPTIONS } from "@/engine/city-defaults";

describe("CITY_DEFAULTS", () => {
  const cities = Object.entries(CITY_DEFAULTS);

  it("has 13 cities", () => {
    expect(cities).toHaveLength(13);
  });

  it("includes Sorocaba", () => {
    expect(CITY_DEFAULTS.SOROCABA).toBeDefined();
    expect(CITY_DEFAULTS.SOROCABA.label).toBe("Sorocaba");
    expect(CITY_DEFAULTS.SOROCABA.state).toBe("SP");
  });

  it.each(cities)("city %s has valid IPTU rate (0.1%-1.5%)", (_key, city) => {
    expect(city.iptuRate).toBeGreaterThanOrEqual(0.001);
    expect(city.iptuRate).toBeLessThanOrEqual(0.015);
  });

  it.each(cities)(
    "city %s has valid appreciation rate (0.5%-5%)",
    (_key, city) => {
      expect(city.propertyAppreciationRate).toBeGreaterThanOrEqual(0.005);
      expect(city.propertyAppreciationRate).toBeLessThanOrEqual(0.05);
    }
  );

  it.each(cities)("city %s has valid ITBI rate (1%-5%)", (_key, city) => {
    expect(city.itbiRate).toBeGreaterThanOrEqual(0.01);
    expect(city.itbiRate).toBeLessThanOrEqual(0.05);
  });

  it.each(cities)(
    "city %s has valid rental yield (3%-10% annual)",
    (_key, city) => {
      const annualYield = city.rentToPrice * 12;
      expect(annualYield).toBeGreaterThanOrEqual(0.03);
      expect(annualYield).toBeLessThanOrEqual(0.10);
    }
  );

  it.each(cities)(
    "city %s has valid rent adjustment rate (3%-10%)",
    (_key, city) => {
      expect(city.rentAdjustmentRate).toBeGreaterThanOrEqual(0.03);
      expect(city.rentAdjustmentRate).toBeLessThanOrEqual(0.10);
    }
  );
});

describe("CITY_OPTIONS", () => {
  it("has same count as CITY_DEFAULTS", () => {
    expect(CITY_OPTIONS).toHaveLength(Object.keys(CITY_DEFAULTS).length);
  });

  it("is sorted alphabetically by label (pt-BR)", () => {
    const labels = CITY_OPTIONS.map((o) => o.label);
    const sorted = [...labels].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
    expect(labels).toEqual(sorted);
  });
});
