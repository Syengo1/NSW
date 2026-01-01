'use client';

import { useCartStore } from '@/lib/store/cart';
import { X, Plus, Minus, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, getCartTotal } = useCartStore();
  const [mounted, setMounted] = useState(false);

  // Hydration fix for Zustand
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const total = getCartTotal();

  return (
    <>
      {/* 1. BACKDROP (Darkens the site) */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={closeCart}
      />

      {/* 2. DRAWER (Slides in) */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-[400px] bg-background border-l border-white/10 z-[100] transform transition-transform duration-500 ease-out flex flex-col shadow-2xl shadow-black",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
            Cart <span className="text-sm font-mono text-muted-foreground">({items.length})</span>
          </h2>
          <button onClick={closeCart} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Items Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
              <ShoppingBag size={48} className="opacity-20" />
              <p className="text-sm uppercase tracking-widest font-bold">Your Bag is Empty</p>
              <button onClick={closeCart} className="text-xs underline hover:text-white transition-colors">
                Start Shopping
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.variantId} className="flex gap-4 animate-fade-in">
                {/* Image */}
                <div className="h-24 w-20 bg-neutral-900 shrink-0 border border-white/5">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-sm uppercase leading-tight">{item.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.color} / {item.size}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-mono font-bold">KES {(item.price / 100).toLocaleString()}</p>
                    
                    {/* Qty Controls */}
                    <div className="flex items-center gap-3 bg-secondary/50 px-2 py-1 rounded-sm border border-white/5">
                      <button onClick={() => updateQuantity(item.variantId, -1)} disabled={item.quantity <= 1} className="hover:text-white disabled:opacity-30">
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-mono w-3 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.variantId, 1)} disabled={item.quantity >= item.maxStock} className="hover:text-white disabled:opacity-30">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Remove */}
                <button onClick={() => removeItem(item.variantId)} className="text-muted-foreground hover:text-red-500 self-start p-1 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer (Total & Checkout) */}
        {items.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-background/95 backdrop-blur">
            <div className="flex justify-between items-center mb-4 text-sm font-bold uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="font-mono text-lg">KES {(total / 100).toLocaleString()}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mb-4 text-center">
              Shipping & Taxes calculated at checkout.
            </p>
            <Link 
              href="/checkout" 
              onClick={closeCart}
              className="w-full bg-white text-black py-4 font-black uppercase tracking-widest hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 group"
            >
              Secure Checkout 
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}