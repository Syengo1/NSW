import { createClient } from "@/lib/supabase/server";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  XCircle,
  MapPin,
  Store,
  User,
  ArrowRight
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import OrderActions from "./OrderActions"; 
import OrdersToolbar from "@/components/admin/orders/OrdersToolbar"; // Import the new toolbar

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
    processing: Package,
    paid: CheckCircle,
    shipped: Truck,
    failed: AlertCircle,
    cancelled: XCircle,
  };

  const Style = styles[status as keyof typeof styles] || styles.pending_payment;
  const Icon = icons[status as keyof typeof icons] || Clock;

  return (
    <span className={cn("flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border", Style)}>
      <Icon size={10} strokeWidth={3} />
      {status.replace('_', ' ')}
    </span>
  );
}

// MAIN PAGE COMPONENT
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams; // Await params in Next.js 15+

  // 1. BUILD QUERY
  let query = supabase
    .from("orders")
    .select(`
      id,
      customer_name,
      customer_phone,
      customer_location,
      recipient_name,
      recipient_phone,
      delivery_method,
      delivery_coordinates,
      delivery_fee,
      total_amount,
      status,
      created_at,
      mpesa_receipt,
      order_items (
        quantity,
        variant_name,
        product_name
      )
    `);

  // 2. APPLY SEARCH FILTER
  if (params.q) {
    const term = params.q;
    // Search across multiple columns (ID, Name, Phone, Receipt)
    query = query.or(`id.eq.${term},customer_name.ilike.%${term}%,customer_phone.ilike.%${term}%,mpesa_receipt.ilike.%${term}%`);
  }

  // 3. APPLY SORTING
  switch (params.sort) {
    case 'date_asc':
      query = query.order('created_at', { ascending: true });
      break;
    case 'total_desc':
      query = query.order('total_amount', { ascending: false });
      break;
    case 'status_pending':
      query = query.eq('status', 'pending_payment').order('created_at', { ascending: false });
      break;
    default: // 'date_desc'
      query = query.order('created_at', { ascending: false });
  }

  const { data: orders } = await query;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-foreground pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Logistics Center</h1>
          <p className="text-muted-foreground text-xs uppercase tracking-widest font-bold">
             {orders?.length || 0} Active Records
          </p>
        </div>
      </div>

      {/* TOOLBAR (Search & Sort) */}
      <OrdersToolbar />

      {/* DATA TERMINAL */}
      <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
        <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <div className="col-span-3">Order / Items</div>
          <div className="col-span-3">Customer & Logistics</div>
          <div className="col-span-2">Location</div>
          <div className="col-span-2 text-right">Financials</div>
          <div className="col-span-2 text-right">Status</div>
        </div>

        <div className="divide-y divide-border">
          {orders?.map((order) => {
            const isGift = order.recipient_name && order.recipient_name !== order.customer_name;
            const isPickup = order.delivery_method === 'pickup';

            return (
              <div key={order.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 items-start hover:bg-muted/10 transition-colors group relative">
                
                {/* 1. ID & ITEMS */}
                <div className="col-span-3 space-y-3">
                  <div className="flex items-center gap-2">
                     <span className="font-mono text-xs font-bold text-primary">#{order.id.slice(0, 8)}</span>
                     {order.mpesa_receipt && (
                        <span className="text-[10px] bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded font-mono font-bold">
                          {order.mpesa_receipt}
                        </span>
                     )}
                  </div>
                  
                  <div className="space-y-1 pl-2 border-l-2 border-border">
                    {order.order_items.map((item: any, i: number) => (
                      <div key={i} className="text-xs font-bold uppercase text-foreground leading-tight">
                        <span className="text-muted-foreground mr-1">{item.quantity}x</span> 
                        {item.product_name} 
                        <span className="text-[10px] text-muted-foreground block font-normal">{item.variant_name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase">
                    {new Date(order.created_at).toLocaleString()}
                  </div>
                </div>

                {/* 2. CUSTOMER & RECIPIENT LOGIC */}
                <div className="col-span-3 space-y-3">
                  {/* Payer */}
                  <div className="flex items-start gap-2">
                     <User size={14} className="mt-0.5 text-muted-foreground" />
                     <div>
                       <div className="text-xs font-bold uppercase">{order.customer_name}</div>
                       <div className="text-[10px] font-mono text-muted-foreground">{order.customer_phone}</div>
                     </div>
                  </div>

                  {/* Different Recipient Alert */}
                  {isGift && (
                     <div className="flex items-start gap-2 bg-blue-500/5 p-2 rounded border border-blue-500/10">
                        <ArrowRight size={14} className="mt-0.5 text-blue-500" />
                        <div>
                          <span className="text-[9px] font-black uppercase text-blue-500 tracking-wider">Recipient</span>
                          <div className="text-xs font-bold uppercase">{order.recipient_name}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">{order.recipient_phone}</div>
                        </div>
                     </div>
                  )}
                </div>

                {/* 3. LOGISTICS / LOCATION */}
                <div className="col-span-2 space-y-2">
                   {isPickup ? (
                     <div className="flex items-center gap-2 text-emerald-600 bg-emerald-500/10 px-2 py-1.5 rounded w-fit border border-emerald-500/20">
                        <Store size={14} />
                        <span className="text-[10px] font-black uppercase tracking-wider">Store Pickup</span>
                     </div>
                   ) : (
                     <div className="space-y-1">
                        <div className="flex items-center gap-2 text-blue-600 bg-blue-500/10 px-2 py-1 rounded w-fit border border-blue-500/20">
                            <Truck size={14} />
                            <span className="text-[10px] font-black uppercase tracking-wider">Delivery</span>
                        </div>
                        <p className="text-[10px] font-bold uppercase leading-tight line-clamp-2" title={order.customer_location}>
                          {order.customer_location || 'No address provided'}
                        </p>
                        
                        {/* Map Button */}
                        {order.delivery_coordinates && (
                          <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${order.delivery_coordinates}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[10px] font-bold uppercase text-blue-500 hover:underline"
                          >
                             <MapPin size={10} /> View Map
                          </a>
                        )}
                     </div>
                   )}
                </div>

                {/* 4. FINANCIALS */}
                <div className="col-span-2 text-right space-y-1">
                  <div className="font-mono text-sm font-bold text-foreground">
                    {formatCurrency(order.total_amount / 100)}
                  </div>
                  {order.delivery_fee > 0 && (
                     <div className="text-[10px] text-muted-foreground">
                       Inc. {formatCurrency(order.delivery_fee / 100)} Del.
                     </div>
                  )}
                  {isPickup && (
                    <span className="text-[9px] text-emerald-600 font-bold uppercase">Free Pickup</span>
                  )}
                </div>

                {/* 5. ACTIONS */}
                <div className="col-span-2 flex flex-col items-end gap-2">
                  <StatusBadge status={order.status} />
                  <OrderActions order={order} />
                </div>

              </div>
            );
          })}

          {(!orders || orders.length === 0) && (
            <div className="p-20 text-center flex flex-col items-center justify-center gap-2 text-muted-foreground">
               <Package size={40} strokeWidth={1} className="opacity-20" />
               <p className="text-sm font-bold uppercase tracking-widest">No matching records found.</p>
               {params.q && <p className="text-xs">Try searching for something else.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}