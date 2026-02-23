import { useState, useEffect, useRef, useCallback } from "react";

export function useLocalStorage<T extends object>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(defaultValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initializedRef = useRef(false);

  // On mount, read from localStorage and merge with defaults
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<T>;
        setState({ ...defaultValue, ...parsed });
      }
    } catch {
      // Corrupted data — ignore, use defaults
    }
    initializedRef.current = true;
  }, [key, defaultValue]);

  // Debounced write to localStorage on state change
  useEffect(() => {
    if (!initializedRef.current) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch {
        // Storage full or unavailable — ignore
      }
    }, 500);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [key, state]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setState(value);
    },
    []
  );

  return [state, setValue];
}
