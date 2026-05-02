"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import { formatCurrency } from "@/lib/utils"

// STRICT TYPING
export interface ChartData {
  name: string;
  total: number;
}

export function OverviewChart({ data }: { data: ChartData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-xs uppercase font-bold text-muted-foreground tracking-widest border border-dashed border-border rounded-xl bg-secondary/20">
        Awaiting Data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="currentColor"
          className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest"
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="currentColor"
          className="text-muted-foreground text-[10px] font-mono"
          tickLine={false}
          axisLine={false}
          // Safely cast to Number to prevent runtime errors if YAxis passes unexpected data
          tickFormatter={(value) => formatCurrency(Number(value) / 100).replace('.00', '')}
        />
        <Tooltip
          cursor={{ fill: 'var(--secondary)' }}
          contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '0.5rem' }}
          itemStyle={{ color: 'var(--foreground)', fontWeight: '900', fontFamily: 'monospace' }}
          // FIX: Broadened the type to handle undefined, making it mathematically safe and TS compliant
          formatter={(value: number | string | undefined) => {
            const numericValue = Number(value) || 0;
            return [formatCurrency(numericValue / 100), "Revenue"];
          }}
        />
        <Bar
          dataKey="total"
          radius={[4, 4, 0, 0]}
          fill="var(--primary)" 
        />
      </BarChart>
    </ResponsiveContainer>
  )
}