'use client';

import { useState } from 'react';
import { updateOrderStatus } from './actions';
import { Truck, Loader2 } from 'lucide-react';

export default function OrderActions({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);

  const handleShip = async () => {
    if (!confirm("Mark this order as SHIPPED?")) return;
    setLoading(true);
    await updateOrderStatus(orderId, 'shipped');
    setLoading(false);
  };

  return (
    <button 
      onClick={handleShip}
      disabled={loading}
      className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-400 hover:text-blue-300 transition-colors"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Truck size={12} />}
      Mark Shipped
    </button>
  );
}