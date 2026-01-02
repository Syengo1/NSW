"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { 
  ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, 
  XCircle, ExternalLink, Edit2, Save, Loader2, 
  Eye, EyeOff, X, ImageIcon, Globe
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { updateQuickEdit, toggleProductVisibility } from "@/app/(dashboard)/admin/products/actions";

// Precise Type Definitions
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

export function InventoryTable({ products }: { products: Product[] }) {
  // State Management
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Edit Mode State Container
  const [editValues, setEditValues] = useState<{ price: number; variants: Record<string, number> }>({
    price: 0, variants: {}
  });

  // --- HANDLERS ---

  const toggleRow = (id: string) => {
    // Prevent toggling if currently editing this specific row to avoid UX confusion
    if (editingId === id) return; 
    setExpandedId(expandedId === id ? null : id);
  };

  const startEditing = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation(); // Critical: Stop row from toggling
    setEditingId(product.id);
    setExpandedId(product.id); // Auto-expand to show variant inputs
    
    // Hydrate state with current DB values
    const variantStock: Record<string, number> = {};
    product.variants.forEach(v => { variantStock[v.id] = v.stock_quantity });
    
    setEditValues({
      price: product.base_price / 100, // Convert Cents -> Main Unit
      variants: variantStock
    });
  };

  const cancelEditing = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const saveEdits = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    startTransition(async () => {
      // 1. Update Base Price
      await updateQuickEdit('product_price', productId, editValues.price);
      
      // 2. Update All Variant Stocks in Parallel
      await Promise.all(
        Object.entries(editValues.variants).map(([varId, stock]) => 
          updateQuickEdit('variant_stock', varId, stock)
        )
      );
      setEditingId(null);
    });
  };

  const handleGhostMode = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    startTransition(async () => {
      await toggleProductVisibility(product.id, product.is_visible);
    });
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm transition-all duration-200">
      
      {/* TABLE HEADER */}
      <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/40 text-[10px] font-black uppercase tracking-widest text-muted-foreground select-none">
        <div className="col-span-4">Product Identity</div>
        <div className="col-span-3">Inventory Health</div>
        <div className="col-span-2 text-right">Pricing</div>
        <div className="col-span-3 text-right pr-4">Control Center</div>
      </div>

      <div className="divide-y divide-border">
        {products.map((product) => {
          const isExpanded = expandedId === product.id;
          const isEditing = editingId === product.id;
          
          // Logic: Calculate total stock & determine health color
          const totalStock = product.variants?.reduce((acc, v) => acc + v.stock_quantity, 0) || 0;
          const stockHealthColor = totalStock === 0 ? "bg-red-500" : totalStock < 10 ? "bg-yellow-500" : "bg-emerald-500";
          
          const mainImage = product.product_images?.[0]?.url;

          return (
            <div 
              key={product.id} 
              className={cn(
                "group transition-all duration-200", 
                !product.is_visible ? "bg-muted/30" : "bg-card hover:bg-muted/5",
                isExpanded ? "shadow-md z-10 relative" : ""
              )}
            >
              
              {/* --- MAIN ROW --- */}
              <div 
                onClick={() => toggleRow(product.id)} 
                className="grid grid-cols-1 md:grid-cols-12 gap-6 p-4 items-center cursor-pointer"
              >
                
                {/* 1. IDENTITY */}
                <div className="col-span-4 flex items-center gap-4">
                  {/* Image Thumbnail */}
                  <div className="h-12 w-12 rounded-lg border border-border overflow-hidden bg-secondary flex-shrink-0 relative shadow-sm">
                    {mainImage ? (
                      <img src={mainImage} className={cn("w-full h-full object-cover", !product.is_visible && "grayscale opacity-50")} alt={product.title} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon size={16}/></div>
                    )}
                    {/* Ghost Overlay */}
                    {!product.is_visible && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                         <EyeOff size={14} className="text-white drop-shadow-md" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="font-bold uppercase tracking-tight text-sm flex items-center gap-2 truncate text-foreground">
                      {product.title}
                      {product.sale_price && (
                        <span className="text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-sm font-black animate-pulse">SALE</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded uppercase border border-border/50">
                        {product.category}
                      </span>
                      {!product.is_visible && (
                        <span className="text-[10px] text-muted-foreground font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded uppercase border border-border/50">
                          Hidden
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. INVENTORY HEALTH */}
                <div className="col-span-3">
                   <div className="flex items-center justify-between text-xs mb-1.5 max-w-[140px]">
                      <span className={cn("font-mono font-bold", totalStock === 0 ? "text-red-500" : "text-foreground")}>
                        {totalStock} <span className="text-muted-foreground font-sans text-[10px] uppercase">Units Available</span>
                      </span>
                   </div>
                   {/* Smart Progress Bar */}
                   <div className="h-1.5 w-full max-w-[140px] bg-secondary rounded-full overflow-hidden">
                      <div 
                        className={cn("h-full transition-all duration-500 rounded-full", stockHealthColor)} 
                        style={{ width: `${Math.min(Math.max((totalStock / 50) * 100, 5), 100)}%` }} 
                      />
                   </div>
                </div>

                {/* 3. PRICING (EDITABLE) */}
                <div className="col-span-2 text-right font-mono text-sm">
                  {isEditing ? (
                    <div className="flex items-center justify-end gap-1 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                       <span className="text-muted-foreground text-[10px] font-sans font-bold pt-1">KES</span>
                       <input 
                         type="number" 
                         value={editValues.price}
                         onChange={(e) => setEditValues({...editValues, price: parseFloat(e.target.value)})}
                         className="w-20 bg-background border border-primary/50 focus:border-primary text-right px-2 py-1 rounded shadow-sm focus:outline-none font-bold text-sm"
                         autoFocus
                       />
                    </div>
                  ) : (
                    <div className="flex flex-col items-end">
                      {product.sale_price ? (
                        <>
                          <span className="text-red-600 font-bold">{formatCurrency(product.sale_price / 100)}</span>
                          <span className="text-muted-foreground line-through text-[10px] opacity-70">{formatCurrency(product.base_price / 100)}</span>
                        </>
                      ) : (
                        <span className="text-foreground">{formatCurrency(product.base_price / 100)}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. ACTIONS & CONTROLS */}
                <div className="col-span-3 flex justify-end gap-3 items-center pl-4">
                   
                   {/* GHOST TOGGLE */}
                   {!isEditing && (
                     <button 
                       onClick={(e) => handleGhostMode(e, product)}
                       className={cn(
                         "hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border",
                         product.is_visible 
                           ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/10" 
                           : "bg-neutral-500/5 text-neutral-500 border-neutral-500/20 hover:bg-neutral-500/10"
                       )}
                       title={product.is_visible ? "Hide from Store" : "Show in Store"}
                     >
                       <span className={cn("w-1.5 h-1.5 rounded-full", product.is_visible ? "bg-emerald-500 animate-pulse" : "bg-neutral-400")} />
                       {product.is_visible ? "Live" : "Ghost"}
                     </button>
                   )}

                   <div className="h-6 w-px bg-border/50 mx-1 hidden md:block" />

                   {/* EDIT / SAVE CONTROLS */}
                   {isEditing ? (
                     <div className="flex items-center gap-1 animate-in slide-in-from-right-2 duration-200" onClick={e => e.stopPropagation()}>
                       <button 
                          onClick={(e) => saveEdits(e, product.id)} 
                          disabled={isPending} 
                          className="bg-emerald-600 text-white p-2 rounded-md hover:bg-emerald-500 shadow-sm transition-all hover:scale-105"
                          title="Save Changes"
                        >
                         {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} strokeWidth={2.5} />}
                       </button>
                       <button 
                          onClick={cancelEditing} 
                          className="bg-red-600/10 text-red-600 border border-red-600/20 p-2 rounded-md hover:bg-red-600 hover:text-white transition-all"
                          title="Cancel"
                        >
                         <X size={14} strokeWidth={2.5} />
                       </button>
                     </div>
                   ) : (
                     <div className="flex items-center gap-1">
                        {/* VIEW LIVE DROP BUTTON (New) */}
                        <Link 
                          href={`/product/${product.slug}`} 
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          className="p-2 text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10 rounded-md transition-all"
                          title="View Live Drop"
                        >
                          <ExternalLink size={16} />
                        </Link>

                        <button 
                          onClick={(e) => startEditing(e, product)} 
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-all"
                          title="Quick Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                     </div>
                   )}
                   
                   {/* EXPAND TOGGLE */}
                   <div className="text-muted-foreground/50 group-hover:text-foreground transition-colors">
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                   </div>
                </div>
              </div>

              {/* --- EXPANDED MATRIX (EDITABLE) --- */}
              {isExpanded && (
                <div className="bg-muted/30 border-t border-border/50 p-6 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                     
                     {/* Quick Analysis */}
                     <div className="col-span-1 space-y-4 pt-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Variant Logic</h4>
                        <div className="bg-background border border-border p-4 rounded-lg space-y-2 shadow-sm">
                           <div className="flex justify-between text-xs">
                             <span className="text-muted-foreground">Total Variants</span>
                             <span className="font-bold">{product.variants.length}</span>
                           </div>
                           <div className="flex justify-between text-xs">
                             <span className="text-muted-foreground">Stock Value</span>
                             <span className="font-bold font-mono">
                               {formatCurrency((product.base_price / 100) * totalStock)}
                             </span>
                           </div>
                        </div>
                        
                        {/* Secondary View Live Button (for clarity) */}
                        <Link 
                          href={`/product/${product.slug}`} 
                          target="_blank"
                          className="flex items-center justify-center gap-2 w-full border border-border bg-background hover:bg-muted text-foreground text-[10px] font-bold uppercase py-2.5 rounded-md transition-all"
                        >
                          <Globe size={12} /> Open Store Page
                        </Link>
                     </div>

                     {/* The Matrix Table */}
                     <div className="col-span-3">
                        <div className="border border-border rounded-lg overflow-hidden bg-background shadow-sm">
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
                                {product.variants.map((v) => (
                                   <tr key={v.id} className="hover:bg-muted/10 transition-colors">
                                      <td className="px-4 py-3 font-mono text-muted-foreground">{v.sku}</td>
                                      <td className="px-4 py-3 font-bold">{v.size}</td>
                                      <td className="px-4 py-3">{v.color}</td>
                                      
                                      {/* Editable Stock Cell */}
                                      <td className="px-4 py-3 text-right">
                                         {isEditing ? (
                                           <div className="flex justify-end" onClick={e => e.stopPropagation()}>
                                              <input 
                                                type="number"
                                                value={editValues.variants[v.id] ?? v.stock_quantity}
                                                onChange={(e) => setEditValues({
                                                   ...editValues,
                                                   variants: { ...editValues.variants, [v.id]: parseInt(e.target.value) || 0 }
                                                })}
                                                className="w-20 bg-muted/50 border border-primary/30 focus:border-primary text-right px-2 py-1 rounded text-xs font-mono focus:outline-none"
                                              />
                                           </div>
                                         ) : (
                                            <span className={cn("font-mono font-medium", v.stock_quantity < 5 ? "text-red-600" : "")}>
                                              {v.stock_quantity}
                                            </span>
                                         )}
                                      </td>

                                      {/* Status Badge */}
                                      <td className="px-4 py-3 text-right">
                                        {v.stock_quantity === 0 ? (
                                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded uppercase border border-red-500/20">
                                            <XCircle size={10} /> Out
                                          </span>
                                        ) : v.stock_quantity < 5 ? (
                                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded uppercase border border-orange-500/20">
                                            <AlertTriangle size={10} /> Low
                                          </span>
                                        ) : (
                                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded uppercase border border-emerald-500/20">
                                            <CheckCircle2 size={10} /> OK
                                          </span>
                                        )}
                                      </td>
                                   </tr>
                                ))}
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