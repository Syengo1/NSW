import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import OrderPoller from "@/components/storefront/OrderPoller";
import { retryPayment } from "./actions";
import { Check, Clock, XCircle, RefreshCw, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// FIX: Retry Button Client Component
import RetryButton from "./RetryButton"; 

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from('orders')
    .select(`*, order_items(*)`)
    .eq('id', id)
    .single();

  if (!order) notFound();

  // STATUS CONFIG
  const isPaid = order.status === 'paid';
  const isFailed = order.status === 'failed';
  const isPending = order.status === 'pending_payment' || order.status === 'processing';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6 animate-fade-in">
      
      {/* 1. AUTO REFRESHER (Only runs if pending) */}
      <OrderPoller stop={!isPending} />

      <div className="max-w-md w-full space-y-8">
        
        {/* STATUS ICON */}
        <div className="flex justify-center">
          <div className={cn(
            "h-24 w-24 rounded-full flex items-center justify-center border-4 shadow-2xl transition-all duration-500",
            isPaid ? "border-green-500 bg-green-500/10 text-green-500" :
            isFailed ? "border-red-500 bg-red-500/10 text-red-500" :
            "border-accent bg-accent/10 text-accent animate-pulse"
          )}>
            {isPaid ? <Check size={48} /> : 
             isFailed ? <XCircle size={48} /> : 
             <Clock size={48} />}
          </div>
        </div>

        {/* HEADER TEXT */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black uppercase tracking-tighter">
            {isPaid ? "Order Confirmed" : 
             isFailed ? "Payment Failed" : 
             "Check your Phone"}
          </h1>
          <p className="text-muted-foreground text-sm font-mono">
            {isPaid ? `Receipt: ${order.mpesa_receipt}` : 
             isFailed ? "The transaction was cancelled or timed out." : 
             `We sent an M-Pesa prompt to ${order.customer_phone}`}
          </p>
        </div>

        {/* ORDER DETAILS CARD */}
        <div className="bg-card border border-white/10 p-6 rounded-none space-y-4">
          <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-muted-foreground border-b border-white/10 pb-2">
            <span>Order ID</span>
            <span className="font-mono text-white">#{order.id.slice(0,8)}</span>
          </div>

          <div className="space-y-3">
             {order.order_items.map((item: any) => (
               <div key={item.id} className="flex justify-between text-sm">
                 <span className="uppercase font-bold">{item.variant_name} <span className="text-muted-foreground">x{item.quantity}</span></span>
                 <span className="font-mono">{(item.price_at_purchase/100).toLocaleString()}</span>
               </div>
             ))}
          </div>

          <div className="flex justify-between items-center text-lg font-black uppercase border-t border-white/10 pt-4">
            <span>Total</span>
            <span className="text-accent">KES {(order.total_amount/100).toLocaleString()}</span>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="space-y-3">
          {isFailed && (
             <RetryButton orderId={order.id} />
          )}
          
          <Link 
            href="/shop" 
            className={cn(
              "w-full py-4 font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all",
              isPaid ? "bg-white text-black hover:bg-neutral-200" : 
              "border border-white/20 hover:bg-white/10"
            )}
          >
            {isPaid ? "Continue Shopping" : "Back to Shop"} <ArrowRight size={16} />
          </Link>
        </div>

      </div>
    </div>
  );
}