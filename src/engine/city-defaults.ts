// ─── CITY-SPECIFIC DEFAULTS ─────────────────────────────────
// Sources: FipeZAP Dec/2025 (rental yields, appreciation, rent adjustment),
//          municipal legislation verified Feb/2026 (IPTU effective rates, ITBI rates)

export interface CityDefaults {
  readonly label: string;
  readonly state: string;
  /** Effective IPTU rate as % of market value per year (decimal) */
  readonly iptuRate: number;
  /** Real property appreciation rate per year, above inflation (decimal) */
  readonly propertyAppreciationRate: number;
  /** ITBI property transfer tax rate (decimal) */
  readonly itbiRate: number;
  /** Monthly rent as fraction of property value (decimal) */
  readonly rentToPrice: number;
  /** Annual rent adjustment rate for existing contracts (decimal) */
  readonly rentAdjustmentRate: number;
}

export const CITY_DEFAULTS: Record<string, CityDefaults> = {
  SAO_PAULO: {
    label: "São Paulo",
    state: "SP",
    iptuRate: 0.006,
    propertyAppreciationRate: 0.02,
    itbiRate: 0.03,
    rentToPrice: 0.00523,
    rentAdjustmentRate: 0.055,
  },
  RIO_DE_JANEIRO: {
    label: "Rio de Janeiro",
    state: "RJ",
    iptuRate: 0.005,
    propertyAppreciationRate: 0.015,
    itbiRate: 0.03,
    rentToPrice: 0.00493,
    rentAdjustmentRate: 0.05,
  },
  BELO_HORIZONTE: {
    label: "Belo Horizonte",
    state: "MG",
    iptuRate: 0.007,
    propertyAppreciationRate: 0.03,
    itbiRate: 0.03,
    rentToPrice: 0.00426,
    rentAdjustmentRate: 0.055,
  },
  CURITIBA: {
    label: "Curitiba",
    state: "PR",
    iptuRate: 0.004,
    propertyAppreciationRate: 0.035,
    itbiRate: 0.027,
    rentToPrice: 0.00379,
    rentAdjustmentRate: 0.055,
  },
  PORTO_ALEGRE: {
    label: "Porto Alegre",
    state: "RS",
    iptuRate: 0.004,
    propertyAppreciationRate: 0.02,
    itbiRate: 0.03,
    rentToPrice: 0.00581,
    rentAdjustmentRate: 0.05,
  },
  BRASILIA: {
    label: "Brasília",
    state: "DF",
    iptuRate: 0.003,
    propertyAppreciationRate: 0.015,
    itbiRate: 0.02,
    rentToPrice: 0.00529,
    rentAdjustmentRate: 0.045,
  },
  SALVADOR: {
    label: "Salvador",
    state: "BA",
    iptuRate: 0.005,
    propertyAppreciationRate: 0.035,
    itbiRate: 0.03,
    rentToPrice: 0.00593,
    rentAdjustmentRate: 0.06,
  },
  RECIFE: {
    label: "Recife",
    state: "PE",
    iptuRate: 0.006,
    propertyAppreciationRate: 0.02,
    itbiRate: 0.03,
    rentToPrice: 0.00698,
    rentAdjustmentRate: 0.055,
  },
  FORTALEZA: {
    label: "Fortaleza",
    state: "CE",
    iptuRate: 0.005,
    propertyAppreciationRate: 0.03,
    itbiRate: 0.04,
    rentToPrice: 0.00386,
    rentAdjustmentRate: 0.055,
  },
  GOIANIA: {
    label: "Goiânia",
    state: "GO",
    iptuRate: 0.005,
    propertyAppreciationRate: 0.02,
    itbiRate: 0.02,
    rentToPrice: 0.00498,
    rentAdjustmentRate: 0.045,
  },
  FLORIANOPOLIS: {
    label: "Florianópolis",
    state: "SC",
    iptuRate: 0.004,
    propertyAppreciationRate: 0.03,
    itbiRate: 0.02,
    rentToPrice: 0.00467,
    rentAdjustmentRate: 0.055,
  },
  CAMPINAS: {
    label: "Campinas",
    state: "SP",
    iptuRate: 0.005,
    propertyAppreciationRate: 0.025,
    itbiRate: 0.027,
    rentToPrice: 0.0057,
    rentAdjustmentRate: 0.05,
  },
  SOROCABA: {
    label: "Sorocaba",
    state: "SP",
    iptuRate: 0.006,
    propertyAppreciationRate: 0.02,
    itbiRate: 0.025,
    rentToPrice: 0.00458,
    rentAdjustmentRate: 0.045,
  },
};

/** Sorted list for the UI dropdown */
export const CITY_OPTIONS = Object.entries(CITY_DEFAULTS)
  .map(([key, city]) => ({ key, label: `${city.label} - ${city.state}` }))
  .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
