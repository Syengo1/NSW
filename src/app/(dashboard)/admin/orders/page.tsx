// src/app/(dashboard)/admin/orders/page.tsx
import { createClient } from "@/lib/supabase/server"; 
import { Package, Truck, User, Store, MapPin, CalendarClock, AlertCircle } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import OrderActions from "./OrderActions"; 
import OrdersToolbar from "@/components/admin/orders/OrdersToolbar";


export const dynamic = 'force-dynamic';

// --- STRICT TYPES ---
interface OrderItemData {
  quantity: number;
  variant_name: string;
  product_name: string;
}

// Ensure the fetched data perfectly matches what the OrderActions component expects
interface OrderData {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_location: string | null;
  total_amount: number;
  status: string;
  mpesa_receipt: string | null;
  created_at: string;
  delivery_method: string;
  recipient_name: string | null;
  recipient_phone: string | null;
  delivery_fee: number;
  delivery_coordinates: string | null;
  order_items: OrderItemData[];
}

// --- HELPERS ---
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending_payment: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    processing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    paid: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    shipped: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    received: "bg-green-500/10 text-green-600 border-green-500/20",
    failed: "bg-red-500/10 text-red-500 border-red-500/20",
    cancelled: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20", 
  };

  const config = styles[status] || "bg-neutral-100 text-neutral-500 border-neutral-200";

  return (
    <span className={cn("px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest border", config)}>
      {status.replace('_', ' ')}
    </span>
  );
}

function formatOrderDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-KE', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

export default async function OrdersPage(props: { searchParams?: Promise<{ highlight?: string }> }) {
  const supabase = await createClient();
  const searchParams = await props.searchParams;
  const highlightId = searchParams?.highlight;

  const { data: rawOrders, error } = await supabase
    .from("orders")
    .select(`
      id,
      order_number,
      customer_name,
      customer_phone,
      customer_location,
      total_amount,
      status,
      mpesa_receipt,
      created_at,
      delivery_method,
      recipient_name,
      recipient_phone,
      delivery_fee,
      delivery_coordinates,
      order_items (
        quantity,
        variant_name,
        product_name
      )
    `)
    .order("created_at", { ascending: false });

  // Type assertion to bridge Supabase's generic return type with our strict interface
  const orders = rawOrders as unknown as OrderData[];

  return (
    <div className="space-y-6">
      <OrdersToolbar />

      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-600 text-sm font-bold">
           <AlertCircle size={18} />
           Failed to load orders from the database. Please refresh the page.
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 border border-border rounded-xl shadow-sm overflow-hidden">
        
        {/* DESKTOP TABLE HEADER (Hidden on mobile) */}
        <div className="hidden lg:grid grid-cols-12 gap-4 p-4 border-b border-border bg-neutral-50/50 dark:bg-black/20 text-xs font-black uppercase tracking-widest text-muted-foreground">
          <div className="col-span-3">Order Details</div>
          <div className="col-span-3">Customer</div>
          <div className="col-span-3">Fulfillment</div>
          <div className="col-span-3 text-right">Status / Value</div>
        </div>

        {/* TABLE BODY */}
        <div className="divide-y divide-border">
          {orders?.map((order) => {
            const isGift = order.recipient_phone && order.recipient_phone !== order.customer_phone;
            const isHighlighted = highlightId === order.order_number;

            return (
              <div 
                key={order.id} 
                id={`order-${order.order_number}`}
                className={cn(
                  "flex flex-col lg:grid lg:grid-cols-12 gap-4 lg:gap-4 p-4 lg:items-center transition-colors hover:bg-neutral-50/50 dark:hover:bg-white/[0.02]",
                  isHighlighted && "bg-emerald-50/50 dark:bg-emerald-950/20 border-l-4 border-l-emerald-500"
                )}
              >
                
                {/* 1. ORDER SUMMARY */}
                <div className="lg:col-span-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground bg-secondary px-1.5 py-0.5 rounded">
                      {order.order_number}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-mono">
                       <CalendarClock size={10} /> {formatOrderDate(order.created_at)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {order.order_items?.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-[11px]">
                        <span className="font-bold text-muted-foreground">{item.quantity}x</span>
                        <div className="leading-tight">
                          <div className="font-bold">{item.product_name}</div>
                          <div className="text-muted-foreground text-[10px]">{item.variant_name}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. CUSTOMER & RECIPIENT */}
                <div className="lg:col-span-3 space-y-2 border-t border-border/50 pt-3 lg:border-t-0 lg:pt-0">
                   <div className="flex items-start gap-2">
                      <User size={14} className="text-muted-foreground mt-0.5" />
                      <div>
                         <div className="text-xs font-bold uppercase">{order.customer_name}</div>
                         <div className="text-[10px] font-mono text-muted-foreground">{order.customer_phone}</div>
                      </div>
                   </div>
                   
                   {isGift && (
                     <div className="flex items-start gap-2 mt-2 pt-2 border-t border-dashed border-border/50">
                        <Package size={14} className="text-orange-500 mt-0.5" />
                        <div>
                           <div className="text-[9px] font-black uppercase text-orange-500 tracking-widest">Recipient</div>
                           <div className="text-xs font-bold uppercase">{order.recipient_name}</div>
                           <div className="text-[10px] font-mono text-muted-foreground">{order.recipient_phone}</div>
                        </div>
                     </div>
                   )}
                </div>

                {/* 3. FULFILLMENT METHOD */}
                <div className="lg:col-span-3 border-t border-border/50 pt-3 lg:border-t-0 lg:pt-0">
                  {order.delivery_method === 'pickup' ? (
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2 py-1 rounded w-fit">
                        <Store size={12} /> Store Pickup
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2 py-1 rounded w-fit">
                        <Truck size={12} /> Delivery
                      </span>
                      <div className="text-[10px] text-muted-foreground leading-tight mt-1 max-w-[200px] line-clamp-2">
                        {order.customer_location}
                      </div>
                      {order.delivery_coordinates && (
                        <a 
                          // 🚨 FIX: Official Google Maps cross-platform routing URL
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.delivery_coordinates)}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] font-bold uppercase text-blue-500 hover:underline mt-1 w-fit"
                        >
                          <MapPin size={10} /> Open GPS
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. STATUS & TOTAL */}
                <div className="lg:col-span-3 flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-2 border-t border-border/50 pt-3 lg:border-t-0 lg:pt-0">
                  <div className="flex flex-col lg:items-end">
                    <div className="font-mono text-sm font-bold">{formatCurrency(order.total_amount / 100)}</div>
                    {order.mpesa_receipt && <div className="text-[9px] font-mono text-emerald-600">Ref: {order.mpesa_receipt}</div>}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={order.status} />
                    <OrderActions order={order} />
                  </div>
                </div>

              </div>
            );
          })}
          
          {(!orders || orders.length === 0) && !error && (
             <div className="p-12 flex flex-col items-center justify-center text-center text-muted-foreground">
                <Package size={32} className="mb-3 opacity-20" />
                <div className="uppercase tracking-widest text-xs font-bold">No orders found.</div>
                <div className="text-[10px] mt-1">Waiting for the next drop to sell out.</div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}