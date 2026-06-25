import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
  trend?: number;
}

export function DashboardCard({ title, value, description, icon: Icon, trend }: DashboardCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md hover:border-primary/50 transition-all group relative overflow-hidden">
      {/* Decorative gradient flare */}
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />

      <div className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
        <h3 className="tracking-widest text-xs uppercase font-black text-muted-foreground">
          {title}
        </h3>
        <div className="p-2 bg-secondary rounded-full group-hover:scale-110 transition-transform">
          <Icon className="h-4 w-4 text-foreground" />
        </div>
      </div>
      
      <div className="relative z-10">
        <div className="flex items-baseline gap-3">
          <div className="text-3xl font-black tracking-tighter">{value}</div>
          
          {/* Conditional Trend Badge */}
          {trend !== undefined && (
            <span className={cn(
              "flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-secondary/80 backdrop-blur-sm", 
              trend >= 0 ? "text-emerald-500" : "text-red-500"
            )}>
              {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
        
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-2">
          {description}
        </p>
      </div>
    </div>
  );
}