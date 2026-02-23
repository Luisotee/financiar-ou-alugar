"use client";

import { useMemo, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
  BarChart,
  Bar,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { SimulationResults, ScenarioResult } from "@/engine/types";
import { formatBRLCompact } from "@/engine/formatters";

interface WealthChartProps {
  results: SimulationResults;
  showRealValues: boolean;
}

const wealthConfig = {
  alugar: {
    label: "Alugar",
    color: "var(--color-scenario-rent)",
  },
  comprarVista: {
    label: "Comprar à Vista",
    color: "var(--color-scenario-buy)",
  },
  financiar: {
    label: "Financiar",
    color: "var(--color-scenario-finance)",
  },
} satisfies ChartConfig;

const compositionConfig = {
  investment: {
    label: "Investimentos",
    color: "oklch(0.7 0.15 160)",
  },
  equity: {
    label: "Equity Imóvel",
    color: "oklch(0.65 0.15 250)",
  },
} satisfies ChartConfig;

function formatTooltipValue(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function WealthAreaChart({ data }: { data: SimulationResults["chartData"] }) {
  return (
    <ChartContainer config={wealthConfig} className="h-[350px] w-full">
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <defs>
          <linearGradient id="fillAlugar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-scenario-rent)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-scenario-rent)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fillComprar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-scenario-buy)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-scenario-buy)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="fillFinanciar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-scenario-finance)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--color-scenario-finance)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
        <XAxis
          dataKey="year"
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}a`}
          tick={{ fontSize: 12 }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => formatBRLCompact(v)}
          tick={{ fontSize: 12 }}
          width={70}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => <span>{formatTooltipValue(value as number)}</span>}
              labelFormatter={(label) => `Ano ${label}`}
            />
          }
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Area
          type="monotone"
          dataKey="alugar"
          stroke="var(--color-scenario-rent)"
          fill="url(#fillAlugar)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Area
          type="monotone"
          dataKey="comprarVista"
          stroke="var(--color-scenario-buy)"
          fill="url(#fillComprar)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Area
          type="monotone"
          dataKey="financiar"
          stroke="var(--color-scenario-finance)"
          fill="url(#fillFinanciar)"
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ChartContainer>
  );
}

function CompositionChart({
  results,
  showRealValues,
}: {
  results: SimulationResults;
  showRealValues: boolean;
}) {
  const [selectedScenario, setSelectedScenario] = useState<
    "rent" | "buyCash" | "finance"
  >("rent");

  const scenario = results[selectedScenario];

  const data = useMemo(() => {
    return scenario.yearlySnapshots.map((snap) => {
      const deflator =
        showRealValues && snap.totalWealth !== 0
          ? snap.totalWealthReal / snap.totalWealth
          : 1;

      const investment = snap.investmentBalance * deflator;
      const equity = Math.max(0, (snap.propertyValue - snap.outstandingDebt) * deflator);

      return {
        year: snap.year,
        investment,
        equity,
      };
    });
  }, [scenario, showRealValues]);

  const isRent = selectedScenario === "rent";

  return (
    <div className="space-y-3">
      <div className="flex gap-1">
        <button
          onClick={() => setSelectedScenario("rent")}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
            selectedScenario === "rent"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Alugar
        </button>
        <button
          onClick={() => setSelectedScenario("buyCash")}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
            selectedScenario === "buyCash"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Comprar à Vista
        </button>
        <button
          onClick={() => setSelectedScenario("finance")}
          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
            selectedScenario === "finance"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          Financiar
        </button>
      </div>

      <ChartContainer config={compositionConfig} className="h-[350px] w-full">
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="fillInvestment" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.7 0.15 160)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="oklch(0.7 0.15 160)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="fillEquity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="oklch(0.65 0.15 250)" stopOpacity={0.4} />
              <stop offset="95%" stopColor="oklch(0.65 0.15 250)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} />
          <XAxis
            dataKey="year"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}a`}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatBRLCompact(v)}
            tick={{ fontSize: 12 }}
            width={70}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => <span>{formatTooltipValue(value as number)}</span>}
                labelFormatter={(label) => `Ano ${label}`}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Area
            type="monotone"
            dataKey="investment"
            stackId="composition"
            stroke="oklch(0.7 0.15 160)"
            fill="url(#fillInvestment)"
            strokeWidth={2}
          />
          {!isRent && (
            <Area
              type="monotone"
              dataKey="equity"
              stackId="composition"
              stroke="oklch(0.65 0.15 250)"
              fill="url(#fillEquity)"
              strokeWidth={2}
            />
          )}
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

export function WealthChart({ results, showRealValues }: WealthChartProps) {
  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Evolução Patrimonial</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="total">
          <TabsList className="mb-3">
            <TabsTrigger value="total">Patrimônio Total</TabsTrigger>
            <TabsTrigger value="composition">Composição</TabsTrigger>
          </TabsList>
          <TabsContent value="total">
            <WealthAreaChart data={results.chartData} />
          </TabsContent>
          <TabsContent value="composition">
            <CompositionChart results={results} showRealValues={showRealValues} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
