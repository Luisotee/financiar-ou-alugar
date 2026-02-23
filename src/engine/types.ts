// ─── INPUT TYPES ───────────────────────────────────────────

export interface SimulationInputs {
  // Property
  propertyValue: number;
  propertyAppreciationRate: number; // Real annual appreciation (e.g. 0.03 = 3%)

  // Rent
  monthlyRent: number;
  rentAdjustmentIndex: "IGPM" | "IPCA";
  rentAdjustmentRate: number;

  // Financing
  downPaymentPercent: number;
  financingRate: number; // CET annual
  financingTermYears: number;
  amortizationType: "SAC" | "PRICE";
  useFGTS: boolean;
  fgtsAmount: number;

  // Cash Purchase
  cashDiscountPercent: number; // Discount for paying cash (e.g. 0.10 = 10%)

  // Ownership Costs
  iptuRate: number; // % of property value per year (e.g. 0.008 = 0.8%)
  condominioMonthly: number;
  itbiRate: number;
  escrituraRate: number; // % of property value (e.g. 0.008 = 0.8%)
  registroRate: number; // % of property value (e.g. 0.008 = 0.8%)
  renterInsuranceMonthly: number;

  // Insurance & Fees (Financing)
  mipRate: number; // Monthly rate on outstanding balance
  dfiRate: number; // Monthly rate on property value
  taxaAdministracao: number; // Monthly flat fee
  taxaAvaliacao: number; // Bank appraisal fee (one-time, financing only)

  // Investment
  selicRate: number;
  ipcaRate: number;
  tesouroSpread: number; // IPCA+ spread
  igpmRate: number;

  // Current financial situation
  currentCapital: number; // Capital available today
  currentRent: number; // Rent paid today (0 if living with parents)
  monthlySavings: number; // Monthly savings capacity

  // Buyer Profile (for rate estimation)
  monthlyIncome: number;
  employmentType: "CLT" | "PJ";
  isFirstProperty: boolean;

  // Macro
  timeHorizonYears: number;

  // Location
  selectedCity: string | null; // key from CITY_DEFAULTS, or null = custom

  // Display
  showRealValues: boolean;
}

// ─── OUTPUT TYPES ──────────────────────────────────────────

export interface MonthlySnapshot {
  month: number;
  year: number;

  // Scenario-specific
  rentPaid: number;
  mortgagePayment: number;
  principalPaid: number;
  interestPaid: number;
  insurancePaid: number;

  // Common
  condominioPayment: number;
  iptuPayment: number;
  investmentBalance: number;
  investmentContribution: number;
  propertyValue: number;
  outstandingDebt: number;

  // Totals
  totalWealth: number;
  totalSpent: number;
  totalWealthReal: number;
  totalSpentReal: number;
}

export interface ScenarioResult {
  name: "ALUGAR" | "COMPRAR_VISTA" | "FINANCIAR";
  label: string;
  monthlySnapshots: MonthlySnapshot[];
  yearlySnapshots: MonthlySnapshot[];
  finalWealth: number;
  finalWealthReal: number;
  totalSpent: number;
  totalSpentReal: number;
  effectiveMonthlyAvgCost: number;
  effectiveMonthlyAvgCostReal: number;
  totalInterestPaid: number;
  upfrontCost: number;
  savingsPhaseMonths: number;
}

export interface SimulationResults {
  rent: ScenarioResult;
  buyCash: ScenarioResult;
  finance: ScenarioResult;
  winner: "ALUGAR" | "COMPRAR_VISTA" | "FINANCIAR";
  winnerLabel: string;
  advantage: number;
  advantagePercent: number;
  chartData: ChartDataPoint[];
  startingCapital: number;
  monthlyBudget: number;
  monthlySavings: number;
}

export interface ChartDataPoint {
  year: number;
  alugar: number;
  comprarVista: number;
  financiar: number;
}

export interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  insurance: number;
  adminFee: number;
  outstandingBalance: number;
}

export interface InvestmentState {
  grossBalance: number;
  totalContributed: number;
  months: number;
}
