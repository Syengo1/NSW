import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils"; 
import { 
  DollarSign, 
  CreditCard, 
  Users, 
  TrendingUp
} from "lucide-react";
import { DashboardCard } from "@/components/admin/DashboardCard";
import { RecentSales, type Order as RecentOrder } from "@/components/admin/RecentSales";
import { OverviewChart, type ChartData } from "@/components/admin/OverviewChart";

// --- STRICT DATABASE INTERFACES ---
interface DbOrderItem {
  profit_at_purchase: number;
}

interface DbOrder {
  total_amount: number;
  created_at: string | null;
  status: string | null;
  customer_phone: string | null;
  order_items: DbOrderItem[] | DbOrderItem | null;
}

interface DbRecentOrderItem {
  variant_name: string;
  quantity: number;
}

interface DbRecentOrder {
  id: string;
  order_number: string | null;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: DbRecentOrderItem[] | DbRecentOrderItem | null;
}

function formatMonth(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString('default', { month: 'short' });
}

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 1. FETCH DATA IN PARALLEL WITH FINANCIAL JOINS
  const [
    { count: orderCount, data: dbOrders },
    { data: dbRecentOrders }
  ] = await Promise.all([
    supabase.from("orders").select("total_amount, created_at, status, customer_phone, order_items(profit_at_purchase)", { count: "exact" }),
    supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, total_amount, status, created_at, order_items(variant_name, quantity)")
      .in("status", ["paid", "shipped", "received"])
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // Safe type-casting from Supabase returns
  const orders = (dbOrders as unknown as DbOrder[]) || [];
  const rawRecentOrders = (dbRecentOrders as unknown as DbRecentOrder[]) || [];

  // 2. TIMELINE COHORT CALCULATIONS (MoM Performance metrics)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  let current30Rev = 0;
  let prev30Rev = 0;
  let current30Profit = 0;
  let prev30Profit = 0;
  let current30Orders = 0;
  let prev30Orders = 0;

  // Process all operational records
  const validOrders = orders.filter(o => o.status && ['paid', 'shipped', 'received'].includes(o.status));
  
  validOrders.forEach(order => {
    if (!order.created_at) return;
    const orderDate = new Date(order.created_at);

    // Normalize potential object vs array Supabase payload formats
    const orderItemsRaw = order.order_items;
    const itemsArray = Array.isArray(orderItemsRaw) 
      ? orderItemsRaw 
      : orderItemsRaw 
        ? [orderItemsRaw] 
        : [];
        
    const totalOrderProfit = itemsArray.reduce((sum, item) => sum + (item.profit_at_purchase || 0), 0);

    if (orderDate >= thirtyDaysAgo) {
      current30Rev += order.total_amount;
      current30Profit += totalOrderProfit;
      current30Orders += 1;
    } else if (orderDate >= sixtyDaysAgo) {
      prev30Rev += order.total_amount;
      prev30Profit += totalOrderProfit;
      prev30Orders += 1;
    }
  });

  // Calculate percentage growth parameters safely
  const revenueGrowth = prev30Rev > 0 ? Math.round(((current30Rev - prev30Rev) / prev30Rev) * 100) : current30Rev > 0 ? 100 : 0;
  const profitGrowth = prev30Profit > 0 ? Math.round(((current30Profit - prev30Profit) / prev30Profit) * 100) : current30Profit > 0 ? 100 : 0;
  const ordersGrowth = prev30Orders > 0 ? Math.round(((current30Orders - prev30Orders) / prev30Orders) * 100) : current30Orders > 0 ? 100 : 0;

  // Global totals (Converted from Cents to KES units)
  const totalRevenue = current30Rev + prev30Rev;
  const totalProfit = current30Profit + prev30Profit;

  // 3. GENERATE COMPARATIVE CHART TIMELINE SERIES
  const monthlyData: Record<string, { revenue: number; profit: number }> = {};
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[key] = { revenue: 0, profit: 0 };
  }

  validOrders.forEach(order => {
    if (!order.created_at) return;
    const monthKey = order.created_at.substring(0, 7);
    if (monthlyData[monthKey] !== undefined) {
      const orderItemsRaw = order.order_items;
      const itemsArray = Array.isArray(orderItemsRaw) ? orderItemsRaw : orderItemsRaw ? [orderItemsRaw] : [];
      const orderProfit = itemsArray.reduce((sum, item) => sum + (item.profit_at_purchase || 0), 0);

      monthlyData[monthKey].revenue += order.total_amount;
      monthlyData[monthKey].profit += orderProfit;
    }
  });

  const chartData: ChartData[] = Object.entries(monthlyData).map(([key, dataObj]) => ({
    name: formatMonth(key + '-01'),
    revenue: dataObj.revenue,
    profit: dataObj.profit
  }));

  // 4. METADATA COMBINATION & CLEANUP
  const uniqueCustomers = new Set(orders.map(o => o.customer_phone).filter(Boolean)).size;

  // Map dynamic relational format cleanly to match child expectations
  const formattedRecentOrders: RecentOrder[] = rawRecentOrders.map(ro => {
    const itemsRaw = ro.order_items;
    const itemsArray = Array.isArray(itemsRaw) ? itemsRaw : itemsRaw ? [itemsRaw] : [];
    return {
      id: ro.id,
      order_number: ro.order_number || `NSW-GEN`,
      customer_name: ro.customer_name,
      customer_phone: ro.customer_phone,
      total_amount: ro.total_amount,
      status: ro.status,
      created_at: ro.created_at,
      order_items: itemsArray
    };
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* HEADER AREA */}
      <div>
        <h2 className="text-3xl font-black uppercase tracking-tighter">Command Center</h2>
        <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground mt-1">
          Real-time enterprise metrics & inventory control center
        </p>
      </div>

      {/* INTELLIGENT FINANCIAL KPI MATRIX */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard 
          title="Gross Revenue" 
          value={formatCurrency(totalRevenue / 100)} 
          icon={DollarSign}
          description="30-Day performance window"
          trend={revenueGrowth}
        />
        <DashboardCard 
          title="Net Profit" 
          value={formatCurrency(totalProfit / 100)} 
          icon={TrendingUp}
          description="Consolidated take-home value"
          trend={profitGrowth}
        />
        <DashboardCard 
          title="Completed Volume" 
          value={(orderCount || 0).toLocaleString()} 
          icon={CreditCard}
          description="Lifetime sales counter"
          trend={ordersGrowth}
        />
        <DashboardCard 
          title="Drop Pool Audiences" 
          value={uniqueCustomers.toLocaleString()} 
          icon={Users}
          description="Unique verified buyers"
        />
      </div>

      {/* CHART MATRIX & REAL-TIME ACTIVITY LAYER */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        
        {/* REVENUE & NET PROFIT TREND PATTERNS */}
        <div className="col-span-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6 flex flex-col space-y-2 border-b border-border/50">
            <h3 className="text-sm font-black uppercase tracking-wider leading-none">Yield Trajectory</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Comparative revenue vs profit configuration (6 MoM)</p>
          </div>
          <div className="p-6 pt-6 pl-2">
            <OverviewChart data={chartData} />
          </div>
        </div>

        {/* RECENT SALES PREVIEW FEED */}
        <div className="col-span-3 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
           <div className="p-6 flex flex-col space-y-2 border-b border-border/50">
            <h3 className="text-sm font-black uppercase tracking-wider leading-none">Recent Activity</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Latest live transactional feeds
            </p>
          </div>
          <div className="p-6">
            <RecentSales orders={formattedRecentOrders} />
          </div>
        </div>

      </div>
    </div>
  );
}