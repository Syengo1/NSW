"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RefreshCcw, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { InventoryRow } from "./InventoryRow";

// --- STRICT TYPES ---
export type Variant = {
  id: string;
  size: string;
  color: string;
  stock_quantity: number;
  sku: string;
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  base_price: number;
  sale_price?: number | null;
  cost_price?: number | null;
  category: string;
  status: string;
  is_visible: boolean;
  product_images: { url: string }[];
  collections: { title: string }[] | { title: string } | null;
  variants: Variant[];
};

// Apply Product[] type to the incoming props
export function InventoryTable({ products: initialProducts }: { products: Product[] }) {
  const router = useRouter();
  const supabase = createClient();
  
  // Apply Product[] type to the state
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isConnected, setIsConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [flashingItems, setFlashingItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Realtime Connection
  useEffect(() => {
    const channel = supabase
      .channel('admin-inventory-live')
      .on(
        'postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'variants' }, 
        (payload) => {
          // Cast the incoming realtime payload strictly to our Variant type
          const updatedVariant = payload.new as Variant;
          
          setFlashingItems(prev => new Set(prev).add(updatedVariant.id));
          setTimeout(() => {
            setFlashingItems(prev => {
              const next = new Set(prev);
              next.delete(updatedVariant.id);
              return next;
            });
          }, 2000);

          // Because 'products' is typed, TS infers 'currentProducts', 'p', and 'v' automatically
          setProducts((currentProducts) => 
            currentProducts.map((p) => {
              if (p.variants.some((v) => v.id === updatedVariant.id)) {
                return {
                  ...p,
                  variants: p.variants.map((v) => 
                    v.id === updatedVariant.id ? { ...v, stock_quantity: updatedVariant.stock_quantity } : v
                  )
                };
              }
              return p;
            })
          );
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Use Partial<Product> to tell TS that 'updates' will only contain valid Product fields
  const updateProductState = (productId: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((p) => p.id === productId ? { ...p, ...updates } : p));
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm transition-all">
      {/* Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground items-center sticky top-0 z-10 backdrop-blur-sm">
        <div className="col-span-4">Product Identity</div>
        <div className="col-span-3 flex items-center gap-2">
           Inventory Health
           <button onClick={handleRefresh} disabled={isRefreshing} className="hover:text-primary focus:outline-none">
             <RefreshCcw size={12} className={cn(isRefreshing && "animate-spin")} />
           </button>
           <div className={cn("flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors", isConnected ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" : "text-amber-600 bg-amber-500/10 border-amber-500/20")}>
             <Activity size={10} className={cn(isConnected && "animate-pulse")} />
             {isConnected ? "LIVE FEED" : "CONNECTING..."}
           </div>
        </div>
        <div className="col-span-2 text-right">Pricing</div>
        <div className="col-span-3 text-right pr-4">Control Center</div>
      </div>

      <div className="flex flex-col">
        {/* TS now knows 'product' is of type Product */}
        {products.map((product) => (
          <InventoryRow 
            key={product.id} 
            product={product} 
            updateProductState={updateProductState} 
            flashingItems={flashingItems} 
          />
        ))}
      </div>
    </div>
  );
}