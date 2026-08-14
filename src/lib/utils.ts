import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function zodErrorMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Validation failed";
}

export function actionErrorMessage(result: { success: boolean; error?: string }): string {
  if (result.success) return "";
  return result.error ?? "An error occurred";
}