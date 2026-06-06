'use client';

import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/lib/store/cart';
import { X, Plus, Minus, Trash2, ArrowRight, ShoppingBag, Truck, AlertCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

// FIX 1: Strict Typing for Supabase Relational Payload
interface SupabaseVariantResponse {
  id: string;
  stock_quantity: number | null;
  price_adjustment: number | null;
  products: 
    | { base_price: number; sale_price: number | null }
    | { base_price: number; sale_price: number | null }[]
    | null;
}

const emptySubscribe = () => () => {};

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getCartTotal, syncCart } = useCartStore();
  
  const isMounted = useSyncExternalStore(
    emptySubscribe, 
    () => true,
    () => false
  );

  // FIX 2: Derive a stable string of IDs to safely use as a useEffect dependency
  // This prevents infinite loops while satisfying ESLint rules.
  const variantIdsStr = useMemo(() => {
    return items.map((i) => i.variantId).sort().join(',');
  }, [items]);

  // --- ROBUST UPGRADE: REAL-TIME CART SYNC ---
  useEffect(() => {
    let isSubscribed = true;

    const syncLiveData = async () => {
      if (!isOpen || !variantIdsStr || !syncCart) return;

      const variantIds = variantIdsStr.split(',');
      const supabase = createClient();

      const { data, error } = await supabase
        .from('variants')
        .select(`
          id,
          stock_quantity,
          price_adjustment,
          products ( base_price, sale_price )
        `)
        .in('id', variantIds);

      if (data && !error && isSubscribed) {
        // Cast the data using our strict Interface to eliminate 'any'
        const freshData = (data as SupabaseVariantResponse[]).map((variant) => {
          const product = Array.isArray(variant.products) ? variant.products[0] : variant.products;
          const basePrice = product?.sale_price || product?.base_price || 0;

          return {
            variantId: variant.id,
            price: basePrice + (variant.price_adjustment || 0),
            originalPrice: product?.sale_price ? (product?.base_price || 0) + (variant.price_adjustment || 0) : undefined,
            maxStock: variant.stock_quantity || 0,
          };
        });

        syncCart(freshData);
      }
    };

    syncLiveData();

    return () => {
      isSubscribed = false; 
    };
  }, [isOpen, syncCart, variantIdsStr]); // ESLint is now perfectly satisfied


  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => { 
      document.body.style.overflow = 'unset'; 
    };
  }, [isOpen]);

  // --- SMART CALCULATIONS ---
  const { totalCents, totalSavingsCents } = useMemo(() => {
    const total = getCartTotal();
    const savings = items.reduce((acc, item) => {
      if (item.originalPrice && item.originalPrice > item.price) {
        return acc + ((item.originalPrice - item.price) * item.quantity);
      }
      return acc;
    }, 0);
    return { totalCents: total, totalSavingsCents: savings };
  }, [items, getCartTotal]);

  const shippingThresholdCents = 10000 * 100; // KES 10,000 threshold
  const progress = Math.min((totalCents / shippingThresholdCents) * 100, 100);
  const remaining = shippingThresholdCents - totalCents;

  if (!isMounted) return null;

  const DrawerContent = (
    <div 
      className={cn(
        "fixed inset-0 z-[9999] flex justify-end isolate", 
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500 ease-in-out",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={closeCart}
      />

      <div 
        className={cn(
          "relative w-full max-w-[420px] h-full bg-background border-l border-border/50 shadow-[0_0_40px_rgba(0,0,0,0.3)] transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{ pointerEvents: 'auto' }}
      >
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-20">
          <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
            Your Bag 
            <span className="flex items-center justify-center bg-primary text-primary-foreground text-xs font-bold w-6 h-6 rounded-full font-mono shadow-sm">
              {items.length}
            </span>
          </h2>
          <button 
            onClick={closeCart} 
            className="p-2 hover:bg-secondary hover:text-foreground text-muted-foreground rounded-full transition-colors"
          >
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* SMART SHIPPING BAR */}
        <div className="px-6 py-4 bg-secondary/20 border-b border-border/50 relative overflow-hidden">
          {progress === 100 && <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />}
          
          <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-widest relative z-10">
            <Truck size={14} className={progress === 100 ? "text-emerald-500" : "text-muted-foreground"} />
            {progress === 100 ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in duration-500">
                 <Sparkles size={12} className="animate-pulse" /> Free Shipping Unlocked!
              </span>
            ) : (
              <span className="text-muted-foreground">
                Add <span className="text-foreground font-mono">KES {(remaining / 100).toLocaleString()}</span> for Free Shipping
              </span>
            )}
          </div>
          
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden relative z-10">
             <div 
               className={cn(
                 "h-full transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] relative overflow-hidden",
                 progress === 100 ? "bg-emerald-500" : "bg-primary"
               )}
               style={{ width: `${progress}%` }}
             >
                <div className="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
             </div>
          </div>
        </div>

        {/* ITEMS */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-80">
              <div className="w-24 h-24 bg-secondary/50 rounded-full flex items-center justify-center mb-2 animate-in zoom-in duration-500">
                 <ShoppingBag size={40} className="text-muted-foreground/50" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-xl font-black uppercase tracking-tighter">Your bag is empty</p>
                <p className="text-xs text-muted-foreground mt-2 max-w-[200px] mx-auto uppercase tracking-widest">
                   The streets are waiting.<br/>Find your fit.
                </p>
              </div>
              <Link 
                href="/shop" 
                onClick={closeCart}
                className="px-8 py-4 bg-foreground text-background font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-transform rounded-sm shadow-xl"
              >
                Shop New Drops
              </Link>
            </div>
          ) : (
            items.map((item, index) => {
              const isOnSale = item.originalPrice && item.originalPrice > item.price;
              const isMaxStock = item.quantity >= item.maxStock;

              return (
                <div 
                  key={item.variantId} 
                  className="flex gap-4 group animate-in slide-in-from-right-8 fade-in duration-500 fill-mode-both"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="relative h-28 w-24 bg-secondary overflow-hidden shrink-0 rounded-md border border-border/50">
                    {item.image ? (
                       <Image 
                         src={item.image} 
                         alt={item.name} 
                         fill
                         sizes="96px"
                         unoptimized
                         className="object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]" 
                       />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-[8px] uppercase font-bold text-muted-foreground">No Image</div>
                    )}
                    
                    {isOnSale && (
                      <div className="absolute top-0 left-0 bg-red-600 text-white text-[8px] font-black px-1.5 py-0.5 uppercase tracking-widest z-10">
                        Sale
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div className="space-y-1 pr-2">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-black text-sm uppercase leading-none tracking-tight line-clamp-2">
                          <Link href={`/product/${item.slug}`} onClick={closeCart} className="hover:text-primary transition-colors">
                            {item.name}
                          </Link>
                        </h3>
                        <button 
                          onClick={() => removeItem(item.variantId)} 
                          className="text-muted-foreground/50 hover:text-red-500 transition-colors p-1 -mt-1 -mr-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full border border-border" style={{ backgroundColor: item.color.toLowerCase() }}></span>
                        {item.color} <span className="opacity-50">|</span> {item.size}
                      </p>
                    </div>

                    <div className="flex items-end justify-between mt-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center border border-border rounded-sm bg-background w-fit overflow-hidden">
                          <button 
                            onClick={() => updateQuantity(item.variantId, -1)} 
                            className="w-7 h-7 flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30 disabled:hover:bg-transparent" 
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.variantId, 1)} 
                            className={cn(
                              "w-7 h-7 flex items-center justify-center transition-colors disabled:opacity-30", 
                              isMaxStock ? "text-muted-foreground bg-secondary/50 cursor-not-allowed" : "hover:bg-secondary"
                            )} 
                            disabled={isMaxStock}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        {isMaxStock && (
                          <span className="text-[8px] text-red-500 flex items-center gap-1 font-bold uppercase tracking-widest animate-pulse">
                            <AlertCircle size={10} /> Max Stock
                          </span>
                        )}
                      </div>
                      
                      <div className="text-right">
                        {isOnSale ? (
                          <div className="flex flex-col items-end leading-none">
                             <span className="text-[10px] text-muted-foreground line-through decoration-red-500/40 mb-1 font-mono">
                               KES {(item.originalPrice! / 100).toLocaleString()}
                             </span>
                             <span className="text-sm font-black text-red-600 font-mono tracking-tighter">
                               KES {(item.price / 100).toLocaleString()}
                             </span>
                          </div>
                        ) : (
                          <span className="text-sm font-black font-mono tracking-tighter text-foreground">
                            KES {(item.price / 100).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FOOTER */}
        {items.length > 0 && (
          <div className="p-6 border-t border-border/50 bg-background/80 backdrop-blur-xl space-y-4 shrink-0">
            {totalSavingsCents > 0 && (
              <div className="flex items-center justify-center gap-2 bg-red-500/10 py-2 rounded-sm text-[10px] font-black text-red-600 uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2">
                <span className="flex items-center justify-center w-3 h-3 bg-red-600 text-white rounded-full text-[8px]">$</span>
                You saved KES {(totalSavingsCents / 100).toLocaleString()}!
              </div>
            )}

            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold">Subtotal</span>
                <span className="font-mono text-xl font-black tracking-tighter">KES {(totalCents / 100).toLocaleString()}</span>
              </div>
              <p className="text-[9px] text-muted-foreground/60 uppercase tracking-widest">
                Shipping & taxes calculated at checkout.
              </p>
            </div>

            <Link 
              href="/checkout" 
              onClick={closeCart}
              className="group w-full bg-primary text-primary-foreground py-5 font-black uppercase tracking-widest text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-2 relative overflow-hidden rounded-sm shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.05)] mt-2"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out skew-x-12" />
              <span className="relative z-10 flex items-center gap-2">
                Checkout <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
  
  return createPortal(DrawerContent, document.body);
}