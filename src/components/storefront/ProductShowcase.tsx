"use client";

import { useState, useEffect, useRef } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { ShoppingBag, Heart, Share2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming you have shadcn button
// If you have a specific Cart Context, import it here. 
// Otherwise, this component manages the selection state perfectly.

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
  description: string;
  base_price: number;
  sale_price: number | null;
  category: string;
  product_images: ProductImage[];
  variants: Variant[];
};

export default function ProductShowcase({ product }: { product: Product }) {
  // 1. INTELLIGENT STATE
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  
  // Get unique colors/sizes from variants
  const colors = Array.from(new Set(product.variants.map(v => v.color)));
  const sizes = Array.from(new Set(product.variants.map(v => v.size)));
  
  // Refs for scrolling to images
  const imageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 2. SMART DEFAULTS & IMAGE SWITCHING
  useEffect(() => {
    // Set default color if not set
    if (!selectedColor && colors.length > 0) {
      setSelectedColor(colors[0]);
    }
  }, [colors, selectedColor]);

  // Scroll to image when color changes
  useEffect(() => {
    if (selectedColor && imageRefs.current[selectedColor]) {
      imageRefs.current[selectedColor]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'center' // For mobile horizontal scroll
      });
    }
  }, [selectedColor]);

  // 3. PRICING LOGIC
  // Calculate dynamic price based on variant adjustment (e.g. XXL +200)
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

  return (
    <div className="lg:grid lg:grid-cols-2 min-h-[calc(100vh-4rem)]">
      
      {/* --- LEFT: SMART GALLERY --- */}
      {/* Mobile: Horizontal Scroll (Carousel) | Desktop: Vertical Stack */}
      <div className="relative bg-neutral-100 lg:bg-neutral-50 w-full overflow-x-auto lg:overflow-visible snap-x snap-mandatory flex lg:block scrollbar-hide h-[50vh] lg:h-auto">
        {product.product_images.length > 0 ? (
          product.product_images.map((img, idx) => {
            // Logic: Is this the "Active" image for the selected color?
            const isMatch = selectedColor && img.color_tag === selectedColor;
            
            return (
              <div 
                key={idx} 
                // Assign ref if this image matches a color tag
                ref={(el) => {
                  if (img.color_tag) imageRefs.current[img.color_tag] = el;
                }}
                className={cn(
                  "relative w-full h-full flex-shrink-0 snap-center border-r lg:border-r-0 lg:border-b border-white/20",
                  // Highlight logic for debugging or visual flair could go here
                )}
              >
                <img 
                  src={img.url} 
                  alt={`${product.title} - ${img.color_tag || 'View'}`} 
                  className="w-full h-full object-cover"
                />
                
                {/* Mobile Scrim */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent lg:hidden" />
              </div>
            );
          })
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-200 text-neutral-400">
            NO IMAGE
          </div>
        )}
        
        {/* Mobile: Pagination Dots Helper */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 lg:hidden">
           {product.product_images.map((_, i) => (
             <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/50 backdrop-blur-sm" />
           ))}
        </div>
      </div>

      {/* --- RIGHT: CONTROL PANEL --- */}
      <div className="relative p-6 pt-8 lg:p-12 xl:p-20 flex flex-col justify-center bg-background">
         <div className="max-w-lg mx-auto w-full space-y-8">
            
            {/* 1. Header & Price */}
            <div className="space-y-4">
               <div className="flex justify-between items-start">
                 <div>
                    <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-[0.9]">
                      {product.title}
                    </h1>
                    <p className="text-sm font-mono text-muted-foreground mt-2 uppercase tracking-widest">
                       {product.category}
                    </p>
                 </div>
                 {/* Share / Wishlist */}
                 <button className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground">
                    <Share2 size={20} />
                 </button>
               </div>

               {/* Smart Price Display */}
               <div className="flex items-baseline gap-3 mt-4">
                  {isOnSale ? (
                    <>
                        {/* Add suppressHydrationWarning */}
                        <span 
                        className="text-3xl font-bold text-red-600"
                        suppressHydrationWarning 
                        >
                        {formatCurrency(currentSalePrice)}
                        </span>
                        <span 
                        className="text-lg text-muted-foreground line-through decoration-2 decoration-red-500/30"
                        suppressHydrationWarning
                        >
                        {formatCurrency(currentBasePrice)}
                        </span>
                        {/* ... badge ... */}
                    </>
                    ) : (
                    <span 
                        className="text-3xl font-bold"
                        suppressHydrationWarning
                    >
                        {formatCurrency(currentBasePrice)}
                    </span>
                    )}
               </div>
            </div>

            {/* 2. Selectors */}
            <div className="space-y-6 border-t border-border pt-6">
              
              {/* Colors */}
              <div className="space-y-3">
                 <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                   Color <span className="text-foreground ml-2">{selectedColor}</span>
                 </span>
                 <div className="flex flex-wrap gap-3">
                    {colors.map((color) => {
                       // Find if this color is out of stock across all sizes
                       const isOutOfStock = !product.variants.some(v => v.color === color && v.stock_quantity > 0);
                       
                       return (
                         <button
                           key={color}
                           onClick={() => setSelectedColor(color)}
                           disabled={isOutOfStock}
                           className={cn(
                             "group relative w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all",
                             selectedColor === color ? "border-foreground scale-110" : "border-transparent hover:border-border",
                             isOutOfStock && "opacity-50 cursor-not-allowed"
                           )}
                         >
                            <div 
                              className="w-full h-full rounded-full border border-black/10" 
                              style={{ backgroundColor: color.toLowerCase() }} 
                            />
                            {isOutOfStock && <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-0.5 bg-red-500 -rotate-45" /></div>}
                         </button>
                       )
                    })}
                 </div>
              </div>

              {/* Sizes */}
              <div className="space-y-3">
                 <div className="flex justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Select Size</span>
                    <button className="text-[10px] underline uppercase tracking-widest text-muted-foreground hover:text-foreground">Size Guide</button>
                 </div>
                 <div className="grid grid-cols-4 gap-2">
                    {sizes.map((size) => {
                       // Check stock for this specific Size + Active Color combination
                       const variant = product.variants.find(v => v.size === size && v.color === selectedColor);
                       const isAvailable = variant && variant.stock_quantity > 0;
                       
                       return (
                         <button
                           key={size}
                           onClick={() => setSelectedSize(size)}
                           disabled={!isAvailable}
                           className={cn(
                             "h-12 border text-sm font-bold uppercase transition-all",
                             selectedSize === size 
                               ? "bg-foreground text-background border-foreground" 
                               : "bg-background text-foreground border-border hover:border-foreground",
                             !isAvailable && "opacity-40 cursor-not-allowed bg-muted text-muted-foreground decoration-slate-500 line-through"
                           )}
                         >
                           {size}
                         </button>
                       )
                    })}
                 </div>
              </div>
            </div>

            {/* 3. Action Buttons */}
            <div className="space-y-4 pt-4">
              <Button 
                size="lg" 
                className="w-full h-14 text-base font-black uppercase tracking-widest rounded-none"
                disabled={!selectedColor || !selectedSize}
                // onClick={ ... Add to Cart Logic Here ... }
              >
                {!selectedColor || !selectedSize ? "Select Options" : "Add to Cart"}
                <ShoppingBag className="ml-2 h-4 w-4" />
              </Button>
              
              <p className="text-center text-xs text-muted-foreground">
                Free shipping on orders over KES 10,000
              </p>
            </div>

            {/* 4. Manifesto */}
            <div className="pt-8 border-t border-border">
               <h4 className="text-xs font-bold uppercase tracking-widest mb-3">The Details</h4>
               <p className="text-sm text-muted-foreground leading-relaxed">
                 {product.description}
               </p>
            </div>

         </div>
      </div>
    </div>
  );
}