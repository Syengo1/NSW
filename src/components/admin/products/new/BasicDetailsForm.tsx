'use client';

import { Sparkles, Tag, TrendingUp, DollarSign, Plus, FolderPlus, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn, formatCurrency } from '@/lib/utils';

interface BasicDetailsProps {
  basePrice: string; setBasePrice: (val: string) => void;
  salePrice: string; setSalePrice: (val: string) => void;
  costPrice: string; setCostPrice: (val: string) => void;
  category: string; setCategory: (val: string) => void;
}

const DEFAULT_CATEGORIES = [
  'Tops/Tees',
  'Hoodies/Sweatshirts',
  'Outerwear/Jackets',
  'Bottoms/Pants',
  'Shorts',
  'Footwear',
  'Headwear',
  'Accessories',
  'Bags'
];

export default function BasicDetailsForm({
  basePrice, setBasePrice, salePrice, setSalePrice, costPrice, setCostPrice, category, setCategory
}: BasicDetailsProps) {
  
  const [categoriesList, setCategoriesList] = useState<string[]>(DEFAULT_CATEGORIES);
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [stockStrategyTag, setStockStrategyTag] = useState('Core Collection');

  // Real-time Financial Intelligence & Profit Health Calculation
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

  const handleAddCategory = () => {
    const trimmed = customCategoryInput.trim();
    if (trimmed && !categoriesList.includes(trimmed)) {
      setCategoriesList(prev => [...prev, trimmed]);
      setCategory(trimmed);
      setCustomCategoryInput('');
      setIsAddingCustomCategory(false);
    }
  };

  // Quick Markup Helpers (+50%, +100%, +150%)
  const applyQuickMarkup = (multiplier: number) => {
    const cost = parseFloat(costPrice);
    if (!cost || isNaN(cost)) return;
    const calculatedBase = Math.round(cost * multiplier);
    setBasePrice(calculatedBase.toString());
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-border">
         <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <h3 className="font-bold uppercase tracking-wider text-sm text-foreground">Drop Concept & Pricing</h3>
         </div>
         {/* Dynamic Stock Movement / Release Tag */}
         <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-amber-500" />
            <select
              value={stockStrategyTag}
              onChange={(e) => setStockStrategyTag(e.target.value)}
              className="bg-secondary text-[10px] font-bold uppercase px-2 py-1 rounded border border-border text-foreground outline-none cursor-pointer"
            >
              <option value="Core Collection">Core Collection</option>
              <option value="Limited Drop">Limited Drop</option>
              <option value="High Turnover">High Turnover</option>
              <option value="Pre-Order">Pre-Order</option>
              <option value="Vault Clearance">Vault Clearance</option>
            </select>
         </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* TITLE */}
         <div className="col-span-2">
           <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Product Title</label>
           <input 
              name="title" 
              required 
              placeholder="e.g. CONCRETE JUNGLE HOODIE" 
              className="w-full bg-secondary/50 border border-border rounded-lg p-4 text-sm font-bold text-foreground uppercase focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50" 
           />
         </div>
         
         {/* PRICING INTELLIGENCE WIDGET */}
         <div className="col-span-2 bg-secondary/30 border border-border rounded-xl relative overflow-hidden">
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/60">
             {/* Cost Price */}
             <div className="bg-card p-4">
               <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
                 <DollarSign size={12} /> Supplier Cost
               </label>
               <input 
                  name="costPrice" type="number" required value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  placeholder="2000" 
                  className="w-full bg-background border border-border rounded-md p-2.5 font-mono text-sm text-foreground focus:border-primary outline-none transition-colors" 
               />
             </div>

             {/* Base Price + Quick Markup Multipliers */}
             <div className="bg-card p-4">
               <div className="flex items-center justify-between mb-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                   Base Price
                 </label>
                 <div className="flex items-center gap-1">
                   <button type="button" onClick={() => applyQuickMarkup(1.5)} className="text-[9px] font-mono bg-secondary hover:bg-secondary/80 px-1 rounded text-muted-foreground">+50%</button>
                   <button type="button" onClick={() => applyQuickMarkup(2.0)} className="text-[9px] font-mono bg-secondary hover:bg-secondary/80 px-1 rounded text-muted-foreground">2x</button>
                   <button type="button" onClick={() => applyQuickMarkup(2.5)} className="text-[9px] font-mono bg-secondary hover:bg-secondary/80 px-1 rounded text-muted-foreground">2.5x</button>
                 </div>
               </div>
               <input 
                  name="basePrice" type="number" required value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="4500" 
                  className="w-full bg-background border border-border rounded-md p-2.5 font-mono text-sm text-foreground focus:border-primary outline-none transition-colors" 
               />
             </div>

             {/* Sale Price */}
             <div className="bg-card p-4">
               <label className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                 <Tag size={12} /> Sale Price (Opt)
               </label>
               <input 
                  name="salePrice" type="number" value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="3500" 
                  className="w-full bg-background border border-emerald-500/20 rounded-md p-2.5 font-mono text-sm text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 outline-none transition-colors" 
               />
             </div>
           </div>

           {/* Live Profit Preview & Margin Indicator */}
           <div className={cn(
             "p-3 border-t flex items-center justify-between text-xs font-mono uppercase tracking-wider transition-colors",
             metrics.margin >= 40 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
              : metrics.margin > 15 
              ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400" 
              : "bg-muted text-muted-foreground border-border"
           )}>
             <div className="flex items-center gap-2">
               <TrendingUp size={14} />
               <span className="font-bold">Projected Profit / Unit</span>
             </div>
             <div className="flex items-center gap-4">
                {metrics.discount && <span className="bg-emerald-500 text-white px-1.5 py-0.5 rounded text-[9px] font-bold">{metrics.discount}% OFF SALE</span>}
                <span className="font-black">{formatCurrency(metrics.profit)} KES</span>
                <span className="opacity-80">({metrics.margin}% Margin)</span>
             </div>
           </div>
         </div>

         {/* CATEGORY MANAGEMENT */}
         <div>
           <div className="flex items-center justify-between mb-2">
             <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block">Category</label>
             <button
                type="button"
                onClick={() => setIsAddingCustomCategory(!isAddingCustomCategory)}
                className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
             >
               {isAddingCustomCategory ? 'Select Existing' : '+ Custom Category'}
             </button>
           </div>

           {isAddingCustomCategory ? (
             <div className="flex gap-2">
               <input
                 type="text"
                 value={customCategoryInput}
                 onChange={(e) => setCustomCategoryInput(e.target.value)}
                 placeholder="e.g. Cyberpunk Outerwear"
                 className="flex-1 bg-secondary/50 border border-border rounded-lg p-3 text-sm font-bold text-foreground uppercase outline-none focus:border-primary"
               />
               <button
                 type="button"
                 onClick={handleAddCategory}
                 className="bg-primary text-primary-foreground px-4 rounded-lg font-bold text-xs uppercase hover:opacity-90 flex items-center gap-1"
               >
                 <Plus size={14} /> Add
               </button>
             </div>
           ) : (
             <select 
                name="category" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)} 
                className="w-full bg-secondary/50 border border-border rounded-lg p-3.5 text-sm font-bold text-foreground uppercase outline-none focus:border-primary transition-all cursor-pointer"
              >
              {categoriesList.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
           )}
         </div>
         
         <div>
           <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Gender Fit</label>
           <select name="gender" className="w-full bg-secondary/50 border border-border rounded-lg p-3.5 text-sm font-bold text-foreground uppercase outline-none focus:border-primary transition-all cursor-pointer">
            <option value="unisex">Unisex</option>
            <option value="men">Mens</option>
            <option value="women">Womens</option>
          </select>
         </div>

         <div className="col-span-2">
           <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Manifesto (Description)</label>
           <textarea 
             name="description" 
             rows={4} 
             className="w-full bg-secondary/50 border border-border rounded-lg p-4 text-sm text-foreground outline-none focus:border-primary transition-all placeholder:text-muted-foreground/50" 
             placeholder="Describe the texture, the fit, the street culture story..." 
           />
         </div>
      </div>
    </div>
  );
}