"use client";

import { useState, useRef, Suspense } from "react";
import Image from "next/image";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { formatCurrency, cn } from "@/lib/utils";
import { ShoppingBag, Share2, AlertCircle, Loader2, Heart, ArrowLeft, ArrowRight, ImageIcon } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { FullProduct } from "@/app/(storefront)/product/[slug]/page";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ProductShowcaseProps {
  product: FullProduct;
}

// 🚨 SECURITY FIX: STRICT IMAGE URL VALIDATION
// Uses the URL parser to strictly allow known hosts rather than weak substring matching
const ALLOWED_IMAGE_HOSTS = [
  "wqrtjgfrjuadksaotbxj.supabase.co", // Your Supabase Project
];

const isValidImageUrl = (value?: string | null): boolean => {
  if (!value) return false;
  // Permit same-origin paths for local assets
  if (value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return false;
    // Allow Supabase and Vercel Blob storage
    return ALLOWED_IMAGE_HOSTS.includes(url.hostname) || url.hostname.includes('vercel-storage.com');
  } catch {
    return false;
  }
};

function ShowcaseContent({ product }: ProductShowcaseProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const urlColor = searchParams.get('color');
  
  // Normalize and extract unique values
  const colors = Array.from(new Set(product.variants.map(v => v.color?.trim()).filter(Boolean)));
  const sizes = Array.from(new Set(product.variants.map(v => v.size?.trim()).filter(Boolean)));

  // --- SCHEMA-AWARE IMAGE MATCHING ENGINE ---
  const findImageIndexForColor = (targetColor: string | null) => {
    if (!targetColor) return -1;
    const normalizedColor = targetColor.toLowerCase().trim();

    let idx = product.product_images.findIndex(
      img => img.color_tag && img.color_tag.toLowerCase().trim() === normalizedColor
    );
    if (idx !== -1) return idx;

    const matchingVariant = product.variants.find(
      v => v.color && v.color.toLowerCase().trim() === normalizedColor
    );

    if (matchingVariant) {
      idx = product.product_images.findIndex(img => img.variant_id === matchingVariant.id);
    }
    return idx;
  };

  // 🚨 LOGIC FIX: SMART INITIAL COLOR
  // Default to the first color that actually has stock, rather than blindly picking the first variant
  const firstInStockColor = colors.find(c => 
    product.variants.some(v => v.color === c && v.stock_quantity > 0)
  ) || colors[0] || null;

  const initialColor = urlColor && colors.includes(urlColor) ? urlColor : firstInStockColor;
  const targetImgIdx = findImageIndexForColor(initialColor);
  const startingImageIndex = targetImgIdx !== -1 ? targetImgIdx : 0;

  // --- STATE ---
  const [selectedImageIdx, setSelectedImageIdx] = useState(startingImageIndex);
  const [selectedColor, setSelectedColor] = useState<string | null>(initialColor);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  
  const [isAdding, setIsAdding] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false); 
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);
  const { addItem, openCart } = useCartStore();

  // --- PERFECT SYNC HELPER ---
  const updateUrlColor = (color: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('color', color);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // --- 🚨 LOGIC FIX: DYNAMIC VARIANT PRICING & STOCK ---
  const activeVariant = product.variants.find(
    v => v.color === selectedColor && v.size === selectedSize
  );

  const colorVariants = product.variants.filter(v => v.color === selectedColor);
  const colorTotalStock = colorVariants.reduce((acc, v) => acc + v.stock_quantity, 0);
  const isColorOutOfStock = colorTotalStock === 0;

  // Calculate pricing to display (Handles unselected sizes by showing the lowest price for the color)
  let displayBasePrice = product.base_price;
  let displaySalePrice = product.sale_price;

  if (activeVariant) {
    displayBasePrice = product.base_price + activeVariant.price_adjustment;
    // Strict null check instead of truthiness
    displaySalePrice = product.sale_price != null ? product.sale_price + activeVariant.price_adjustment : null;
  } else if (colorVariants.length > 0) {
    const minAdjustment = Math.min(...colorVariants.map(v => v.price_adjustment));
    displayBasePrice = product.base_price + minAdjustment;
    displaySalePrice = product.sale_price != null ? product.sale_price + minAdjustment : null;
  }

  const currentBasePrice = displayBasePrice / 100;
  const currentSalePrice = displaySalePrice != null ? displaySalePrice / 100 : null;
  const isOnSale = currentSalePrice != null;
  const discountPercent = isOnSale 
    ? Math.round(((currentBasePrice - currentSalePrice) / currentBasePrice) * 100) 
    : 0;

  const currentImageData = product.product_images[selectedImageIdx];
  const safeMainImageUrl = isValidImageUrl(currentImageData?.url) ? currentImageData.url : null;
  const mainImageAlt = currentImageData?.alt_text || `${product.title} - View ${selectedImageIdx + 1}`;

  // Unified Purchase State
  const canAddToCart = !!activeVariant && activeVariant.stock_quantity > 0 && !isAdding;

  // --- HANDLERS ---
  const handleAddToCart = () => {
    if (!canAddToCart || !activeVariant || !selectedColor || !selectedSize) return;

    setIsAdding(true);
    addItem({
      variantId: activeVariant.id,
      productId: product.id,
      name: product.title,
      slug: product.slug,
      price: displaySalePrice != null ? displaySalePrice : displayBasePrice,
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

  // 🚨 LOGIC FIX: NATIVE SHARE ABORT HANDLING
  const handleShare = async () => {
    const url = window.location.href;
    const title = [selectedColor, product.title].filter(Boolean).join(" ");

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title, url });
        return;
      } catch (error) {
        // Prevent fallback to clipboard if the user simply closed the native share menu
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Unable to share automatically. Please copy the page URL.");
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
          <div className="relative aspect-square md:aspect-[4/3] w-full overflow-hidden bg-[#ebedee] dark:bg-zinc-900 rounded-sm">
            <button 
              onClick={() => setIsWishlisted(!isWishlisted)}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={isWishlisted}
              className="absolute top-6 right-6 z-20 text-foreground hover:scale-110 transition-transform focus-visible:ring-2 outline-none rounded-full"
            >
              <Heart size={28} strokeWidth={1.5} className={cn(isWishlisted ? "fill-foreground" : "fill-transparent", "transition-colors")} />
            </button>
            
            <AnimatePresence mode="wait">
              {safeMainImageUrl ? (
                <motion.div
                  key={safeMainImageUrl}
                  initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, scale: 1.02, filter: 'blur(4px)' }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute inset-0"
                >
                  <Image 
                    src={safeMainImageUrl}
                    alt={mainImageAlt}
                    fill
                    // Retained 'unoptimized' to bypass Next.js IP blocking for Supabase NAT64 IPs
                    unoptimized 
                    priority={selectedImageIdx === 0}
                    className="object-contain p-4 md:p-8 mix-blend-multiply dark:mix-blend-normal"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                  />
                </motion.div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-secondary/10 border border-border/50 border-dashed m-4 rounded-xl">
                  <ImageIcon size={32} className="opacity-20 mb-2" />
                  <span className="uppercase font-mono text-xs tracking-widest">Image Unavailable</span>
                </div>
              )}
            </AnimatePresence>
          </div>

          {product.product_images.length > 1 && (
            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={() => scrollThumbnails('left')} 
                aria-label="Scroll thumbnails left"
                className="p-3 md:p-4 border-2 border-foreground bg-background hover:bg-muted transition-colors shrink-0 outline-none focus-visible:ring-2"
              >
                <ArrowLeft size={20} strokeWidth={1.5} className="text-foreground" />
              </button>
              
              <div ref={thumbnailScrollRef} className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide snap-x scroll-smooth px-1">
                {product.product_images.map((img, idx) => {
                  const safeThumbUrl = isValidImageUrl(img.url) ? img.url : null;
                  if (!safeThumbUrl) return null;
                  
                  return (
                    <button
                      key={img.url + idx}
                      onClick={() => {
                        setSelectedImageIdx(idx);
                        
                        let imgColor = img.color_tag;
                        if (!imgColor && img.variant_id) {
                          const matchedVariant = product.variants.find(v => v.id === img.variant_id);
                          if (matchedVariant) imgColor = matchedVariant.color;
                        }

                        if (imgColor && imgColor.toLowerCase() !== selectedColor?.toLowerCase()) {
                          const isValidColor = colors.some(c => c.toLowerCase() === imgColor?.toLowerCase());
                          if (isValidColor) {
                            const exactColorCase = colors.find(c => c.toLowerCase() === imgColor?.toLowerCase()) || imgColor;
                            setSelectedColor(exactColorCase);
                            setSelectedSize(null);
                            updateUrlColor(exactColorCase);
                          }
                        }
                      }}
                      aria-label={`View product image ${idx + 1}`}
                      aria-pressed={selectedImageIdx === idx}
                      className={cn(
                        "relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 transition-all duration-300 snap-start bg-[#ebedee] dark:bg-zinc-900 outline-none focus-visible:ring-2",
                        selectedImageIdx === idx ? "border-b-4 border-foreground opacity-100" : "border-b-4 border-transparent opacity-50 hover:opacity-100"
                      )}
                    >
                      <Image 
                        src={safeThumbUrl} 
                        alt="" // Empty alt as button aria-label provides context (A11y Fix)
                        fill 
                        unoptimized
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
                aria-label="Scroll thumbnails right"
                className="p-3 md:p-4 border-2 border-foreground bg-background hover:bg-muted transition-colors shrink-0 outline-none focus-visible:ring-2"
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
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">{product.category || 'Collection'}</p>
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-tight">{product.title}</h1>
              </div>
              <button 
                onClick={handleShare} 
                aria-label="Share product"
                className="p-3 bg-secondary hover:bg-muted rounded-full transition-colors outline-none focus-visible:ring-2"
              >
                <Share2 size={18} className="text-foreground" />
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              {isOnSale ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-black text-red-600 font-mono">
                    {!activeVariant && <span className="text-sm font-bold text-muted-foreground mr-1.5">FROM</span>}
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
                  {!activeVariant && <span className="text-sm font-bold text-muted-foreground mr-1.5">FROM</span>}
                  {formatCurrency(currentBasePrice)}
                </span>
              )}
            </div>
          </div>

          <hr className="border-border" />

          {/* COLOR SELECTOR */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Color</span>
              <span className="text-xs font-bold uppercase">{selectedColor || 'Select'}</span>
            </div>
            <div className="flex flex-wrap gap-3" role="group" aria-label="Color Selection">
              {colors.map((color) => {
                const isSelected = selectedColor === color;
                const isColorStockEmpty = product.variants.filter(v => v.color === color).reduce((acc, v) => acc + v.stock_quantity, 0) === 0;

                return (
                  <button
                    key={color}
                    aria-pressed={isSelected}
                    onClick={() => {
                      setSelectedColor(color);
                      setSelectedSize(null);
                      updateUrlColor(color);
                      
                      const matchingImgIdx = findImageIndexForColor(color);
                      if (matchingImgIdx !== -1) setSelectedImageIdx(matchingImgIdx);
                    }}
                    className={cn(
                      "px-5 py-2.5 rounded-full text-xs font-bold uppercase border transition-all outline-none focus-visible:ring-2",
                      isSelected ? "bg-foreground text-background border-foreground shadow-lg" : "bg-transparent text-foreground border-border hover:border-foreground/50",
                      isColorStockEmpty && "opacity-50"
                    )}
                  >
                    {color}
                  </button>
                )
              })}
            </div>
          </div>

          {/* SIZE SELECTOR */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Size</span>
              {activeVariant && activeVariant.stock_quantity < 5 && activeVariant.stock_quantity > 0 && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 flex items-center gap-1 animate-pulse" role="status">
                  <AlertCircle size={12} /> Low Stock
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2" role="group" aria-label="Size Selection">
              {sizes.map((size) => {
                const variant = product.variants.find(v => v.size === size && v.color === selectedColor);
                const isAvailable = variant && variant.stock_quantity > 0;
                const isSelected = selectedSize === size;
                
                return (
                  <button
                    key={size}
                    onClick={() => isAvailable && setSelectedSize(size)}
                    disabled={!isAvailable}
                    aria-pressed={isSelected}
                    aria-label={`Size ${size} ${!isAvailable ? '(Out of stock)' : ''}`}
                    className={cn(
                      "h-14 rounded-lg border text-sm font-bold uppercase transition-all flex items-center justify-center outline-none focus-visible:ring-2",
                      isSelected ? "bg-primary text-primary-foreground border-primary shadow-md" : "bg-transparent text-foreground border-border",
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

          <div className="pt-4">
            <button
              onClick={handleAddToCart}
              disabled={!canAddToCart}
              aria-busy={isAdding}
              className={cn(
                "w-full h-16 rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-xl outline-none focus-visible:ring-2",
                isAdding ? "bg-emerald-600 text-white" : "bg-foreground text-background hover:opacity-90 active:scale-[0.98]",
                !canAddToCart && "opacity-50 cursor-not-allowed active:scale-100"
              )}
            >
              {isAdding ? (
                <><Loader2 size={20} className="animate-spin" /> Securing</>
              ) : isColorOutOfStock ? (
                "Sold Out"
              ) : !selectedSize ? (
                "Select a Size"
              ) : (
                <>Add to Bag <ShoppingBag size={20} /></>
              )}
            </button>
            <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-4">Fast fulfillment across Kenya</p>
          </div>

          <div className="border-t border-border pt-8 mt-8">
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Product Details</h2>
            <p className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{product.description || "Premium streetwear piece. Check label for care instructions."}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductShowcase({ product }: ProductShowcaseProps) {
  return (
    <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>}>
      <ShowcaseContent product={product} />
    </Suspense>
  );
}