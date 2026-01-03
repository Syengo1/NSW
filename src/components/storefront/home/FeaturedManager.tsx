'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import SmartSlider from './SmartSlider';
import { Filter, Sparkles } from 'lucide-react';

type FilterType = 'all' | 'men' | 'women' | 'unisex';

export default function FeaturedManager({ allProducts, saleProducts, categories }: any) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  // --- INTELLIGENT FILTERING ---
  // Note: Since 'gender' isn't in your DB Schema yet, we simulate it or filter by keywords.
  // Ideally, add a 'gender' column to your 'products' table.
  const filterProduct = (p: any) => {
    if (activeFilter === 'all') return true;
    
    // Smart Keyword Matching (Fallback logic)
    const text = (p.title + p.category + p.description).toLowerCase();
    if (activeFilter === 'men') return text.includes('men') || text.includes('unisex') || !text.includes('women');
    if (activeFilter === 'women') return text.includes('women') || text.includes('unisex');
    return true;
  };

  const filteredSales = useMemo(() => saleProducts.filter(filterProduct), [activeFilter, saleProducts]);
  const filteredCatalog = useMemo(() => allProducts.filter(filterProduct), [activeFilter, allProducts]);

  return (
    <div className="space-y-20 pb-20">
      
      {/* 1. FILTER CONTROLS */}
      <div className="sticky top-16 z-20 bg-background/80 backdrop-blur-md border-y border-border/50 py-4">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
             <Filter size={14} /> 
             <span>Curate Feed:</span>
          </div>
          <div className="flex gap-2">
            {['all', 'men', 'women'].map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f as FilterType)}
                className={cn(
                  "px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border",
                  activeFilter === f 
                    ? "bg-foreground text-background border-foreground scale-105" 
                    : "bg-transparent text-muted-foreground border-transparent hover:border-border"
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. SALES SLIDER (The "Infinite" Smart Slider) */}
      {filteredSales.length > 0 && (
        <section className="space-y-8 overflow-hidden">
          <div className="container mx-auto px-4 flex items-center gap-3">
             <div className="bg-red-600 text-white p-1.5 rounded-sm animate-pulse">
               <Sparkles size={16} fill="currentColor" />
             </div>
             <h3 className="text-xl font-black uppercase tracking-tighter">
               Top Deals <span className="text-muted-foreground text-sm font-normal normal-case ml-2">Sorted by highest discount</span>
             </h3>
          </div>
          
          <SmartSlider products={filteredSales} isInfinite={true} />
        </section>
      )}

      {/* 3. CATEGORY SLIDERS */}
      {categories.map((cat: string) => {
        const catProducts = filteredCatalog.filter((p: any) => p.category === cat);
        if (catProducts.length === 0) return null;

        return (
          <section key={cat} className="space-y-8">
            <div className="container mx-auto px-4 flex justify-between items-end">
               <div>
                 <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Collection</p>
                 <h3 className="text-2xl font-black uppercase tracking-tighter">{cat}</h3>
               </div>
               {/* Smart Link: Pre-filters the shop page */}
               <a 
                 href={`/shop?category=${cat}`} 
                 className="hidden md:flex text-xs font-bold uppercase tracking-widest border-b border-foreground/30 hover:border-foreground pb-0.5 transition-all"
               >
                 View All {cat}
               </a>
            </div>
            
            <SmartSlider products={catProducts} />
            
            {/* Mobile View All Button */}
            <div className="container mx-auto px-4 md:hidden">
              <a 
                href={`/shop?category=${cat}`} 
                className="block w-full text-center py-3 border border-border text-xs font-bold uppercase rounded-sm hover:bg-secondary"
              >
                View All {cat}
              </a>
            </div>
          </section>
        );
      })}
    </div>
  );
}