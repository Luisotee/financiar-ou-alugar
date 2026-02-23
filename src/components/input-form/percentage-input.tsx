"use client";

import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";

interface PercentageInputProps {
  value: number; // stored as decimal, e.g. 0.0999
  onChange: (value: number) => void;
  id?: string;
  className?: string;
}

export function PercentageInput({
  value,
  onChange,
  id,
  className,
}: PercentageInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [rawValue, setRawValue] = useState(String(value * 100));

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    setRawValue(value === 0 ? "" : String(+(value * 100).toFixed(4)));
  }, [value]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    const parsed = parseFloat(rawValue.replace(",", "."));
    if (!isNaN(parsed)) {
      onChange(parsed / 100);
    }
  }, [rawValue, onChange]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setRawValue(raw);
      const parsed = parseFloat(raw.replace(",", "."));
      if (!isNaN(parsed)) {
        onChange(parsed / 100);
      }
    },
    [onChange]
  );

  return (
    <div className="relative">
      <Input
        id={id}
        type={isFocused ? "number" : "text"}
        inputMode="decimal"
        step="0.01"
        value={
          isFocused ? rawValue : `${(value * 100).toFixed(2).replace(".", ",")}%`
        }
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        className={className}
      />
    </div>
  );
}
