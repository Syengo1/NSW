"use client";

import { CheckCircle2, AlertTriangle, XCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

// 1. Import the strict Variant type from our master component
import type { Variant } from "./InventoryTable";

// 2. Define the exact shape of the edit state to match InventoryRow
export type EditValuesState = {
  basePrice: number;
  salePrice: number | string;
  costPrice: number;
  variants: Record<string, number>;
};

// 3. Apply the strict types to the component's props
interface VariantMatrixProps {
  variants: Variant[];
  isEditing: boolean;
  editValues: EditValuesState;
  setEditValues: React.Dispatch<React.SetStateAction<EditValuesState>>; // Replaced 'any'
  flashingItems: Set<string>;
}

export function VariantMatrix({ variants, isEditing, editValues, setEditValues, flashingItems }: VariantMatrixProps) {
  const isAnyFlashing = variants.some(v => flashingItems.has(v.id));

  return (
    <div className="bg-muted/30 border-t border-border/50 p-6 animate-in slide-in-from-top-2 duration-300 cursor-default" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-end mb-3">
        <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
          Variant Matrix
          {isAnyFlashing && (
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
            {variants.map((v) => {
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
                        value={editValues.variants[v.id] ?? v.stock_quantity} 
                        // 4. Removed 'any' from (prev). TS automatically infers the EditValuesState type!
                        onChange={e => setEditValues((prev) => ({...prev, variants: {...prev.variants, [v.id]: parseInt(e.target.value)||0}}))} 
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
  );
}
