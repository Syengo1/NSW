import { formatCurrency } from "@/lib/utils";
import { Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

// STRICT TYPING: Upgraded to include items and timestamps
interface OrderItem {
  variant_name: string;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items?: OrderItem[];
}

// Minimalistic time-ago formatter
function timeAgo(dateString: string) {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export function RecentSales({ orders }: { orders: Order[] }) {
  if (!orders || orders.length === 0) {
    return <div className="text-xs uppercase font-bold text-muted-foreground tracking-widest text-center py-8 border border-dashed border-border rounded-lg">No recent sales detected.</div>;
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const initial = order.customer_name ? order.customer_name.charAt(0).toUpperCase() : "U";
        const itemText = order.order_items && order.order_items.length > 0 
          ? `${order.order_items[0].quantity}x ${order.order_items[0].variant_name} ${order.order_items.length > 1 ? `+${order.order_items.length - 1} more` : ''}`
          : 'Processing items...';
        
        return (
          <Link 
            href={`/admin/orders?search=${order.order_number}`}
            key={order.id} 
            className="flex items-center justify-between group p-3 -mx-3 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-background border border-border flex items-center justify-center shrink-0 group-hover:border-primary group-hover:text-primary transition-colors shadow-sm">
                 <span className="font-black text-sm">{initial}</span>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold uppercase leading-none tracking-wider">
                    {order.customer_name}
                  </p>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                    {order.order_number}
                  </span>
                </div>
                <p className="text-[10px] font-mono text-muted-foreground truncate max-w-[200px] md:max-w-[300px]">
                  {itemText}
                </p>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-1">
              <div className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                +{formatCurrency(order.total_amount / 100)}
                <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
              </div>
              <div className="flex items-center gap-1 text-[9px] font-bold uppercase text-muted-foreground">
                <Clock size={10} /> {timeAgo(order.created_at)}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}