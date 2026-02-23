"use client";

import { useMemo, useState, useCallback } from "react";
import { Copy, Download, Check } from "lucide-react";
import { InputForm } from "@/components/input-form/input-form";
import { ResultsPanel } from "@/components/results/results-panel";
import { Button } from "@/components/ui/button";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useLocalStorage } from "@/hooks/use-local-storage";
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

  return (
    <div className="space-y-8">
      <InputForm inputs={inputs} onChange={setInputs} />
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span className="ml-1.5">{copied ? "Copiado!" : "Copiar"}</span>
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4" />
          <span className="ml-1.5">Download .md</span>
        </Button>
      </div>
      <ResultsPanel results={results} showRealValues={debouncedInputs.showRealValues} />
    </div>
  );
}
