// ─── MCMV BRACKETS ──────────────────────────────────────────
const MCMV_BRACKETS = [
  { maxIncome: 2_640, maxProperty: 264_000, rate: 0.0425 },
  { maxIncome: 4_400, maxProperty: 264_000, rate: 0.06 },
  { maxIncome: 8_000, maxProperty: 350_000, rate: 0.0766 },
] as const;

// ─── SBPE BASE RATES ────────────────────────────────────────
const SBPE_BASE_RATE = 0.105;
const CLT_DISCOUNT = 0.005;
const FIRST_PROPERTY_DISCOUNT = 0.005;
const PJ_PREMIUM = 0.005;

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
