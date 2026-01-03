'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn, formatCurrency } from '@/lib/utils';
import { ArrowUpRight, ShoppingBag, AlertCircle, Loader2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client'; 
import { useCartStore } from '@/lib/store/cart'; 
import { toast } from 'sonner';
import QuickAddModal from './QuickAddModal'; // IMPORT THE MODAL

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
  totalStock = 0 
}: ProductCardProps) {
  const router = useRouter();
  const { addItem } = useCartStore(); 
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  
  // --- MODAL STATE ---
  const [showModal, setShowModal] = useState(false);
  const [modalVariants, setModalVariants] = useState<any[]>([]);

  // --- INTELLIGENT LOGIC ---
  const isSoldOut = totalStock === 0;
  const isLowStock = totalStock > 0 && totalStock < 5;
  const isOnSale = salePrice && salePrice < price && !isSoldOut;
  const discountPct = isOnSale ? Math.round(((price - salePrice) / price) * 100) : 0;
  
  const displayPrice = salePrice ? salePrice / 100 : price / 100;
  const originalPrice = price / 100;

  // --- SMART ADD HANDLER ---
  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();
    
    if (isSoldOut || adding) return;
    setAdding(true);

    try {
      const supabase = createClient();
      
      // 1. FETCH VARIANTS (Include color & stock_quantity)
      const { data: variants } = await supabase
        .from('variants')
        .select('id, size, color, stock_quantity, price_adjustment') 
        .eq('product_id', id)
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('price_adjustment', { ascending: true }); 

      if (!variants || variants.length === 0) {
        toast.error("Item is out of stock");
        setAdding(false);
        return;
      }

      // 2. AUTO-ADD LOGIC (Single Variant)
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
        // 3. MODAL LOGIC (Multiple Variants)
        setModalVariants(variants);
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
        className={cn(
          "group flex flex-col h-full relative select-none cursor-pointer outline-none",
          isSoldOut && "opacity-60 grayscale-[0.5]" 
        )}
      >
        {/* 1. IMAGE CONTAINER */}
        <div className="relative aspect-4/5 w-full overflow-hidden rounded-xl bg-secondary/10 group-hover:shadow-2xl transition-all duration-500 ease-out">
          
          {image ? (
            <img 
              src={image} 
              alt={title} 
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 will-change-transform"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/30 bg-secondary/20">
              <span className="text-[10px] font-black uppercase tracking-widest">No Image</span>
            </div>
          )}

          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
          
          {/* Status Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10 items-start">
            {isSoldOut ? (
              <span className="bg-neutral-900 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full shadow-lg tracking-widest border border-white/10">
                Sold Out
              </span>
            ) : (
              <>
                {status === 'dropping_soon' && (
                  <span className="bg-blue-600 text-white text-[9px] font-bold px-2.5 py-1 uppercase tracking-widest rounded-full shadow-lg">
                    Dropping Soon
                  </span>
                )}
                {isOnSale && (
                  <span className="bg-red-600 text-white text-[9px] font-bold px-2.5 py-1 uppercase tracking-widest rounded-full shadow-lg animate-in fade-in zoom-in duration-300">
                    -{discountPct}%
                  </span>
                )}
                {isLowStock && !isSoldOut && (
                  <span className="bg-orange-500 text-white text-[9px] font-bold px-2.5 py-1 uppercase tracking-widest rounded-full shadow-lg flex items-center gap-1">
                    <AlertCircle size={8} strokeWidth={4} /> Low Stock
                  </span>
                )}
              </>
            )}
          </div>

          {/* ACTION BUTTONS (Foolproof Visibility) */}
          {!isSoldOut && (
            <div className={cn(
               "absolute bottom-3 right-3 flex gap-2 z-20 transition-all duration-300 ease-out",
               // Mobile: Always visible, natural position
               "opacity-100 translate-y-0",
               // Desktop (md+): Hidden until hover, slides up
               "md:opacity-0 md:translate-y-4 md:group-hover:translate-y-0 md:group-hover:opacity-100"
            )}>
              
              <div className="bg-white/90 dark:bg-black/90 backdrop-blur text-foreground h-9 w-9 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer border border-border/10">
                <ArrowUpRight size={16} strokeWidth={2.5} />
              </div>

              <button 
                onClick={handleQuickAdd}
                disabled={adding}
                className={cn(
                  "h-9 w-9 rounded-full flex items-center justify-center shadow-lg transition-all border border-border/10",
                  justAdded ? "bg-emerald-600 text-white" : "bg-black dark:bg-white text-white dark:text-black hover:scale-110 active:scale-95"
                )}
              >
                {adding ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : justAdded ? (
                  <Check size={16} strokeWidth={3} />
                ) : (
                  <ShoppingBag size={14} strokeWidth={2.5} />
                )}
              </button>
            </div>
          )}
        </div>

        {/* 2. DETAILS */}
        <div className="pt-4 flex flex-col flex-1 space-y-1">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-0.5">
              <p className="text-[9px] text-muted-foreground/70 font-mono uppercase tracking-widest line-clamp-1">
                {category}
              </p>
              <h3 className="text-sm font-black uppercase leading-none text-foreground line-clamp-1 group-hover:text-primary transition-colors">
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
                  <span className="text-sm font-black text-red-600">
                    {formatCurrency(displayPrice)}
                  </span>
                  <span className="text-[10px] text-muted-foreground line-through decoration-red-500/50 decoration-2">
                    {formatCurrency(originalPrice)}
                  </span>
                </div>
              ) : (
                <span className="text-sm font-black text-foreground">
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
        variants={modalVariants}
      />
    </>
  );
}