'use client';

import { useState } from 'react';
import { retryPayment } from './actions';
import { RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner'; // Recommend ensuring 'sonner' is installed

export default function RetryButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    setLoading(true);
    try {
      const result = await retryPayment(orderId);
      
      if (result.success) {
        toast.success("M-Pesa prompt sent! Check your phone.");
      } else {
        toast.error(result.error || "Failed to retry payment.");
      }
    } catch (e) {
      toast.error("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleRetry}
      disabled={loading}
      className="w-full bg-red-600 text-white py-4 font-black uppercase tracking-widest hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 rounded-md shadow-lg shadow-red-900/20"
    >
      {loading ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
      Retry Payment
    </button>
  );
}