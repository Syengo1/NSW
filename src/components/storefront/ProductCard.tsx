'use client';

import { useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn, formatCurrency } from '@/lib/utils';
import { ArrowUpRight, ShoppingBag, AlertCircle, Loader2, Check, ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client'; 
import { useCartStore } from '@/lib/store/cart'; 
import { toast } from 'sonner';
import QuickAddModal from './QuickAddModal';

// --- STRICT TYPES ---
type CardSize = 'sm' | 'md' | 'lg';

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock_quantity: number;
  price_adjustment: number;
}

interface ProductCardProps {
  id: string;
  title: string;
  slug: string;
  price: number;
  salePrice?: number | null;
  image: string;
  hoverImage?: string | null;
  category: string;
  status: 'active' | 'draft' | 'dropping_soon' | 'archived';
  description?: string;
  totalStock?: number;
  size?: CardSize;
  priority?: boolean;
}

// --- UTILITY: SAFE IMAGE VALIDATION ---
// Prevents Next.js crashes if DB contains old Unsplash URLs or invalid strings
const isValidImageUrl = (url?: string | null) => {
  if (!url) return false;
  if (url.startsWith('/')) return true; 
  return url.includes('supabase.co') || url.includes('vercel-storage.com');
};

export default function ProductCard({ 
  id,
  title, 
  slug, 
  price, 
  salePrice,
  image, 
  hoverImage,
  category, 
  status,
  description,
  totalStock = 0,
  size = 'md', 
  priority = false
}: ProductCardProps) {
  const { addItem } = useCartStore(); 
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false); 
  
  const [prefetchedVariants, setPrefetchedVariants] = useState<ProductVariant[] | null>(null);
  const isFetching = useRef(false); 
  const [showModal, setShowModal] = useState(false);

  // --- LOGIC ENGINE ---
  const isSoldOut = totalStock === 0;
  const isLowStock = totalStock > 0 && totalStock < 5;
  const isOnSale = salePrice && (salePrice < price) && !isSoldOut;
  const discountPct = isOnSale ? Math.round(((price - salePrice) / price) * 100) : 0;
  
  const displayPrice = salePrice ? salePrice / 100 : price / 100;
  const originalPrice = price / 100;

  const safeImageToRender = isValidImageUrl(image) ? image : null;
  const safeHoverImage = isValidImageUrl(hoverImage) ? hoverImage : null;

  // --- STYLE MAPPING ---
  const styles = {
    sm: {
      title: "text-xs", cat: "text-[8px]", price: "text-xs",
      iconBox: "h-7 w-7", iconSize: 12, badge: "text-[8px] px-1.5 py-0.5", gap: "gap-1"
    },
    md: {
      title: "text-sm", cat: "text-[9px]", price: "text-sm",
      iconBox: "h-9 w-9", iconSize: 14, badge: "text-[9px] px-2.5 py-1", gap: "gap-2"
    },
    lg: {
      title: "text-lg", cat: "text-xs", price: "text-lg",
      iconBox: "h-11 w-11", iconSize: 18, badge: "text-xs px-3 py-1.5", gap: "gap-3"
    }
  }[size];

  // --- SMART FETCHING ---
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
      
      if (variants) setPrefetchedVariants(variants as ProductVariant[]);
    } catch (e) {
      console.error("Prefetch failed", e);
    } finally {
      isFetching.current = false;
    }
  }, [id, isSoldOut, prefetchedVariants]);

  // --- HANDLERS ---
  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    if (isSoldOut || adding) return;
    setAdding(true);

    try {
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
        variants = data as ProductVariant[];
      }

      if (!variants || variants.length === 0) {
        toast.error("Item is out of stock");
        setAdding(false);
        return;
      }

      if (variants.length === 1) {
        const v = variants[0];
        const finalPriceCents = price + (v.price_adjustment || 0); 
        
        addItem({
          variantId: v.id,
          productId: id,
          name: title,
          price: finalPriceCents,
          image: safeImageToRender || '', 
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
        onMouseEnter={prefetchVariants}
        className={cn(
          "group flex flex-col h-full relative select-none cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl",
          isSoldOut && "opacity-60 grayscale-[0.5]" 
        )}
      >
        {/* 1. IMAGE CONTAINER */}
        <div className="relative aspect-4/5 w-full overflow-hidden rounded-xl bg-secondary/20 shadow-none group-hover:shadow-2xl transition-all duration-500 ease-out isolate">
            
          {/* Skeleton Loader */}
          {!imageLoaded && safeImageToRender && (
             <div className="absolute inset-0 bg-secondary animate-pulse z-0" />
          )}

          {safeImageToRender ? (
            <>
              {/* PRIMARY IMAGE */}
              <Image 
                src={safeImageToRender} 
                alt={title}
                fill
                // 🚨 MOBILE PERFORMANCE FIX: Strictly sets 50vw for 2-column mobile grids
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                // 🚨 LCP FIX: Explicitly links the Next.js priority flag to the native browser fetchPriority
                priority={priority}
                fetchPriority={priority ? "high" : "auto"}
                onLoad={() => setImageLoaded(true)}
                className={cn(
                  "object-cover transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform z-10",
                  imageLoaded ? "opacity-100" : "opacity-0",
                  safeHoverImage ? "group-hover:scale-100" : "group-hover:scale-105"
                )}
              />

              {/* SECONDARY HOVER IMAGE */}
              {safeHoverImage && (
                <Image 
                  src={safeHoverImage} 
                  alt={`${title} alternate view`}
                  fill
                  // 🚨 MOBILE PERFORMANCE FIX: Same strict 50vw mobile size
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  // 🚨 NETWORK FIX: Explicitly enforce lazy loading and async decoding
                  loading="lazy" 
                  decoding="async"
                  className={cn(
                    "object-cover transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform z-20",
                    "opacity-0 scale-100 group-hover:opacity-100 group-hover:scale-105"
                  )}
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30 bg-secondary/10 z-10 border border-border/50 border-dashed rounded-xl">
              <ImageIcon size={32} className="mb-2 opacity-50" />
              <span className="text-[10px] font-black uppercase tracking-widest">Image Unavailable</span>
            </div>
          )}

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 z-10 pointer-events-none" />
          
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
               // 🚨 GPU FIX: Added transform-gpu and z-30 to prevent Safari from dropping the layer during scroll
               "absolute bottom-3 right-3 flex z-30 transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] transform-gpu",
               styles.gap,
               // 🚨 INVISIBLE FIX: Moved from `md:` (Tablets) to `lg:` (Desktops). Tablets can't hover!
               "opacity-100 translate-y-0",
               "lg:opacity-0 lg:translate-y-8 lg:group-hover:translate-y-0 lg:group-hover:opacity-100"
            )}>
              
              <div className={cn(
                // 🚨 BLURRY GREY FIX: Removed backdrop-blur-md. Solid contrasting colors eliminate the iOS WebKit blur bug entirely.
                "bg-white dark:bg-neutral-900 text-black dark:text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer border border-border/10",
                styles.iconBox
              )}>
                <ArrowUpRight size={styles.iconSize} strokeWidth={2.5} />
              </div>

              <button 
                onClick={handleQuickAdd}
                disabled={adding}
                aria-label="Quick Add to Bag"
                className={cn(
                  "rounded-full flex items-center justify-center shadow-lg transition-all border border-border/10 relative",
                  styles.iconBox,
                  justAdded 
                    ? "bg-emerald-600 border-emerald-600 text-white" 
                    : "bg-black dark:bg-white text-white dark:text-black hover:scale-110 active:scale-95"
                )}
              >
                {/* Extends the touchable area on mobile devices */}
                <span className="absolute -inset-3 lg:inset-0" /> 
                
                {adding ? (
                  <Loader2 size={styles.iconSize} className="animate-spin text-current" />
                ) : justAdded ? (
                  <Check size={styles.iconSize} strokeWidth={3} className="text-white" />
                ) : (
                  <ShoppingBag size={styles.iconSize} strokeWidth={2.5} className="text-current" />
                )}
              </button>
            </div>
          )}
        </div>

        {/* 2. DETAILS (Editorial Typography) */}
        <div className="pt-4 flex flex-col flex-1 space-y-1">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-0.5 w-full">
              <p className={cn("text-muted-foreground font-mono uppercase tracking-widest line-clamp-1", styles.cat)}>
                {category}
              </p>
              <h3 className={cn(
                "font-black uppercase leading-tight tracking-tighter text-foreground line-clamp-1 transition-colors duration-300",
                styles.title,
                "group-hover:text-primary"
              )}>
                {title}
              </h3>
            </div>
          </div>

          <div className="min-h-[2.4em] overflow-hidden pt-1">
            <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2 pr-4">
              {description || "Premium streetwear crafted for the bold."}
            </p>
          </div>

          <div className="mt-auto pt-3 flex items-center gap-2 border-t border-border/20">
            <div className="flex flex-col">
              {isOnSale ? (
                <div className="flex items-center gap-2.5">
                  <span className={cn("font-black text-red-600", styles.price)}>
                    {formatCurrency(displayPrice)}
                  </span>
                  <span className={cn("text-muted-foreground/60 font-medium line-through decoration-muted-foreground/30 decoration-1", styles.cat)}>
                    {formatCurrency(originalPrice)}
                  </span>
                </div>
              ) : (
                <span className={cn("font-black text-foreground tracking-tight", styles.price)}>
                  {formatCurrency(displayPrice)}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      <QuickAddModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        product={{ id, title, price, salePrice, image: safeImageToRender || '', slug }} 
        variants={prefetchedVariants || []} 
      />
    </>
  );
}