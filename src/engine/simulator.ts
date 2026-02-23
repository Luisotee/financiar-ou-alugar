import type { SimulationInputs, SimulationResults, ChartDataPoint } from "./types";
import { calculateRentScenario } from "./scenario-rent";
import { calculateBuyCashScenario } from "./scenario-buy-cash";
import { calculateFinanceScenario } from "./scenario-finance";
import { generateSACSchedule, generatePriceSchedule } from "./amortization";

const LABELS: Record<string, string> = {
  ALUGAR: "Alugar",
  COMPRAR_VISTA: "Comprar à Vista",
  FINANCIAR: "Financiar",
};

export function runSimulation(inputs: SimulationInputs): SimulationResults {
  // Compute monthly budget = max first-month cost across all 3 scenarios
  const iptuMonthly = inputs.propertyValue * inputs.iptuRate / 12;
  const rentFirstMonth =
    inputs.monthlyRent + inputs.condominioMonthly + iptuMonthly + inputs.renterInsuranceMonthly;
  const cashFirstMonth = inputs.condominioMonthly + iptuMonthly;

  const downPayment = inputs.propertyValue * inputs.downPaymentPercent;
  const fgts = inputs.useFGTS ? inputs.fgtsAmount : 0;
  const loanAmount = Math.max(0, inputs.propertyValue - downPayment - fgts);
  const financingMonths = inputs.financingTermYears * 12;
  const tempSchedule =
    inputs.amortizationType === "SAC"
      ? generateSACSchedule(
          loanAmount, inputs.financingRate, financingMonths,
          inputs.propertyValue, inputs.mipRate, inputs.dfiRate, inputs.taxaAdministracao
        )
      : generatePriceSchedule(
          loanAmount, inputs.financingRate, financingMonths,
          inputs.propertyValue, inputs.mipRate, inputs.dfiRate, inputs.taxaAdministracao
        );
  const financeFirstMonth = (tempSchedule[0]?.payment ?? 0) + cashFirstMonth;

  const monthlyBudget = Math.max(rentFirstMonth, cashFirstMonth, financeFirstMonth);

  const rent = calculateRentScenario(inputs, monthlyBudget);
  const buyCash = calculateBuyCashScenario(inputs, monthlyBudget);
  const finance = calculateFinanceScenario(inputs, monthlyBudget);

  // Determine winner
  const key = inputs.showRealValues ? "finalWealthReal" : "finalWealth";
  const scenarios = [
    { result: rent, name: "ALUGAR" as const },
    { result: buyCash, name: "COMPRAR_VISTA" as const },
    { result: finance, name: "FINANCIAR" as const },
  ];

  const sorted = [...scenarios].sort((a, b) => b.result[key] - a.result[key]);
  const winner = sorted[0].name;
  const advantage = sorted[0].result[key] - sorted[1].result[key];

  // Build chart data (yearly snapshots)
  const chartData: ChartDataPoint[] = [];

  // Year 0: starting point
  const startingCapital =
    inputs.propertyValue +
    inputs.propertyValue * inputs.itbiRate +
    inputs.propertyValue * inputs.escrituraRate +
    inputs.propertyValue * inputs.registroRate;

  chartData.push({
    year: 0,
    alugar: startingCapital,
    comprarVista: inputs.propertyValue,
    financiar: inputs.propertyValue,
  });

  for (let y = 1; y <= inputs.timeHorizonYears; y++) {
    const monthIndex = y * 12 - 1;
    const getValue = inputs.showRealValues ? "totalWealthReal" : "totalWealth";

    chartData.push({
      year: y,
      alugar: rent.monthlySnapshots[monthIndex]?.[getValue] ?? 0,
      comprarVista: buyCash.monthlySnapshots[monthIndex]?.[getValue] ?? 0,
      financiar: finance.monthlySnapshots[monthIndex]?.[getValue] ?? 0,
    });
  }

  return {
    rent,
    buyCash,
    finance,
    winner,
    winnerLabel: LABELS[winner],
    advantage,
    chartData,
    startingCapital,
    monthlyBudget,
  };
}
