"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2Icon } from "lucide-react";
import { cn } from "@/lib/utils";

export function DynamicChart({
  children,
  fallback,
  config,
  className,
}: {
  children:
    | React.ReactNode
    | ((props: {
        ChartTooltip: React.ElementType;
        ChartTooltipContent: React.ElementType;
      }) => React.ReactNode);
  fallback?: React.ReactNode;
  config?: Record<string, { label?: React.ReactNode; color?: string }>;
  className?: string;
}) {
  const [ChartContainer, setChartContainer] = useState<React.ElementType | null>(null);
  const [ChartTooltip, setChartTooltip] = useState<React.ElementType | null>(null);
  const [ChartTooltipContent, setChartTooltipContent] = useState<React.ElementType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const loadRef = useRef(false);

  useEffect(() => {
    if (loadRef.current) return;
    loadRef.current = true;

    const loadCharts = async () => {
      try {
        setIsLoading(true);
        const [{ ChartContainer }, { ChartTooltip }, { ChartTooltipContent }] = await Promise.all([
          import("./chart").then((m) => ({ ChartContainer: m.ChartContainer })),
          import("./chart").then((m) => ({ ChartTooltip: m.ChartTooltip })),
          import("./chart").then((m) => ({ ChartTooltipContent: m.ChartTooltipContent })),
        ]);
        setChartContainer(ChartContainer);
        setChartTooltip(ChartTooltip);
        setChartTooltipContent(ChartTooltipContent);
      } catch (err) {
        console.error("Failed to load charts:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadCharts();
  }, []);

  if (error) {
    return (
      <div className={cn("flex aspect-video justify-center items-center text-sm text-muted-foreground", className)}>
        <p>Failed to load chart</p>
      </div>
    );
  }

  if (isLoading || !ChartContainer || !ChartTooltip || !ChartTooltipContent) {
    return fallback ?? (
      <div className={cn("flex aspect-video justify-center items-center gap-2 text-sm text-muted-foreground", className)}>
        <Loader2Icon className="size-4 animate-spin" />
        <span>Loading chart…</span>
      </div>
    );
  }

  return (
    <ChartContainer config={config ?? {}} className={className}>
      {typeof children === "function"
        ? children({ ChartTooltip, ChartTooltipContent })
        : children}
    </ChartContainer>
  );
}
