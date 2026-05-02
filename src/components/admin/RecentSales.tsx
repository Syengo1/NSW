import { formatCurrency } from "@/lib/utils";

// STRICT TYPING matching your orders table
interface Order {
  id: string;
  order_number?: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
}

export function RecentSales({ orders }: { orders: Order[] }) {
  if (!orders || orders.length === 0) {
    return <div className="text-xs uppercase font-bold text-muted-foreground tracking-widest text-center py-4">No recent sales.</div>;
  }

  return (
    <div className="space-y-6">
      {orders.map((order) => {
        // Extract first letter for the avatar
        const initial = order.customer_name ? order.customer_name.charAt(0).toUpperCase() : "U";
        
        return (
          <div key={order.id} className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 group-hover:border-primary transition-colors">
                 <span className="font-black text-sm text-foreground">{initial}</span>
              </div>
              
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase leading-none tracking-wider">
                  {order.customer_name}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground">
                  {order.customer_phone}
                </p>
              </div>
            </div>
            <div className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(order.total_amount / 100)}
            </div>
          </div>
        );
      })}
    </div>
  );
}