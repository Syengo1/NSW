import { createClient } from "@supabase/supabase-js"; 
import { notFound } from "next/navigation";
import Link from "next/link";
import { Metadata } from "next";
import { Check, Clock, XCircle, ArrowRight, Package, ShoppingBag } from "lucide-react";

import OrderPoller from "@/components/storefront/OrderPoller";
import RetryButton from "./RetryButton"; 
import ReceiptDownloader from "@/components/storefront/ReceiptDownloader";
import { cn, formatCurrency } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>
}

// --- DYNAMIC METADATA ---
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Track Order #${id.slice(0, 8)} | Nairobi Streetwear`,
    description: "View your order status and receipt.",
  };
}

// --- MAIN PAGE ---
export default async function OrderPage({ params }: Props) {
  const { id } = await params;

  // 1. INIT MASTER CLIENT (Bypass RLS for Guest Access)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  // 2. FETCH ORDER
  const { data: order } = await supabase
    .from('orders')
    .select(`*, order_items(*)`)
    .eq('id', id)
    .single();

  if (!order) notFound();

  // 3. DERIVE STATUS
  const isPaid = order.status === 'paid' || order.status === 'shipped';
  const isFailed = order.status === 'failed' || order.status === 'cancelled';
  const isPending = !isPaid && !isFailed;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 animate-fade-in">
      
      {/* Auto-Refresher (Only active when processing) */}
      <OrderPoller stop={!isPending} />

      <div className="max-w-md w-full space-y-8">
        
        {/* STATUS VISUAL */}
        <div className="flex justify-center mb-6">
          <div className={cn(
            "h-24 w-24 rounded-full flex items-center justify-center border-4 shadow-2xl transition-all duration-700",
            isPaid ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 scale-100" :
            isFailed ? "border-red-500 bg-red-500/10 text-red-500 scale-100" :
            "border-blue-500 bg-blue-500/10 text-blue-500 animate-pulse scale-105"
          )}>
            {isPaid ? <Check size={48} strokeWidth={3} /> : 
             isFailed ? <XCircle size={48} strokeWidth={3} /> : 
             <Clock size={48} strokeWidth={3} />}
          </div>
        </div>

        {/* HEADLINE */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black uppercase tracking-tighter">
            {isPaid ? "Order Confirmed" : 
             isFailed ? "Payment Failed" : 
             "Processing Payment"}
          </h1>
          <p className="text-muted-foreground text-sm font-mono px-4">
            {isPaid ? (
              <span className="text-emerald-600 font-bold">Receipt: {order.mpesa_receipt}</span>
            ) : isFailed ? (
              "The transaction was cancelled or timed out. Please try again."
            ) : (
              `Please check your phone (${order.customer_phone}) and enter your M-Pesa PIN.`
            )}
          </p>
        </div>

        {/* RECEIPT CARD */}
        <div className="bg-card border border-border p-6 rounded-lg shadow-sm space-y-4">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
            <span>Order ID</span>
            <span className="font-mono text-foreground">#{order.id.slice(0,8)}</span>
          </div>

          <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin">
             {order.order_items && order.order_items.length > 0 ? (
               order.order_items.map((item: any) => (
                 <div key={item.id} className="flex justify-between text-sm items-start">
                   <div className="flex flex-col">
                     <span className="uppercase font-bold text-xs leading-tight">{item.product_name}</span>
                     <span className="text-[10px] text-muted-foreground uppercase">{item.variant_name} x{item.quantity}</span>
                   </div>
                   <span className="font-mono font-medium">{formatCurrency(item.price_at_purchase/100)}</span>
                 </div>
               ))
             ) : (
               <div className="text-xs text-muted-foreground text-center py-4 flex items-center justify-center gap-2">
                 <Package size={14} /> Loading items...
               </div>
             )}
          </div>

          <div className="flex justify-between items-center text-lg font-black uppercase border-t border-border pt-4">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(order.total_amount/100)}</span>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="space-y-3 pt-2">
          {isFailed && <RetryButton orderId={order.id} />}
          
          {isPaid && <ReceiptDownloader order={order} />}
          
          <Link 
            href="/shop" 
            className={cn(
              "w-full py-4 font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all rounded-md shadow-sm",
              isPaid ? "bg-black text-white hover:opacity-90 dark:bg-white dark:text-black" : 
              "border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
             {isPaid ? <ShoppingBag size={16} /> : <ArrowRight size={16} />}
             {isPaid ? "Continue Shopping" : "Back to Shop"}
          </Link>
        </div>

      </div>
    </div>
  );
}