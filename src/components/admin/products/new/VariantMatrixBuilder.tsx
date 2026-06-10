'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shirt, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { VariantInput } from '@/app/(dashboard)/admin/products/actions';

// --- CATEGORY INTELLIGENCE ---
const SIZE_PRESETS: Record<string, string> = {
  'Tops/Tees': 'S, M, L, XL, XXL',
  'Hoodies/Sweatshirts': 'S, M, L, XL, XXL',
  'Outerwear/Jackets': 'S, M, L, XL, XXL',
  'Bottoms/Pants': '28, 30, 32, 34, 36, 38', 
  'Shorts': 'S, M, L, XL', 
  'Footwear': '37, 38, 39, 40, 41, 42, 43, 44, 45',
  'Headwear': 'One Size',
  'Accessories': 'One Size',
  'Bags': 'One Size'
};

interface VariantMatrixProps {
  category: string;
  generatedVariants: VariantInput[];
  setGeneratedVariants: (variants: VariantInput[]) => void;
}

export default function VariantMatrixBuilder({ category, generatedVariants, setGeneratedVariants }: VariantMatrixProps) {
  const [sizesInput, setSizesInput] = useState(SIZE_PRESETS[category] || 'S, M, L, XL');
  const [colorsInput, setColorsInput] = useState('Black');

  // 🚨 ESLINT FIX: Push category auto-updates to the end of the execution queue to prevent cascading renders
  useEffect(() => {
    const timer = setTimeout(() => {
      setSizesInput(SIZE_PRESETS[category] || 'S, M, L, XL');
    }, 0);
    return () => clearTimeout(timer);
  }, [category]);

  // 🚨 PERFORMANCE FIX: Memoize the matrix generation to prevent recreation on every render
  const generateMatrix = useCallback(() => {
    const sizes = sizesInput.split(',').map(s => s.trim()).filter(Boolean);
    const colors = colorsInput.split(',').map(c => c.trim()).filter(Boolean);
    
    if (sizes.length === 0 || colors.length === 0) {
      toast.error("Please enter at least one Size and one Color.");
      return;
    }

    const newVariants: VariantInput[] = [];
    colors.forEach(color => {
      sizes.forEach(size => {
        const colorCode = color.substring(0, 3).toUpperCase();
        const sizeCode = size.toUpperCase();
        // Generates a robust, unique SKU identifier
        const sku = `DROP-${colorCode}-${sizeCode}-${Math.floor(Math.random() * 10000)}`;
        newVariants.push({ size, color, sku, stock: 10, priceDiff: 0 });
      });
    });
    
    setGeneratedVariants(newVariants);
    toast.success(`Generated ${newVariants.length} inventory units.`);
  }, [sizesInput, colorsInput, setGeneratedVariants]);

  // 🚨 PERFORMANCE FIX: Extracted inline handlers to prevent React from re-rendering the entire table on every keystroke
  const handleStockChange = useCallback((index: number, value: string) => {
    const newVariants = [...generatedVariants]; 
    newVariants[index].stock = parseInt(value) || 0; 
    setGeneratedVariants(newVariants);
  }, [generatedVariants, setGeneratedVariants]);

  const removeVariant = useCallback((index: number) => {
    setGeneratedVariants(generatedVariants.filter((_, idx) => idx !== index));
  }, [generatedVariants, setGeneratedVariants]);

  return (
    <div className="bg-card border border-border p-6 space-y-6 rounded-xl shadow-sm">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border/50">
         <Shirt size={18} className="text-muted-foreground" />
         <h3 className="font-bold uppercase tracking-wider text-sm text-foreground">Inventory Matrix</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-secondary/20 p-6 border border-border/50 border-dashed rounded-lg">
         <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
              Sizes (Comma Separated)
            </label>
            <input 
              value={sizesInput} 
              onChange={e => setSizesInput(e.target.value)} 
              className="w-full bg-background border border-border/50 rounded-md p-3 text-sm text-foreground outline-none focus:border-primary font-mono transition-colors" 
              placeholder="e.g. S, M, L"
            />
         </div>
         <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
              Colors (Comma Separated)
            </label>
            <input 
              value={colorsInput} 
              onChange={e => setColorsInput(e.target.value)} 
              className="w-full bg-background border border-border/50 rounded-md p-3 text-sm text-foreground outline-none focus:border-primary font-mono transition-colors" 
              placeholder="e.g. Black, White, Red"
            />
         </div>
         <div className="col-span-1 md:col-span-2 pt-2">
           <button 
             type="button" 
             onClick={generateMatrix} 
             className="w-full bg-foreground text-background text-xs font-black uppercase tracking-widest py-4 rounded-md hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2 active:scale-[0.99]"
           >
              <Sparkles size={14} /> Generate Stock Units
           </button>
         </div>
      </div>

      {generatedVariants.length > 0 && (
        <div className="border border-border/50 rounded-lg overflow-x-auto shadow-sm">
          <table className="w-full text-xs text-left">
            <thead className="bg-secondary/50 text-muted-foreground font-black uppercase tracking-widest">
              <tr>
                <th className="p-4 rounded-tl-lg">SKU</th>
                <th className="p-4">Color</th>
                <th className="p-4">Size</th>
                <th className="p-4">Stock</th>
                <th className="p-4 text-right rounded-tr-lg">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 bg-card">
              {generatedVariants.map((v, i) => (
                <tr 
                  // 🚨 ROBUSTNESS FIX: Using v.sku instead of the array index 'i' prevents React state corruption when deleting rows
                  key={v.sku} 
                  className="hover:bg-secondary/30 transition-colors"
                >
                  <td className="p-4 font-mono text-muted-foreground">{v.sku}</td>
                  <td className="p-4 font-bold text-foreground">{v.color}</td>
                  <td className="p-4 font-bold text-foreground">{v.size}</td>
                  <td className="p-4">
                      <input 
                        type="number" 
                        min="0"
                        value={v.stock} 
                        onChange={(e) => handleStockChange(i, e.target.value)} 
                        className="w-20 bg-background border border-border/50 rounded p-2 text-center text-foreground font-mono outline-none focus:border-primary transition-colors" 
                      />
                  </td>
                  <td className="p-4 text-right">
                      <button 
                        type="button" 
                        onClick={() => removeVariant(i)} 
                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                        aria-label={`Remove variant ${v.sku}`}
                      >
                        <X size={16} />
                      </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}