"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { DynamicChart } from "@/components/ui/dynamic-chart";
import { BRAND_COLORS } from "@/lib/constants";
import { formatMoney } from "@/lib/format";

function compactMoney(value: number): string {
  if (value >= 1_000_000) return `MK ${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `MK ${(value / 1_000).toFixed(value >= 100_000 ? 0 : 1)}k`;
  return `MK ${Math.round(value)}`;
}

export function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <DynamicChart
      config={{ revenue: { label: "Revenue", color: BRAND_COLORS.primary } }}
      className="aspect-[1.5/1] sm:aspect-[2.4/1]"
    >
      {({ ChartTooltip, ChartTooltipContent }) => (
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={52}
            tickMargin={4}
            tickFormatter={(value: number) => compactMoney(value)}
          />
          <ChartTooltip
            cursor={{ fill: "var(--color-revenue)", opacity: 0.08 }}
            content={
              <ChartTooltipContent
                formatter={(value: unknown) => formatMoney(Number(value))}
              />
            }
          />
          <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      )}
    </DynamicChart>
  );
}
