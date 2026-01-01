'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, AlertCircle, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/lib/store/cart';

// 1. Strict Type Definitions
type Variant = {
  id: string;
  size: string;
  color: string;
  stock_quantity: number;
  price_adjustment: number;
  sku: string;
};

interface VariantSelectorProps {
  variants: Variant[];
  basePrice: number;
  // Metadata needed for the Cart Item
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string;
}

export default function VariantSelector({ 
  variants, 
  basePrice,
  productId,
  productName,
  productSlug,
  productImage
}: VariantSelectorProps) {
  
  // 2. Zustand Store Integration
  const { addItem, openCart } = useCartStore();

  // 3. Extract Unique Options
  // We use Sets to ensure no duplicate buttons
  const colors = Array.from(new Set(variants.map(v => v.color)));
  const sizes = Array.from(new Set(variants.map(v => v.size)));

  // 4. Selection State
  // Auto-select color if there's only one option
  const [selectedColor, setSelectedColor] = useState<string>(colors.length === 1 ? colors[0] : colors[0]);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isShake, setIsShake] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 5. Derived State (Active Variant)
  const activeVariant = variants.find(
    v => v.color === selectedColor && v.size === selectedSize
  );

  const isOutOfStock = activeVariant ? activeVariant.stock_quantity <= 0 : false;
  
  // Calculate dynamic price
  const price = activeVariant 
    ? basePrice + activeVariant.price_adjustment 
    : basePrice;

  // 6. Action Handlers
  const handleAddToCart = () => {
    // Validation: Must select size
    if (!selectedSize || !activeVariant) {
      setIsShake(true);
      setTimeout(() => setIsShake(false), 500); // Reset shake after 500ms
      return;
    }

    // Validation: Stock check
    if (isOutOfStock) return;

    // Add to Global Store
    addItem({
      variantId: activeVariant.id,
      productId: productId,
      name: productName,
      slug: productSlug,
      price: price,
      image: productImage, // You could enhance this to find a variant-specific image if available
      size: selectedSize,
      color: selectedColor,
      quantity: 1,
      maxStock: activeVariant.stock_quantity
    });

    // UX Feedback
    setIsSuccess(true);
    setTimeout(() => {
        setIsSuccess(false);
        openCart(); // Open the drawer so they can checkout
    }, 600);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* SECTION: PRICE & STOCK STATUS */}
      <div className="pb-6 border-b border-gray-200">
        <h3 className="text-3xl font-mono tracking-tighter text-gray-900">
          KES {(price / 100).toLocaleString()}
        </h3>
        
        {isOutOfStock && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 rounded-full">
            <AlertCircle size={14} className="text-red-600" /> 
            <span className="text-xs font-bold uppercase tracking-widest text-red-700">Sold Out</span>
          </div>
        )}
      </div>

      {/* SECTION: COLOR SELECTOR */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
          Color: <span className="text-gray-900">{selectedColor}</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => {
                setSelectedColor(color);
                setSelectedSize(null); // Reset size to force user to re-check availability
              }}
              className={cn(
                "px-5 py-2.5 text-sm border transition-all uppercase font-bold tracking-wide",
                selectedColor === color
                  ? "border-gray-900 bg-gray-900 text-white shadow-md"
                  : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900 bg-white"
              )}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION: SIZE SELECTOR */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase tracking-widest text-gray-500">
            Size: <span className="text-gray-900">{selectedSize || 'Select'}</span>
            </label>
            {/* Optional: Add Size Guide Link Here */}
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {sizes.map((size) => {
            // Check availability for this specific size + selected color combination
            const variantForSize = variants.find(
              v => v.color === selectedColor && v.size === size
            );
            const isAvailable = variantForSize && variantForSize.stock_quantity > 0;
            const doesNotExist = !variantForSize;

            return (
              <button
                key={size}
                disabled={doesNotExist} 
                onClick={() => isAvailable && setSelectedSize(size)}
                className={cn(
                  "py-3 text-sm border transition-all uppercase font-bold relative overflow-hidden",
                  selectedSize === size
                    ? "border-amber-500 bg-amber-500 text-white shadow-md ring-2 ring-amber-200" // Active State
                    : "bg-white",
                  
                  // Inactive but available
                  selectedSize !== size && isAvailable && "border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900",
                  
                  // Out of Stock styling
                  !isAvailable && !doesNotExist && "opacity-50 cursor-not-allowed bg-gray-50 border-gray-100 text-gray-300 decoration-slice line-through",
                  
                  // Does not exist for this color
                  doesNotExist && "opacity-20 cursor-not-allowed bg-gray-50 border-transparent text-gray-200"
                )}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION: ADD TO CART BUTTON */}
      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        className={cn(
          "w-full py-5 font-black uppercase tracking-widest text-lg transition-all flex items-center justify-center gap-3 shadow-xl relative overflow-hidden group",
          // Shake Animation
          isShake && "animate-[shake_0.5s_ease-in-out]",
          // Disabled State
          (isOutOfStock) 
            ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200" 
            : "bg-gray-900 text-white hover:bg-black hover:scale-[1.01] active:scale-[0.99]",
          // Success State
          isSuccess && "bg-green-600 text-white"
        )}
      >
        {isSuccess ? (
             <>
               <Check size={24} className="animate-bounce" /> Added to Bag
             </>
        ) : isOutOfStock ? (
            "Sold Out"
        ) : !selectedSize ? (
            "Select Options"
        ) : (
          <>
            <span>Add To Cart</span>
            <ShoppingBag size={20} className="group-hover:-translate-y-1 transition-transform" />
          </>
        )}
      </button>

      {/* FOOTER BADGE */}
      <div className="flex items-center gap-2 text-[10px] text-gray-400 justify-center uppercase tracking-widest font-mono">
         <Check size={12} className="text-green-500" />
         Authentic Nairobi Hardware • Fast Delivery
      </div>

    </div>
  );
}