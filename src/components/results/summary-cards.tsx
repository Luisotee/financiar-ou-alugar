"use client";

import type { SimulationResults, ScenarioResult } from "@/engine/types";
import { formatBRL, formatBRLCompact } from "@/engine/formatters";
import { cn } from "@/lib/utils";

function WealthBreakdown({
  scenario,
  showRealValues,
}: {
  scenario: ScenarioResult;
  showRealValues: boolean;
}) {
  const last = scenario.monthlySnapshots[scenario.monthlySnapshots.length - 1];
  if (!last) return null;

  const deflator =
    showRealValues && last.totalWealth !== 0
      ? last.totalWealthReal / last.totalWealth
      : 1;

  const items: { label: string; value: number; negative?: boolean }[] = [];

  if (last.investmentBalance > 0) {
    items.push({ label: "Investimentos", value: last.investmentBalance * deflator });
  }
  if (last.propertyValue > 0) {
    items.push({ label: "Imóvel", value: last.propertyValue * deflator });
  }
  if (last.outstandingDebt > 0) {
    items.push({ label: "Dívida", value: -last.outstandingDebt * deflator, negative: true });
  }

  const capitalGainsTax =
    last.propertyValue - last.outstandingDebt + last.investmentBalance - last.totalWealth;
  if (capitalGainsTax > 1) {
    items.push({ label: "Imp. Ganho Capital", value: -capitalGainsTax * deflator, negative: true });
  }

  if (items.length <= 1) return null;

  return (
    <div className="border-t border-border/50 pt-2 space-y-0.5">
      {items.map((item) => (
        <div key={item.label} className="flex justify-between text-xs">
          <span className="text-muted-foreground">{item.label}</span>
          <span className={item.negative ? "text-destructive" : "text-foreground/80"}>
            {formatBRLCompact(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface SummaryCardsProps {
  results: SimulationResults;
  showRealValues: boolean;
}

function ScenarioCard({
  scenario,
  isWinner,
  ringClass,
  glowClass,
  icon,
  showRealValues,
}: {
  scenario: ScenarioResult;
  isWinner: boolean;
  ringClass: string;
  glowClass: string;
  icon: string;
  showRealValues: boolean;
}) {
  return (
    <div
      className={cn(
        "glass-card relative overflow-hidden p-5 transition-all",
        isWinner && "ring-2 ring-offset-2 ring-offset-background",
        isWinner && ringClass,
        isWinner && glowClass
      )}
    >
      {isWinner && (
        <div className="absolute top-0 right-0 rounded-bl-lg bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
          MELHOR
        </div>
      )}

      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h3 className="font-semibold">{scenario.label}</h3>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-2xl font-bold tracking-tight">
            {formatBRL(showRealValues ? scenario.finalWealthReal : scenario.finalWealth)}
          </p>
          <p className="text-xs text-muted-foreground">Patrimônio Final</p>
          <WealthBreakdown scenario={scenario} showRealValues={showRealValues} />
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="font-medium">{formatBRL(showRealValues ? scenario.totalSpentReal : scenario.totalSpent)}</p>
            <p className="text-xs text-muted-foreground">Gasto Total</p>
          </div>
          <div>
            <p className="font-medium">
              {formatBRL(showRealValues ? scenario.effectiveMonthlyAvgCostReal : scenario.effectiveMonthlyAvgCost)}
            </p>
            <p className="text-xs text-muted-foreground">Custo Mensal Médio</p>
          </div>
        </div>

        {scenario.totalInterestPaid > 0 && (
          <div className="border-t border-border/50 pt-2 text-sm">
            <p className="font-medium text-destructive">
              {formatBRL(scenario.totalInterestPaid)}
            </p>
            <p className="text-xs text-muted-foreground">Total de Juros Pagos</p>
          </div>
        )}

        {scenario.savingsPhaseMonths > 0 && (
          <div className="border-t border-border/50 pt-2 text-sm">
            <p className="font-medium">
              {Math.floor(scenario.savingsPhaseMonths / 12) > 0
                ? `${Math.floor(scenario.savingsPhaseMonths / 12)}a ${scenario.savingsPhaseMonths % 12}m`
                : `${scenario.savingsPhaseMonths} meses`}
            </p>
            <p className="text-xs text-muted-foreground">Fase de Poupança</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function SummaryCards({ results, showRealValues }: SummaryCardsProps) {
  return (
    <div className="space-y-4">
      <ScenarioCard
        scenario={results.rent}
        isWinner={results.winner === "ALUGAR"}
        ringClass="ring-scenario-rent"
        glowClass="glass-card-glow-rent"
        icon="🏠"
        showRealValues={showRealValues}
      />
      <ScenarioCard
        scenario={results.buyCash}
        isWinner={results.winner === "COMPRAR_VISTA"}
        ringClass="ring-scenario-buy"
        glowClass="glass-card-glow-buy"
        icon="💰"
        showRealValues={showRealValues}
      />
      <ScenarioCard
        scenario={results.finance}
        isWinner={results.winner === "FINANCIAR"}
        ringClass="ring-scenario-finance"
        glowClass="glass-card-glow-finance"
        icon="🏦"
        showRealValues={showRealValues}
      />
    </div>
  );
}
