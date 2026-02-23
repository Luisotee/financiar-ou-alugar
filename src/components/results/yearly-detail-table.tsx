"use client";

import { useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import type { SimulationResults, ScenarioResult, MonthlySnapshot } from "@/engine/types";
import { formatBRLCompact } from "@/engine/formatters";
import { cn } from "@/lib/utils";

interface YearlyDetailTableProps {
  results: SimulationResults;
  showRealValues: boolean;
}

function deflate(value: number, snapshot: MonthlySnapshot, showReal: boolean): number {
  if (!showReal || snapshot.totalWealth === 0) return value;
  return value * (snapshot.totalWealthReal / snapshot.totalWealth);
}

function ScenarioTable({
  scenario,
  showRealValues,
}: {
  scenario: ScenarioResult;
  showRealValues: boolean;
}) {
  const isRent = scenario.name === "ALUGAR";
  const isFinance = scenario.name === "FINANCIAR";

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-xs">Ano</TableHead>
          <TableHead className="text-right text-xs">Custo/mês</TableHead>
          <TableHead className="text-right text-xs">Surplus/mês</TableHead>
          <TableHead className="text-right text-xs">Gasto Acum.</TableHead>
          <TableHead className="text-right text-xs">Investimentos</TableHead>
          {!isRent && <TableHead className="text-right text-xs">Imóvel</TableHead>}
          {isFinance && <TableHead className="text-right text-xs">Dívida</TableHead>}
          <TableHead className="text-right text-xs">Patrimônio</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {scenario.yearlySnapshots.map((snap) => {
          const monthlyCost =
            snap.rentPaid + snap.mortgagePayment + snap.condominioPayment + snap.iptuPayment;

          const d = (v: number) => deflate(v, snap, showRealValues);

          return (
            <TableRow key={snap.year} className="text-xs">
              <TableCell className="font-medium">{snap.year}</TableCell>
              <TableCell className="text-right">{formatBRLCompact(d(monthlyCost))}</TableCell>
              <TableCell className="text-right">{formatBRLCompact(d(snap.investmentContribution))}</TableCell>
              <TableCell className="text-right">{formatBRLCompact(d(snap.totalSpent))}</TableCell>
              <TableCell className="text-right">{formatBRLCompact(d(snap.investmentBalance))}</TableCell>
              {!isRent && <TableCell className="text-right">{formatBRLCompact(d(snap.propertyValue))}</TableCell>}
              {isFinance && (
                <TableCell className="text-right text-destructive">
                  {snap.outstandingDebt > 0 ? formatBRLCompact(d(snap.outstandingDebt)) : "—"}
                </TableCell>
              )}
              <TableCell className="text-right font-medium">
                {formatBRLCompact(showRealValues ? snap.totalWealthReal : snap.totalWealth)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function YearlyDetailTable({ results, showRealValues }: YearlyDetailTableProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button className="flex w-full items-center justify-between glass-card px-5 py-3 transition-colors hover:bg-accent/30">
          <h3 className="text-sm font-semibold">Evolução Anual Detalhada</h3>
          <ChevronRight
            className={cn(
              "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
              isOpen && "rotate-90"
            )}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="glass-card mt-2 p-5">
          <Tabs defaultValue="ALUGAR">
            <TabsList className="mb-3">
              <TabsTrigger value="ALUGAR">Alugar</TabsTrigger>
              <TabsTrigger value="COMPRAR_VISTA">Comprar à Vista</TabsTrigger>
              <TabsTrigger value="FINANCIAR">Financiar</TabsTrigger>
            </TabsList>
            <TabsContent value="ALUGAR">
              <ScenarioTable scenario={results.rent} showRealValues={showRealValues} />
            </TabsContent>
            <TabsContent value="COMPRAR_VISTA">
              <ScenarioTable scenario={results.buyCash} showRealValues={showRealValues} />
            </TabsContent>
            <TabsContent value="FINANCIAR">
              <ScenarioTable scenario={results.finance} showRealValues={showRealValues} />
            </TabsContent>
          </Tabs>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
