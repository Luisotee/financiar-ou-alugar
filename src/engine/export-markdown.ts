import type { SimulationInputs, SimulationResults, ScenarioResult, MonthlySnapshot } from "./types";
import { formatBRL, formatBRLCompact, formatPercent } from "./formatters";

function deflate(value: number, snapshot: MonthlySnapshot, showReal: boolean): number {
  if (!showReal || snapshot.totalWealth === 0) return value;
  return value * (snapshot.totalWealthReal / snapshot.totalWealth);
}

function computeCosts(scenario: ScenarioResult) {
  let totalRent = 0;
  let totalPrincipal = 0;
  let totalCondominio = 0;
  let totalIptu = 0;
  let totalInsurance = 0;

  for (const s of scenario.monthlySnapshots) {
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

function pad(str: string, len: number): string {
  return str.padStart(len);
}

function scenarioYearlyTable(
  scenario: ScenarioResult,
  showRealValues: boolean,
): string {
  const isRent = scenario.name === "ALUGAR";
  const isFinance = scenario.name === "FINANCIAR";

  const headers = ["Ano", "Custo/mês", "Surplus/mês", "Gasto Acum.", "Investimentos"];
  if (!isRent) headers.push("Imóvel");
  if (isFinance) headers.push("Dívida");
  headers.push("Patrimônio");

  const rows = scenario.yearlySnapshots.map((snap) => {
    const d = (v: number) => deflate(v, snap, showRealValues);

    const monthlyCost =
      snap.rentPaid + snap.mortgagePayment + snap.condominioPayment + snap.iptuPayment;

    const cells: string[] = [
      String(snap.year),
      formatBRLCompact(d(monthlyCost)),
      formatBRLCompact(d(snap.investmentContribution)),
      formatBRLCompact(showRealValues ? snap.totalSpentReal : snap.totalSpent),
      formatBRLCompact(d(snap.investmentBalance)),
    ];
    if (!isRent) cells.push(formatBRLCompact(d(snap.propertyValue)));
    if (isFinance) cells.push(snap.outstandingDebt > 0 ? formatBRLCompact(d(snap.outstandingDebt)) : "—");
    cells.push(formatBRLCompact(showRealValues ? snap.totalWealthReal : snap.totalWealth));

    return cells;
  });

  return markdownTable(headers, rows);
}

function markdownTable(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) => {
    const maxData = rows.reduce((max, r) => Math.max(max, (r[i] ?? "").length), 0);
    return Math.max(h.length, maxData);
  });

  const headerLine = "| " + headers.map((h, i) => pad(h, widths[i])).join(" | ") + " |";
  const sepLine = "| " + widths.map((w) => "-".repeat(w)).join(" | ") + " |";
  const dataLines = rows.map(
    (r) => "| " + r.map((c, i) => pad(c, widths[i])).join(" | ") + " |"
  );

  return [headerLine, sepLine, ...dataLines].join("\n");
}

