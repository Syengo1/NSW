'use client';

import { useEffect, useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useCartStore } from '@/lib/store/cart';
import { X, Plus, Minus, Trash2, ArrowRight, ShoppingBag, Truck, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getCartTotal } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Lock body scroll ONLY when open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // --- SMART CALCULATIONS ---
  // Memoize these to avoid recalculating on every render
  const { totalCents, totalSavingsCents } = useMemo(() => {
    const total = getCartTotal();
    const savings = items.reduce((acc, item) => {
      // If original price exists and is higher than selling price, calculate difference
      if (item.originalPrice && item.originalPrice > item.price) {
        return acc + ((item.originalPrice - item.price) * item.quantity);
      }
      return acc;
    }, 0);
    return { totalCents: total, totalSavingsCents: savings };
  }, [items, getCartTotal]);

  const shippingThresholdCents = 10000 * 100; // KES 10,000
  const progress = Math.min((totalCents / shippingThresholdCents) * 100, 100);
  const remaining = shippingThresholdCents - totalCents;

  if (!mounted) return null;

  const DrawerContent = (
    <div 
      className={cn(
        "fixed inset-0 z-[9999] flex justify-end isolate", 
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      
      {/* 1. BACKDROP */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out",
          isOpen ? "opacity-100" : "opacity-0"
        )}
        onClick={closeCart}
      />

      {/* 2. DRAWER PANEL */}
      <div 
        className={cn(
          "relative w-full max-w-[420px] h-full bg-background border-l border-border shadow-2xl transform transition-transform duration-300 ease-out flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{ pointerEvents: 'auto' }}
      >
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-3">
            Your Bag 
            <span className="flex items-center justify-center bg-foreground text-background text-xs font-bold w-6 h-6 rounded-full font-mono">
              {items.length}
            </span>
          </h2>
          <button 
            onClick={closeCart} 
            className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* FREE SHIPPING BAR */}
        <div className="px-6 py-4 bg-secondary/30 border-b border-border">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider">
            <Truck size={14} className={progress === 100 ? "text-emerald-500" : "text-foreground"} />
            {progress === 100 ? (
              <span className="text-emerald-500 animate-pulse">Free Shipping Unlocked!</span>
            ) : (
              <span>
                Add <span className="text-foreground font-mono">KES {(remaining / 100).toLocaleString()}</span> for Free Shipping
              </span>
            )}
          </div>
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-700 ease-out",
                progress === 100 ? "bg-emerald-500" : "bg-foreground"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* ITEMS LIST */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-60">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-2 animate-in zoom-in duration-300">
                 <ShoppingBag size={40} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-black uppercase tracking-tighter">Your bag is empty</p>
                <p className="text-sm text-muted-foreground mt-2">Looks like you haven't found your fit yet.</p>
              </div>
              <button 
                onClick={closeCart}
                className="text-xs font-bold border-b border-foreground pb-0.5 hover:opacity-50 transition-opacity uppercase tracking-widest"
              >
                Start Browsing
              </button>
            </div>
          ) : (
            items.map((item) => {
              const isOnSale = item.originalPrice && item.originalPrice > item.price;
              const isMaxStock = item.quantity >= item.maxStock;

              return (
                <div key={item.variantId} className="flex gap-4 group animate-in slide-in-from-bottom-2 duration-500">
                  
                  {/* Product Image */}
                  <div className="relative h-32 w-24 bg-secondary overflow-hidden border border-border shrink-0 rounded-sm">
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    {isOnSale && (
                      <div className="absolute top-0 left-0 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 uppercase tracking-wide">
                        Sale
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    
                    {/* Top Section */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="font-bold text-sm uppercase leading-tight line-clamp-2">
                          <Link href={`/product/${item.slug}`} onClick={closeCart} className="hover:underline decoration-1 underline-offset-4">
                            {item.name}
                          </Link>
                        </h3>
                        <button 
                          onClick={() => removeItem(item.variantId)} 
                          className="text-muted-foreground hover:text-red-500 transition-colors p-1 -mr-2"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      <p className="text-xs text-muted-foreground font-mono">
                        {item.color} / {item.size}
                      </p>
                    </div>

                    {/* Bottom Section: Quantity & Price */}
                    <div className="flex items-end justify-between">
                      
                      {/* Quantity Controls */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center border border-border rounded-sm bg-background w-fit">
                          <button 
                            onClick={() => updateQuantity(item.variantId, -1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30"
                            disabled={item.quantity <= 1}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-8 text-center text-xs font-mono font-bold">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.variantId, 1)}
                            className={cn(
                              "w-7 h-7 flex items-center justify-center hover:bg-secondary transition-colors disabled:opacity-30",
                              isMaxStock && "text-muted-foreground bg-secondary/50"
                            )}
                            disabled={isMaxStock}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                        {isMaxStock && (
                          <span className="text-[9px] text-red-500 flex items-center gap-1 font-medium animate-pulse">
                            <AlertCircle size={8} /> Max Stock
                          </span>
                        )}
                      </div>

                      {/* Price Display */}
                      <div className="text-right">
                        {isOnSale ? (
                          <div className="flex flex-col items-end">
                             <span className="text-[10px] text-muted-foreground line-through decoration-red-500/40">
                               KES {(item.originalPrice! / 100).toLocaleString()}
                             </span>
                             <span className="text-sm font-bold text-red-600">
                               KES {(item.price / 100).toLocaleString()}
                             </span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold font-mono">
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
          <div className="p-6 border-t border-border bg-background/95 backdrop-blur shadow-[0_-5px_20px_rgba(0,0,0,0.05)] space-y-4">
            
            {/* Savings Callout */}
            {totalSavingsCents > 0 && (
              <div className="flex items-center justify-center gap-2 bg-red-100 dark:bg-red-900/20 py-1.5 rounded text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                <span className="flex items-center justify-center w-4 h-4 bg-red-600 text-white rounded-full text-[9px]">$</span>
                You are saving KES {(totalSavingsCents / 100).toLocaleString()}!
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground uppercase tracking-widest">Subtotal</span>
                <span className="font-mono text-xl font-bold">KES {(totalCents / 100).toLocaleString()}</span>
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Shipping, taxes, and discounts calculated at checkout.
              </p>
            </div>

            <Link 
              href="/checkout" 
              onClick={closeCart}
              className="group w-full bg-foreground text-background py-4 font-black uppercase tracking-widest hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 relative overflow-hidden rounded-sm shadow-xl"
            >
              <span className="relative z-10 flex items-center gap-2">
                Secure Checkout <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(DrawerContent, document.body);
}