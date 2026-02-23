"use client";

import type { SimulationResults } from "@/engine/types";
import { formatBRL } from "@/engine/formatters";
import { cn } from "@/lib/utils";

interface WinnerBannerProps {
  results: SimulationResults;
}

export function WinnerBanner({ results }: WinnerBannerProps) {
  const { winnerLabel, advantage, advantagePercent, winner } = results;

  const glowClass =
    winner === "ALUGAR"
      ? "glass-card-glow-rent"
      : winner === "COMPRAR_VISTA"
        ? "glass-card-glow-buy"
        : "glass-card-glow-finance";

  return (
    <div className={cn("glass-card winner-shimmer p-5", glowClass)}>
      <p className="text-center text-sm sm:text-base">
        Com base nos parâmetros informados,{" "}
        <span className="font-bold">{winnerLabel}</span> gera{" "}
        <span className="font-bold">{formatBRL(advantage)}</span>{" "}
        <span className="text-muted-foreground">(+{advantagePercent.toFixed(1)}%)</span> a mais em
        patrimônio.
      </p>
    </div>
  );
}
