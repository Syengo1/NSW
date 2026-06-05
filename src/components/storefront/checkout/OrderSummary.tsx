// src/components/storefront/checkout/OrderSummary.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronUp, ChevronDown, Info, AlertCircle, Loader2, Lock } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

// --- STRICT TYPES ---
interface CheckoutItem {
  variantId: string;
  name: string;
  image: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
}

interface OrderSummaryProps {
  items: CheckoutItem[]; // FIX: Replaced explicit 'any[]' with strict structure
  cartTotal: number;
  deliveryFee: number;
  grandTotal: number;
  deliveryMethod: 'delivery' | 'pickup';
  phone: string;
  loading: boolean; // FIX: Cleanly dropped unused 'phoneError' prop
  error: string | null;
  mobileSummaryOpen: boolean;
  setMobileSummaryOpen: (open: boolean) => void;
  acceptedTerms: boolean;
  setAcceptedTerms: (accepted: boolean) => void;
  isSubmitDisabled: boolean;
}

export function OrderSummary({
  items,
  cartTotal,
  deliveryFee,
  grandTotal,
  deliveryMethod,
  phone,
  loading,
  error,
  mobileSummaryOpen,
  setMobileSummaryOpen,
  acceptedTerms,
  setAcceptedTerms,
  isSubmitDisabled,
}: OrderSummaryProps) {
  return (
    <div className="sticky top-24 space-y-6">
      {/* MOBILE COLLAPSIBLE TOGGLE */}
      <button 
         type="button"
         onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
         className="lg:hidden w-full flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-lg border border-border shadow-sm"
      >
         <span className="font-bold uppercase text-sm flex items-center gap-2">
           <div className="bg-black text-white dark:bg-white dark:text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-mono">
             {items.length}
           </div> 
           Order Summary
         </span>
         {mobileSummaryOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
      </button>

      {/* SUMMARY DETAILS BODY */}
      <div className={cn("bg-white dark:bg-zinc-900 border border-border p-6 lg:p-8 shadow-xl rounded-xl transition-all", !mobileSummaryOpen && "hidden lg:block")}>
        <h2 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
           Your Bag <span className="text-muted-foreground text-sm font-normal">({items.length} items)</span>
        </h2>
        
        {/* BASKET ITEM ROWS */}
        <div className="space-y-4 max-h-[35vh] overflow-y-auto scrollbar-thin mb-6 pr-2">
           {items.map(item => (
             <div key={item.variantId} className="flex gap-4 text-sm group">
                <div className="relative w-14 h-16 bg-secondary shrink-0 rounded overflow-hidden border border-border">
                   <Image 
                     src={item.image} 
                     alt={item.name || "Product Image"}
                     fill
                     sizes="56px"
                     priority={false}
                     className="object-cover group-hover:scale-110 transition-transform duration-500" 
                   />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold block uppercase text-xs truncate">{item.name}</span>
                  <span className="text-muted-foreground text-[10px] uppercase font-mono">{item.color} / {item.size}</span>
                  <div className="text-[10px] mt-1 text-muted-foreground">Qty: {item.quantity}</div>
                </div>
                <div className="font-mono text-xs font-bold">
                  {formatCurrency((item.price * item.quantity) / 100)}
                </div>
             </div>
           ))}
        </div>

        {/* FINANCIAL CALCULATIONS BREAKDOWN */}
        <div className="border-t border-dashed border-border pt-4 space-y-3 text-sm">
           <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-mono text-foreground">{formatCurrency(cartTotal / 100)}</span>
           </div>
           <div className="flex justify-between text-muted-foreground items-center">
              <span className="flex items-center gap-2">
                Delivery {deliveryMethod === 'pickup' && <span className="text-[9px] bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-1 rounded font-bold uppercase tracking-wide">Pickup</span>}
              </span>
              {deliveryMethod === 'pickup' ? (
                 <span className="text-xs font-bold uppercase text-emerald-600">Free</span>
              ) : (
                 <span className={cn("font-mono", deliveryFee === 0 ? "text-emerald-600 font-bold" : "text-foreground")}>
                    {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee / 100)}
                 </span>
              )}
           </div>
           
           <div className="flex justify-between text-xl font-black uppercase pt-4 border-t border-border mt-2">
              <span>Total</span>
              <span className="text-emerald-600">{formatCurrency(grandTotal / 100)}</span>
           </div>
        </div>

        {/* SECURITY & GATEWAY INTERACTION PANELS */}
        <div className="mt-8 space-y-4">
           {/* TERMS & CONDITIONS CHECKBOX LAYER */}
           <div className="bg-secondary/20 p-4 border border-border rounded-lg space-y-3">
             <label className="flex items-start gap-3 cursor-pointer group">
               <div className={cn(
                 "w-5 h-5 border-2 rounded flex items-center justify-center shrink-0 mt-0.5 transition-all",
                 acceptedTerms 
                   ? "bg-black border-black dark:bg-white dark:border-white text-white dark:text-black" 
                   : "border-muted-foreground/60 group-hover:border-foreground"
               )}>
                 {acceptedTerms && (
                   <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                     <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
                   </svg>
                 )}
               </div>
               <input 
                 type="checkbox" 
                 className="hidden" 
                 checked={acceptedTerms} 
                 onChange={(e) => setAcceptedTerms(e.target.checked)} 
               />
               <span className="text-[11px] font-medium leading-tight text-muted-foreground select-none">
                 I agree to the{' '}
                 <Link href="/terms" target="_blank" className="text-foreground font-bold underline underline-offset-2 hover:text-primary transition-colors">
                   Terms & Conditions
                 </Link>
                 , Store Return Rules, and authorize an M-Pesa push to my handset.
               </span>
             </label>
           </div>

           {/* TRANSIT NOTE */}
           <div className="bg-secondary/50 p-3 rounded border border-border flex gap-3 items-start">
              <Info size={16} className="text-primary mt-0.5 shrink-0" />
              <p className="text-[10px] text-muted-foreground leading-tight">
                 By clicking pay, you&apos;ll receive an M-Pesa prompt on <span className="font-mono font-bold text-foreground">{phone || 'your phone'}</span>.
              </p>
           </div>

           {/* SERVER ROUTE RESPONSE ERRORS */}
           {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-bold uppercase rounded flex items-center gap-2 animate-pulse">
                <AlertCircle size={16} /> {error}
              </div>
           )}

           {/* SUBMISSION ACTIVATION GATEWAY */}
           <button 
             type="submit"
             form="checkout-form" 
             disabled={isSubmitDisabled}
             className="w-full bg-black dark:bg-white text-white dark:text-black py-4 font-black uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 rounded-sm shadow-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 text-xs"
           >
             {loading ? <Loader2 className="animate-spin" size={16} /> : `Pay ${formatCurrency(grandTotal / 100)}`}
           </button>

           <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest opacity-70">
              <Lock size={10} />
              <span>Secured by Safaricom M-Pesa</span>
           </div>
        </div>
      </div>
    </div>
  );
}