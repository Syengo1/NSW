'use client';

import { useState } from 'react';
import { updateOrderStatus, cancelOrder } from './actions';
import { Truck, Loader2, Copy, Check, XCircle, Ban } from 'lucide-react';
import { toast } from 'sonner';

export default function OrderActions({ order }: { order: any }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // --- ACTIONS ---
  const handleShip = async () => {
    if (!confirm("Confirm: Mark this order as SHIPPED?")) return;
    setLoading(true);
    try {
      await updateOrderStatus(order.id, 'shipped');
      toast.success("Order dispatched");
    } catch (e) {
      toast.error("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    // Double confirmation for destructive action
    const isSure = confirm("WARNING: This will CANCEL the order and RESTOCK items to inventory. Continue?");
    if (!isSure) return;

    setLoading(true);
    try {
      await cancelOrder(order.id);
      toast.success("Order cancelled & items restocked");
    } catch (e) {
      toast.error("Failed to cancel order");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    // Formats details perfectly for WhatsApp/SMS to riders
    const details = `
ORDER #${order.id.slice(0,8)}
RECIPIENT: ${order.recipient_name || order.customer_name}
PHONE: ${order.recipient_phone || order.customer_phone}
LOCATION: ${order.customer_location}
ITEMS: ${order.order_items.map((i: any) => `${i.quantity}x ${i.variant_name}`).join(', ')}
    `.trim();
    
    navigator.clipboard.writeText(details);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (order.status === 'cancelled') {
    return (
      <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
        <Ban size={10} /> CANCELLED
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
       {/* UTILS */}
       <button 
         onClick={handleCopy}
         className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
         title="Copy Details for Rider"
       >
         {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
         {copied ? "Copied" : "Copy Info"}
       </button>

       {/* PRIMARY ACTIONS */}
       <div className="flex items-center gap-2">
         {/* Cancel Button (Only for active orders) */}
         {order.status !== 'shipped' && (
            <button 
              onClick={handleCancel}
              disabled={loading}
              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors border border-transparent hover:border-red-200"
              title="Cancel & Restock"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
            </button>
         )}

         {/* Ship Button (Only for paid orders) */}
         {order.status === 'paid' && (
          <button 
            onClick={handleShip}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50"
          >
            <Truck size={12} />
            Dispatch
          </button>
        )}
       </div>
    </div>
  );
}