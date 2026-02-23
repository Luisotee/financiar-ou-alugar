import type { SimulationInputs, SimulationResults, ChartDataPoint } from "./types";
import { calculateRentScenario } from "./scenario-rent";
import { calculateBuyCashScenario } from "./scenario-buy-cash";
import { calculateFinanceScenario } from "./scenario-finance";

const LABELS: Record<string, string> = {
  ALUGAR: "Alugar",
  COMPRAR_VISTA: "Comprar à Vista",
  FINANCIAR: "Financiar",
};

export function runSimulation(inputs: SimulationInputs): SimulationResults {
  // Monthly budget = what the person can actually spend on housing + investing.
  // If rent exceeds budget, surplus goes negative (renter disinvests to cover housing).
  const monthlyBudget = inputs.currentRent + inputs.monthlySavings;

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

  // Year 0: starting point = current capital for all scenarios
  const startingCapital = inputs.currentCapital;

  chartData.push({
    year: 0,
    alugar: startingCapital,
    comprarVista: startingCapital,
    financiar: startingCapital,
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
    monthlySavings: inputs.monthlySavings,
  };
}
