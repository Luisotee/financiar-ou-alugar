// ─── MCMV BRACKETS (updated Feb/2026) ───────────────────────
const MCMV_BRACKETS = [
  { maxIncome: 2_850, maxProperty: 270_000, rate: 0.05 },
  { maxIncome: 4_700, maxProperty: 270_000, rate: 0.0816 },
  { maxIncome: 8_600, maxProperty: 350_000, rate: 0.1025 },
  { maxIncome: 12_000, maxProperty: 500_000, rate: 0.105 },
] as const;

// ─── SBPE BASE RATES ────────────────────────────────────────
const SBPE_BASE_RATE = 0.11;
const CLT_DISCOUNT = 0.005;
const FIRST_PROPERTY_DISCOUNT = 0.005;
const PJ_PREMIUM = 0;

export interface RateEstimation {
  rate: number;
  description: string;
}

export function estimateFinancingRate(params: {
  monthlyIncome: number;
  propertyValue: number;
  employmentType: "CLT" | "PJ";
  isFirstProperty: boolean;
}): RateEstimation {
  const { monthlyIncome, propertyValue, employmentType, isFirstProperty } =
    params;

  // Check MCMV eligibility
  for (const bracket of MCMV_BRACKETS) {
    if (monthlyIncome <= bracket.maxIncome && propertyValue <= bracket.maxProperty) {
      return {
        rate: bracket.rate,
        description: `MCMV (renda até R$${bracket.maxIncome.toLocaleString("pt-BR")})`,
      };
    }
  }

  // SBPE market rate
  let rate = SBPE_BASE_RATE;
  const parts: string[] = ["SBPE"];

  if (employmentType === "CLT") {
    rate -= CLT_DISCOUNT;
    parts.push("CLT");
  } else {
    rate += PJ_PREMIUM;
    parts.push("PJ");
  }

  if (isFirstProperty) {
    rate -= FIRST_PROPERTY_DISCOUNT;
    parts.push("1ª casa");
  }

  return {
    rate,
    description: parts.join(" "),
  };
}
