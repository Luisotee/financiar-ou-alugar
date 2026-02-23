"use client";

import { formatBRL } from "@/engine/formatters";

interface CapitalContextBannerProps {
  startingCapital: number;
  monthlyBudget: number;
  monthlySavings: number;
}

export function CapitalContextBanner({
  startingCapital,
  monthlyBudget,
  monthlySavings,
}: CapitalContextBannerProps) {
  return (
    <div className="glass-card px-4 py-2.5 text-center text-sm text-muted-foreground">
      Capital atual:{" "}
      <span className="font-medium text-foreground">{formatBRL(startingCapital)}</span>
      {" · "}
      Poupança mensal:{" "}
      <span className="font-medium text-foreground">{formatBRL(monthlySavings)}</span>/mês
      {" · "}
      Orçamento total:{" "}
      <span className="font-medium text-foreground">{formatBRL(monthlyBudget)}</span>/mês
    </div>
  );
}
