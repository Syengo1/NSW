// src/app/(storefront)/track-order/[id]/page.tsx

import { createClient } from "@supabase/supabase-js"; 
import { notFound } from "next/navigation";
import OrderPoller from "@/components/storefront/OrderPoller";
import RetryButton from "./RetryButton"; 
import ReceiptDownloader from "@/components/storefront/ReceiptDownloader";
import { Check, Clock, XCircle, ArrowRight, Package } from "lucide-react";
import Link from "next/link";
import { cn, formatCurrency } from "@/lib/utils";
// 1. IMPORT NOSTORE TO PREVENT CACHING
import { unstable_noStore as noStore } from 'next/cache';

// 2. FORCE DYNAMIC PAGE RENDERING
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// SAFE TYPE DEF FOR NEXT.JS 14 & 15 COMPATIBILITY
type Props = {
  params: Promise<{ id: string }> | { id: string }
}

export default async function OrderPage({ params }: Props) {
  // 3. CALL NOSTORE BEFORE FETCHING
  noStore(); 

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const { data: order } = await supabase
    .from('orders')
    .select(`*, order_items(*)`)
    .eq('order_number', id)
    .single();

  if (!order) notFound();

  const isPaid = order.status === 'paid' || order.status === 'shipped';
  const isFailed = order.status === 'failed' || order.status === 'cancelled';
  const isPending = !isPaid && !isFailed;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 animate-fade-in">
      <OrderPoller stop={!isPending} />

      <div className="max-w-md w-full space-y-8">
        
        <div className="flex justify-center">
          <div className={cn(
            "h-24 w-24 rounded-full flex items-center justify-center border-4 shadow-2xl transition-all duration-500",
            isPaid ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" :
            isFailed ? "border-red-500 bg-red-500/10 text-red-500" :
            "border-blue-500 bg-blue-500/10 text-blue-500 animate-pulse"
          )}>
            {isPaid ? <Check size={48} strokeWidth={3} /> : 
             isFailed ? <XCircle size={48} strokeWidth={3} /> : 
             <Clock size={48} strokeWidth={3} />}
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black uppercase tracking-tighter">
            {isPaid ? "Order Confirmed" : 
             isFailed ? "Payment Failed" : 
             "Processing Payment"}
          </h1>
          <p className="text-muted-foreground text-sm font-mono">
            {isPaid ? `Receipt: ${order.mpesa_receipt}` : 
             isFailed ? "The transaction was cancelled or timed out." : 
             `Check your phone (${order.customer_phone}) for the M-Pesa prompt.`}
          </p>
        </div>

        <div className="bg-card border border-border p-6 rounded-lg shadow-sm space-y-4">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-border pb-2">
            <span>Order ID</span>
            <span className="font-mono text-foreground">{order.order_number}</span>
          </div>

          <div className="space-y-3">
             {order.order_items && order.order_items.length > 0 ? (
               // FIX: Replaced explicit `any` with safe type narrowing to improve robustness
               order.order_items.map((item: { id: string, variant_name: string, quantity: number, price_at_purchase: number }) => (
                 <div key={item.id} className="flex justify-between text-sm">
                   <span className="uppercase font-bold text-xs">
                     {item.variant_name} 
                     <span className="text-muted-foreground ml-1">x{item.quantity}</span>
                   </span>
                   <span className="font-mono">{formatCurrency(item.price_at_purchase/100)}</span>
                 </div>
               ))
             ) : (
               <div className="text-xs text-muted-foreground text-center py-2 flex items-center justify-center gap-2">
                 <Package size={14} /> Loading items...
               </div>
             )}
          </div>

          <div className="flex justify-between items-center text-lg font-black uppercase border-t border-border pt-4">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(order.total_amount/100)}</span>
          </div>
        </div>

        <div className="space-y-3">
          {isFailed && <RetryButton orderId={order.id} />}
          {isPaid && <ReceiptDownloader order={order} />}
          
          <Link 
            href="/shop" 
            className={cn(
              "w-full py-4 font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all rounded-md",
              isPaid ? "bg-black text-white hover:opacity-90 dark:bg-white dark:text-black" : 
              "border border-border hover:bg-muted"
            )}
          >
            {isPaid ? "Continue Shopping" : "Back to Shop"} <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </div>
  );
}