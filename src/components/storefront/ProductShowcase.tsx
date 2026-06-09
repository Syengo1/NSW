"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { formatCurrency, cn } from "@/lib/utils";
import { ShoppingBag, Share2, AlertCircle, Loader2, Heart, ArrowLeft, ArrowRight, ImageIcon } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { FullProduct } from "@/app/(storefront)/product/[slug]/page";
import { toast } from "sonner";

interface ProductShowcaseProps {
  product: FullProduct;
}

// --- UTILITY: SAFE IMAGE VALIDATION ---
// Prevents Next.js crashes if DB contains old or malformed URLs
const isValidImageUrl = (url?: string | null) => {
  if (!url) return false;
  if (url.startsWith('/')) return true; 
  return url.includes('supabase.co') || url.includes('vercel-storage.com');
};

export default function ProductShowcase({ product }: ProductShowcaseProps) {
  // --- STATE ---
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(product.variants[0]?.color || null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false); 

  const thumbnailScrollRef = useRef<HTMLDivElement>(null);
  const { addItem, openCart } = useCartStore();

  // --- DATA PROCESSING ---
  const colors = Array.from(new Set(product.variants.map(v => v.color)));
  const sizes = Array.from(new Set(product.variants.map(v => v.size)));

  const activeVariant = product.variants.find(
    v => v.color === selectedColor && v.size === selectedSize
  );

  const adjustment = activeVariant?.price_adjustment || 0;
  const currentBasePrice = (product.base_price + adjustment) / 100;
  const currentSalePrice = product.sale_price ? (product.sale_price + adjustment) / 100 : null;
  const isOnSale = !!currentSalePrice;
  const discountPercent = isOnSale 
    ? Math.round(((currentBasePrice - currentSalePrice) / currentBasePrice) * 100) 
    : 0;

  // Ensure the selected image actually exists and is safe to render
  const currentImageData = product.product_images[selectedImageIdx];
  const safeMainImageUrl = isValidImageUrl(currentImageData?.url) ? currentImageData.url : null;

  // --- HANDLERS ---
  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize || !activeVariant) {
      toast.error("Please select a color and size.");
      return;
    }

    setIsAdding(true);

    addItem({
      variantId: activeVariant.id,
      productId: product.id,
      name: product.title,
      slug: product.slug,
      price: product.sale_price ? (product.sale_price + adjustment) : (product.base_price + adjustment),
      image: safeMainImageUrl || product.product_images[0]?.url || '',
      size: selectedSize,
      color: selectedColor,
      quantity: 1,
      maxStock: activeVariant.stock_quantity
    });

    setTimeout(() => {
      setIsAdding(false);
      openCart();
    }, 400);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product.title,
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (thumbnailScrollRef.current) {
      const scrollAmount = 150;
      thumbnailScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
        
        {/* =======================================
            LEFT: IMAGE GALLERY & SLIDER
            ======================================= */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Main Hero Image */}
          <div className="relative aspect-square md:aspect-[4/3] w-full overflow-hidden bg-[#ebedee] dark:bg-zinc-900 rounded-sm">
            
            <button 
              onClick={() => setIsWishlisted(!isWishlisted)}
              className="absolute top-6 right-6 z-10 text-foreground hover:scale-110 transition-transform"
            >
              <Heart 
                size={28} 
                strokeWidth={1.5} 
                className={cn(isWishlisted ? "fill-foreground" : "fill-transparent", "transition-colors")} 
              />
            </button>

            {safeMainImageUrl ? (
              <Image 
                src={safeMainImageUrl}
                alt={`${product.title} - View ${selectedImageIdx + 1}`}
                fill
                // 🚨 LCP FIX: Only the FIRST image gets priority queue.
                priority={selectedImageIdx === 0}
                fetchPriority={selectedImageIdx === 0 ? "high" : "auto"}
                className="object-contain p-4 md:p-8 transition-opacity duration-500 mix-blend-multiply dark:mix-blend-normal"
                // 🚨 RESPONSIVE MATH: 100vw on mobile, 60vw on desktop (since it spans 7 out of 12 columns)
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-secondary/10 border border-border/50 border-dashed m-4 rounded-xl">
                <ImageIcon size={32} className="opacity-20 mb-2" />
                <span className="uppercase font-mono text-xs tracking-widest">Image Unavailable</span>
              </div>
            )}
          </div>

          {/* Thumbnail Slider with Arrows */}
          {product.product_images.length > 1 && (
            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={() => scrollThumbnails('left')}
                className="p-3 md:p-4 border-2 border-foreground bg-background hover:bg-muted transition-colors shrink-0"
                aria-label="Scroll thumbnails left"
              >
                <ArrowLeft size={20} strokeWidth={1.5} className="text-foreground" />
              </button>

              <div 
                ref={thumbnailScrollRef}
                className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide snap-x scroll-smooth px-1"
              >
                {product.product_images.map((img, idx) => {
                  const safeThumbUrl = isValidImageUrl(img.url) ? img.url : null;
                  if (!safeThumbUrl) return null;

                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIdx(idx)}
                      className={cn(
                        "relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 transition-all duration-300 snap-start bg-[#ebedee] dark:bg-zinc-900",
                        selectedImageIdx === idx 
                          ? "border-b-4 border-foreground opacity-100" 
                          : "border-b-4 border-transparent opacity-50 hover:opacity-100"
                      )}
                    >
                      <Image 
                        src={safeThumbUrl}
                        alt={`Thumbnail ${idx + 1}`}
                        fill
                        // 🚨 THUMBNAIL PERFORMANCE: Lazily loaded, asynchronously decoded, strictly 96px.
                        loading="lazy"
                        decoding="async"
                        sizes="96px"
                        className="object-contain p-2 mix-blend-multiply dark:mix-blend-normal"
                      />
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => scrollThumbnails('right')}
                className="p-3 md:p-4 border-2 border-foreground bg-background hover:bg-muted transition-colors shrink-0"
                aria-label="Scroll thumbnails right"
              >
                <ArrowRight size={20} strokeWidth={1.5} className="text-foreground" />
              </button>
            </div>
          )}
        </div>

        {/* =======================================
            RIGHT: STICKY INFO PANEL
            ======================================= */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-8">
          
          {/* 1. Header & Price */}
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">
                  {product.category || 'Collection'}
                </p>
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-tight">
                  {product.title}
                </h1>
              </div>
              <button onClick={handleShare} className="p-3 bg-secondary hover:bg-muted rounded-full transition-colors">
                <Share2 size={18} className="text-foreground" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              {isOnSale ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-black text-red-600 font-mono">
                    {formatCurrency(currentSalePrice)}
                  </span>
                  <span className="text-lg text-muted-foreground line-through decoration-red-500 font-mono">
                    {formatCurrency(currentBasePrice)}
                  </span>
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 text-[10px] font-black uppercase tracking-widest rounded">
                    -{discountPercent}%
                  </span>
                </div>
              ) : (
                <span className="text-2xl font-black text-foreground font-mono">
                  {formatCurrency(currentBasePrice)}
                </span>
              )}
            </div>
          </div>

          <hr className="border-border" />

          {/* 2. Color Selection */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Color</span>
              <span className="text-xs font-bold uppercase">{selectedColor || 'Select'}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {colors.map((color) => {
                const isSelected = selectedColor === color;
                return (
                  <button
                    key={color}
                    onClick={() => {
                      setSelectedColor(color);
                      setSelectedSize(null); 
                      // Smart logic: auto-scroll to the image matching this color if configured in DB
                      const matchingImgIdx = product.product_images.findIndex(img => img.color_tag?.toLowerCase() === color.toLowerCase());
                      if (matchingImgIdx !== -1) setSelectedImageIdx(matchingImgIdx);
                    }}
                    className={cn(
                      "px-5 py-2.5 rounded-full text-xs font-bold uppercase border transition-all",
                      isSelected 
                        ? "bg-foreground text-background border-foreground shadow-lg" 
                        : "bg-transparent text-foreground border-border hover:border-foreground/50"
                    )}
                  >
                    {color}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 3. Size Selection */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Size</span>
              {activeVariant && activeVariant.stock_quantity < 5 && activeVariant.stock_quantity > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 flex items-center gap-1 animate-pulse">
                  <AlertCircle size={12} /> Low Stock
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {sizes.map((size) => {
                const variant = product.variants.find(v => v.size === size && v.color === selectedColor);
                const isAvailable = variant && variant.stock_quantity > 0;
                const isSelected = selectedSize === size;

                return (
                  <button
                    key={size}
                    onClick={() => isAvailable && setSelectedSize(size)}
                    disabled={!isAvailable}
                    className={cn(
                      "h-14 rounded-lg border text-sm font-bold uppercase transition-all flex items-center justify-center",
                      isSelected 
                        ? "bg-primary text-primary-foreground border-primary shadow-md" 
                        : "bg-transparent text-foreground border-border",
                      !isAvailable && "opacity-30 cursor-not-allowed bg-secondary decoration-slice line-through",
                      isAvailable && !isSelected && "hover:border-foreground/50"
                    )}
                  >
                    {size}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 4. Action Button */}
          <div className="pt-4">
            <button
              onClick={handleAddToCart}
              disabled={isAdding || (activeVariant?.stock_quantity === 0)}
              className={cn(
                "w-full h-16 rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl active:scale-[0.98]",
                isAdding ? "bg-emerald-600 text-white" : "bg-foreground text-background hover:opacity-90",
                (!selectedSize || !selectedColor) && "opacity-50 cursor-not-allowed"
              )}
            >
              {isAdding ? (
                <><Loader2 size={20} className="animate-spin" /> Securing</>
              ) : !selectedSize ? (
                "Select a Size"
              ) : activeVariant?.stock_quantity === 0 ? (
                "Out of Stock"
              ) : (
                <>Add to Bag <ShoppingBag size={20} /></>
              )}
            </button>
            <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-4">
              Fast fulfillment across Kenya
            </p>
          </div>

          {/* 5. Description Accordion */}
          <div className="border-t border-border pt-8 mt-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">The Manifesto</h3>
            <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
              {product.description || "Premium streetwear piece. Check label for care instructions."}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}