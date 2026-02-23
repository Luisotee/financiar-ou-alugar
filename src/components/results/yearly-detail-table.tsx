"use client";

import { Card, CardContent } from "@/components/ui/card";
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
          const monthlyCost = isRent
            ? snap.rentPaid + snap.condominioPayment + snap.iptuPayment
            : isFinance
              ? snap.mortgagePayment + snap.condominioPayment + snap.iptuPayment
              : snap.condominioPayment + snap.iptuPayment;

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
  return (
    <Card>
      <CardContent className="pt-5">
        <h3 className="mb-3 text-sm font-semibold">Evolução Anual Detalhada</h3>
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
      </CardContent>
    </Card>
  );
}
