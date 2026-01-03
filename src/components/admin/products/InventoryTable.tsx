"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client"; // Browser Client for Realtime
import { 
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, 
  XCircle, ExternalLink, Edit2, Save, Loader2, 
  Eye, EyeOff, ImageIcon, RefreshCcw, Activity, Zap
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { updateQuickEdit, toggleProductVisibility } from "@/app/(dashboard)/admin/products/actions";
import { toast } from "sonner"; // Assuming you use sonner, otherwise replace with alert

// --- TYPES ---
type Variant = {
  id: string;
  size: string;
  color: string;
  stock_quantity: number;
  sku: string;
};

type Product = {
  id: string;
  title: string;
  slug: string;
  base_price: number;
  sale_price?: number | null;
  category: string;
  status: string;
  is_visible: boolean;
  product_images: { url: string }[];
  collections: { title: string }[] | { title: string } | null;
  variants: Variant[];
};

export function InventoryTable({ products: initialProducts }: { products: Product[] }) {
  const router = useRouter();
  const supabase = createClient();
  
  // --- STATE ---
  // We put products in state so we can mutate them via Realtime updates
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isConnected, setIsConnected] = useState(false);
  
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Track recently updated items for "Flash" effect
  const [flashingItems, setFlashingItems] = useState<Set<string>>(new Set());

  // Edit State
  const [editValues, setEditValues] = useState<{ price: number; variants: Record<string, number> }>({
    price: 0, variants: {}
  });

  // Sync props to state if server revalidates (e.g. manual refresh)
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // --- 1. INTELLIGENT REALTIME LISTENER ---
  useEffect(() => {
    const channel = supabase
      .channel('admin-inventory-live')
      .on(
        'postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'variants' }, 
        (payload) => {
          const updatedVariant = payload.new as Variant;
          
          // Trigger Flash Effect
          setFlashingItems(prev => new Set(prev).add(updatedVariant.id));
          setTimeout(() => {
            setFlashingItems(prev => {
              const next = new Set(prev);
              next.delete(updatedVariant.id);
              return next;
            });
          }, 2000); // Flash for 2 seconds

          // Update State Surgically
          setProducts((currentProducts) => 
            currentProducts.map((p) => {
              // Only update the product containing this variant
              if (p.variants.some(v => v.id === updatedVariant.id)) {
                return {
                  ...p,
                  variants: p.variants.map(v => 
                    v.id === updatedVariant.id 
                      ? { ...v, stock_quantity: updatedVariant.stock_quantity } 
                      : v
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

  // --- ACTIONS ---
  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const toggleRow = (id: string) => {
    if (editingId === id) return; 
    setExpandedId(expandedId === id ? null : id);
  };

  const startEditing = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setEditingId(product.id);
    setExpandedId(product.id);
    const variantStock: Record<string, number> = {};
    product.variants.forEach(v => { variantStock[v.id] = v.stock_quantity });
    setEditValues({
      price: product.base_price / 100,
      variants: variantStock
    });
  };

  const saveEdits = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    
    // Optimistic Update (Update UI before Server responds)
    setProducts(prev => prev.map(p => {
        if (p.id === productId) {
            return {
                ...p,
                base_price: Math.round(editValues.price * 100),
                variants: p.variants.map(v => ({
                    ...v,
                    stock_quantity: editValues.variants[v.id] ?? v.stock_quantity
                }))
            };
        }
        return p;
    }));

    setEditingId(null);
    toast.success("Updating inventory...");

    startTransition(async () => {
      try {
        // 1. Save Price
        await updateQuickEdit('product_price', productId, editValues.price);
        
        // 2. Save All Changed Variants
        const promises = Object.entries(editValues.variants).map(([varId, stock]) => 
          updateQuickEdit('variant_stock', varId, stock)
        );
        await Promise.all(promises);
        
        toast.success("Inventory synced successfully");
        router.refresh(); // Fetch authoritative data to ensure sync
      } catch (err) {
        toast.error("Failed to save changes");
        router.refresh(); // Revert to server state
      }
    });
  };

  const handleGhostMode = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    
    // Optimistic Toggle
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_visible: !p.is_visible } : p));

    startTransition(async () => {
      try {
        await toggleProductVisibility(product.id, product.is_visible);
      } catch (err) {
        // Revert on error
        setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_visible: product.is_visible } : p));
        toast.error("Failed to toggle visibility");
      }
    });
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm transition-all">
      {/* Intelligent Header */}
      <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground items-center sticky top-0 z-10 backdrop-blur-sm">
        <div className="col-span-4">Product Identity</div>
        <div className="col-span-3 flex items-center gap-2">
           Inventory Health
           <button onClick={handleRefresh} disabled={isRefreshing} className="hover:text-primary transition-colors focus:outline-none" title="Force Sync">
             <RefreshCcw size={12} className={cn(isRefreshing && "animate-spin")} />
           </button>
           
           {/* Connection Status Indicator */}
           <div className={cn(
             "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border transition-colors",
             isConnected 
               ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" 
               : "text-amber-600 bg-amber-500/10 border-amber-500/20"
           )}>
             <Activity size={10} className={cn(isConnected && "animate-pulse")} />
             {isConnected ? "LIVE FEED" : "CONNECTING..."}
           </div>
        </div>
        <div className="col-span-2 text-right">Pricing</div>
        <div className="col-span-3 text-right pr-4">Control Center</div>
      </div>

      <div className="divide-y divide-border">
        {products.map((product) => {
          const isExpanded = expandedId === product.id;
          const isEditing = editingId === product.id;
          
          // Live Calculations
          const totalStock = product.variants?.reduce((acc, v) => acc + v.stock_quantity, 0) || 0;
          const mainImage = product.product_images?.[0]?.url;
          const isOnSale = product.sale_price && product.sale_price < product.base_price;
          
          // Stock Health Logic
          const isCritical = totalStock === 0;
          const isLow = totalStock > 0 && totalStock < 10;

          return (
            <div key={product.id} className={cn("group transition-colors duration-200", !product.is_visible ? "bg-muted/30" : "bg-card hover:bg-muted/5")}>
              <div onClick={() => toggleRow(product.id)} className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 items-center cursor-pointer">
                
                {/* 1. Identity */}
                <div className="col-span-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg border border-border overflow-hidden bg-secondary relative shrink-0">
                    {mainImage ? (
                      <img src={mainImage} className={cn("w-full h-full object-cover transition-all", !product.is_visible && "grayscale opacity-50")} />
                    ) : <div className="p-3"><ImageIcon size={20} className="text-muted-foreground" /></div>}
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

                {/* 2. Stock (Smart Bar) */}
                <div className="col-span-3">
                   <div className="flex items-center gap-2 text-xs font-mono font-bold">
                      <span className={cn("transition-colors", isCritical ? "text-red-600" : isLow ? "text-orange-500" : "text-emerald-600")}>
                        {totalStock} Units
                      </span>
                   </div>
                   {/* Visual Stock Meter */}
                   <div className="h-1.5 w-32 bg-secondary rounded-full mt-1.5 overflow-hidden relative">
                      <div 
                        className={cn(
                          "h-full transition-all duration-700 ease-out", 
                          isCritical ? "bg-red-500" : isLow ? "bg-orange-500" : "bg-emerald-500"
                        )} 
                        style={{ width: `${Math.min(Math.max(totalStock, 5), 100)}%` }} 
                      />
                   </div>
                </div>

                {/* 3. Price */}
                <div className="col-span-2 text-right font-mono text-sm">
                  {isEditing ? (
                     <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                       <input 
                         type="number" 
                         value={editValues.price}
                         onChange={e => setEditValues({...editValues, price: parseFloat(e.target.value)})}
                         className="w-20 bg-background border border-primary text-right px-2 py-1 rounded text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                       />
                     </div>
                  ) : (
                    isOnSale ? (
                      <div>
                        <span className="text-red-600 font-bold">{formatCurrency(product.sale_price! / 100)}</span>
                        <div className="text-[10px] text-muted-foreground line-through decoration-red-500/30">{formatCurrency(product.base_price / 100)}</div>
                      </div>
                    ) : (
                      formatCurrency(product.base_price / 100)
                    )
                  )}
                </div>

                {/* 4. Control Center */}
                <div className="col-span-3 flex justify-end gap-2 items-center pl-4">
                   {!isEditing && (
                     <button 
                        onClick={(e) => handleGhostMode(e, product)} 
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border transition-all active:scale-95", 
                          product.is_visible 
                            ? "text-emerald-600 border-emerald-500/20 hover:bg-emerald-50 hover:border-emerald-500/40" 
                            : "text-neutral-500 border-neutral-500/20 hover:bg-neutral-100"
                        )}
                      >
                       <span className={cn("w-1.5 h-1.5 rounded-full shadow-sm", product.is_visible ? "bg-emerald-500" : "bg-neutral-400")} />
                       {product.is_visible ? "Live" : "Ghost"}
                     </button>
                   )}
                   
                   {isEditing ? (
                     <div className="flex gap-1 animate-in zoom-in-50 duration-200" onClick={e => e.stopPropagation()}>
                       <button onClick={(e) => saveEdits(e, product.id)} className="bg-emerald-600 text-white p-2 rounded hover:bg-emerald-500 shadow-sm"><Save size={14}/></button>
                       <button onClick={() => setEditingId(null)} className="bg-red-50 text-red-600 p-2 rounded hover:bg-red-100 border border-red-100"><XCircle size={14}/></button>
                     </div>
                   ) : (
                     <>
                        <Link href={`/product/${product.slug}`} target="_blank" onClick={e => e.stopPropagation()} className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"><ExternalLink size={16}/></Link>
                        <button onClick={(e) => startEditing(e, product)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"><Edit2 size={16}/></button>
                     </>
                   )}
                </div>
              </div>

              {/* EXPANDED MATRIX (Live Data) */}
              {isExpanded && (
                <div className="bg-muted/30 border-t border-border/50 p-6 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 gap-4">
                     <div>
                        <div className="flex justify-between items-end mb-3">
                           <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                             Variant Matrix
                             {flashingItems.size > 0 && products.find(p => p.id === product.id)?.variants.some(v => flashingItems.has(v.id)) && (
                               <span className="text-emerald-500 flex items-center gap-1 animate-pulse"><Zap size={10} fill="currentColor"/> Updating</span>
                             )}
                           </h4>
                        </div>
                        
                        <div className="border border-border rounded-lg overflow-hidden shadow-sm bg-card">
                          <table className="w-full text-xs text-left">
                             <thead className="text-[10px] uppercase text-muted-foreground font-black bg-muted/50 border-b border-border">
                                <tr>
                                  <th className="px-4 py-3">SKU</th>
                                  <th className="px-4 py-3">Size</th>
                                  <th className="px-4 py-3">Color</th>
                                  <th className="px-4 py-3 text-right">Stock Level</th>
                                  <th className="px-4 py-3 text-right">Status</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-border/50">
                                {product.variants.map((v) => {
                                   const isFlashing = flashingItems.has(v.id);
                                   return (
                                     <tr key={v.id} className={cn("transition-colors duration-500", isFlashing ? "bg-emerald-50 dark:bg-emerald-900/20" : "hover:bg-muted/5")}>
                                        <td className="px-4 py-3 font-mono text-muted-foreground">{v.sku}</td>
                                        <td className="px-4 py-3 font-bold">{v.size}</td>
                                        <td className="px-4 py-3 flex items-center gap-2">
                                          <div className="w-3 h-3 rounded-full border border-border shadow-sm" style={{backgroundColor: v.color.toLowerCase()}} />
                                          {v.color}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                           {isEditing ? (
                                             <input 
                                                type="number" 
                                                onClick={e => e.stopPropagation()} 
                                                value={editValues.variants[v.id] ?? v.stock_quantity} 
                                                onChange={e => setEditValues({...editValues, variants: {...editValues.variants, [v.id]: parseInt(e.target.value)||0}})} 
                                                className="w-16 bg-background border border-primary text-right px-2 py-1 rounded text-xs focus:ring-1 focus:ring-primary outline-none" 
                                              />
                                           ) : (
                                              <span className={cn("font-mono font-bold transition-all", isFlashing && "text-emerald-600 scale-110 inline-block", v.stock_quantity < 5 ? "text-red-500" : "")}>
                                                {v.stock_quantity}
                                              </span>
                                           )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                          {v.stock_quantity === 0 ? (
                                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded uppercase border border-red-200 dark:border-red-900">
                                              <XCircle size={10} /> Out
                                            </span>
                                          ) : v.stock_quantity < 5 ? (
                                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded uppercase border border-orange-200 dark:border-orange-900">
                                              <AlertTriangle size={10} /> Low
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded uppercase border border-emerald-200 dark:border-emerald-900">
                                              <CheckCircle2 size={10} /> OK
                                            </span>
                                          )}
                                        </td>
                                     </tr>
                                   );
                                })}
                             </tbody>
                          </table>
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}