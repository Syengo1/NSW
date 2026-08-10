"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { EyeOff, ImageIcon, ExternalLink, Edit2, Loader2 } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { toggleProductVisibility } from "@/app/(dashboard)/admin/products/actions";
import { toast } from "sonner";
import { VariantMatrix } from "./VariantMatrix";
import type { Product, Variant } from "./InventoryTable";

interface InventoryRowProps {
  product: Product;
  updateProductState: (productId: string, updates: Partial<Product>) => void;
  flashingItems: Set<string>;
}

export function InventoryRow({ product, updateProductState, flashingItems }: InventoryRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalStock = product.variants?.reduce((acc: number, v: Variant) => acc + v.stock_quantity, 0) || 0;
  const mainImage = product.product_images?.[0]?.url;
  const isOnSale = product.sale_price && product.sale_price < product.base_price;
  const isCritical = totalStock === 0;
  const isLow = totalStock > 0 && totalStock < 10;

  const activePrice = product.sale_price ? product.sale_price : product.base_price;
  const rawCost = product.cost_price || 0;
  const profitMargin = activePrice > 0 ? Math.round(((activePrice - rawCost) / activePrice) * 100) : 0;

  const toggleRow = () => {
    setIsExpanded(!isExpanded);
  };

  const handleGhostMode = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateProductState(product.id, { is_visible: !product.is_visible });

    startTransition(async () => {
      try {
        await toggleProductVisibility(product.id, product.is_visible);
      } catch {
        updateProductState(product.id, { is_visible: product.is_visible });
        toast.error("Failed to toggle visibility");
      }
    });
  };

  return (
    <div className={cn("group transition-colors duration-200 border-b border-border/50", !product.is_visible ? "bg-muted/30" : "bg-card hover:bg-muted/5")}>
      <div onClick={toggleRow} className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 items-center cursor-pointer">
        
        {/* 1. Identity */}
        <div className="col-span-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg border border-border overflow-hidden bg-secondary relative shrink-0 flex items-center justify-center">
            {mainImage ? (
              <Image 
                src={mainImage} alt={product.title} fill sizes="48px"
                className={cn("object-cover transition-all", !product.is_visible && "grayscale opacity-50")} 
              />
            ) : <ImageIcon size={20} className="text-muted-foreground" />}
            {!product.is_visible && <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[1px]"><EyeOff size={14} className="text-white drop-shadow-md"/></div>}
          </div>
          <div className="min-w-0">
            <div className="font-bold uppercase text-sm flex items-center gap-2 truncate">
              {product.title}
              {isOnSale && <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded shadow-sm animate-pulse shrink-0">SALE</span>}
            </div>
            <div className="text-[10px] text-muted-foreground font-mono truncate flex items-center gap-1">
              {product.category}
              {isCritical && <span className="text-red-500 font-bold ml-1">• OUT OF STOCK</span>}
            </div>
          </div>
        </div>

        {/* 2. Stock */}
        <div className="col-span-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold">
              <span className={cn("transition-colors", isCritical ? "text-red-600" : isLow ? "text-orange-500" : "text-emerald-600")}>
                {totalStock} Units
              </span>
            </div>
            <div className="h-1.5 w-32 bg-secondary rounded-full mt-1.5 overflow-hidden relative">
              <div 
                className={cn("h-full transition-all duration-700 ease-out", isCritical ? "bg-red-500" : isLow ? "bg-orange-500" : "bg-emerald-500")} 
                style={{ width: `${Math.min(Math.max(totalStock, 5), 100)}%` }} 
              />
            </div>
        </div>

        {/* 3. Price & Profit */}
        <div className="col-span-2 text-right font-mono text-sm">
             <div className="flex flex-col items-end">
                {isOnSale ? (
                  <div>
                    <span className="text-red-600 font-bold">{formatCurrency(product.sale_price! / 100)}</span>
                    <div className="text-[10px] text-muted-foreground line-through decoration-red-500/30">{formatCurrency(product.base_price / 100)}</div>
                  </div>
                ) : (
                  <span className="font-bold">{formatCurrency(product.base_price / 100)}</span>
                )}
                
                {/* Visual Profit Margin Indicator */}
                {rawCost > 0 && (
                  <div className="text-[9px] font-mono tracking-wider mt-0.5">
                    <span className="text-muted-foreground/60 uppercase">Cost: {formatCurrency(rawCost / 100)}</span>
                    <span className={cn("ml-1 font-bold", profitMargin >= 50 ? "text-emerald-500" : profitMargin >= 30 ? "text-amber-500" : "text-red-500")}>
                      ({profitMargin}%)
                    </span>
                  </div>
                )}
             </div>
        </div>

        {/* 4. Controls */}
        <div className="col-span-3 flex justify-end gap-2 items-center pl-4">
            <button 
              onClick={handleGhostMode} 
              disabled={isPending}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border transition-all active:scale-95", 
                product.is_visible ? "text-emerald-600 border-emerald-500/20 hover:bg-emerald-50" : "text-neutral-500 border-neutral-500/20 hover:bg-neutral-100",
                isPending && "opacity-50 cursor-not-allowed"
              )}
            >
              {isPending ? <Loader2 size={10} className="animate-spin" /> : <span className={cn("w-1.5 h-1.5 rounded-full shadow-sm", product.is_visible ? "bg-emerald-500" : "bg-neutral-400")} />}
              {product.is_visible ? "Live" : "Ghost"}
            </button>
            
            <Link href={`/product/${product.slug}`} target="_blank" onClick={e => e.stopPropagation()} className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"><ExternalLink size={16}/></Link>
            
            {/* FULL PAGE EDIT UPGRADE: Routes cleanly to the prefilled edit page to allow safe modifications */}
            <Link href={`/admin/products/new?editId=${product.id}`} onClick={e => e.stopPropagation()} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors">
              <Edit2 size={16}/>
            </Link>
        </div>
      </div>

      {isExpanded && (
        <VariantMatrix 
          variants={product.variants} 
          isEditing={false} 
          editValues={{ basePrice: 0, salePrice: '', costPrice: 0, variants: {} }} // Fallbacks for Typescript
          setEditValues={() => {}} 
          flashingItems={flashingItems} 
        />
      )}
    </div>
  );
}