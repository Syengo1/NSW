'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom'; // IMPORT PORTAL
import { X, ShoppingBag, Check } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/lib/store/cart';
import { toast } from 'sonner';

interface Variant {
  id: string;
  size: string;
  color: string;
  stock_quantity: number;
  price_adjustment: number;
}

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    title: string;
    price: number;
    salePrice?: number | null;
    image: string;
    slug: string;
  };
  variants: Variant[];
}

export default function QuickAddModal({ isOpen, onClose, product, variants }: QuickAddModalProps) {
  const { addItem } = useCartStore();
  
  // State
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [mounted, setMounted] = useState(false); // New: Track hydration

  // 1. HYDRATION CHECK
  // We can only access 'document.body' after component mounts on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. INTELLIGENT DEFAULTS
  useEffect(() => {
    if (isOpen && variants.length > 0) {
      const uniqueColors = Array.from(new Set(variants.map(v => v.color)));
      if (uniqueColors.length > 0) setSelectedColor(uniqueColors[0]);
      setSelectedVariantId(null);
    }
  }, [isOpen, variants]);

  // 3. KEYBOARD ESCAPE LISTENER
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // --- LOGIC: COMPUTED LISTS ---
  const uniqueColors = useMemo(() => Array.from(new Set(variants.map(v => v.color))), [variants]);
  
  const availableSizes = useMemo(() => {
    if (!selectedColor) return [];
    return variants.filter(v => v.color === selectedColor);
  }, [selectedColor, variants]);

  const selectedVariant = variants.find(v => v.id === selectedVariantId);
  
  const basePriceToUse = product.salePrice ?? product.price;
  const currentPrice = basePriceToUse + (selectedVariant?.price_adjustment || 0);
  const originalPrice = product.price + (selectedVariant?.price_adjustment || 0);
  const isOnSale = product.salePrice != null && product.salePrice < product.price;
  const isOutOfStock = selectedVariant && selectedVariant.stock_quantity === 0;

  // Don't render until client-side (mounted)
  if (!isOpen || !mounted) return null;

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    setIsAdding(true);
    
    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      name: product.title,
      price: currentPrice,
      image: product.image,
      quantity: 1,
      size: selectedVariant.size,
      color: selectedVariant.color,
      slug: product.slug,
      maxStock: selectedVariant.stock_quantity
    });

    toast.success(`Added ${product.title} (${selectedVariant.size})`);
    
    setTimeout(() => {
      setIsAdding(false);
      onClose();
    }, 500);
  };

  // 4. USE PORTAL TO BREAK OUT OF PARENT TRANSFORMS
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 rounded-xl shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border/50 bg-secondary/5">
          <div className="flex gap-4">
            <div className="h-20 w-16 rounded-md overflow-hidden bg-secondary/20 flex-shrink-0 border border-border/50 shadow-sm">
              <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
            </div>
            <div>
              <h3 className="font-black uppercase text-sm md:text-base leading-tight pr-4 line-clamp-2">{product.title}</h3>
              <p className="text-muted-foreground text-xs mt-1 font-mono">
                {uniqueColors.length > 1 ? 'Select Color & Size' : 'Select Size'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* A. Color Selector (Conditional) */}
          {uniqueColors.length > 1 && (
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Color</span>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map(color => (
                  <button
                    key={color}
                    onClick={() => { setSelectedColor(color); setSelectedVariantId(null); }}
                    className={cn(
                      "px-4 py-2 rounded-full text-xs font-bold uppercase border transition-all shadow-sm",
                      selectedColor === color
                        ? "bg-black dark:bg-white text-white dark:text-black border-transparent scale-105"
                        : "bg-transparent border-border hover:border-foreground/50 text-foreground"
                    )}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* B. Size Grid */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Size</span>
            <div className="grid grid-cols-4 gap-2">
              {availableSizes.map((variant) => {
                const isSelected = selectedVariantId === variant.id;
                const hasStock = variant.stock_quantity > 0;

                return (
                  <button
                    key={variant.id}
                    onClick={() => hasStock && setSelectedVariantId(variant.id)}
                    disabled={!hasStock}
                    className={cn(
                      "relative py-3 rounded-lg border text-sm font-bold uppercase transition-all duration-200 flex flex-col items-center justify-center gap-1",
                      isSelected 
                        ? "border-black dark:border-white bg-black dark:bg-white text-white dark:text-black ring-1 ring-offset-1 ring-black dark:ring-white shadow-md" 
                        : "border-border bg-transparent hover:border-foreground/50 text-foreground",
                      !hasStock && "opacity-40 cursor-not-allowed bg-secondary/50 border-transparent decoration-slice line-through text-muted-foreground"
                    )}
                  >
                    <span>{variant.size}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* C. Price & Stock Status */}
          <div className="flex items-center justify-between pt-2 border-t border-dashed border-border/50">
             <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold">
               {selectedVariant ? (
                 <span className={cn(isOutOfStock ? "text-red-500" : "text-emerald-600 flex items-center gap-1")}>
                    {isOutOfStock ? "Out of Stock" : `In Stock: ${selectedVariant.stock_quantity}`}
                 </span>
               ) : 'Select Options'}
             </div>
             <div className="flex flex-col items-end">
               {isOnSale ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground line-through decoration-red-500/50">{formatCurrency(originalPrice / 100)}</span>
                    <span className="text-lg font-black font-mono text-red-600">{formatCurrency(currentPrice / 100)}</span>
                  </div>
               ) : (
                  <span className="text-lg font-black font-mono">{formatCurrency(currentPrice / 100)}</span>
               )}
             </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-5 border-t border-border/50 bg-secondary/5">
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant || isOutOfStock || isAdding}
            className={cn(
              "w-full py-4 rounded-lg font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95",
              isAdding 
                ? "bg-emerald-600 text-white"
                : !selectedVariant 
                  ? "bg-muted text-muted-foreground cursor-not-allowed" 
                  : "bg-black dark:bg-white text-white dark:text-black hover:opacity-90"
            )}
          >
            {isAdding ? (
              <>Added <Check size={18} /></>
            ) : (
              <>Add to Bag <ShoppingBag size={18} strokeWidth={2.5} /></>
            )}
          </button>
        </div>

      </div>
    </div>,
    document.body // RENDER TARGET
  );
}