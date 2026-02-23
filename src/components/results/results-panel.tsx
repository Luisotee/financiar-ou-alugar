"use client";

import type { SimulationResults } from "@/engine/types";
import { WinnerBanner } from "./winner-banner";
import { CapitalContextBanner } from "./capital-context-banner";
import { SummaryCards } from "./summary-cards";
import { WealthChart } from "./wealth-chart";
import { CostBreakdown } from "./cost-breakdown";
import { YearlyDetailTable } from "./yearly-detail-table";

interface ResultsPanelProps {
  results: SimulationResults;
  showRealValues: boolean;
}

export function ResultsPanel({ results, showRealValues }: ResultsPanelProps) {
  return (
    <div className="space-y-6">
      <WinnerBanner results={results} />
      <CapitalContextBanner
        startingCapital={results.startingCapital}
        monthlyBudget={results.monthlyBudget}
        monthlySavings={results.monthlySavings}
      />
      <SummaryCards results={results} showRealValues={showRealValues} />
      <WealthChart results={results} showRealValues={showRealValues} />
      <CostBreakdown results={results} />
      <YearlyDetailTable results={results} showRealValues={showRealValues} />
    </div>
  );
}
