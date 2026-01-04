'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Upgrade to Next/Image for performance
import { cn, formatCurrency } from '@/lib/utils';
import { ArrowUpRight, ShoppingBag, AlertCircle, Loader2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client'; 
import { useCartStore } from '@/lib/store/cart'; 
import { toast } from 'sonner';
import QuickAddModal from './QuickAddModal';

// --- CONFIG: SIZING SYSTEM ---
// Allows the card to adapt to different grid contexts (Featured vs Grid vs Sidebar)
type CardSize = 'sm' | 'md' | 'lg';

interface ProductCardProps {
  id: string;
  title: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  image: string;
  category: string;
  status: 'active' | 'draft' | 'dropping_soon' | 'archived';
  description?: string;
  totalStock?: number;
  size?: CardSize; // New Prop for sizing control
  priority?: boolean; // New Prop for LCP optimization
}

export default function ProductCard({ 
  id,
  title, 
  slug, 
  price, 
  salePrice,
  image, 
  category, 
  status,
  description,
  totalStock = 0,
  size = 'md', // Default to medium standard
  priority = false
}: ProductCardProps) {
  const { addItem } = useCartStore(); 
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  
  // --- INTELLIGENT PRE-FETCH STATE ---
  const [prefetchedVariants, setPrefetchedVariants] = useState<any[] | null>(null);
  const isFetching = useRef(false); // Ref to prevent double fetching

  // --- MODAL STATE ---
  const [showModal, setShowModal] = useState(false);

  // --- LOGIC ENGINE ---
  const isSoldOut = totalStock === 0;
  const isLowStock = totalStock > 0 && totalStock < 5;
  const isOnSale = salePrice && (salePrice < price) && !isSoldOut;
  const discountPct = isOnSale ? Math.round(((price - salePrice) / price) * 100) : 0;
  
  const displayPrice = salePrice ? salePrice / 100 : price / 100;
  const originalPrice = price / 100;

  // --- STYLE MAPPING ---
  // Centralized styles for easy resizing logic
  const styles = {
    sm: {
      title: "text-xs",
      cat: "text-[8px]",
      price: "text-xs",
      iconBox: "h-7 w-7",
      iconSize: 12,
      badge: "text-[8px] px-1.5 py-0.5",
      gap: "gap-1"
    },
    md: {
      title: "text-sm",
      cat: "text-[9px]",
      price: "text-sm",
      iconBox: "h-9 w-9",
      iconSize: 14,
      badge: "text-[9px] px-2.5 py-1",
      gap: "gap-2"
    },
    lg: {
      title: "text-lg",
      cat: "text-xs",
      price: "text-lg",
      iconBox: "h-11 w-11",
      iconSize: 18,
      badge: "text-xs px-3 py-1.5",
      gap: "gap-3"
    }
  }[size];

  // --- SMART FETCHING ---
  // Fetches variants silently on hover so click is instant
  const prefetchVariants = useCallback(async () => {
    if (prefetchedVariants || isSoldOut || isFetching.current) return;
    
    try {
      isFetching.current = true;
      const supabase = createClient();
      const { data: variants } = await supabase
        .from('variants')
        .select('id, size, color, stock_quantity, price_adjustment') 
        .eq('product_id', id)
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('price_adjustment', { ascending: true }); 
      
      if (variants) setPrefetchedVariants(variants);
    } catch (e) {
      console.error("Prefetch failed", e);
    } finally {
      isFetching.current = false;
    }
  }, [id, isSoldOut, prefetchedVariants]);

  // --- HANDLER ---
  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    if (isSoldOut || adding) return;
    setAdding(true);

    try {
      // Use prefetched data if available, otherwise fetch now
      let variants = prefetchedVariants;
      
      if (!variants) {
        const supabase = createClient();
        const { data } = await supabase
          .from('variants')
          .select('id, size, color, stock_quantity, price_adjustment') 
          .eq('product_id', id)
          .eq('is_active', true)
          .gt('stock_quantity', 0)
          .order('price_adjustment', { ascending: true }); 
        variants = data;
      }

      if (!variants || variants.length === 0) {
        toast.error("Item is out of stock");
        setAdding(false);
        return;
      }

      // AUTO-ADD (Single Variant)
      if (variants.length === 1) {
        const v = variants[0];
        const finalPriceCents = price + (v.price_adjustment || 0); 
        
        addItem({
          variantId: v.id,
          productId: id,
          name: title,
          price: finalPriceCents,
          image: image,
          quantity: 1,
          size: v.size,
          color: v.color, 
          slug: slug,
          maxStock: v.stock_quantity 
        });

        setJustAdded(true);
        toast.success(`Added ${title} to bag`);
        setTimeout(() => {
          setJustAdded(false);
          setAdding(false);
        }, 2000);
        
      } else {
        // OPEN MODAL (Multiple Variants)
        // We set the cached variants to state so modal opens instantly
        setPrefetchedVariants(variants); 
        setShowModal(true);
        setAdding(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not add to cart");
      setAdding(false);
    }
  };

  return (
    <>
      <Link 
        href={`/product/${slug}`} 
        // Trigger prefetch on hover
        onMouseEnter={prefetchVariants}
        className={cn(
          "group flex flex-col h-full relative select-none cursor-pointer outline-none",
          isSoldOut && "opacity-60 grayscale-[0.5]" 
        )}
      >
        {/* 1. IMAGE CONTAINER */}
        <div className="relative aspect-4/5 w-full overflow-hidden rounded-xl bg-secondary/10 group-hover:shadow-2xl transition-all duration-500 ease-out isolate">
          
          {image ? (
            <Image 
              src={image} 
              alt={title}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              priority={priority}
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105 will-change-transform"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30 bg-secondary/20">
              <span className="text-[10px] font-black uppercase tracking-widest">No Image</span>
            </div>
          )}

          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 z-10" />
          
          {/* Status Badges */}
          <div className={cn("absolute top-3 left-3 flex flex-col z-20 items-start", styles.gap)}>
            {isSoldOut ? (
              <span className={cn("bg-neutral-900 text-white font-black uppercase rounded-full shadow-lg tracking-widest border border-white/10", styles.badge)}>
                Sold Out
              </span>
            ) : (
              <>
                {status === 'dropping_soon' && (
                  <span className={cn("bg-blue-600 text-white font-bold uppercase tracking-widest rounded-full shadow-lg", styles.badge)}>
                    Dropping Soon
                  </span>
                )}
                {isOnSale && (
                  <span className={cn("bg-red-600 text-white font-bold uppercase tracking-widest rounded-full shadow-lg animate-in fade-in zoom-in duration-300", styles.badge)}>
                    -{discountPct}%
                  </span>
                )}
                {isLowStock && !isSoldOut && (
                  <span className={cn("bg-orange-500 text-white font-bold uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1", styles.badge)}>
                    <AlertCircle size={styles.iconSize - 4} strokeWidth={4} className="animate-pulse" /> Low Stock
                  </span>
                )}
              </>
            )}
          </div>

          {/* ACTION BUTTONS */}
          {!isSoldOut && (
            <div className={cn(
               "absolute bottom-3 right-3 flex z-20 transition-all duration-300 ease-out",
               styles.gap,
               // Mobile: Always visible
               "opacity-100 translate-y-0",
               // Desktop: Slide up on hover
               "md:opacity-0 md:translate-y-4 md:group-hover:translate-y-0 md:group-hover:opacity-100"
            )}>
              
              <div className={cn(
                "bg-white/90 dark:bg-black/90 backdrop-blur text-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer border border-border/10",
                styles.iconBox
              )}>
                <ArrowUpRight size={styles.iconSize} strokeWidth={2.5} />
              </div>

              <button 
                onClick={handleQuickAdd}
                disabled={adding}
                // Mobile Hit Area Expansion
                className={cn(
                  "rounded-full flex items-center justify-center shadow-lg transition-all border border-border/10 relative",
                  styles.iconBox,
                  justAdded ? "bg-emerald-600 text-white" : "bg-black dark:bg-white text-white dark:text-black hover:scale-110 active:scale-95"
                )}
              >
                {/* Invisible hit area for mobile usability */}
                <span className="absolute -inset-2 md:inset-0" /> 
                
                {adding ? (
                  <Loader2 size={styles.iconSize} className="animate-spin" />
                ) : justAdded ? (
                  <Check size={styles.iconSize} strokeWidth={3} />
                ) : (
                  <ShoppingBag size={styles.iconSize} strokeWidth={2.5} />
                )}
              </button>
            </div>
          )}
        </div>

        {/* 2. DETAILS */}
        <div className="pt-4 flex flex-col flex-1 space-y-1">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-0.5 w-full">
              <p className={cn("text-muted-foreground/70 font-mono uppercase tracking-widest line-clamp-1", styles.cat)}>
                {category}
              </p>
              {/* Glitch Effect on Title Hover */}
              <h3 className={cn(
                "font-black uppercase leading-none text-foreground line-clamp-1 transition-colors",
                styles.title,
                // Custom glitch hover class (requires tailwind config or global css, simplified here as color shift)
                "group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-primary group-hover:to-purple-500"
              )}>
                {title}
              </h3>
            </div>
          </div>

          <div className="min-h-[2.2em] overflow-hidden">
            <p className="text-[10px] text-muted-foreground/60 leading-tight line-clamp-2">
              {description || "Premium streetwear crafted for the bold."}
            </p>
          </div>

          <div className="mt-auto pt-2 flex items-center gap-2 border-t border-border/30">
            <div className="flex flex-col">
              {isOnSale ? (
                <div className="flex items-center gap-2">
                  <span className={cn("font-black text-red-600", styles.price)}>
                    {formatCurrency(displayPrice)}
                  </span>
                  <span className={cn("text-muted-foreground line-through decoration-red-500/50 decoration-2", styles.cat)}>
                    {formatCurrency(originalPrice)}
                  </span>
                </div>
              ) : (
                <span className={cn("font-black text-foreground", styles.price)}>
                  {formatCurrency(displayPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* QUICK ADD MODAL */}
      <QuickAddModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        product={{ id, title, price, salePrice, image, slug }} 
        variants={prefetchedVariants || []} // Use our smart prefetched data
      />
    </>
  );
}