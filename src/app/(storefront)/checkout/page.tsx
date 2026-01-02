'use client';

import { useCartStore } from '@/lib/store/cart';
import { useState, useEffect } from 'react';
import { Loader2, Lock, Smartphone, MapPin, ArrowLeft, User, Truck, Store, Crosshair, Info } from 'lucide-react';
import { processCheckout } from './actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn, formatCurrency } from '@/lib/utils';

// Shop Coords (Westlands)
const SHOP_LAT = -1.2636;
const SHOP_LNG = 36.8028;

export default function CheckoutPage() {
  const { items, getCartTotal, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // --- SMART STATE ---
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>('delivery');
  const [separateRecipient, setSeparateRecipient] = useState(false);
  
  // Location State
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number} | null>(null);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [deliveryFee, setDeliveryFee] = useState(0);

  const cartTotal = getCartTotal();
  const grandTotal = cartTotal + deliveryFee;

  // --- LOGIC: Distance & Fee Calculator ---
  useEffect(() => {
    if (deliveryMethod === 'pickup') {
      setDeliveryFee(0);
      return;
    }

    if (coords) {
      // Client-side Haversine for instant UI feedback
      const R = 6371; 
      const dLat = (coords.lat - SHOP_LAT) * (Math.PI/180);
      const dLon = (coords.lng - SHOP_LNG) * (Math.PI/180);
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(SHOP_LAT * (Math.PI/180)) * Math.cos(coords.lat * (Math.PI/180)) * Math.sin(dLon/2) * Math.sin(dLon/2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      const d = R * c; 
      
      setDistanceKm(d);

      // Fee tiers (Must match backend)
      if (d <= 8) setDeliveryFee(0);
      else if (d <= 13) setDeliveryFee(5000); // 50 KES
      else if (d <= 25) setDeliveryFee(10000); // 100 KES
      else setDeliveryFee(20000 + (Math.ceil(d - 25) * 1000));
    }
  }, [coords, deliveryMethod]);

  const handleLocateMe = () => {
    setLocating(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocating(false);
      },
      () => {
        alert("Unable to retrieve your location. Please check settings.");
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    // Append smart data
    formData.append('deliveryMethod', deliveryMethod);
    if (coords) formData.append('coordinates', `${coords.lat},${coords.lng}`);

    try {
      const result = await processCheckout(formData, items);

      if (result.success) {
        clearCart();
        router.push(`/track-order/${result.orderId}`);
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
        <Link href="/shop" className="mt-4 text-sm underline hover:text-muted-foreground transition-colors">Return to Drop</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-black text-foreground py-8 md:py-12 px-4 animate-slide-up">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        
        {/* --- LEFT: CHECKOUT FORM --- */}
        <div className="lg:col-span-7 space-y-8">
           <Link href="/shop" className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
             <ArrowLeft size={14} /> Back to Shop
           </Link>
           
           <h1 className="text-4xl font-black uppercase tracking-tighter">Checkout</h1>

           <form id="checkout-form" onSubmit={handleSubmit} className="space-y-8">
             
             {/* 1. DELIVERY METHOD */}
             <div className="bg-white dark:bg-zinc-900 p-6 shadow-sm border border-border rounded-lg space-y-4">
               <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                 <Truck size={14} /> Method
               </h3>
               
               <div className="grid grid-cols-2 gap-4">
                 <button
                   type="button"
                   onClick={() => setDeliveryMethod('delivery')}
                   className={cn(
                     "flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-md transition-all",
                     deliveryMethod === 'delivery' 
                       ? "border-black dark:border-white bg-neutral-100 dark:bg-zinc-800" 
                       : "border-transparent bg-neutral-50 dark:bg-zinc-900 hover:bg-neutral-100"
                   )}
                 >
                   <Truck size={24} />
                   <span className="text-xs font-bold uppercase">Delivery</span>
                 </button>
                 
                 <button
                   type="button"
                   onClick={() => setDeliveryMethod('pickup')}
                   className={cn(
                     "flex flex-col items-center justify-center gap-2 p-4 border-2 rounded-md transition-all",
                     deliveryMethod === 'pickup' 
                       ? "border-black dark:border-white bg-neutral-100 dark:bg-zinc-800" 
                       : "border-transparent bg-neutral-50 dark:bg-zinc-900 hover:bg-neutral-100"
                   )}
                 >
                   <Store size={24} />
                   <span className="text-xs font-bold uppercase">Store Pickup</span>
                 </button>
               </div>

               {/* DYNAMIC CONTENT BASED ON METHOD */}
               {deliveryMethod === 'pickup' ? (
                 <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 rounded text-sm animate-in fade-in">
                   <p className="font-bold uppercase mb-1">Pickup Location</p>
                   <p>The Alchemist, Westlands</p>
                   <p className="text-xs opacity-80">Open Mon-Sat, 10am - 8pm</p>
                 </div>
               ) : (
                 <div className="space-y-4 animate-in fade-in">
                   <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Precise Location</label>
                      <div className="flex gap-2">
                        <input 
                           name="addressText" 
                           required={deliveryMethod === 'delivery'}
                           placeholder={coords ? `GPS: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}` : "Search area or estate..."}
                           className="flex-1 bg-secondary border border-border p-3 text-sm focus:border-primary outline-none transition-colors rounded-sm" 
                        />
                        <button 
                          type="button"
                          onClick={handleLocateMe}
                          disabled={locating}
                          className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 text-xs font-bold uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center gap-2 rounded-sm"
                        >
                          {locating ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />}
                          Locate
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-2">
                         {coords ? `Distance: ${distanceKm.toFixed(1)}km from Westlands` : "Tap 'Locate' for best delivery rates."}
                      </p>
                   </div>
                   
                   <div>
                      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Apartment / House No (Optional)</label>
                      <input name="houseDetails" placeholder="e.g. Block B, Door 4" className="w-full bg-secondary border border-border p-3 text-sm focus:border-primary outline-none rounded-sm" />
                   </div>
                 </div>
               )}
             </div>

             {/* 2. CONTACT DETAILS */}
             <div className="bg-white dark:bg-zinc-900 p-6 shadow-sm border border-border rounded-lg space-y-6">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <User size={14} /> Contact
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Payer Name</label>
                    <input name="payerName" required placeholder="JOMO KENYATTA" className="w-full bg-secondary border border-border p-3 text-sm font-bold uppercase focus:border-primary outline-none rounded-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">M-Pesa Number</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                      <input name="payerPhone" type="tel" required placeholder="0712 345 678" className="w-full bg-secondary border border-border p-3 pl-10 text-sm font-mono focus:border-primary outline-none rounded-sm" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="diffRecipient" 
                    className="w-4 h-4 accent-black"
                    checked={separateRecipient}
                    onChange={(e) => setSeparateRecipient(e.target.checked)}
                  />
                  <label htmlFor="diffRecipient" className="text-xs font-bold uppercase cursor-pointer select-none">Someone else is receiving this order</label>
                </div>

                {separateRecipient && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                     <div>
                       <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Recipient Name</label>
                       <input name="recipientName" required placeholder="Recipient Name" className="w-full bg-secondary border border-border p-3 text-sm font-bold uppercase focus:border-primary outline-none rounded-sm" />
                     </div>
                     <div>
                       <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Recipient Phone</label>
                       <input name="recipientPhone" type="tel" required placeholder="07XX XXX XXX" className="w-full bg-secondary border border-border p-3 text-sm font-mono focus:border-primary outline-none rounded-sm" />
                     </div>
                  </div>
                )}
             </div>

           </form>
        </div>

        {/* --- RIGHT: ORDER SUMMARY --- */}
        <div className="lg:col-span-5 space-y-6">
           <div className="bg-white dark:bg-zinc-900 border border-border p-6 lg:p-8 shadow-2xl rounded-lg sticky top-24">
              <h2 className="text-xl font-black uppercase tracking-tighter mb-6">Order Summary</h2>
              
              <div className="space-y-4 max-h-[30vh] overflow-y-auto scrollbar-hide mb-6">
                 {items.map(item => (
                   <div key={item.variantId} className="flex gap-4 text-sm">
                      <div className="relative w-12 h-16 bg-secondary shrink-0">
                         <img src={item.image} className="w-full h-full object-cover" />
                         <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                           {item.quantity}
                         </span>
                      </div>
                      <div className="flex-1">
                        <span className="font-bold block uppercase text-xs line-clamp-1">{item.name}</span>
                        <span className="text-muted-foreground text-[10px] uppercase">{item.color} / {item.size}</span>
                      </div>
                      <div className="font-mono text-xs font-bold">
                        {formatCurrency((item.price * item.quantity)/100)}
                      </div>
                   </div>
                 ))}
              </div>

              <div className="border-t border-dashed border-border pt-4 space-y-2 text-sm">
                 <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="font-mono text-foreground">{formatCurrency(cartTotal/100)}</span>
                 </div>
                 <div className="flex justify-between text-muted-foreground items-center">
                    <span>Delivery</span>
                    {deliveryMethod === 'pickup' ? (
                       <span className="text-xs font-bold uppercase text-emerald-600">Free Pickup</span>
                    ) : (
                       <span className="font-mono text-foreground">{deliveryFee === 0 ? 'Free' : formatCurrency(deliveryFee/100)}</span>
                    )}
                 </div>
                 <div className="flex justify-between text-lg font-black uppercase pt-2 border-t border-border mt-2">
                    <span>Total</span>
                    <span className="text-emerald-600">{formatCurrency(grandTotal/100)}</span>
                 </div>
              </div>

              {/* PAYMENT SECTION */}
              <div className="mt-8 space-y-4">
                 <div className="bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded border border-emerald-100 dark:border-emerald-900/50 flex gap-3 items-start">
                    <Info size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-tight">
                       <strong>Heads up:</strong> You will receive an M-Pesa STK push on the number 
                       <span className="font-mono bg-white dark:bg-black px-1 mx-1 rounded border border-emerald-200">
                          {/* We try to show live value, but this is a controlled input in a form, so generic text is safer for basic implementation */}
                          provided above
                       </span>
                       immediately after clicking pay.
                    </p>
                 </div>

                 {error && (
                    <div className="p-4 bg-red-950/20 border border-red-900 text-red-500 text-xs font-mono uppercase rounded">
                      ERROR: {error}
                    </div>
                 )}

                 <button 
                   type="submit"
                   form="checkout-form" // Links to the form
                   disabled={loading || (deliveryMethod === 'delivery' && !coords)}
                   className="w-full bg-black dark:bg-white text-white dark:text-black py-4 font-black uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2 rounded-sm shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {loading ? <Loader2 className="animate-spin" /> : "Confirm & Pay"}
                 </button>

                 <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
                    <Lock size={12} />
                    <span>Secure M-Pesa Payment</span>
                 </div>
                 <p className="text-center text-[10px] text-muted-foreground">
                    A digital receipt will be generated instantly.
                 </p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}