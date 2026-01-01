import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils"; // Assuming you have this, if not I'll provide it below
import { 
  DollarSign, 
  CreditCard, 
  Users, 
  Package 
} from "lucide-react";
import { DashboardCard } from "@/components/admin/DashboardCard";
import { RecentSales } from "@/components/admin/RecentSales";
import { OverviewChart } from "@/components/admin/OverviewChart";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 1. Fetch Data in Parallel (Waterfall prevention)
  // We use Promise.all to fetch all metrics at the exact same time.
  const [
    { count: orderCount, data: orders },
    { count: productCount },
    { count: customerCount },
    { data: recentOrders }
  ] = await Promise.all([
    supabase.from("orders").select("total", { count: "exact" }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }), // Assuming 'profiles' holds users
    supabase
      .from("orders")
      .select("*, profiles(first_name, last_name, email)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // 2. Calculate Revenue
  // (In a huge app, you'd do this via a Postgres function/view for speed)
  const totalRevenue = orders?.reduce((acc, order) => acc + (order.total || 0), 0) || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your store's performance.
        </p>
      </div>

      {/* KPI Cards Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard 
          title="Total Revenue" 
          value={formatCurrency(totalRevenue)} 
          icon={DollarSign}
          description="+20.1% from last month" // You can calculate this dynamically in Phase 2
        />
        <DashboardCard 
          title="Orders" 
          value={orderCount || 0} 
          icon={CreditCard}
          description="+180 since last hour"
        />
        <DashboardCard 
          title="Products" 
          value={productCount || 0} 
          icon={Package}
          description="12 items low on stock"
        />
        <DashboardCard 
          title="Active Customers" 
          value={customerCount || 0} 
          icon={Users}
          description="+19 new this week"
        />
      </div>

      {/* Charts & Recent Activity Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        
        {/* Left: Revenue Chart (Takes up 4/7 columns) */}
        <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="p-6 flex flex-col space-y-3">
            <h3 className="font-semibold leading-none tracking-tight">Overview</h3>
            <p className="text-sm text-muted-foreground">Monthly revenue breakdown</p>
          </div>
          <div className="p-6 pt-0 pl-2">
            <OverviewChart />
          </div>
        </div>

        {/* Right: Recent Sales (Takes up 3/7 columns) */}
        <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm">
           <div className="p-6 flex flex-col space-y-3">
            <h3 className="font-semibold leading-none tracking-tight">Recent Sales</h3>
            <p className="text-sm text-muted-foreground">
              You made {recentOrders?.length || 0} sales this period.
            </p>
          </div>
          <div className="p-6 pt-0">
            <RecentSales orders={recentOrders || []} />
          </div>
        </div>

      </div>
    </div>
  );
}