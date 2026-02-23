# CLAUDE.md — Financiar ou Alugar?

## Commands

```bash
pnpm dev            # Dev server (port 3000)
pnpm test           # Run all tests (vitest, 100 tests)
pnpm test:watch     # Watch mode
pnpm lint           # ESLint
pnpm build          # Production build (not needed during development)
pnpm start          # Start production server (after build)
npx tsc --noEmit    # Type check without emitting (useful after big changes)
```

## Architecture

```
src/engine/        Pure financial calculation engine (no React, fully testable)
  simulator.ts       Orchestrates 3 scenarios → SimulationResults
  scenario-rent.ts   Renter invests capital in Tesouro IPCA+
  scenario-buy-cash.ts  Cash buyer: discount + invest savings
  scenario-finance.ts   Mortgage: property + investments - debt
  rate-estimator.ts  MCMV + SBPE rate suggestion from buyer profile
  city-defaults.ts   Per-city defaults (IPTU, appreciation, ITBI, rent-to-price)
  amortization.ts    SAC & Price amortization schedules
  investment.ts      Tesouro IPCA+ growth, IR regressiva, B3 custody fee
  taxes.ts           Capital gains (progressive 15-22.5%)
  types.ts           All interfaces (SimulationInputs, ScenarioResult, etc.)
  constants.ts       DEFAULT_INPUTS, IR/IOF/capital gains tax tables
  formatters.ts      BRL formatting, compact notation (R$500k, R$1M)
  export-markdown.ts Markdown report generator (inputs + results → .md string)

src/components/    React UI
  simulator-app.tsx    Main "use client" component (localStorage state, debounced sim, export toolbar)
  input-form/          Single-mode form with all sections visible
    input-form.tsx       Main form with city selector + all parameter sections
    currency-input.tsx   R$ input with formatting (Intl.NumberFormat pt-BR)
    percentage-input.tsx % input with decimal conversion (display % ↔ internal decimal)
  results/             Result display components (all use Recharts + shadcn)
    results-panel.tsx    Orchestrates all result sub-components
    winner-banner.tsx    "Melhor opção" announcement
    summary-cards.tsx    Per-scenario cards with wealth breakdown
    capital-context-banner.tsx  Starting capital + monthly budget context
    wealth-chart.tsx     Area chart (total wealth) + composition tab (investments vs equity)
    cost-breakdown.tsx   Horizontal stacked bar chart (where money goes)
    yearly-detail-table.tsx  Year-by-year table with tabs per scenario
  layout/              Header, Footer, ThemeProvider
  ui/                  shadcn/ui components (auto-generated, do NOT edit)

src/hooks/         Custom React hooks
  use-debounced-value.ts  Debounce any value (300ms default)
  use-local-storage.ts    useState-like hook with localStorage persistence (SSR-safe, debounced writes)
tests/engine/      Vitest tests for the financial engine only
```

## Tech Stack

- Next.js 16 (App Router), React 19, TypeScript strict mode
- shadcn/ui (New York style) + Radix UI + Tailwind CSS 4 + Lucide React icons
- Recharts for charts, react-hook-form + zod for forms
- next-themes for dark mode (default theme)
- Path alias: `@/*` → `src/*`

## Conventions

- Code in English, UI text in Portuguese (pt-BR)
- Components: PascalCase (`SimulatorApp`), kebab-case files (`simulator-app.tsx`)
- Constants: SCREAMING_SNAKE_CASE (`DEFAULT_INPUTS`)
- Interfaces: PascalCase, no `I` prefix
- `"use client"` only on components that need interactivity
- Use `cn()` from `@/lib/utils` for Tailwind class merging
- Add shadcn components via `pnpm dlx shadcn@latest add <name>`, never hand-edit `ui/`

## Financial Engine Patterns

- Scenario functions: `(SimulationInputs, monthlyBudget) → ScenarioResult`; orchestrated by `runSimulation(SimulationInputs) → SimulationResults`
- Rates stored as decimals internally (0.0999 = 9.99%)
- Monthly compound rate: `(1 + annual)^(1/12) - 1`
- IR regressiva on investments: 22.5% (≤180d) → 15% (>720d)
- Nominal to real deflation: `value / (1 + ipca_monthly)^months`
- Capital gains tax: exempt if sale ≤ R$440k and only property
- Investment model: Tesouro IPCA+ with B3 custody fee (0.2%/yr on balance > R$10k)
- Cash discount: cash buyer pays `propertyValue * (1 - cashDiscountPercent)`, invests savings
- IPTU calculated from rate: `propertyValue * iptuRate` (not a fixed amount)
- Rate estimation: `estimateFinancingRate()` suggests rate from income/CLT-PJ/first-property
- Finance scenario tracks `totalInterestPaid` (sum of all interest from amortization)
- Monthly budget equalization: `simulator.ts` computes `monthlyBudget` = max(first-month housing cost across all 3 scenarios). Each scenario invests `surplus = budget - monthlyCost` monthly via `advanceInvestment()`. Budget grows with IPCA annually (represents salary keeping pace with inflation).
- Escritura (notary deed) is only charged to cash purchase; financing uses bank contract instead. `taxaAvaliacao` (bank appraisal) is financing-only.
- Purchase costs are percentage-based: `escrituraRate` (~0.8%), `registroRate` (~0.8%), `itbiRate` (~3%) — all proportional to property value
- City defaults: `CITY_DEFAULTS` in `city-defaults.ts` — 13 cities with IPTU/ITBI/appreciation/rentToPrice
- City selector batch-updates 4 fields on change; "Personalizado" disables auto-fill
- Changing `propertyValue` with a city selected auto-recalculates `monthlyRent` via `useEffect`
- Rate estimator uses `useRef(prevSuggestion)` to auto-update `financingRate` only if user hasn't manually overridden it

## Gotchas

- `src/components/ui/` is auto-generated by shadcn CLI — never edit manually
- No .env files, no API routes — simulation runs entirely client-side in `src/engine/`
- Tailwind CSS 4 uses `@import "tailwindcss"` syntax, not `@tailwind` directives
- CSS custom properties use oklch color space, not hsl
- Scenario colors defined as CSS variables: `--scenario-rent`, `--scenario-buy`, `--scenario-finance`
- Port 3000 may conflict locally — use `pnpm dev --port 3001` if needed
- Root layout + page are server components; all interactive components use `"use client"`
- Default theme is dark (`next-themes` with `enableSystem={false}`)

## Testing

- Engine tests only: `tests/engine/*.test.ts` (6 files, 100 tests)
- Tests use `DEFAULT_INPUTS` from `@/engine/constants` as baseline
- No UI component tests yet
