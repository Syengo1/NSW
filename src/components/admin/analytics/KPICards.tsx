// src/components/admin/analytics/KPICards.tsx
import { 
  TrendingUp, 
  CreditCard, 
  Clock, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight, 
  Banknote,
  Activity
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

interface KPIData {
  revenue: number;
  revenueGrowth: number;
  profit: number;
  profitGrowth: number;
  totalOrders: number;
  pendingMpesa: number;
  fulfillmentQueue: number;
}

interface KPICardsProps {
  data: KPIData;
}

export function KPICards({ data }: KPICardsProps) {
  // Advanced on-the-fly math
  const aov = data.totalOrders > 0 ? (data.revenue / data.totalOrders) : 0;
  const overallMargin = data.revenue > 0 ? Math.round((data.profit / data.revenue) * 100) : 0;

  const cards = [
    {
      title: 'Gross Revenue',
      value: formatCurrency(data.revenue / 100),
      icon: TrendingUp,
      trend: data.revenueGrowth,
      subtitle: 'vs. last 30 days',
      trendColor: data.revenueGrowth >= 0 ? 'text-emerald-500' : 'text-red-500',
      accent: 'group-hover:border-primary'
    },
    {
      title: 'Net Profit',
      value: formatCurrency(data.profit / 100),
      icon: Banknote,
      trend: data.profitGrowth,
      subtitle: `Avg Margin: ${overallMargin}%`,
      trendColor: data.profitGrowth >= 0 ? 'text-emerald-500' : 'text-red-500',
      accent: 'group-hover:border-emerald-500'
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(aov / 100),
      icon: Activity,
      trend: null,
      subtitle: 'Per completed checkout',
      trendColor: '',
      accent: 'group-hover:border-blue-500'
    },
    {
      title: 'Total Orders',
      value: data.totalOrders.toLocaleString(),
      icon: CreditCard,
      trend: null,
      subtitle: 'Lifetime paid/shipped',
      trendColor: '',
      accent: 'group-hover:border-primary'
    },
    {
      title: 'M-Pesa Pending',
      value: data.pendingMpesa.toLocaleString(),
      icon: Clock,
      trend: null,
      subtitle: 'Awaiting PIN entry',
      trendColor: '',
      accent: 'group-hover:border-amber-500'
    },
    {
      title: 'To Fulfill',
      value: data.fulfillmentQueue.toLocaleString(),
      icon: Package,
      trend: null,
      subtitle: 'Paid, un-shipped items',
      trendColor: '',
      accent: 'group-hover:border-purple-500'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <div 
            key={i} 
            className={cn(
              "bg-card border border-border p-5 md:p-6 rounded-xl shadow-sm relative overflow-hidden group transition-colors",
              card.accent
            )}
          >
            {/* Subtle background decoration */}
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-secondary/50 rounded-full group-hover:scale-150 transition-transform duration-500 ease-out" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {card.title}
              </span>
              <Icon size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-3">
                <h3 className="text-xl md:text-3xl font-black tracking-tighter">
                  {card.value}
                </h3>
                
                {card.trend !== null && (
                  <span className={cn("flex items-center w-fit text-[10px] font-bold px-1.5 py-0.5 rounded-sm bg-secondary/80 backdrop-blur-sm", card.trendColor)}>
                    {card.trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {Math.abs(card.trend)}%
                  </span>
                )}
              </div>
              <p className="text-[9px] md:text-[10px] text-muted-foreground mt-2 uppercase tracking-wider font-mono">
                {card.subtitle}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}