"use client";

import { useCallback, useMemo, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HelpCircle } from "lucide-react";
import { CurrencyInput } from "./currency-input";
import { PercentageInput } from "./percentage-input";
import type { SimulationInputs } from "@/engine/types";
import { estimateFinancingRate } from "@/engine/rate-estimator";
import { CITY_DEFAULTS, CITY_OPTIONS } from "@/engine/city-defaults";

interface InputFormProps {
  inputs: SimulationInputs;
  onChange: (inputs: SimulationInputs) => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b border-border/50 pb-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h3>
  );
}

function InfoTooltip({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="inline size-3.5 shrink-0 text-muted-foreground/70 ml-1 cursor-help" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-64">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

export function InputForm({ inputs, onChange }: InputFormProps) {
  const update = useCallback(
    <K extends keyof SimulationInputs>(key: K, value: SimulationInputs[K]) => {
      onChange({ ...inputs, [key]: value });
    },
    [inputs, onChange]
  );

  // City change: batch-update all city-dependent fields
  const handleCityChange = useCallback(
    (cityKey: string) => {
      if (cityKey === "CUSTOM") {
        onChange({ ...inputs, selectedCity: null });
        return;
      }
      const city = CITY_DEFAULTS[cityKey];
      if (!city) return;
      onChange({
        ...inputs,
        selectedCity: cityKey,
        iptuRate: city.iptuRate,
        propertyAppreciationRate: city.propertyAppreciationRate,
        itbiRate: city.itbiRate,
        monthlyRent: Math.round(inputs.propertyValue * city.rentToPrice),
        rentAdjustmentRate: city.rentAdjustmentRate,
      });
    },
    [inputs, onChange]
  );

  // Auto-update rent when property value changes (if city is selected)
  const prevPropertyValue = useRef(inputs.propertyValue);
  useEffect(() => {
    if (
      inputs.selectedCity &&
      prevPropertyValue.current !== inputs.propertyValue
    ) {
      const city = CITY_DEFAULTS[inputs.selectedCity];
      if (city) {
        onChange({
          ...inputs,
          monthlyRent: Math.round(inputs.propertyValue * city.rentToPrice),
        });
      }
    }
    prevPropertyValue.current = inputs.propertyValue;
  }, [inputs.propertyValue]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rate estimation from buyer profile
  const suggestion = useMemo(
    () =>
      estimateFinancingRate({
        monthlyIncome: inputs.monthlyIncome,
        propertyValue: inputs.propertyValue,
        employmentType: inputs.employmentType,
        isFirstProperty: inputs.isFirstProperty,
      }),
    [
      inputs.monthlyIncome,
      inputs.propertyValue,
      inputs.employmentType,
      inputs.isFirstProperty,
    ]
  );

  // Auto-update financing rate when suggestion changes (unless manually overridden)
  const prevSuggestion = useRef(suggestion.rate);
  useEffect(() => {
    if (prevSuggestion.current !== suggestion.rate) {
      if (inputs.financingRate === prevSuggestion.current) {
        onChange({ ...inputs, financingRate: suggestion.rate });
      }
      prevSuggestion.current = suggestion.rate;
    }
  }, [suggestion.rate]); // eslint-disable-line react-hooks/exhaustive-deps

  const isRateCustom = inputs.financingRate !== suggestion.rate;
  const iptuAnnual = inputs.propertyValue * inputs.iptuRate;

  return (
    <TooltipProvider>
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Parâmetros da Simulação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* ── Localização ── */}
        <section className="space-y-4">
          <SectionTitle>Localização</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Cidade <InfoTooltip text="Preenche automaticamente IPTU, valorização, ITBI e aluguel com dados da cidade" /></Label>
              <Select
                value={inputs.selectedCity ?? "CUSTOM"}
                onValueChange={handleCityChange}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITY_OPTIONS.map((city) => (
                    <SelectItem key={city.key} value={city.key}>
                      {city.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="CUSTOM">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {inputs.selectedCity && (
            <p className="text-xs text-muted-foreground">
              IPTU, valorização, ITBI, aluguel e reajuste ajustados para{" "}
              {CITY_DEFAULTS[inputs.selectedCity]?.label ?? inputs.selectedCity}
            </p>
          )}
        </section>

        {/* ── Imóvel ── */}
        <section className="space-y-4">
          <SectionTitle>Imóvel</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="property-value">Valor do Imóvel <InfoTooltip text="Preço de mercado do imóvel que você está considerando" /></Label>
              <CurrencyInput
                id="property-value"
                value={inputs.propertyValue}
                onChange={(v) => update("propertyValue", v)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="condominio">Condomínio Mensal <InfoTooltip text="Taxa mensal do condomínio, paga por proprietários e inquilinos" /></Label>
              <CurrencyInput
                id="condominio"
                value={inputs.condominioMonthly}
                onChange={(v) => update("condominioMonthly", v)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="iptu">IPTU (% do valor do imóvel) <InfoTooltip text="Imposto municipal anual sobre o imóvel, cobrado pela prefeitura" /></Label>
              <div className="flex items-center gap-2">
                <PercentageInput
                  id="iptu"
                  value={inputs.iptuRate}
                  onChange={(v) => update("iptuRate", v)}
                />
                <span className="shrink-0 text-xs text-muted-foreground">
                  = {formatCurrency(iptuAnnual)}/ano
                </span>
              </div>
            </div>
            {inputs.selectedCity && CITY_DEFAULTS[inputs.selectedCity] && (
              <p className="text-xs text-muted-foreground col-span-full">
                Taxa efetiva média — {CITY_DEFAULTS[inputs.selectedCity].label} - {CITY_DEFAULTS[inputs.selectedCity].state}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="appreciation">Valorização Real (%/ano) <InfoTooltip text="Quanto o imóvel valoriza por ano acima da inflação" /></Label>
              <PercentageInput
                id="appreciation"
                value={inputs.propertyAppreciationRate}
                onChange={(v) => update("propertyAppreciationRate", v)}
              />
            </div>
            {inputs.selectedCity && CITY_DEFAULTS[inputs.selectedCity] && (
              <p className="text-xs text-muted-foreground col-span-full">
                Valorização real média — {CITY_DEFAULTS[inputs.selectedCity].label} - {CITY_DEFAULTS[inputs.selectedCity].state} (FipeZAP)
              </p>
            )}
          </div>
        </section>

        {/* ── Aluguel ── */}
        <section className="space-y-4">
          <SectionTitle>Aluguel</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="monthly-rent">Aluguel Mensal <InfoTooltip text="Valor do aluguel que seria pago caso opte por não comprar" /></Label>
              <CurrencyInput
                id="monthly-rent"
                value={inputs.monthlyRent}
                onChange={(v) => update("monthlyRent", v)}
              />
            </div>
            {inputs.selectedCity && CITY_DEFAULTS[inputs.selectedCity] && (
              <p className="text-xs text-muted-foreground sm:col-span-2">
                ≈ {(CITY_DEFAULTS[inputs.selectedCity].rentToPrice * 100).toFixed(2).replace(".", ",")}% do valor do imóvel
                (média {CITY_DEFAULTS[inputs.selectedCity].label} - {CITY_DEFAULTS[inputs.selectedCity].state})
              </p>
            )}
            <div className="space-y-2">
              <Label>Índice de Reajuste <InfoTooltip text="Índice usado para reajustar o aluguel anualmente no contrato" /></Label>
              <Select
                value={inputs.rentAdjustmentIndex}
                onValueChange={(v) => {
                  const index = v as "IGPM" | "IPCA";
                  onChange({
                    ...inputs,
                    rentAdjustmentIndex: index,
                    rentAdjustmentRate:
                      index === "IGPM" ? inputs.igpmRate : inputs.ipcaRate,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IGPM">IGPM</SelectItem>
                  <SelectItem value="IPCA">IPCA</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rent-adjustment">Reajuste (%/ano) <InfoTooltip text="Percentual de aumento anual do aluguel" /></Label>
              <PercentageInput
                id="rent-adjustment"
                value={inputs.rentAdjustmentRate}
                onChange={(v) => update("rentAdjustmentRate", v)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="renter-insurance">Seguro Incêndio (mensal) <InfoTooltip text="Seguro obrigatório para inquilinos, cobre incêndio, raio e explosão" /></Label>
              <CurrencyInput
                id="renter-insurance"
                value={inputs.renterInsuranceMonthly}
                onChange={(v) => update("renterInsuranceMonthly", v)}
              />
            </div>
          </div>
        </section>

        {/* ── Compra à Vista ── */}
        <section className="space-y-4">
          <SectionTitle>Compra à Vista</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cash-discount">Desconto à Vista (%) <InfoTooltip text="Desconto que vendedores costumam dar quando o pagamento é à vista" /></Label>
              <div className="flex items-center gap-2">
                <PercentageInput
                  id="cash-discount"
                  value={inputs.cashDiscountPercent}
                  onChange={(v) => update("cashDiscountPercent", v)}
                />
                <span className="shrink-0 text-xs text-muted-foreground">
                  = {formatCurrency(inputs.propertyValue * inputs.cashDiscountPercent)} de economia
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="itbi">ITBI (%) <InfoTooltip text="Imposto de Transmissão de Bens Imóveis — pago na compra do imóvel" /></Label>
              <PercentageInput
                id="itbi"
                value={inputs.itbiRate}
                onChange={(v) => update("itbiRate", v)}
              />
            </div>
            {inputs.selectedCity && CITY_DEFAULTS[inputs.selectedCity] && (
              <p className="text-xs text-muted-foreground col-span-full">
                Alíquota municipal — {CITY_DEFAULTS[inputs.selectedCity].label} - {CITY_DEFAULTS[inputs.selectedCity].state}
              </p>
            )}
            <div className="space-y-2">
              <Label htmlFor="escritura">Escritura (%) <InfoTooltip text="Custo da escritura pública — obrigatório apenas na compra à vista. No financiamento, o contrato bancário substitui a escritura." /></Label>
              <div className="flex items-center gap-2">
                <PercentageInput
                  id="escritura"
                  value={inputs.escrituraRate}
                  onChange={(v) => update("escrituraRate", v)}
                />
                <span className="shrink-0 text-xs text-muted-foreground">
                  = {formatCurrency(inputs.propertyValue * inputs.escrituraRate)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="registro">Registro (%) <InfoTooltip text="Registro no Cartório de Registro de Imóveis — obrigatório em todas as modalidades de compra" /></Label>
              <div className="flex items-center gap-2">
                <PercentageInput
                  id="registro"
                  value={inputs.registroRate}
                  onChange={(v) => update("registroRate", v)}
                />
                <span className="shrink-0 text-xs text-muted-foreground">
                  = {formatCurrency(inputs.propertyValue * inputs.registroRate)}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Perfil do Comprador ── */}
        <section className="space-y-4">
          <SectionTitle>Perfil do Comprador</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="monthly-income">Renda Mensal Bruta <InfoTooltip text="Sua renda bruta mensal, usada para estimar a taxa de financiamento" /></Label>
              <CurrencyInput
                id="monthly-income"
                value={inputs.monthlyIncome}
                onChange={(v) => update("monthlyIncome", v)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Vínculo <InfoTooltip text="CLT geralmente tem acesso a taxas menores que PJ" /></Label>
              <Select
                value={inputs.employmentType}
                onValueChange={(v) =>
                  update("employmentType", v as "CLT" | "PJ")
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLT">CLT</SelectItem>
                  <SelectItem value="PJ">PJ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Switch
                id="first-property"
                checked={inputs.isFirstProperty}
                onCheckedChange={(v) => update("isFirstProperty", v)}
              />
              <Label htmlFor="first-property">Primeira casa própria <InfoTooltip text="Primeiro imóvel pode ter taxas menores e isenções fiscais" /></Label>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Taxa sugerida: {(suggestion.rate * 100).toFixed(2).replace(".", ",")}% ({suggestion.description})
            {isRateCustom && " — taxa personalizada em uso"}
          </p>
        </section>

        {/* ── Financiamento ── */}
        <section className="space-y-4">
          <SectionTitle>Financiamento</SectionTitle>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Entrada <InfoTooltip text="Parcela paga à vista; o restante é financiado" /></Label>
                <span className="text-sm text-muted-foreground">
                  {(inputs.downPaymentPercent * 100).toFixed(0)}% (
                  {formatCurrency(inputs.propertyValue * inputs.downPaymentPercent)})
                </span>
              </div>
              <Slider
                value={[inputs.downPaymentPercent * 100]}
                onValueChange={([v]) => update("downPaymentPercent", v / 100)}
                min={10}
                max={90}
                step={5}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="financing-rate">
                  Taxa de Juros (CET) <InfoTooltip text="Custo Efetivo Total anual — inclui juros, seguros e taxas do banco" />
                  {isRateCustom && (
                    <button
                      type="button"
                      className="ml-2 text-xs text-primary hover:underline"
                      onClick={() => update("financingRate", suggestion.rate)}
                    >
                      usar sugerida
                    </button>
                  )}
                </Label>
                <PercentageInput
                  id="financing-rate"
                  value={inputs.financingRate}
                  onChange={(v) => update("financingRate", v)}
                />
              </div>
              <div className="space-y-2">
                <Label>Sistema de Amortização <InfoTooltip text="SAC: parcelas decrescem com o tempo. Price: parcelas fixas" /></Label>
                <Select
                  value={inputs.amortizationType}
                  onValueChange={(v) =>
                    update("amortizationType", v as "SAC" | "PRICE")
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SAC">SAC (parcelas decrescentes)</SelectItem>
                    <SelectItem value="PRICE">Price (parcelas fixas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Prazo do Financiamento <InfoTooltip text="Tempo total para quitar o financiamento" /></Label>
                <span className="text-sm text-muted-foreground">
                  {inputs.financingTermYears} anos
                </span>
              </div>
              <Slider
                value={[inputs.financingTermYears]}
                onValueChange={([v]) => update("financingTermYears", v)}
                min={5}
                max={35}
                step={1}
              />
            </div>

            <div className="flex items-center gap-4">
              <Switch
                id="use-fgts"
                checked={inputs.useFGTS}
                onCheckedChange={(v) => update("useFGTS", v)}
              />
              <Label htmlFor="use-fgts">Usar FGTS <InfoTooltip text="Usar saldo do FGTS para reduzir o valor financiado" /></Label>
              {inputs.useFGTS && (
                <CurrencyInput
                  value={inputs.fgtsAmount}
                  onChange={(v) => update("fgtsAmount", v)}
                  className="max-w-[180px]"
                />
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mip">Seguro MIP (%/mês) <InfoTooltip text="Morte e Invalidez Permanente — quita a dívida em caso de falecimento" /></Label>
                <PercentageInput
                  id="mip"
                  value={inputs.mipRate}
                  onChange={(v) => update("mipRate", v)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dfi">Seguro DFI (%/mês) <InfoTooltip text="Danos Físicos ao Imóvel — cobre danos estruturais" /></Label>
                <PercentageInput
                  id="dfi"
                  value={inputs.dfiRate}
                  onChange={(v) => update("dfiRate", v)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-fee">Taxa Admin (mensal) <InfoTooltip text="Taxa de administração mensal cobrada pelo banco" /></Label>
                <CurrencyInput
                  id="admin-fee"
                  value={inputs.taxaAdministracao}
                  onChange={(v) => update("taxaAdministracao", v)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avaliacao">Taxa de Avaliação <InfoTooltip text="Avaliação do imóvel exigida pelo banco para aprovar o financiamento" /></Label>
                <CurrencyInput
                  id="avaliacao"
                  value={inputs.taxaAvaliacao}
                  onChange={(v) => update("taxaAvaliacao", v)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Cenário Macro ── */}
        <section className="space-y-4">
          <SectionTitle>Cenário Macro</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="selic">Taxa Selic (%/ano) <InfoTooltip text="Taxa básica de juros da economia, definida pelo Banco Central" /></Label>
              <PercentageInput
                id="selic"
                value={inputs.selicRate}
                onChange={(v) => update("selicRate", v)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ipca">IPCA (%/ano) <InfoTooltip text="Principal índice de inflação do Brasil" /></Label>
              <PercentageInput
                id="ipca"
                value={inputs.ipcaRate}
                onChange={(v) => update("ipcaRate", v)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spread">Spread IPCA+ (%) <InfoTooltip text="Rendimento do Tesouro IPCA+ acima da inflação (ex: IPCA + 6%)" /></Label>
              <PercentageInput
                id="spread"
                value={inputs.tesouroSpread}
                onChange={(v) => update("tesouroSpread", v)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="igpm">IGPM (%/ano) <InfoTooltip text="Índice de preços usado para reajustar aluguéis e contratos" /></Label>
              <PercentageInput
                id="igpm"
                value={inputs.igpmRate}
                onChange={(v) => update("igpmRate", v)}
              />
            </div>
          </div>
        </section>

        {/* ── Simulação ── */}
        <section className="space-y-4">
          <SectionTitle>Simulação</SectionTitle>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Horizonte de Análise <InfoTooltip text="Período em anos para comparar os cenários" /></Label>
              <span className="text-sm text-muted-foreground">
                {inputs.timeHorizonYears} anos
              </span>
            </div>
            <Slider
              value={[inputs.timeHorizonYears]}
              onValueChange={([v]) => update("timeHorizonYears", v)}
              min={5}
              max={30}
              step={1}
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="real-values"
              checked={inputs.showRealValues}
              onCheckedChange={(v) => update("showRealValues", v)}
            />
            <Label htmlFor="real-values" className="text-sm">
              Mostrar valores reais (descontando inflação) <InfoTooltip text="Desconta a inflação para comparar em poder de compra de hoje" />
            </Label>
          </div>
        </section>
      </CardContent>
    </Card>
    </TooltipProvider>
  );
}