export function exportMarkdown(
  inputs: SimulationInputs,
  results: SimulationResults,
  showRealValues: boolean,
): string {
  const valMode = showRealValues ? "Valores Reais (deflacionados)" : "Valores Nominais";
  const date = new Date().toLocaleDateString("pt-BR");

  const scenarios = [results.rent, results.buyCash, results.finance] as const;

  const lines: string[] = [];

  // ─── Title ─────────────────────────────────────────────────
  lines.push(`# Financiar ou Alugar? — Simulação`);
  lines.push("");
  lines.push(`> Gerado em ${date} · ${valMode}`);
  lines.push("");

  // ─── Winner ────────────────────────────────────────────────
  lines.push(`## Resultado`);
  lines.push("");
  lines.push(
    `**${results.winnerLabel}** é a melhor opção, gerando **${formatBRL(results.advantage)}** (+${results.advantagePercent.toFixed(1)}%) a mais em patrimônio.`
  );
  lines.push("");

  // ─── Context ───────────────────────────────────────────────
  lines.push(`- **Capital atual:** ${formatBRL(results.startingCapital)}`);
  lines.push(`- **Poupança mensal:** ${formatBRL(results.monthlySavings)}/mês`);
  lines.push(`- **Orçamento mensal:** ${formatBRL(results.monthlyBudget)}/mês`);
  lines.push("");

  // ─── Summary table ─────────────────────────────────────────
  lines.push(`## Resumo por Cenário`);
  lines.push("");

  const summaryHeaders = ["Cenário", "Patrimônio Final", "Gasto Total", "Custo Mensal Médio", "Juros Pagos", "Custos Iniciais", "Poupança"];
  const summaryRows = scenarios.map((s) => [
    s.label,
    formatBRL(showRealValues ? s.finalWealthReal : s.finalWealth),
    formatBRL(showRealValues ? s.totalSpentReal : s.totalSpent),
    formatBRL(showRealValues ? s.effectiveMonthlyAvgCostReal : s.effectiveMonthlyAvgCost),
    s.totalInterestPaid > 0 ? formatBRL(s.totalInterestPaid) : "—",
    formatBRL(s.upfrontCost),
    s.savingsPhaseMonths > 0 ? `${Math.floor(s.savingsPhaseMonths / 12)}a ${s.savingsPhaseMonths % 12}m` : "—",
  ]);
  lines.push(markdownTable(summaryHeaders, summaryRows));
  lines.push("");

  // ─── Cost Breakdown ────────────────────────────────────────
  lines.push(`## Destino dos Gastos`);
  lines.push("");

  const costHeaders = ["Cenário", "Custos Iniciais", "Aluguel", "Juros", "Amortização", "Condomínio", "IPTU", "Seguros"];
  const costRows = scenarios.map((s) => {
    const c = computeCosts(s);
    return [
      s.label,
      formatBRL(c.upfront),
      c.rent > 0 ? formatBRL(c.rent) : "—",
      c.interest > 0 ? formatBRL(c.interest) : "—",
      c.principal > 0 ? formatBRL(c.principal) : "—",
      formatBRL(c.condominio),
      formatBRL(c.iptu),
      c.insurance > 0 ? formatBRL(c.insurance) : "—",
    ];
  });
  lines.push(markdownTable(costHeaders, costRows));
  lines.push("");

  // ─── Yearly Detail Tables ─────────────────────────────────
  lines.push(`## Evolução Anual Detalhada`);
  lines.push("");

  for (const s of scenarios) {
    lines.push(`### ${s.label}`);
    lines.push("");
    lines.push(scenarioYearlyTable(s, showRealValues));
    lines.push("");
  }

  // ─── Inputs ────────────────────────────────────────────────
  lines.push(`## Parâmetros Utilizados`);
  lines.push("");

  const inputRows: [string, string][] = [
    ["**Sua Situação Atual**", ""],
    ["Capital disponível", formatBRL(inputs.currentCapital)],
    ["Aluguel atual", formatBRL(inputs.currentRent)],
    ["Poupança mensal", formatBRL(inputs.monthlySavings)],
    ["", ""],
    ["**Imóvel**", ""],
    ["Valor do imóvel", formatBRL(inputs.propertyValue)],
    ["Valorização anual", formatPercent(inputs.propertyAppreciationRate)],
    ["", ""],
    ["**Aluguel**", ""],
    ["Aluguel mensal", formatBRL(inputs.monthlyRent)],
    ["Índice de reajuste", inputs.rentAdjustmentIndex],
    ["Taxa de reajuste", formatPercent(inputs.rentAdjustmentRate)],
    ["", ""],
    ["**Financiamento**", ""],
    ["Entrada", formatPercent(inputs.downPaymentPercent)],
    ["Taxa anual (CET)", formatPercent(inputs.financingRate)],
    ["Prazo", `${inputs.financingTermYears} anos`],
    ["Amortização", inputs.amortizationType],
    ["Usa FGTS", inputs.useFGTS ? "Sim" : "Não"],
    ...(inputs.useFGTS ? [["Valor FGTS", formatBRL(inputs.fgtsAmount)] as [string, string]] : []),
    ["", ""],
    ["**Compra à Vista**", ""],
    ["Desconto à vista", formatPercent(inputs.cashDiscountPercent)],
    ["", ""],
    ["**Custos de Propriedade**", ""],
    ["IPTU (% do imóvel/ano)", formatPercent(inputs.iptuRate)],
    ["Condomínio mensal", formatBRL(inputs.condominioMonthly)],
    ["ITBI", formatPercent(inputs.itbiRate)],
    ["Escritura", formatPercent(inputs.escrituraRate)],
    ["Registro", formatPercent(inputs.registroRate)],
    ["Seguro inquilino/mês", formatBRL(inputs.renterInsuranceMonthly)],
    ["", ""],
    ["**Seguros e Taxas (Financiamento)**", ""],
    ["MIP (mensal s/ saldo)", formatPercent(inputs.mipRate)],
    ["DFI (mensal s/ imóvel)", formatPercent(inputs.dfiRate)],
    ["Taxa de administração/mês", formatBRL(inputs.taxaAdministracao)],
    ["Taxa de avaliação", formatBRL(inputs.taxaAvaliacao)],
    ["", ""],
    ["**Investimento**", ""],
    ["Selic", formatPercent(inputs.selicRate)],
    ["IPCA", formatPercent(inputs.ipcaRate)],
    ["Spread Tesouro IPCA+", formatPercent(inputs.tesouroSpread)],
    ["IGP-M", formatPercent(inputs.igpmRate)],
    ["", ""],
    ["**Perfil do Comprador**", ""],
    ["Renda mensal", formatBRL(inputs.monthlyIncome)],
    ["Vínculo", inputs.employmentType],
    ["Primeiro imóvel", inputs.isFirstProperty ? "Sim" : "Não"],
    ["", ""],
    ["**Horizonte**", ""],
    ["Prazo da simulação", `${inputs.timeHorizonYears} anos`],
    ...(inputs.selectedCity ? [["Cidade", inputs.selectedCity] as [string, string]] : []),
  ];

  // Filter out separator rows and build table
  const paramHeaders = ["Parâmetro", "Valor"];
  const paramData = inputRows.filter(([a, b]) => a !== "" || b !== "");
  lines.push(markdownTable(paramHeaders, paramData));
  lines.push("");

  return lines.join("\n");
}
