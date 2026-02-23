import { CAPITAL_GAINS_TABLE } from "./constants";

export function calculateCapitalGainsTax(
  nominalGain: number,
  salePrice: number,
  isOnlyProperty: boolean = false
): number {
  if (nominalGain <= 0) return 0;

  // Exemption: sale price <= R$440,000 and only property
  if (salePrice <= 440_000 && isOnlyProperty) return 0;

  let remainingGain = nominalGain;
  let totalTax = 0;
  let previousMax = 0;

  for (const bracket of CAPITAL_GAINS_TABLE) {
    const taxableInBracket = Math.min(
      remainingGain,
      bracket.maxGain - previousMax
    );
    if (taxableInBracket <= 0) break;
    totalTax += taxableInBracket * bracket.rate;
    remainingGain -= taxableInBracket;
    previousMax = bracket.maxGain;
  }

  return totalTax;
}
