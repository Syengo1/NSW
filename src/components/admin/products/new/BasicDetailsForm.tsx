'use client';
import { Sparkles, Tag } from 'lucide-react';
import { useMemo } from 'react';

interface BasicDetailsProps {
  basePrice: string;
  setBasePrice: (val: string) => void;
  salePrice: string;
  setSalePrice: (val: string) => void;
  category: string;
  setCategory: (val: string) => void;
}

export default function BasicDetailsForm({
  basePrice, setBasePrice, salePrice, setSalePrice, category, setCategory
}: BasicDetailsProps) {
  
  const discountPercentage = useMemo(() => {
    const base = parseFloat(basePrice);
    const sale = parseFloat(salePrice);
    if (!base || !sale || sale >= base) return null;
    return Math.round(((base - sale) / base) * 100);
  }, [basePrice, salePrice]);

  return (
    <div className="bg-card border border-border p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
         <Sparkles size={18} className="text-muted-foreground" />
         <h3 className="font-bold uppercase tracking-wider text-sm text-foreground">Drop Concept</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="col-span-2">
           <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Product Title</label>
           <input name="title" required placeholder="e.g. CONCRETE JUNGLE HOODIE" className="w-full bg-secondary border border-border p-4 text-sm font-bold text-foreground uppercase focus:border-primary outline-none transition-all" />
         </div>
         
         <div className="col-span-2 grid grid-cols-2 gap-6 bg-secondary/50 p-4 border border-border rounded relative overflow-hidden">
           <div>
             <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Base Price (KES)</label>
             <input 
                name="basePrice" type="number" required value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                placeholder="4500" 
                className="w-full bg-background border border-border p-3 font-mono text-foreground focus:border-primary outline-none" 
             />
           </div>
           <div>
             <label className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-2">
               <Tag size={12} /> Sale Price (Optional)
             </label>
             <input 
                name="salePrice" type="number" value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                placeholder="3500" 
                className="w-full bg-background border border-emerald-900/20 dark:border-emerald-900/50 p-3 font-mono text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 outline-none" 
             />
           </div>
           {discountPercentage && (
             <div className="absolute top-0 right-0 bg-accent text-accent-foreground text-xs font-black px-3 py-1 rounded-bl shadow-lg animate-in slide-in-from-right">
               {discountPercentage}% OFF
             </div>
           )}
         </div>

         <div>
           <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Category</label>
           <select 
              name="category" 
              value={category} 
              onChange={(e) => setCategory(e.target.value)} 
              className="w-full bg-secondary border border-border p-4 text-sm text-foreground uppercase outline-none focus:border-primary"
            >
            <option value="Tops/Tees">Tops / Tees</option>
            <option value="Hoodies/Sweatshirts">Hoodies / Sweatshirts</option>
            <option value="Outerwear/Jackets">Outerwear / Jackets</option>
            <option value="Bottoms/Pants">Bottoms / Pants</option>
            <option value="Shorts">Shorts</option>
            <option value="Footwear">Footwear</option>
            <option value="Headwear">Headwear</option>
            <option value="Accessories">Accessories</option>
            <option value="Bags">Bags</option>
          </select>
         </div>
         <div>
           <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Gender</label>
           <select name="gender" className="w-full bg-secondary border border-border p-4 text-sm text-foreground uppercase outline-none focus:border-primary">
            <option value="unisex">Unisex</option>
            <option value="men">Mens</option>
            <option value="women">Womens</option>
          </select>
         </div>
         <div className="col-span-2">
           <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Manifesto</label>
           <textarea name="description" rows={4} className="w-full bg-secondary border border-border p-4 text-sm text-foreground outline-none focus:border-primary" placeholder="Describe the texture, the fit, the culture..." />
         </div>
      </div>
    </div>
  );
}