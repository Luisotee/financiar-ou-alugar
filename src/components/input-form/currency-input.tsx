"use client";

import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  id?: string;
  className?: string;
}

function formatForDisplay(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function parseFromInput(raw: string): number {
  const cleaned = raw.replace(/[^\d,.-]/g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function CurrencyInput({
  value,
  onChange,
  id,
  className,
}: CurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [rawValue, setRawValue] = useState(String(value));

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setRawValue(value === 0 ? "" : String(value));
  }, [value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    const parsed = parseFromInput(rawValue);
    onChange(parsed);
  }, [rawValue, onChange]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setRawValue(raw);
      const parsed = parseFromInput(raw);
      if (parsed > 0 || raw === "0") {
        onChange(parsed);
      }
    },
    [onChange]
  );

  return (
    <Input
      id={id}
      type={isFocused ? "number" : "text"}
      inputMode="numeric"
      value={isFocused ? rawValue : formatForDisplay(value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onChange={handleChange}
      className={className}
    />
  );
}
