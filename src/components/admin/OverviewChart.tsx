"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { formatCurrency } from "@/lib/utils"

export interface ChartData {
  name: string;
  revenue: number;
  profit: number;
}

// 1. BULLETPROOF TYPING: Define exactly what Recharts passes to the custom tooltip
interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}

// 2. Apply our custom interface
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length >= 2) {
    const revenue = payload[0].value || 0;
    const profit = payload[1].value || 0;
    const margin = revenue > 0 ? Math.round((profit / revenue) * 100) : 0;

    return (
      <div className="bg-card border border-border p-4 rounded-lg shadow-xl animate-in zoom-in-95 duration-200">
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 pb-2 border-b border-border">{label}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-6 text-sm">
            <span className="text-muted-foreground font-bold">Gross Revenue:</span>
            <span className="font-mono font-black">{formatCurrency(revenue / 100)}</span>
          </div>
          <div className="flex items-center justify-between gap-6 text-sm">
            <span className="text-emerald-600 dark:text-emerald-500 font-bold">Net Profit:</span>
            <span className="font-mono font-black text-emerald-600 dark:text-emerald-500">+{formatCurrency(profit / 100)}</span>
          </div>
          <div className="pt-2 mt-2 border-t border-border flex justify-between items-center text-[10px] font-mono">
            <span className="uppercase text-muted-foreground">Margin</span>
            <span className="bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded font-bold">{margin}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function OverviewChart({ data }: { data: ChartData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-xs uppercase font-bold text-muted-foreground tracking-widest border border-dashed border-border rounded-xl bg-secondary/20">
        Awaiting Financial Data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.4} />
        <XAxis
          dataKey="name"
          stroke="currentColor"
          className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest"
          tickLine={false}
          axisLine={false}
          dy={10}
        />
        <YAxis
          stroke="currentColor"
          className="text-muted-foreground text-[10px] font-mono"
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => formatCurrency(Number(value) / 100).replace('.00', '')}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--secondary)', opacity: 0.4 }} />
        
        <Bar dataKey="revenue" fill="var(--foreground)" radius={[4, 4, 0, 0]} maxBarSize={40} />
        <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} /> 
      </BarChart>
    </ResponsiveContainer>
  )
}