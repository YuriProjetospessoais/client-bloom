import * as React from "react";

/**
 * Pequeno helper para estado persistido em localStorage (mock/poc),
 * garantindo refresh sem perder dados e mantendo comportamento WEB.
 */
export function usePersistedState<T>(key: string, initialValue: T) {
  const [state, setState] = React.useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initialValue;
      return JSON.parse(raw) as T;
    } catch {
      return initialValue;
    }
  });

  React.useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // ignore quota/serialization errors for now
    }
  }, [key, state]);

  return [state, setState] as const;
}
