"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface BreadcrumbContextValue {
  labels: Record<string, string>;
  setLabel: (path: string, label: string) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextValue>({
  labels: {},
  setLabel: () => {},
});

export function BreadcrumbProvider({ children }: { children: React.ReactNode }) {
  const [labels, setLabels] = useState<Record<string, string>>({});

  const setLabel = useCallback((path: string, label: string) => {
    setLabels((prev) => {
      if (prev[path] === label) return prev;
      return { ...prev, [path]: label };
    });
  }, []);

  return (
    <BreadcrumbContext.Provider value={{ labels, setLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  );
}

export function useBreadcrumbLabel(path: string, label: string) {
  const { setLabel } = useContext(BreadcrumbContext);
  setLabel(path, label);
}

export function useBreadcrumbLabels() {
  return useContext(BreadcrumbContext).labels;
}
