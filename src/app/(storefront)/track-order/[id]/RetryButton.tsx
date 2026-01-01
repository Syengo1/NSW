'use client';

import { useState } from 'react';
import { retryPayment } from './actions';
import { RefreshCw, Loader2 } from 'lucide-react';

export default function RetryButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    setLoading(true);
    await retryPayment(orderId);
    // Action will revalidate path, UI will update automatically
    setLoading(false);
  };

  return (
    <button 
      onClick={handleRetry}
      disabled={loading}
      className="w-full bg-red-600 text-white py-4 font-black uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2"
    >
      {loading ? <Loader2 className="animate-spin" /> : <RefreshCw size={18} />}
      Retry Payment
    </button>
  );
}