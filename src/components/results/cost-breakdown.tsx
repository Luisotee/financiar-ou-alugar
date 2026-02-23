"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { SimulationResults, ScenarioResult } from "@/engine/types";
import { formatBRLCompact } from "@/engine/formatters";

interface CostBreakdownProps {
  results: SimulationResults;
}

const costConfig = {
  upfront: { label: "Custos Iniciais", color: "oklch(0.65 0.12 30)" },
  rent: { label: "Aluguel", color: "oklch(0.7 0.15 195)" },
  interest: { label: "Juros", color: "oklch(0.6 0.2 25)" },
  principal: { label: "Amortização", color: "oklch(0.7 0.12 250)" },
  condominio: { label: "Condomínio", color: "oklch(0.7 0.12 140)" },
  iptu: { label: "IPTU", color: "oklch(0.65 0.1 80)" },
  insurance: { label: "Seguros", color: "oklch(0.7 0.08 310)" },
} satisfies ChartConfig;

function computeCosts(scenario: ScenarioResult) {
  const snaps = scenario.monthlySnapshots;
  let totalRent = 0;
  let totalPrincipal = 0;
  let totalCondominio = 0;
  let totalIptu = 0;
  let totalInsurance = 0;

  for (const s of snaps) {
    totalRent += s.rentPaid;
    totalPrincipal += s.principalPaid;
    totalCondominio += s.condominioPayment;
    totalIptu += s.iptuPayment;
    totalInsurance += s.insurancePaid;
  }

  return {
    upfront: scenario.upfrontCost,
    rent: totalRent,
    interest: scenario.totalInterestPaid,
    principal: totalPrincipal,
    condominio: totalCondominio,
    iptu: totalIptu,
    insurance: totalInsurance,
  };
}

export function CostBreakdown({ results }: CostBreakdownProps) {
  const data = useMemo(() => {
    const rentCosts = computeCosts(results.rent);
    const buyCosts = computeCosts(results.buyCash);
    const financeCosts = computeCosts(results.finance);

    return [
      { scenario: "Alugar", ...rentCosts },
      { scenario: "Comprar à Vista", ...buyCosts },
      { scenario: "Financiar", ...financeCosts },
    ];
  }, [results]);

  return (
    <div className="glass-card p-5">
      <h3 className="mb-3 text-lg font-semibold">Destino dos Gastos</h3>
      <ChartContainer config={costConfig} className="h-[200px] w-full">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.1} horizontal={false} />
          <XAxis
            type="number"
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => formatBRLCompact(v)}
            tick={{ fontSize: 12 }}
          />
          <YAxis
            type="category"
            dataKey="scenario"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11 }}
            width={110}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value) => (
                  <span>
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                      maximumFractionDigits: 0,
                    }).format(value as number)}
                  </span>
                )}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="upfront" stackId="costs" fill="oklch(0.65 0.12 30)" radius={0} />
          <Bar dataKey="rent" stackId="costs" fill="oklch(0.7 0.15 195)" radius={0} />
          <Bar dataKey="interest" stackId="costs" fill="oklch(0.6 0.2 25)" radius={0} />
          <Bar dataKey="principal" stackId="costs" fill="oklch(0.7 0.12 250)" radius={0} />
          <Bar dataKey="condominio" stackId="costs" fill="oklch(0.7 0.12 140)" radius={0} />
          <Bar dataKey="iptu" stackId="costs" fill="oklch(0.65 0.1 80)" radius={0} />
          <Bar dataKey="insurance" stackId="costs" fill="oklch(0.7 0.08 310)" radius={0} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
