import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: LucideIcon;
}

export function DashboardCard({ title, value, description, icon: Icon }: DashboardCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-row items-center justify-between space-y-0 pb-4">
        <h3 className="tracking-widest text-xs uppercase font-black text-muted-foreground">
          {title}
        </h3>
        <div className="p-2 bg-secondary rounded-full">
          <Icon className="h-4 w-4 text-foreground" />
        </div>
      </div>
      <div>
        <div className="text-3xl font-black tracking-tighter">{value}</div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-2">
          {description}
        </p>
      </div>
    </div>
  );
}