'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shirt, Sparkles, X, CheckCheck, Layers } from 'lucide-react';
import { toast } from 'sonner';
import { VariantInput } from '@/app/(dashboard)/admin/products/actions';

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
  const [colorsInput, setColorsInput] = useState('Black, Washed Gray');
  const [bulkStockValue, setBulkStockValue] = useState<string>('15');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSizesInput(SIZE_PRESETS[category] || 'S, M, L, XL');
    }, 0);
    return () => clearTimeout(timer);
  }, [category]);

  const generateMatrix = useCallback(() => {
    const sizes = sizesInput.split(',').map(s => s.trim()).filter(Boolean);
    const colors = colorsInput.split(',').map(c => c.trim()).filter(Boolean);
    
    if (sizes.length === 0 || colors.length === 0) {
      toast.error("Please enter at least one Size and one Color.");
      return;
    }

    const initialStock = parseInt(bulkStockValue) || 10;

    const newVariants: VariantInput[] = [];
    colors.forEach(color => {
      sizes.forEach(size => {
        const colorCode = color.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
        const sizeCode = size.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const sku = `DROP-${colorCode}-${sizeCode}-${Math.floor(Math.random() * 8999 + 1000)}`;
        newVariants.push({ size, color, sku, stock: initialStock, priceDiff: 0 });
      });
    });
    
    setGeneratedVariants(newVariants);
    toast.success(`Generated ${newVariants.length} inventory units.`);
  }, [sizesInput, colorsInput, bulkStockValue, setGeneratedVariants]);

  // Bulk Apply Stock to ALL variants in 1 click
  const handleApplyBulkStock = () => {
    const targetStock = parseInt(bulkStockValue);
    if (isNaN(targetStock)) return;

    setGeneratedVariants(generatedVariants.map(v => ({ ...v, stock: targetStock })));
    toast.success(`Updated all ${generatedVariants.length} items to stock level ${targetStock}`);
  };

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
      <div className="flex items-center justify-between pb-4 border-b border-border">
         <div className="flex items-center gap-2">
            <Shirt size={18} className="text-primary" />
            <h3 className="font-bold uppercase tracking-wider text-sm text-foreground">Inventory & Variant Matrix</h3>
         </div>
         {generatedVariants.length > 0 && (
           <span className="text-xs font-mono font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-md">
             {generatedVariants.reduce((acc, curr) => acc + curr.stock, 0)} Total Pieces
           </span>
         )}
      </div>
      
      {/* Matrix Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-secondary/20 p-5 border border-border/60 rounded-xl">
         <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
              Sizes (Comma Separated)
            </label>
            <input 
              value={sizesInput} 
              onChange={e => setSizesInput(e.target.value)} 
              className="w-full bg-background border border-border/80 rounded-lg p-3 text-sm text-foreground outline-none focus:border-primary font-mono transition-colors" 
              placeholder="e.g. S, M, L, XL"
            />
         </div>
         <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
              Colors (Comma Separated)
            </label>
            <input 
              value={colorsInput} 
              onChange={e => setColorsInput(e.target.value)} 
              className="w-full bg-background border border-border/80 rounded-lg p-3 text-sm text-foreground outline-none focus:border-primary font-mono transition-colors" 
              placeholder="e.g. Vintage Black, Off-White"
            />
         </div>
         <div className="col-span-1 md:col-span-2 pt-2 flex items-center gap-3">
           <button 
             type="button" 
             onClick={generateMatrix} 
             className="flex-1 bg-foreground text-background text-xs font-black uppercase tracking-widest py-3.5 rounded-lg hover:bg-foreground/90 transition-all flex items-center justify-center gap-2 active:scale-[0.99] shadow-sm"
           >
              <Sparkles size={14} /> Generate Variant Matrix
           </button>
         </div>
      </div>

      {/* Generated Table View with Batch Controls */}
      {generatedVariants.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-secondary/30 p-3 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-muted-foreground" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">Bulk Stock Fill</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={bulkStockValue}
                onChange={(e) => setBulkStockValue(e.target.value)}
                className="w-20 bg-background border border-border rounded px-2.5 py-1 text-center font-mono text-xs outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleApplyBulkStock}
                className="bg-secondary hover:bg-secondary/80 text-foreground text-[10px] font-black uppercase px-3 py-1.5 rounded border border-border transition-all flex items-center gap-1"
              >
                <CheckCheck size={12} /> Apply to All
              </button>
            </div>
          </div>

          <div className="border border-border/80 rounded-lg overflow-x-auto shadow-xs">
            <table className="w-full text-xs text-left">
              <thead className="bg-secondary/60 text-muted-foreground font-black uppercase tracking-widest border-b border-border">
                <tr>
                  <th className="p-3.5">SKU</th>
                  <th className="p-3.5">Color</th>
                  <th className="p-3.5">Size</th>
                  <th className="p-3.5">Stock Quantity</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 bg-card">
                {generatedVariants.map((v, i) => (
                  <tr key={v.sku} className="hover:bg-secondary/20 transition-colors">
                    <td className="p-3.5 font-mono text-muted-foreground font-medium">{v.sku}</td>
                    <td className="p-3.5 font-bold text-foreground">{v.color}</td>
                    <td className="p-3.5 font-bold text-foreground">{v.size}</td>
                    <td className="p-3.5">
                        <input 
                          type="number" 
                          min="0"
                          value={v.stock} 
                          onChange={(e) => handleStockChange(i, e.target.value)} 
                          className="w-20 bg-background border border-border/80 rounded-md p-1.5 text-center text-foreground font-mono font-bold outline-none focus:border-primary transition-colors" 
                        />
                    </td>
                    <td className="p-3.5 text-center">
                      {v.stock === 0 ? (
                        <span className="text-[9px] font-bold uppercase bg-destructive/10 text-destructive px-2 py-0.5 rounded">Sold Out</span>
                      ) : v.stock < 5 ? (
                        <span className="text-[9px] font-bold uppercase bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded">Low Stock</span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded">In Stock</span>
                      )}
                    </td>
                    <td className="p-3.5 text-right">
                        <button 
                          type="button" 
                          onClick={() => removeVariant(i)} 
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                          aria-label={`Remove variant ${v.sku}`}
                        >
                          <X size={14} />
                        </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}