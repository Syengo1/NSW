import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils"; 
import { 
  DollarSign, 
  CreditCard, 
  Users, 
  Package 
} from "lucide-react";
import { DashboardCard } from "@/components/admin/DashboardCard";
import { RecentSales } from "@/components/admin/RecentSales";
import { OverviewChart, ChartData } from "@/components/admin/OverviewChart";

// FIX 3: Strict type definition to eliminate the 'any' ESLint error
interface RecentOrderData {
  id: string;
  order_number?: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
}

// Helper to format month strings (e.g., "2026-05" -> "May")
function formatMonth(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString('default', { month: 'short' });
}

export default async function AdminDashboardPage() {
  // FIX 1: Reverted to the 0-argument call matching your server wrapper
  const supabase = await createClient();

  // 1. Fetch Data in Parallel (Waterfall prevention)
  const [
    { count: orderCount, data: orders },
    { count: productCount },
    { data: recentOrders }
  ] = await Promise.all([
    // FIX 2: Added 'customer_phone' to the select statement
    supabase.from("orders").select("total_amount, created_at, status, customer_phone", { count: "exact" }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, total_amount, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // 2. Calculate Revenue Metrics (Only counting paid/shipped/received orders)
  const validOrders = orders?.filter(o => ['paid', 'shipped', 'received'].includes(o.status)) || [];
  
  const totalRevenueCents = validOrders.reduce((acc, order) => acc + (order.total_amount || 0), 0);
  const totalRevenue = totalRevenueCents / 100;

  // 3. Generate Chart Data Dynamically
  const monthlyData: Record<string, number> = {};
  
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[key] = 0;
  }

  validOrders.forEach(order => {
    if (!order.created_at) return;
    const monthKey = order.created_at.substring(0, 7); 
    if (monthlyData[monthKey] !== undefined) {
      monthlyData[monthKey] += order.total_amount;
    }
  });

  const chartData: ChartData[] = Object.entries(monthlyData).map(([key, value]) => ({
    name: formatMonth(key + '-01'),
    total: value
  }));

  // 4. Calculate Unique Customers
  const uniqueCustomers = new Set(orders?.map(o => o.customer_phone).filter(Boolean)).size;

  // Safely cast recent orders to match our strictly defined interface
  const formattedRecentOrders = (recentOrders as unknown as RecentOrderData[]) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-black uppercase tracking-tighter">Command Center</h2>
        <p className="text-xs uppercase font-bold tracking-widest text-muted-foreground mt-1">
          Overview of your store&apos;s performance.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard 
          title="Total Revenue" 
          value={formatCurrency(totalRevenue)} 
          icon={DollarSign}
          description="Lifetime Gross Sales"
        />
        <DashboardCard 
          title="Orders" 
          value={orderCount || 0} 
          icon={CreditCard}
          description="Total Lifetime Orders"
        />
        <DashboardCard 
          title="Products" 
          value={productCount || 0} 
          icon={Package}
          description="Total Inventory Assets"
        />
        <DashboardCard 
          title="Active Customers" 
          value={uniqueCustomers} 
          icon={Users}
          description="Estimated Unique Buyers"
        />
      </div>

      {/* Charts & Recent Activity Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Left: Revenue Chart */}
        <div className="col-span-4 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <div className="p-6 flex flex-col space-y-2 border-b border-border/50">
            <h3 className="text-lg font-black uppercase tracking-wider leading-none">Revenue Matrix</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Monthly revenue breakdown (Last 6 Months)</p>
          </div>
          <div className="p-6 pt-6 pl-2">
            <OverviewChart data={chartData} />
          </div>
        </div>

        {/* Right: Recent Sales */}
        <div className="col-span-3 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
           <div className="p-6 flex flex-col space-y-2 border-b border-border/50">
            <h3 className="text-lg font-black uppercase tracking-wider leading-none">Recent Activity</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Latest {formattedRecentOrders.length} transactions
            </p>
          </div>
          <div className="p-6">
            {/* FIX 3: Passed the strictly typed array */}
            <RecentSales orders={formattedRecentOrders} />
          </div>
        </div>

      </div>
    </div>
  );
}