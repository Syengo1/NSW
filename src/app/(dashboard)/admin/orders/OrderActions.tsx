'use client';

import { useState } from 'react';
import { updateOrderStatus, cancelOrder, markOrderReceived } from './actions';
import { Truck, Loader2, Copy, Check, XCircle, Ban, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// --- STRICT TYPES ---
interface OrderItem {
  quantity: number;
  variant_name: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  delivery_method: string;
  recipient_name: string | null;
  customer_name: string;
  recipient_phone: string | null;
  customer_phone: string;
  customer_location: string | null;
  order_items: OrderItem[];
}

export default function OrderActions({ order }: { order: Order }) {
  const router = useRouter(); // <-- 2. INIT ROUTER
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // <-- 3. OPTIMISTIC UI STATE
  // This allows the button to change instantly without waiting for a page reload
  const [currentStatus, setCurrentStatus] = useState(order.status); 

  // --- ACTIONS ---
  const handleShip = async () => {
    const msg = order.delivery_method === 'pickup' 
      ? "Confirm: Is this order READY FOR PICKUP?" 
      : "Confirm: Dispatch this order with a rider?";
      
    if (!confirm(msg)) return;
    
    setLoading(true);
    try {
      await updateOrderStatus(order.id, 'shipped');
      setCurrentStatus('shipped'); // <-- INSTANTLY UPDATE THE BUTTON
      toast.success(order.delivery_method === 'pickup' ? "Ready for pickup" : "Order dispatched to rider");
      router.refresh(); // <-- Tell Next.js to fetch the fresh data in the background
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleReceive = async () => {
    const msg = order.delivery_method === 'pickup'
      ? "Confirm: Has the customer collected this order?"
      : "Confirm: Has the rider successfully delivered this order?";

    if (!confirm(msg)) return;

    setLoading(true);
    try {
      await markOrderReceived(order.id);
      setCurrentStatus('received'); // <-- INSTANTLY UPDATE THE BUTTON
      toast.success("Order marked as completed!");
      router.refresh();
    } catch {
      toast.error("Failed to mark as received");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    const isSure = confirm("WARNING: This will CANCEL the order and RESTOCK items to inventory. Continue?");
    if (!isSure) return;

    setLoading(true);
    try {
      await cancelOrder(order.id);
      setCurrentStatus('cancelled'); // <-- INSTANTLY UPDATE THE BUTTON
      toast.success("Order cancelled & items restocked");
      router.refresh();
    } catch {
      toast.error("Failed to cancel order");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const details = `
ORDER #${order.order_number}
RECIPIENT: ${order.recipient_name || order.customer_name}
PHONE: ${order.recipient_phone || order.customer_phone}
LOCATION: ${order.customer_location}
ITEMS: ${order.order_items.map((i) => `${i.quantity}x ${i.variant_name}`).join(', ')}
    `.trim();
    
    navigator.clipboard.writeText(details);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // --- TERMINAL STATES ---
  // Notice we now check `currentStatus` instead of `order.status`
  if (currentStatus === 'cancelled') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded border border-border">
        <Ban size={10} /> CANCELLED
      </span>
    );
  }

  if (currentStatus === 'received') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
        <CheckCircle2 size={12} /> COMPLETED
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
       {currentStatus !== 'received' && (
         <button 
           onClick={handleCopy}
           className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
           title="Copy Details for Rider"
         >
           {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
           {copied ? "Copied" : "Copy Info"}
         </button>
       )}

       <div className="flex items-center gap-2">
         {(currentStatus === 'paid' || currentStatus === 'pending_payment') && (
            <button 
              onClick={handleCancel}
              disabled={loading}
              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors border border-transparent hover:border-red-200"
              title="Cancel & Restock"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            </button>
         )}

         {currentStatus === 'paid' && (
          <button 
            onClick={handleShip}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Truck size={12} />}
            Dispatch
          </button>
        )}

        {currentStatus === 'shipped' && (
          <button 
            onClick={handleReceive}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            title="Mark as successfully delivered to customer"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
            Mark Received
          </button>
        )}

       </div>
    </div>
  );
}