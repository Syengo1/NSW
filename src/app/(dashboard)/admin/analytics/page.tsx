// src/app/(dashboard)/admin/analytics/page.tsx
import { createClient } from '@supabase/supabase-js';
import { KPICards } from '@/components/admin/analytics/KPICards';
import { AlertCircle, BarChart3 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AnalyticsDashboardPage() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const kpiData = {
    revenue: 0,
    revenueGrowth: 0,
    profit: 0,
    profitGrowth: 0,
    totalOrders: 0,
    pendingMpesa: 0,
    fulfillmentQueue: 0,
  };

  try {
    // 1. Fetch orders AND join the order_items to get the auto-calculated profit
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        total_amount, 
        status, 
        created_at,
        order_items ( profit_at_purchase )
      `);

    if (error) throw error;

    if (orders) {
      // 2. Process Financial Data
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      let currentMonthRev = 0;
      let lastMonthRev = 0;
      let currentMonthProfit = 0;
      let lastMonthProfit = 0;

      orders.forEach(order => {
        const orderDate = new Date(order.created_at);
        
        if (order.status === 'pending_payment') {
          kpiData.pendingMpesa += 1;
        }

        // Only count financially successful orders
        if (['paid', 'shipped', 'received'].includes(order.status)) {
          kpiData.totalOrders += 1;
          
          if (order.status === 'paid') {
            kpiData.fulfillmentQueue += 1; 
          }

          // Sum the profit from all items in this specific order
          const orderProfit = order.order_items?.reduce((sum, item) => sum + (item.profit_at_purchase || 0), 0) || 0;

          // Time-cohort analysis
          if (orderDate >= thirtyDaysAgo) {
            currentMonthRev += order.total_amount;
            currentMonthProfit += orderProfit;
          } else if (orderDate >= sixtyDaysAgo) {
            lastMonthRev += order.total_amount;
            lastMonthProfit += orderProfit;
          }
        }
      });

      // Assign lifetime totals
      kpiData.revenue = currentMonthRev + lastMonthRev; 
      kpiData.profit = currentMonthProfit + lastMonthProfit;
      
      // Calculate Revenue Growth
      if (lastMonthRev > 0) {
        kpiData.revenueGrowth = Math.round(((currentMonthRev - lastMonthRev) / lastMonthRev) * 100);
      } else if (currentMonthRev > 0) {
        kpiData.revenueGrowth = 100;
      }

      // Calculate Profit Growth
      if (lastMonthProfit > 0) {
        kpiData.profitGrowth = Math.round(((currentMonthProfit - lastMonthProfit) / lastMonthProfit) * 100);
      } else if (currentMonthProfit > 0) {
        kpiData.profitGrowth = 100;
      }
    }
  } catch (error) {
    console.error("Failed to load admin analytics:", error);
    return (
      <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 flex items-center gap-3">
        <AlertCircle />
        <span>Failed to load database aggregations. Check server logs.</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto p-6 md:p-8">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">
              Store Analytics
            </h1>
            <p className="text-muted-foreground text-xs uppercase tracking-widest mt-1">
              Real-time sales & financial telemetry
            </p>
          </div>
        </div>
        
        <div className="text-[10px] font-mono text-muted-foreground bg-secondary px-3 py-1.5 rounded-sm border border-border flex items-center gap-2 w-fit">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          LIVE DATA STREAM
        </div>
      </div>

      {/* PART 1: THE KPI METRICS */}
      <KPICards data={kpiData} />

      {/* SCAFFOLDING FOR UPCOMING FEATURES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 bg-card border border-border h-96 rounded-xl flex flex-col p-6 shadow-sm relative">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Gross Volume Trend</h3>
            <div className="flex-1 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground text-xs font-mono">
               [ Part 2: Recharts Trend Graph Incoming ]
            </div>
         </div>
         
         <div className="bg-card border border-border h-96 rounded-xl flex flex-col p-6 shadow-sm relative">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">The Heat Index</h3>
            <div className="flex-1 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground text-xs font-mono">
               [ Part 3: Top Selling Variants Incoming ]
            </div>
         </div>
      </div>
    </div>
  );
}