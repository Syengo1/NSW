"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { ShoppingBag, Share2, Check, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button"; 
import { useCartStore } from "@/lib/store/cart"; 

type ProductImage = {
  url: string;
  display_order: number;
  color_tag: string | null;
};

type Variant = {
  id: string;
  size: string;
  color: string;
  stock_quantity: number;
  price_adjustment: number;
  sku: string;
};

type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  base_price: number;
  sale_price: number | null;
  category: string;
  product_images: ProductImage[];
  variants: Variant[];
};

export default function ProductShowcase({ product }: { product: Product }) {
  // --- 1. SAFE DATA NORMALIZATION ---
  const normalizedVariants = useMemo(() => {
    return product.variants.map(v => ({
      ...v,
      color: v.color.trim(),
      size: v.size.trim(),
      normColor: v.color.trim().toLowerCase(),
    }));
  }, [product.variants]);

  const colors = Array.from(new Set(normalizedVariants.map(v => v.color)));
  const sizes = Array.from(new Set(normalizedVariants.map(v => v.size)));

  // --- 2. STATE ---
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [shake, setShake] = useState(false); 
  
  const imageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // --- 3. SMART DEFAULTS ---
  useEffect(() => {
    if (!selectedColor && colors.length > 0) {
      const firstInStock = colors.find(c => 
        normalizedVariants.some(v => v.color === c && v.stock_quantity > 0)
      );
      setSelectedColor(firstInStock || colors[0]);
    }
  }, [colors, normalizedVariants, selectedColor]);

  // Scroll to image on color change
  useEffect(() => {
    if (selectedColor) {
      const normColor = selectedColor.toLowerCase();
      // Try fuzzy match for "Off-White" -> "off-white"
      const ref = imageRefs.current[selectedColor] || imageRefs.current[normColor];
      if (ref) {
        ref.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      }
    }
  }, [selectedColor]);

  // --- 4. CALCULATION ---
  const activeVariant = normalizedVariants.find(
    v => v.color === selectedColor && v.size === selectedSize
  );

  const adjustment = activeVariant?.price_adjustment || 0;
  const currentBasePrice = (product.base_price + adjustment) / 100;
  const currentSalePrice = product.sale_price ? (product.sale_price + adjustment) / 100 : null;
  const isOnSale = !!currentSalePrice;
  const discountPercent = isOnSale 
    ? Math.round(((currentBasePrice - currentSalePrice) / currentBasePrice) * 100)
    : 0;

  // --- 5. CART INTEGRATION ---
  const { addItem } = useCartStore(); 

  const handleAddToCart = () => {
    if (!selectedColor || !selectedSize || !activeVariant) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    setIsAdding(true);

    // Smart Image Matcher: Looks for exact tag, then lowercase, then partial inclusion
    const variantImage = product.product_images.find(
      img => {
        if (!img.color_tag) return false;
        const tag = img.color_tag.toLowerCase();
        const selected = selectedColor.toLowerCase();
        return tag === selected || selected.includes(tag) || tag.includes(selected);
      }
    )?.url || product.product_images[0]?.url;

    addItem({
      variantId: activeVariant.id,
      productId: product.id,
      name: product.title,
      slug: product.slug,
      price: product.sale_price ? (product.sale_price + adjustment) : (product.base_price + adjustment),
      image: variantImage,
      size: selectedSize,
      color: selectedColor,
      quantity: 1,
      maxStock: activeVariant.stock_quantity
    });

    setTimeout(() => {
      setIsAdding(false);
    }, 600);
  };

  return (
    <div className="lg:grid lg:grid-cols-2 min-h-screen">
      
      {/* GALLERY */}
      <div className="relative bg-neutral-100 dark:bg-neutral-900 w-full overflow-x-auto lg:overflow-visible snap-x snap-mandatory flex lg:block scrollbar-hide h-[55vh] lg:h-auto">
        {product.product_images.length > 0 ? (
          product.product_images.map((img, idx) => (
            <div 
              key={idx} 
              ref={(el) => {
                if (img.color_tag) {
                  // Register refs for both exact and lowercase tags
                  imageRefs.current[img.color_tag] = el;
                  imageRefs.current[img.color_tag.toLowerCase()] = el;
                }
              }}
              className="relative w-full h-full flex-shrink-0 snap-center border-b border-border/5 lg:mb-1 last:mb-0"
            >
              <img 
                src={img.url} 
                alt={`${product.title} view ${idx + 1}`} 
                className="w-full h-full object-cover"
                loading={idx === 0 ? "eager" : "lazy"}
              />
            </div>
          ))
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary text-muted-foreground font-mono text-sm uppercase">
            No Visuals Available
          </div>
        )}

        {product.product_images.length > 1 && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 lg:hidden z-10">
            {product.product_images.map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/80 shadow-sm backdrop-blur-md" />
            ))}
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <div className="relative z-20 bg-background">
        <div className="p-6 pt-8 lg:p-12 xl:p-20 flex flex-col justify-center h-full lg:sticky lg:top-16 lg:min-h-[calc(100vh-4rem)]">
          <div className="max-w-lg mx-auto w-full space-y-10">
              
              {/* Header */}
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                      <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9]">
                        {product.title}
                      </h1>
                      <p className="text-xs font-bold font-mono text-muted-foreground uppercase tracking-[0.2em]">
                        {product.category}
                      </p>
                  </div>
                  <button className="p-3 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground">
                      <Share2 size={20} strokeWidth={1.5} />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                    {isOnSale ? (
                      <div className="flex items-baseline gap-3">
                        <span className="text-3xl font-black text-red-600">
                          {formatCurrency(currentSalePrice)}
                        </span>
                        <span className="text-lg text-muted-foreground line-through decoration-2 decoration-red-500/20 font-medium">
                          {formatCurrency(currentBasePrice)}
                        </span>
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest rounded-sm">
                          {discountPercent}% OFF
                        </span>
                      </div>
                    ) : (
                      <span className="text-3xl font-black text-foreground">
                        {formatCurrency(currentBasePrice)}
                      </span>
                    )}
                </div>
              </div>

              {/* Selectors */}
              <div className="space-y-8 border-t border-border pt-8">
                
                {/* Colors */}
                <div className="space-y-4">
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Color <span className="text-foreground ml-2">— {selectedColor}</span>
                  </span>
                  <div className="flex flex-wrap gap-3">
                      {colors.map((color) => {
                        const isSelected = selectedColor === color;
                        const isOutOfStock = !normalizedVariants.some(v => v.color === color && v.stock_quantity > 0);
                        
                        // --- THE FIX: SMART WHITE DETECTION ---
                        // We check if the string contains "white" (case-insensitive)
                        // This catches "White", "Off-White", "Cream White", "Vintage White"
                        const isLightColor = color.toLowerCase().includes('white');
                        
                        return (
                          <button
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            disabled={isOutOfStock}
                            className={cn(
                              "group relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300",
                              isSelected 
                                ? "ring-1 ring-offset-4 ring-foreground scale-110" 
                                : "ring-1 ring-transparent hover:ring-border hover:scale-105",
                              isOutOfStock && "opacity-40 grayscale cursor-not-allowed"
                            )}
                            title={color}
                          >
                              <span 
                                className={cn(
                                  "w-12 h-12 rounded-full shadow-sm",
                                  // Apply border to ANY white-ish color so it doesn't disappear
                                  isLightColor ? "border border-neutral-300 dark:border-neutral-700" : "border-transparent"
                                )}
                                // If it's a known invalid CSS name like "Off-White", this style might fail to render a background.
                                // But the border above ensures the circle is always visible regardless.
                                style={{ backgroundColor: color }} 
                              />
                              
                              {/* Smart Contrast: Dark checkmark for light colors, Light checkmark for dark colors */}
                              {isSelected && (
                                <span className={cn(
                                  "absolute inset-0 flex items-center justify-center animate-in fade-in zoom-in duration-200",
                                  isLightColor ? "text-black" : "text-white mix-blend-difference"
                                )}>
                                  <Check size={20} strokeWidth={3} />
                                </span>
                              )}

                              {isOutOfStock && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-full h-0.5 bg-red-500/80 -rotate-45" />
                                </div>
                              )}
                          </button>
                        )
                      })}
                  </div>
                </div>

                {/* Sizes */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Size</span>
                      {activeVariant && activeVariant.stock_quantity < 5 && activeVariant.stock_quantity > 0 && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-red-500 flex items-center gap-1 animate-pulse">
                          <AlertCircle size={10} />
                          Only {activeVariant.stock_quantity} Left
                        </span>
                      )}
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                      {sizes.map((size) => {
                        const variant = normalizedVariants.find(v => v.size === size && v.color === selectedColor);
                        const isAvailable = variant && variant.stock_quantity > 0;
                        return (
                          <button
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            disabled={!isAvailable}
                            className={cn(
                              "h-14 border text-sm font-bold uppercase transition-all duration-200 flex items-center justify-center",
                              selectedSize === size 
                                ? "bg-foreground text-background border-foreground shadow-xl translate-y-[-2px]" 
                                : "bg-background text-foreground border-border hover:border-foreground/50",
                              !isAvailable && "opacity-40 cursor-not-allowed bg-secondary text-muted-foreground decoration-slate-500 line-through"
                            )}
                          >
                            {size}
                          </button>
                        )
                      })}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className={cn("space-y-4 pt-6 transition-all", shake && "animate-shake")}>
                <Button 
                  size="lg" 
                  className={cn(
                    "w-full h-16 text-base font-black uppercase tracking-[0.2em] rounded-none shadow-2xl transition-all duration-300",
                    isAdding ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                  )}
                  disabled={isAdding || (activeVariant?.stock_quantity === 0)}
                  onClick={handleAddToCart}
                >
                  {isAdding ? (
                    <span className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                       <Check size={20} /> Added to Bag
                    </span>
                  ) : !selectedColor || !selectedSize ? (
                    "Select Options"
                  ) : !activeVariant ? (
                    "Out of Stock"
                  ) : (
                    <span className="flex items-center gap-2">
                      Add to Bag <ShoppingBag size={18} />
                    </span>
                  )}
                </Button>
                
                <p className="text-center text-[10px] text-muted-foreground uppercase tracking-widest opacity-60">
                  Free shipping on orders over KES 10,000
                </p>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}