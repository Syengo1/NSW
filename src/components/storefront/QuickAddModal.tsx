'use client';

import { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, ShoppingBag, Check } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/lib/store/cart';
import { toast } from 'sonner';
import { fetchAllProductVariants, type QuickAddVariant } from '@/app/(storefront)/actions';

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
    preSelectedColor?: string | null; 
  };
}

// React 18 hydration safety mechanism
const emptySubscribe = () => () => {};

export default function QuickAddModal({ isOpen, onClose, product }: QuickAddModalProps) {
  const { addItem } = useCartStore();
  
  // 1. HYDRATION CHECK (Bypasses the ESLint useEffect warning)
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  // State
  const [variants, setVariants] = useState<QuickAddVariant[]>([]);
  const [isLoadingVariants, setIsLoadingVariants] = useState(true); // Default to true to prevent synchronous re-renders
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // 2. INDEPENDENT DATA FETCHING
  useEffect(() => {
    if (!isOpen) return;

    let isSubscribed = true;

    const loadData = async () => {
      const data = await fetchAllProductVariants(product.id);
      
      // Prevent state updates if modal was closed before fetch completed
      if (!isSubscribed) return;

      setVariants(data);
      
      if (data.length > 0) {
        const colors = Array.from(new Set(data.map(v => v.color)));
        if (product.preSelectedColor && colors.includes(product.preSelectedColor)) {
          setSelectedColor(product.preSelectedColor);
        } else {
          setSelectedColor(colors[0]);
        }
      }
      
      // Asynchronous state update completely avoids the cascading render warning
      setIsLoadingVariants(false);
    };

    loadData();

    // Cleanup function strictly resets state when modal closes
    return () => {
      isSubscribed = false;
      setIsLoadingVariants(true);
      setVariants([]);
      setSelectedColor(null);
      setSelectedVariantId(null);
    };
  }, [isOpen, product.id, product.preSelectedColor]);

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

  if (!isOpen || !isMounted) return null;

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

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-zinc-950 rounded-xl shadow-2xl border border-white/10 overflow-hidden animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300">
        
        <div className="flex items-start justify-between p-5 border-b border-border/50 bg-secondary/5">
          <div className="flex gap-4">
            <div className="h-20 w-16 rounded-md overflow-hidden bg-secondary/20 flex-shrink-0 border border-border/50 shadow-sm relative">
              {/* LCP Fix: Implemented Next/Image */}
              <Image 
                src={product.image || 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=300&auto=format&fit=crop'} 
                alt={product.title} 
                fill
                sizes="64px"
                className="object-cover" 
              />
            </div>
            <div>
              <h3 className="font-black uppercase text-sm md:text-base leading-tight pr-4 line-clamp-2">{product.title}</h3>
              <p className="text-muted-foreground text-xs mt-1 font-mono">
                {isLoadingVariants ? 'Loading matrix...' : uniqueColors.length > 1 ? 'Select Color & Size' : 'Select Size'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {isLoadingVariants ? (
            // --- SKELETON LOADER ---
            <div className="space-y-6 animate-pulse">
              <div className="space-y-2">
                 <div className="h-3 w-12 bg-secondary rounded" />
                 <div className="flex gap-2"><div className="h-8 w-16 bg-secondary rounded-full" /><div className="h-8 w-16 bg-secondary rounded-full" /></div>
              </div>
              <div className="space-y-2">
                 <div className="h-3 w-12 bg-secondary rounded" />
                 <div className="grid grid-cols-4 gap-2">
                   {[1,2,3,4].map(i => <div key={i} className="h-10 w-full bg-secondary rounded-lg" />)}
                 </div>
              </div>
            </div>
          ) : (
            <>
              {/* A. Color Selector */}
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
            </>
          )}

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

        <div className="p-5 border-t border-border/50 bg-secondary/5">
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant || isOutOfStock || isAdding || isLoadingVariants}
            className={cn(
              "w-full py-4 rounded-lg font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95",
              isAdding ? "bg-emerald-600 text-white" : !selectedVariant || isLoadingVariants ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-black dark:bg-white text-white dark:text-black hover:opacity-90"
            )}
          >
            {isAdding ? <>Added <Check size={18} /></> : <>Add to Bag <ShoppingBag size={18} strokeWidth={2.5} /></>}
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
}