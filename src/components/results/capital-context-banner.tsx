"use client";

import { formatBRL } from "@/engine/formatters";

interface CapitalContextBannerProps {
  startingCapital: number;
  monthlyBudget: number;
}

export function CapitalContextBanner({
  startingCapital,
  monthlyBudget,
}: CapitalContextBannerProps) {
  return (
    <div className="rounded-lg bg-muted/50 px-4 py-2.5 text-center text-sm text-muted-foreground">
      Capital inicial equivalente:{" "}
      <span className="font-medium text-foreground">{formatBRL(startingCapital)}</span>
      {" · "}
      Orçamento mensal:{" "}
      <span className="font-medium text-foreground">{formatBRL(monthlyBudget)}</span>/mês
    </div>
  );
}
