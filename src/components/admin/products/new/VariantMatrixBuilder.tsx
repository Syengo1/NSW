'use client';
import { useState, useEffect } from 'react';
import { Shirt, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { VariantInput } from '@/app/(dashboard)/admin/products/actions';

// Category Intelligence
const SIZE_PRESETS: Record<string, string> = {
  'Tops/Tees': 'S, M, L, XL, XXL',
  'Hoodies/Sweatshirts': 'S, M, L, XL, XXL',
  'Outerwear/Jackets': 'S, M, L, XL, XXL',
  'Bottoms/Pants': '28, 30, 32, 34, 36, 38', // Default to waist sizes for Denim/Cargos
  'Shorts': 'S, M, L, XL', // Streetwear shorts usually use letters
  'Footwear': '38, 39, 40, 41, 42, 43, 44, 45, 46',
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

  // Auto-update sizing suggestions when the admin changes the product category
  useEffect(() => {
    setSizesInput(SIZE_PRESETS[category] || 'S, M, L, XL');
  }, [category]);

  const generateMatrix = () => {
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
        const sku = `DROP-${colorCode}-${sizeCode}-${Math.floor(Math.random() * 1000)}`;
        newVariants.push({ size, color, sku, stock: 10, priceDiff: 0 });
      });
    });
    setGeneratedVariants(newVariants);
  };

  return (
    <div className="bg-card border border-border p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
         <Shirt size={18} className="text-muted-foreground" />
         <h3 className="font-bold uppercase tracking-wider text-sm text-foreground">Inventory Matrix</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-secondary/30 p-6 border border-border border-dashed">
         <div>
            <label className="text-xs font-bold uppercase text-muted-foreground block mb-2">Sizes (Comma Separated)</label>
            <input value={sizesInput} onChange={e => setSizesInput(e.target.value)} className="w-full bg-background border border-border p-3 text-sm text-foreground outline-none focus:border-primary font-mono" />
         </div>
         <div>
            <label className="text-xs font-bold uppercase text-muted-foreground block mb-2">Colors (Comma Separated)</label>
            <input value={colorsInput} onChange={e => setColorsInput(e.target.value)} className="w-full bg-background border border-border p-3 text-sm text-foreground outline-none focus:border-primary font-mono" />
         </div>
         <div className="col-span-1 md:col-span-2">
           <button type="button" onClick={generateMatrix} className="w-full bg-primary text-primary-foreground text-xs font-black uppercase py-4 hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Sparkles size={14} /> Generate Stock Units
           </button>
         </div>
      </div>

      {generatedVariants.length > 0 && (
        <div className="border border-border overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-secondary text-muted-foreground font-bold uppercase"><tr><th className="p-4">SKU</th><th className="p-4">Color</th><th className="p-4">Size</th><th className="p-4">Stock</th><th className="p-4 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-border bg-card">
              {generatedVariants.map((v, i) => (
                <tr key={i} className="hover:bg-secondary/30 transition-colors">
                  <td className="p-4 font-mono text-muted-foreground">{v.sku}</td>
                  <td className="p-4 font-bold text-foreground">{v.color}</td>
                  <td className="p-4 font-bold text-foreground">{v.size}</td>
                  <td className="p-4">
                      <input type="number" value={v.stock} onChange={(e) => {
                          const n = [...generatedVariants]; 
                          n[i].stock = parseInt(e.target.value) || 0; 
                          setGeneratedVariants(n)
                      }} className="w-20 bg-background border border-border p-2 text-center text-foreground outline-none focus:border-primary" />
                  </td>
                  <td className="p-4 text-right">
                      <button type="button" onClick={() => setGeneratedVariants(generatedVariants.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive transition-colors"><X size={16} /></button>
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