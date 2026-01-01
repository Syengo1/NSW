"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Box,
  Edit2,
  Save,
  Loader2
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { updateQuickEdit } from "@/app/(dashboard)/admin/products/actions"; // Import the server action

// Types
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
  sale_price?: number | null; // Added support for sale price
  category: string;
  status: string;
  collections: { title: string }[] | { title: string } | null;
  variants: Variant[];
};

export function InventoryTable({ products }: { products: Product[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null); // Track which row is being edited
  const [isPending, startTransition] = useTransition();

  // Local state for edits
  const [editValues, setEditValues] = useState<{ price: number; variants: Record<string, number> }>({
    price: 0,
    variants: {}
  });

  const toggleRow = (id: string) => {
    // Don't toggle if we are clicking an input inside the row
    if (editingId === id) return; 
    setExpandedId(expandedId === id ? null : id);
  };

  const startEditing = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setEditingId(product.id);
    setExpandedId(product.id); // Auto expand to show variants
    
    // Initialize state with current values
    const variantStock: Record<string, number> = {};
    product.variants.forEach(v => { variantStock[v.id] = v.stock_quantity });
    
    setEditValues({
      price: product.base_price / 100, // Convert cents to main unit
      variants: variantStock
    });
  };

  const saveEdits = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    
    startTransition(async () => {
      // 1. Update Price
      await updateQuickEdit('product_price', productId, editValues.price);
      
      // 2. Update All Variants
      // In a real app, you might only update changed ones to save bandwidth
      await Promise.all(
        Object.entries(editValues.variants).map(([varId, stock]) => 
          updateQuickEdit('variant_stock', varId, stock)
        )
      );
      
      setEditingId(null);
    });
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background shadow-sm">
      <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-border bg-muted/40 text-xs font-bold uppercase tracking-widest text-muted-foreground">
        <div className="col-span-5">Product Info</div>
        <div className="col-span-2">Stock Health</div>
        <div className="col-span-2 text-right">Price</div>
        <div className="col-span-2 text-center">Status</div>
        <div className="col-span-1 text-center"></div>
      </div>

      <div className="divide-y divide-border">
        {products.map((product) => {
          const isExpanded = expandedId === product.id;
          const isEditing = editingId === product.id;
          
          const totalStock = product.variants?.reduce((acc, v) => acc + v.stock_quantity, 0) || 0;
          const lowStockVariants = product.variants?.filter(v => v.stock_quantity < 5) || [];
          const outOfStockVariants = product.variants?.filter(v => v.stock_quantity === 0) || [];
          const hasIssues = lowStockVariants.length > 0;
          
          const collectionName = Array.isArray(product.collections) 
            ? product.collections[0]?.title 
            : product.collections?.title;

          return (
            <div key={product.id} className="group bg-card transition-colors hover:bg-muted/20">
              
              {/* --- MAIN ROW --- */}
              <div 
                onClick={() => toggleRow(product.id)}
                className="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 items-center cursor-pointer relative"
              >
                
                {/* 1. Product Info */}
                <div className="col-span-5 flex items-center gap-4">
                  <div className={cn(
                    "h-10 w-10 rounded-md flex items-center justify-center border transition-colors",
                    hasIssues ? "bg-red-950/20 border-red-900/50" : "bg-secondary border-border"
                  )}>
                    {hasIssues ? <AlertTriangle size={18} className="text-red-500" /> : <Box size={18} className="text-muted-foreground" />}
                  </div>

                  <div>
                    <div className="font-bold uppercase tracking-wide text-foreground flex items-center gap-2">
                      {product.title}
                      {product.sale_price && (
                        <span className="text-[9px] bg-red-500 text-white px-1.5 rounded-sm">SALE</span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground font-mono bg-secondary px-1.5 py-0.5 rounded">
                        {product.category}
                      </span>
                      {collectionName && (
                         <span className="text-[10px] text-blue-400 font-mono bg-blue-950/20 px-1.5 py-0.5 rounded border border-blue-900/30">
                           {collectionName}
                         </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Stock Health Summary */}
                <div className="col-span-2 text-sm">
                   <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "font-mono font-bold", 
                        totalStock === 0 ? "text-red-500" : "text-foreground"
                      )}>
                        {totalStock} <span className="text-xs text-muted-foreground font-sans">Units</span>
                      </span>
                   </div>
                   <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden flex">
                      <div 
                        className="bg-red-500" 
                        style={{ width: `${(outOfStockVariants.length / (product.variants?.length || 1)) * 100}%` }} 
                      />
                      <div 
                        className="bg-emerald-500" 
                        style={{ width: `${100 - (outOfStockVariants.length / (product.variants?.length || 1)) * 100}%` }} 
                      />
                   </div>
                </div>

                {/* 3. Price (Editable) */}
                <div className="col-span-2 text-right font-mono text-sm hidden md:block">
                  {isEditing ? (
                    <div className="flex items-center justify-end gap-1">
                       <span className="text-muted-foreground text-xs">KES</span>
                       <input 
                         type="number" 
                         value={editValues.price}
                         onChange={(e) => setEditValues({...editValues, price: parseFloat(e.target.value)})}
                         className="w-20 bg-background border border-primary text-right px-2 py-1 rounded focus:outline-none font-bold"
                         onClick={(e) => e.stopPropagation()}
                       />
                    </div>
                  ) : (
                    <>
                      {product.sale_price ? (
                        <div className="flex flex-col items-end">
                          <span className="text-red-500 font-bold">{formatCurrency(product.sale_price / 100)}</span>
                          <span className="text-muted-foreground line-through text-xs">{formatCurrency(product.base_price / 100)}</span>
                        </div>
                      ) : (
                        formatCurrency(product.base_price / 100)
                      )}
                    </>
                  )}
                </div>

                {/* 4. Actions / Edit Button */}
                <div className="col-span-3 flex justify-end gap-2 items-center">
                   {isEditing ? (
                     <button 
                       onClick={(e) => saveEdits(e, product.id)}
                       disabled={isPending}
                       className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-colors"
                     >
                       {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                       Save
                     </button>
                   ) : (
                     <button 
                       onClick={(e) => startEditing(e, product)}
                       className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-all"
                       title="Quick Edit Stock & Price"
                     >
                       <Edit2 size={16} />
                     </button>
                   )}
                   
                   <div className="text-muted-foreground">
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                   </div>
                </div>
              </div>

              {/* --- EXPANDED DETAILS --- */}
              {isExpanded && (
                <div className="bg-muted/20 border-t border-border/50 p-4 md:p-6 animate-in slide-in-from-top-2 duration-200">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left: Quick Stats */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Analysis</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-background p-3 rounded border border-border">
                          <div className="text-[10px] uppercase text-muted-foreground">Total Value</div>
                          <div className="font-mono font-bold text-lg">
                            {formatCurrency((product.base_price / 100) * totalStock)}
                          </div>
                        </div>
                         <div className="bg-background p-3 rounded border border-border">
                          <div className="text-[10px] uppercase text-muted-foreground">Variants</div>
                          <div className="font-mono font-bold text-lg">{product.variants?.length}</div>
                        </div>
                      </div>
                      <Link href={`/product/${product.slug}`} target="_blank" className="flex items-center justify-center gap-2 w-full text-xs font-bold uppercase tracking-wider py-2 border border-border rounded hover:bg-background transition-colors">
                         <ExternalLink size={14} /> View Live Page
                      </Link>
                    </div>

                    {/* Right: The Variant Table (Editable Stock) */}
                    <div className="lg:col-span-2">
                       <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex justify-between">
                         Inventory Matrix
                         {isEditing && <span className="text-emerald-500 animate-pulse">● Editing Mode Active</span>}
                       </h4>
                       
                       <div className="border border-border rounded-md overflow-hidden bg-background">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground">
                              <tr>
                                <th className="px-3 py-2">SKU</th>
                                <th className="px-3 py-2">Size</th>
                                <th className="px-3 py-2">Color</th>
                                <th className="px-3 py-2 text-right">Stock</th>
                                <th className="px-3 py-2 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {product.variants?.sort((a,b) => a.stock_quantity - b.stock_quantity).map((variant) => (
                                <tr key={variant.id} className={cn("transition-colors", isEditing ? "hover:bg-blue-500/5" : "hover:bg-muted/20")}>
                                  <td className="px-3 py-2 font-mono text-muted-foreground text-xs">{variant.sku}</td>
                                  <td className="px-3 py-2 font-bold">{variant.size}</td>
                                  <td className="px-3 py-2 flex items-center gap-2">
                                     <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: variant.color }} />
                                     <span className="capitalize text-xs">{variant.color}</span>
                                  </td>
                                  
                                  {/* EDITABLE STOCK COLUMN */}
                                  <td className="px-3 py-2 text-right font-mono">
                                    {isEditing ? (
                                      <input 
                                        type="number"
                                        value={editValues.variants[variant.id] ?? variant.stock_quantity}
                                        onChange={(e) => setEditValues({
                                          ...editValues,
                                          variants: {
                                            ...editValues.variants,
                                            [variant.id]: parseInt(e.target.value) || 0
                                          }
                                        })}
                                        className="w-16 bg-background border border-primary text-right px-1 py-0.5 rounded focus:outline-none"
                                      />
                                    ) : (
                                      variant.stock_quantity
                                    )}
                                  </td>

                                  <td className="px-3 py-2 text-right">
                                    {variant.stock_quantity === 0 ? (
                                      <span className="text-[10px] text-red-500 font-bold uppercase flex items-center justify-end gap-1"><XCircle size={12} /> Out</span>
                                    ) : variant.stock_quantity < 5 ? (
                                      <span className="text-[10px] text-orange-500 font-bold uppercase flex items-center justify-end gap-1"><AlertTriangle size={12} /> Low</span>
                                    ) : (
                                      <span className="text-[10px] text-emerald-500 font-bold uppercase flex items-center justify-end gap-1"><CheckCircle2 size={12} /> OK</span>
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