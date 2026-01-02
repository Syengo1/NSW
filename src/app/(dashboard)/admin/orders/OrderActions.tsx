'use client';

import { useState } from 'react';
import { updateOrderStatus } from './actions';
import { Truck, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner'; // Assuming you have sonner or use alert

export default function OrderActions({ order }: { order: any }) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShip = async () => {
    if (!confirm("Confirm: Mark this order as SHIPPED?")) return;
    setLoading(true);
    try {
      await updateOrderStatus(order.id, 'shipped');
    } catch (e) {
      alert("Failed to update");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
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

  return (
    <div className="flex flex-col items-end gap-2">
       {/* Copy Button for Logistics */}
       <button 
         onClick={handleCopy}
         className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
         title="Copy Shipping Details"
       >
         {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
         {copied ? "Copied" : "Copy Info"}
       </button>

       {/* Mark Shipped Action */}
       {order.status === 'paid' && (
        <button 
          onClick={handleShip}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest rounded-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Truck size={12} />}
          Dispatch
        </button>
      )}
    </div>
  );
}