import type { SimulationInputs } from "./types";

// ─── IR REGRESSIVA (Tesouro Direto) ───────────────────────
export const IR_REGRESSIVE_TABLE = [
  { maxDays: 180, rate: 0.225 },
  { maxDays: 360, rate: 0.2 },
  { maxDays: 720, rate: 0.175 },
  { maxDays: Infinity, rate: 0.15 },
];

// ─── IOF TABLE (first 30 days) ────────────────────────────
export const IOF_TABLE: number[] = [
  96, 93, 90, 86, 83, 80, 76, 73, 70, 66, 63, 60, 56, 53, 50, 46, 43, 40, 36,
  33, 30, 26, 23, 20, 16, 13, 10, 6, 3, 0,
].map((v) => v / 100);

// ─── CAPITAL GAINS TAX ────────────────────────────────────
export const CAPITAL_GAINS_TABLE = [
  { maxGain: 5_000_000, rate: 0.15 },
  { maxGain: 10_000_000, rate: 0.175 },
  { maxGain: 30_000_000, rate: 0.2 },
  { maxGain: Infinity, rate: 0.225 },
];

// ─── DEFAULT INPUTS ────────────────────────────────────────
export const DEFAULT_INPUTS: SimulationInputs = {
  propertyValue: 500_000,
  propertyAppreciationRate: 0.02,

  monthlyRent: 2_615,
  rentAdjustmentIndex: "IGPM",
  rentAdjustmentRate: 0.055,

  cashDiscountPercent: 0.1,

  downPaymentPercent: 0.2,
  financingRate: 0.0999,
  financingTermYears: 30,
  amortizationType: "SAC",
  useFGTS: false,
  fgtsAmount: 0,

  iptuRate: 0.006,
  condominioMonthly: 800,
  itbiRate: 0.03,
  escrituraRate: 0.008,
  registroRate: 0.008,
  renterInsuranceMonthly: 50,

  mipRate: 0.0003,
  dfiRate: 0.00015,
  taxaAdministracao: 25,
  taxaAvaliacao: 3_000,

  selicRate: 0.15,
  ipcaRate: 0.045,
  tesouroSpread: 0.07,
  igpmRate: 0.035,

  monthlyIncome: 10_000,
  employmentType: "CLT",
  isFirstProperty: true,

  selectedCity: "SAO_PAULO",

  timeHorizonYears: 20,
  showRealValues: false,
};
