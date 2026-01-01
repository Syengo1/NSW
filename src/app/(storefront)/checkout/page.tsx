'use client';

import { useCartStore } from '@/lib/store/cart';
import { useState } from 'react';
import { Loader2, Lock, Smartphone, MapPin, ArrowLeft } from 'lucide-react';
import { processCheckout } from './actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CheckoutPage() {
  const { items, getCartTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const total = getCartTotal();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    try {
      const result = await processCheckout(formData, items);

      if (result.success) {
        clearCart();
        router.push(`/track-order/${result.orderId}`); // We will create this dynamic route next
      } else {
        setError(result.error || "Payment failed.");
      }
    } catch (err: any) {
      setError(err.message || "Connection error.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground animate-fade-in">
        <h2 className="text-2xl font-black uppercase tracking-tighter">Your bag is empty</h2>
        <Link href="/shop" className="mt-4 text-sm underline hover:text-muted-foreground transition-colors">
          Return to Drop
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 animate-slide-up">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        
        {/* LEFT: SUMMARY */}
        <div className="space-y-6">
           <Link href="/shop" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">
             <ArrowLeft size={14} /> Continue Shopping
           </Link>
           
           <h1 className="text-4xl font-black uppercase tracking-tighter">Secure Checkout</h1>
           
           <div className="bg-secondary/20 border border-white/10 p-6 space-y-4">
              {items.map(item => (
                <div key={item.variantId} className="flex justify-between items-center text-sm">
                   <div>
                     <span className="font-bold block uppercase">{item.name}</span>
                     <span className="text-muted-foreground text-xs">{item.color} / {item.size} x {item.quantity}</span>
                   </div>
                   <div className="font-mono">KES {((item.price * item.quantity)/100).toLocaleString()}</div>
                </div>
              ))}
              <div className="border-t border-white/10 pt-4 flex justify-between items-center text-lg font-black uppercase">
                 <span>Total</span>
                 <span className="text-accent">KES {(total / 100).toLocaleString()}</span>
              </div>
           </div>
        </div>

        {/* RIGHT: FORM */}
        <div className="bg-card border border-white/10 p-8 shadow-2xl">
          <div className="flex items-center gap-2 mb-8 text-green-500">
             <Lock size={16} />
             <span className="text-xs font-bold uppercase tracking-widest">Encrypted by M-Pesa</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Full Name</label>
              <input name="name" required placeholder="JOMO KENYATTA" className="w-full bg-secondary border border-border p-4 text-sm font-bold uppercase focus:border-white outline-none transition-colors" />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">M-Pesa Number</label>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input name="phone" type="tel" required placeholder="0712 345 678" className="w-full bg-secondary border border-border p-4 pl-12 text-sm font-mono focus:border-white outline-none transition-colors" />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Delivery Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input name="address" required placeholder="NAIROBI, WESTLANDS" className="w-full bg-secondary border border-border p-4 pl-12 text-sm font-bold uppercase focus:border-white outline-none transition-colors" />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-950/20 border border-red-900 text-red-500 text-xs font-mono uppercase">
                ERROR: {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white text-black py-4 font-black uppercase tracking-widest hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Pay Now"}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}