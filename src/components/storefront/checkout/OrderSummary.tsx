// src/components/storefront/checkout/OrderSummary.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ChevronUp, ChevronDown, Info, AlertCircle, Loader2, Lock, ImageIcon } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';

// --- STRICT TYPES ---
interface CheckoutItem {
  variantId: string;
  name: string;
  image: string | null; // Defensively allow nulls
  color: string;
  size: string;
  quantity: number;
  price: number;
}

interface OrderSummaryProps {
  items: CheckoutItem[];
  cartTotal: number;
  deliveryFee: number;
  grandTotal: number;
  deliveryMethod: 'delivery' | 'pickup';
  phone: string;
  loading: boolean;
  error: string | null;
  mobileSummaryOpen: boolean;
  setMobileSummaryOpen: (open: boolean) => void;
  acceptedTerms: boolean;
  setAcceptedTerms: (accepted: boolean) => void;
  isSubmitDisabled: boolean;
}

export function OrderSummary({
  items = [], // Defensive default
  cartTotal = 0,
  deliveryFee = 0,
  grandTotal = 0,
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
         aria-expanded={mobileSummaryOpen}
         aria-controls="order-summary-content"
         className="lg:hidden w-full flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-lg border border-border shadow-sm hover:bg-neutral-50 dark:hover:bg-zinc-800/50 transition-colors"
      >
         <span className="font-bold uppercase text-sm flex items-center gap-2">
           <div className="bg-black text-white dark:bg-white dark:text-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-mono shadow-sm">
             {items.length}
           </div> 
           Order Summary
         </span>
         {mobileSummaryOpen ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
      </button>

      {/* SUMMARY DETAILS BODY */}
      <div 
        id="order-summary-content"
        className={cn(
          "bg-white dark:bg-zinc-900 border border-border p-6 lg:p-8 shadow-xl rounded-xl transition-all duration-300 ease-in-out", 
          !mobileSummaryOpen ? "hidden lg:block opacity-0 lg:opacity-100" : "block opacity-100"
        )}
      >
        <h2 className="text-xl font-black uppercase tracking-tighter mb-6 flex items-center gap-2">
           Your Bag <span className="text-muted-foreground text-sm font-normal">({items.length} items)</span>
        </h2>
        
        {/* BASKET ITEM ROWS */}
        <div className="space-y-4 max-h-[35vh] overflow-y-auto scrollbar-thin mb-6 pr-2">
           {items.map(item => (
             <div key={item.variantId} className="flex gap-4 text-sm group">
                <div className="relative w-14 h-16 bg-secondary/50 shrink-0 rounded overflow-hidden border border-border flex items-center justify-center">
                   {/* Defensive Image Rendering */}
                   {item.image ? (
                     <Image 
                       src={item.image} 
                       alt={item.name || "Product Image"}
                       fill
                       sizes="56px"
                       priority={false}
                       className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                     />
                   ) : (
                     <ImageIcon size={16} className="text-muted-foreground/30" />
                   )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <span className="font-bold block uppercase text-xs truncate" title={item.name}>
                    {item.name || 'Unknown Item'}
                  </span>
                  <span className="text-muted-foreground text-[10px] uppercase font-mono">
                    {item.color} / {item.size}
                  </span>
                  <div className="text-[10px] mt-1 font-medium text-muted-foreground">
                    Qty: <span className="text-foreground">{item.quantity}</span>
                  </div>
                </div>
                
                <div className="font-mono text-xs font-black tracking-tight text-right">
                  {formatCurrency(((item.price || 0) * (item.quantity || 1)) / 100)}
                </div>
             </div>
           ))}
        </div>

        {/* FINANCIAL CALCULATIONS BREAKDOWN */}
        <div className="border-t border-dashed border-border pt-4 space-y-3 text-sm">
           <div className="flex justify-between text-muted-foreground">
              <span className="text-xs uppercase tracking-widest font-bold">Subtotal</span>
              <span className="font-mono text-foreground font-medium">{formatCurrency(cartTotal / 100)}</span>
           </div>
           <div className="flex justify-between text-muted-foreground items-center">
              <span className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
                Delivery 
                {deliveryMethod === 'pickup' && (
                  <span className="text-[9px] bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-1.5 py-0.5 rounded font-black tracking-widest">
                    Pickup
                  </span>
                )}
              </span>
              {deliveryMethod === 'pickup' ? (
                 <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Free</span>
              ) : (
                 <span className={cn(
                   "font-mono font-medium", 
                   deliveryFee === 0 ? "text-emerald-600 dark:text-emerald-400 font-black tracking-widest text-xs" : "text-foreground"
                 )}>
                    {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee / 100)}
                 </span>
              )}
           </div>
           
           <div className="flex justify-between items-end text-xl font-black uppercase pt-4 border-t border-border mt-2">
              <span className="tracking-tighter">Total</span>
              <span className="text-emerald-600 dark:text-emerald-400 tracking-tighter">
                {formatCurrency(grandTotal / 100)}
              </span>
           </div>
        </div>

        {/* SECURITY & GATEWAY INTERACTION PANELS */}
        <div className="mt-8 space-y-4">
           
           {/* TERMS & CONDITIONS CHECKBOX LAYER */}
           <div className="bg-secondary/20 p-4 border border-border rounded-lg transition-colors hover:bg-secondary/40">
             {/* Accessibility Upgrade: htmlFor matches input id */}
             <label htmlFor="terms-agreement" className="flex items-start gap-3 cursor-pointer group">
               <div className={cn(
                 "w-5 h-5 border-2 rounded flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200",
                 acceptedTerms 
                   ? "bg-black border-black dark:bg-white dark:border-white text-white dark:text-black shadow-sm" 
                   : "border-muted-foreground/40 group-hover:border-primary bg-background"
               )}>
                 {acceptedTerms && (
                   <svg className="w-3 h-3 fill-current animate-in zoom-in duration-200" viewBox="0 0 20 20">
                     <path d="M0 11l2-2 5 5L18 3l2 2L7 18z"/>
                   </svg>
                 )}
               </div>
               
               {/* Accessibility Upgrade: 'sr-only' allows screen readers to interact properly natively */}
               <input 
                 id="terms-agreement"
                 type="checkbox" 
                 className="sr-only" 
                 checked={acceptedTerms} 
                 onChange={(e) => setAcceptedTerms(e.target.checked)} 
                 aria-label="Agree to terms and conditions"
               />
               
               <span className="text-[11px] font-medium leading-relaxed text-muted-foreground select-none">
                 I agree to the{' '}
                 <Link href="/terms" target="_blank" className="text-foreground font-bold underline underline-offset-2 hover:text-primary transition-colors">
                   Terms & Conditions
                 </Link>
                 , Store Return Rules, and authorize an M-Pesa push to my handset.
               </span>
             </label>
           </div>

           {/* TRANSIT NOTE */}
           <div className="bg-blue-50/50 dark:bg-blue-950/20 p-3 rounded border border-blue-100 dark:border-blue-900/50 flex gap-3 items-start">
              <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-[10px] text-muted-foreground leading-tight">
                 By clicking pay, you&apos;ll receive an M-Pesa prompt on <span className="font-mono font-bold text-foreground">{phone || 'your phone'}</span>.
              </p>
           </div>

           {/* SERVER ROUTE RESPONSE ERRORS */}
           <div className={cn(
             "overflow-hidden transition-all duration-300 ease-in-out",
             error ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
           )}>
             {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-bold uppercase tracking-wide rounded flex items-start gap-2">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" /> 
                  <span className="leading-tight">{error}</span>
                </div>
             )}
           </div>

           {/* SUBMISSION ACTIVATION GATEWAY */}
           <button 
             type="submit"
             form="checkout-form" 
             disabled={isSubmitDisabled}
             aria-disabled={isSubmitDisabled}
             className="w-full bg-black dark:bg-white text-white dark:text-black py-4 font-black uppercase tracking-widest hover:opacity-90 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 rounded-sm shadow-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 text-xs relative overflow-hidden group"
           >
             {/* Subtle shine effect on hover */}
             {!isSubmitDisabled && (
               <div className="absolute inset-0 -translate-x-full bg-white/20 dark:bg-black/10 group-hover:animate-[shimmer_1.5s_infinite] skew-x-12" />
             )}
             
             <span className="relative z-10 flex items-center gap-2">
               {loading ? <Loader2 className="animate-spin" size={16} /> : `Pay ${formatCurrency(grandTotal / 100)}`}
             </span>
           </button>

           <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest opacity-70 pt-2">
              <Lock size={10} />
              <span>Secured by Safaricom M-Pesa</span>
           </div>
        </div>
      </div>
    </div>
  );
}