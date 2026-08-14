"use client";

import { useBreadcrumbLabel } from "@/components/layout/breadcrumb-context";

export function SetBreadcrumbLabel({ path, label }: { path: string; label: string }) {
  useBreadcrumbLabel(path, label);
  return null;
}
