"use client";

import { createContext, useContext } from "react";

const FormFieldErrorsContext = createContext<Record<string, string> | null>(null);

export const FormFieldErrorsProvider = FormFieldErrorsContext.Provider;

export function useFieldError(name: string): string | undefined {
  return useContext(FormFieldErrorsContext)?.[name];
}
