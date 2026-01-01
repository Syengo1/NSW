import { createClient } from "@/lib/supabase/server";
import { 
  Search, 
  Package, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  MoreHorizontal 
} from "lucide-react";
import { updateOrderStatus } from "./actions"; // We will hook this up to a button
import { cn } from "@/lib/utils";

// STATUS BADGE COMPONENT
function StatusBadge({ status }: { status: string }) {
  const styles = {
    pending_payment: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    processing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    paid: "bg-green-500/10 text-green-500 border-green-500/20",
    shipped: "bg-white/10 text-white border-white/20",
    failed: "bg-red-500/10 text-red-500 border-red-500/20",
    cancelled: "bg-neutral-800 text-neutral-500 border-neutral-700",
  };

  const icons = {
    pending_payment: Clock,
    processing: Clock,
    paid: CheckCircle,
    shipped: Truck,
    failed: AlertCircle,
    cancelled: XCircle,
  };

  const Style = styles[status as keyof typeof styles] || styles.pending_payment;
  const Icon = icons[status as keyof typeof icons] || Clock;

  return (
    <span className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border", Style)}>
      <Icon size={12} />
      {status.replace('_', ' ')}
    </span>
  );
}

// CLIENT ACTION COMPONENT (Tiny client wrapper for the button)
import OrderActions from "./OrderActions"; 
import { XCircle } from "lucide-react";

export default async function OrdersPage() {
  const supabase = await createClient();

  // Fetch Orders with Items
  const { data: orders } = await supabase
    .from("orders")
    .select(`
      id,
      customer_name,
      customer_phone,
      customer_location,
      total_amount,
      status,
      created_at,
      mpesa_receipt,
      order_items (
        quantity,
        variant_name
      )
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8 animate-fade-in text-foreground">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Logistics</h1>
          <p className="text-muted-foreground text-sm uppercase tracking-widest">
            Fulfillment Center • {orders?.length || 0} Records
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="relative max-w-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input 
          type="text" 
          placeholder="SEARCH ORDER ID OR RECEIPT..." 
          className="w-full bg-secondary border border-border pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:border-white transition-colors placeholder:text-muted-foreground/50 uppercase"
        />
      </div>

      {/* TERMINAL LIST */}
      <div className="border border-border bg-card">
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border bg-secondary/50 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          <div className="col-span-3">Order Details</div>
          <div className="col-span-3">Items</div>
          <div className="col-span-2">Customer</div>
          <div className="col-span-2 text-right">Total</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        <div className="divide-y divide-border">
          {orders?.map((order) => (
            <div key={order.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 items-center hover:bg-secondary/30 transition-colors group">
              
              {/* ID & Date */}
              <div className="col-span-3 space-y-1">
                <div className="font-mono text-xs text-muted-foreground">#{order.id.slice(0, 8)}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString()} • {new Date(order.created_at).toLocaleTimeString()}
                </div>
                {order.mpesa_receipt && (
                  <div className="text-[10px] text-green-500 font-mono tracking-wider">
                    {order.mpesa_receipt}
                  </div>
                )}
              </div>

              {/* Items Summary */}
              <div className="col-span-3">
                <div className="flex flex-col gap-1">
                  {order.order_items.slice(0, 2).map((item: any, i: number) => (
                    <div key={i} className="text-xs font-bold uppercase text-white truncate">
                      {item.quantity}x {item.variant_name}
                    </div>
                  ))}
                  {order.order_items.length > 2 && (
                    <span className="text-[10px] text-muted-foreground italic">
                      + {order.order_items.length - 2} more items
                    </span>
                  )}
                </div>
              </div>

              {/* Customer Info */}
              <div className="col-span-2">
                <div className="text-sm font-bold text-white uppercase">{order.customer_name}</div>
                <div className="text-xs text-muted-foreground font-mono">{order.customer_phone}</div>
                <div className="text-[10px] text-muted-foreground uppercase mt-1 truncate max-w-[150px]">
                  {order.customer_location || 'Nairobi'}
                </div>
              </div>

              {/* Amount */}
              <div className="col-span-2 text-right">
                <div className="font-mono text-sm text-white">
                  KES {(order.total_amount / 100).toLocaleString()}
                </div>
              </div>

              {/* Status & Actions */}
              <div className="col-span-2 flex flex-col items-end gap-2">
                <StatusBadge status={order.status} />
                
                {/* Only show 'Mark Shipped' if Paid */}
                {order.status === 'paid' && (
                  <OrderActions orderId={order.id} />
                )}
              </div>

            </div>
          ))}

          {(!orders || orders.length === 0) && (
            <div className="p-12 text-center text-muted-foreground text-sm uppercase tracking-widest">
               No active orders.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}