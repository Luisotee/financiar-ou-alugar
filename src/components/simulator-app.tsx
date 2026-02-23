"use client";

import { useMemo, useState, useCallback, useRef } from "react";
import { Copy, Download, Check, ChevronDown } from "lucide-react";
import { InputForm } from "@/components/input-form/input-form";
import { ResultsPanel } from "@/components/results/results-panel";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useScrollSpy } from "@/hooks/use-scroll-spy";
import { runSimulation } from "@/engine/simulator";
import { exportMarkdown } from "@/engine/export-markdown";
import { DEFAULT_INPUTS } from "@/engine/constants";
import type { SimulationInputs } from "@/engine/types";

export function SimulatorApp() {
  const [inputs, setInputs] = useLocalStorage<SimulationInputs>(
    "financiar-ou-alugar:inputs",
    DEFAULT_INPUTS
  );

  const debouncedInputs = useDebouncedValue(inputs, 300);

  const results = useMemo(
    () => runSimulation(debouncedInputs),
    [debouncedInputs]
  );

  const [copied, setCopied] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const isResultsVisible = useScrollSpy(resultsRef);

  const getMarkdown = useCallback(
    () => exportMarkdown(debouncedInputs, results, debouncedInputs.showRealValues),
    [debouncedInputs, results]
  );

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(getMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [getMarkdown]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([getMarkdown()], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "simulacao-financiar-ou-alugar.md";
    a.click();
    URL.revokeObjectURL(url);
  }, [getMarkdown]);

  const scrollToResults = useCallback(() => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const exportActions = (
    <>
      <Button variant="outline" size="sm" onClick={handleCopy}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        <span className="ml-1.5 hidden sm:inline">{copied ? "Copiado!" : "Copiar"}</span>
      </Button>
      <Button variant="outline" size="sm" onClick={handleDownload}>
        <Download className="h-4 w-4" />
        <span className="ml-1.5 hidden sm:inline">Download</span>
      </Button>
    </>
  );

  return (
    <>
      <Header actions={exportActions} />

      <div className="mx-auto max-w-[1440px] px-4 py-6 lg:px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Left Panel: Form */}
          <div className="w-full shrink-0 lg:w-[400px] xl:w-[440px] 2xl:w-[480px]">
            <InputForm inputs={inputs} onChange={setInputs} />
          </div>

          {/* Right Panel: Results (sticky on desktop) */}
          <div
            ref={resultsRef}
            className="min-w-0 flex-1 lg:sticky lg:top-[calc(var(--header-height)+1.5rem)] lg:max-h-[calc(100vh-var(--header-height)-3rem)] lg:overflow-y-auto lg:scrollbar-thin"
          >
            <ResultsPanel results={results} showRealValues={debouncedInputs.showRealValues} />
          </div>
        </div>
      </div>

      {/* Mobile FAB: "Ver Resultados" */}
      {!isResultsVisible && (
        <button
          onClick={scrollToResults}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95 lg:hidden"
          aria-label="Ver resultados"
        >
          Ver Resultados
          <ChevronDown className="h-4 w-4" />
        </button>
      )}
    </>
  );
}
