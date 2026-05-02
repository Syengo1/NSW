import { createClient } from "@supabase/supabase-js"; 
import { 
  Package, Truck, User, Store, ArrowRight, TrendingUp, Wallet, MapPin
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import OrderActions from "./OrderActions"; 
import OrdersToolbar from "@/components/admin/orders/OrdersToolbar";

// --- STRICT TYPES ---
interface OrderItemData {
  quantity: number;
  variant_name: string;
  product_name: string;
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
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
    cancelled: "bg-neutral-500/10 text-neutral-500 border-neutral-500/20",
  };
  return (
    <span className={cn("flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border", styles[status] || styles.pending_payment)}>
      {status.replace('_', ' ')}
    </span>
  );
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-card border border-border p-5 rounded-xl flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={cn("p-3 rounded-full", color)}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">{label}</div>
        <div className="text-2xl font-black tracking-tight">{value}</div>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  
  const params = await searchParams;

  let query = supabase
    .from("orders")
    .select(`*, order_items ( quantity, variant_name, product_name )`)
    .order('created_at', { ascending: false });

  if (params.q) {
    const term = params.q;
    // FIX: Updated search capability to use order_number instead of id
    query = query.or(`order_number.ilike.%${term}%,customer_name.ilike.%${term}%,customer_phone.ilike.%${term}%,mpesa_receipt.ilike.%${term}%`);
  }
  
  if (params.sort === 'status_pending') query = query.eq('status', 'pending_payment');
  if (params.sort === 'status_paid') query = query.eq('status', 'paid');

  const { data: orders } = await query;

  const totalRevenue = orders?.filter(o => o.status === 'paid' || o.status === 'shipped' || o.status === 'received').reduce((sum, o) => sum + o.total_amount, 0) || 0;
  const pendingShipment = orders?.filter(o => o.status === 'paid').length || 0;
  const activeOrders = orders?.length || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Logistics Center</h1>
          <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold">Real-time Fulfillment Dashboard</p>
        </div>
      </div>

      {/* INTELLIGENT HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <StatCard 
            label="Total Revenue" 
            value={formatCurrency(totalRevenue / 100)} 
            icon={Wallet} 
            color="bg-emerald-500/10 text-emerald-600" 
         />
         <StatCard 
            label="Ready to Ship" 
            value={pendingShipment} 
            icon={Package} 
            color="bg-blue-500/10 text-blue-600" 
         />
         <StatCard 
            label="Total Records" 
            value={activeOrders} 
            icon={TrendingUp} 
            color="bg-neutral-500/10 text-neutral-600" 
         />
      </div>

      {/* TOOLBAR */}
      <OrdersToolbar />

      {/* ORDERS LIST */}
      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <div className="col-span-3">Order Details</div>
          <div className="col-span-3">Customer</div>
          <div className="col-span-3">Logistics</div>
          <div className="col-span-3 text-right">Status & Action</div>
        </div>

        <div className="divide-y divide-border">
          {orders?.map((order) => {
            const isGift = order.recipient_name && order.recipient_name !== order.customer_name;
            const isPickup = order.delivery_method === 'pickup';

            return (
              <div key={order.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 items-start hover:bg-muted/5 transition-colors group">
                
                {/* 1. ORDER DETAILS */}
                <div className="col-span-3 space-y-2">
                  <div className="flex items-center gap-2">
                     {/* FIX: Now cleanly displays the generated NSW- number */}
                     <span className="font-mono text-xs font-bold text-primary">#{order.order_number}</span>
                     <span className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="space-y-1 pl-2 border-l-2 border-border/50">
                    {/* FIX: Explicit interface used instead of 'any' */}
                    {order.order_items.map((item: OrderItemData, i: number) => (
                      <div key={i} className="text-xs font-bold uppercase leading-tight">
                        <span className="text-muted-foreground mr-1">{item.quantity}x</span> {item.product_name}
                        <span className="text-[10px] text-muted-foreground block font-normal">{item.variant_name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. CUSTOMER */}
                <div className="col-span-3 space-y-3">
                  <div className="flex items-start gap-2">
                     <User size={14} className="mt-0.5 text-muted-foreground" />
                     <div>
                       <div className="text-xs font-bold uppercase">{order.customer_name}</div>
                       <div className="text-[10px] font-mono text-muted-foreground">{order.customer_phone}</div>
                     </div>
                  </div>
                  {isGift && (
                     <div className="flex items-start gap-2 bg-purple-500/5 p-2 rounded border border-purple-500/10">
                        <ArrowRight size={14} className="mt-0.5 text-purple-500" />
                        <div>
                          <span className="text-[9px] font-black uppercase text-purple-500 tracking-wider">Recipient</span>
                          <div className="text-xs font-bold uppercase">{order.recipient_name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">{order.recipient_phone}</div>
                        </div>
                     </div>
                  )}
                </div>

                {/* 3. LOGISTICS */}
                <div className="col-span-3 space-y-2">
                   {isPickup ? (
                     <div className="flex items-center gap-2 text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded w-fit border border-emerald-500/20">
                        <Store size={14} /> <span className="text-[10px] font-black uppercase tracking-wider">Store Pickup</span>
                     </div>
                   ) : (
                     <div className="space-y-1">
                        <div className="flex items-center gap-2 text-blue-600 bg-blue-500/10 px-2 py-1 rounded w-fit border border-blue-500/20">
                            <Truck size={14} /> <span className="text-[10px] font-black uppercase tracking-wider">Delivery</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase leading-tight line-clamp-2" title={order.customer_location}>
                          {order.customer_location || 'No address provided'}
                        </p>
                        {order.delivery_coordinates && (
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${order.delivery_coordinates}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] font-bold uppercase text-blue-500 hover:underline"
                          >
                             <MapPin size={10} /> Open GPS Location
                          </a>
                        )}
                     </div>
                   )}
                </div>

                {/* 4. STATUS & TOTAL */}
                <div className="col-span-3 flex flex-col items-end gap-2">
                  <div className="text-right">
                    <div className="font-mono text-sm font-bold">{formatCurrency(order.total_amount / 100)}</div>
                    {order.mpesa_receipt && <div className="text-[9px] font-mono text-emerald-600">Ref: {order.mpesa_receipt}</div>}
                  </div>
                  <StatusBadge status={order.status} />
                  <OrderActions order={order} />
                </div>

              </div>
            );
          })}
          
          {(!orders || orders.length === 0) && (
             <div className="p-12 text-center text-muted-foreground uppercase tracking-widest text-xs">
                No orders found.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}