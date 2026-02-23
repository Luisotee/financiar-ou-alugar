"use client";

import type { SimulationResults } from "@/engine/types";
import { formatBRL } from "@/engine/formatters";

interface WinnerBannerProps {
  results: SimulationResults;
}

export function WinnerBanner({ results }: WinnerBannerProps) {
  const { winnerLabel, advantage, winner } = results;

  const colorClass =
    winner === "ALUGAR"
      ? "from-scenario-rent/20 to-transparent border-scenario-rent/30"
      : winner === "COMPRAR_VISTA"
        ? "from-scenario-buy/20 to-transparent border-scenario-buy/30"
        : "from-scenario-finance/20 to-transparent border-scenario-finance/30";

  return (
    <div
      className={`rounded-xl border bg-gradient-to-r p-4 ${colorClass}`}
    >
      <p className="text-center text-sm sm:text-base">
        Com base nos parâmetros informados,{" "}
        <span className="font-bold">{winnerLabel}</span> gera{" "}
        <span className="font-bold">{formatBRL(advantage)}</span> a mais em
        patrimônio.
      </p>
    </div>
  );
}
