'use client';
import { Sparkles, Tag, TrendingUp, DollarSign } from 'lucide-react';
import { useMemo } from 'react';
import { cn, formatCurrency } from '@/lib/utils';

interface BasicDetailsProps {
  basePrice: string; setBasePrice: (val: string) => void;
  salePrice: string; setSalePrice: (val: string) => void;
  costPrice: string; setCostPrice: (val: string) => void;
  category: string; setCategory: (val: string) => void;
}

export default function BasicDetailsForm({
  basePrice, setBasePrice, salePrice, setSalePrice, costPrice, setCostPrice, category, setCategory
}: BasicDetailsProps) {
  
  // Real-time Financial Intelligence
  const metrics = useMemo(() => {
    const base = parseFloat(basePrice) || 0;
    const sale = parseFloat(salePrice) || 0;
    const cost = parseFloat(costPrice) || 0;

    const activePrice = sale > 0 ? sale : base;
    const profit = activePrice - cost;
    const margin = activePrice > 0 ? Math.round((profit / activePrice) * 100) : 0;
    const discount = base > 0 && sale > 0 && sale < base ? Math.round(((base - sale) / base) * 100) : null;

    return { activePrice, profit, margin, discount, cost };
  }, [basePrice, salePrice, costPrice]);

  return (
    <div className="bg-card border border-border p-6 space-y-6">
      <div className="flex items-center gap-2 mb-4 pb-4 border-b border-border">
         <Sparkles size={18} className="text-muted-foreground" />
         <h3 className="font-bold uppercase tracking-wider text-sm text-foreground">Drop Concept & Pricing</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* TITLE */}
         <div className="col-span-2">
           <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Product Title</label>
           <input name="title" required placeholder="e.g. CONCRETE JUNGLE HOODIE" className="w-full bg-secondary border border-border p-4 text-sm font-bold text-foreground uppercase focus:border-primary outline-none transition-all" />
         </div>
         
         {/* PRICING INTELLIGENCE WIDGET */}
         <div className="col-span-2 bg-secondary/50 border border-border rounded-lg relative overflow-hidden">
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border">
             {/* Cost Price */}
             <div className="bg-card p-4">
               <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                 <DollarSign size={12} /> Supplier Cost
               </label>
               <input 
                  name="costPrice" type="number" required value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="2000" 
                  className="w-full bg-background border border-border p-2.5 font-mono text-sm text-foreground focus:border-primary outline-none" 
               />
             </div>

             {/* Base Price */}
             <div className="bg-card p-4">
               <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 block">
                 Base Selling Price
               </label>
               <input 
                  name="basePrice" type="number" required value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="4500" 
                  className="w-full bg-background border border-border p-2.5 font-mono text-sm text-foreground focus:border-primary outline-none" 
               />
             </div>

             {/* Sale Price */}
             <div className="bg-card p-4">
               <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                 <Tag size={12} /> Sale Price (Opt)
               </label>
               <input 
                  name="salePrice" type="number" value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="3500" 
                  className="w-full bg-background border border-emerald-900/20 p-2.5 font-mono text-sm text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 outline-none" 
               />
             </div>
           </div>

           {/* Live Profit Preview */}
           <div className={cn(
             "p-3 border-t flex items-center justify-between text-xs font-mono uppercase tracking-wider transition-colors",
             metrics.profit > 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-muted text-muted-foreground border-border"
           )}>
             <div className="flex items-center gap-2">
               <TrendingUp size={14} />
               <span className="font-bold">Projected Profit / Unit</span>
             </div>
             <div className="flex items-center gap-4">
                {metrics.discount && <span className="bg-emerald-500 text-white px-1.5 py-0.5 rounded-sm text-[9px]">{metrics.discount}% OFF SALE</span>}
                <span className="font-black">{formatCurrency(metrics.profit)} KES</span>
                <span className="opacity-75">({metrics.margin}%)</span>
             </div>
           </div>
         </div>

         {/* CLASSIFICATIONS */}
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
           <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Manifesto (Description)</label>
           <textarea name="description" rows={4} className="w-full bg-secondary border border-border p-4 text-sm text-foreground outline-none focus:border-primary" placeholder="Describe the texture, the fit, the culture..." />
         </div>
      </div>
    </div>
  );
}