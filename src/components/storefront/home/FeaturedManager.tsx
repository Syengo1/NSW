'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import SmartSlider from './SmartSlider';
import { Filter, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type FilterType = 'all' | 'men' | 'women';

export default function FeaturedManager({ allProducts, saleProducts, categories }: any) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isChanging, setIsChanging] = useState(false);

  // --- LOGIC: SMOOTH FILTERING ---
  const handleFilterChange = (f: FilterType) => {
    if (f === activeFilter) return;
    setIsChanging(true);
    setActiveFilter(f);
    setTimeout(() => setIsChanging(false), 300); 
  };

  const filterProduct = (p: any) => {
    if (activeFilter === 'all') return true;
    const text = (p.title + p.category + p.description).toLowerCase();
    
    // Strict + Fallback Logic
    if (activeFilter === 'men') return text.includes('men') || text.includes('unisex') || !text.includes('women');
    if (activeFilter === 'women') return text.includes('women') || text.includes('unisex');
    return true;
  };

  const filteredSales = useMemo(() => saleProducts.filter(filterProduct), [activeFilter, saleProducts]);
  const filteredCatalog = useMemo(() => allProducts.filter(filterProduct), [activeFilter, allProducts]);

  return (
    // OPTIMIZATION: 'min-h-screen' ensures we utilize full height
    <div className="relative min-h-screen pb-20 bg-background">
      
      {/* 1. STICKY FILTER CONTROL */}
      <div className="sticky top-16 z-30 pointer-events-none pt-4 pb-2">
        <div className="container mx-auto px-4">
           <div className="pointer-events-auto inline-flex items-center gap-1 p-1.5 rounded-full bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-black/5 shadow-xl transition-all hover:scale-[1.02]">
              
              <div className="pl-3 pr-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-r border-border/50 mr-1 h-6">
                 <Filter size={12} /> 
                 <span className="hidden sm:inline">Filter</span>
              </div>

              {['all', 'men', 'women'].map((f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f as FilterType)}
                  className={cn(
                    "relative px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
                    activeFilter === f 
                      ? "text-white dark:text-black" 
                      : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                  )}
                >
                  {activeFilter === f && (
                    <span className="absolute inset-0 bg-black dark:bg-white rounded-full -z-10 animate-in zoom-in-95 duration-200" />
                  )}
                  {f}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className={cn(
        // APP FEEL: Use snap scrolling for the main container
        "transition-opacity duration-500 ease-in-out snap-y snap-mandatory",
        isChanging ? "opacity-50 blur-sm scale-[0.99]" : "opacity-100 blur-0 scale-100"
      )}>

        {/* 2. SALES SLIDER */}
        {filteredSales.length > 0 && (
          // PADDING STRATEGY: 'py-6' provides the "Invisible Border"
          <section className="py-6 snap-start scroll-pt-28">
            <div className="container mx-auto px-4 flex items-center justify-between mb-3">
               <div className="flex items-center gap-2">
                  <div className="bg-red-600 text-white p-1 rounded-md shadow-lg shadow-red-500/30">
                    <Sparkles size={14} fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-black uppercase tracking-tighter leading-none">
                      Top Deals
                    </h3>
                  </div>
               </div>
               
               <Link href="/shop?sort=price_asc" className="hidden md:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-red-600 transition-colors">
                 View All <ArrowRight size={12} />
               </Link>
            </div>
            
            <SmartSlider products={filteredSales} isInfinite={true} />
          </section>
        )}

        {/* 3. CATEGORY COLLECTIONS */}
        {categories.map((cat: string) => {
          const catProducts = filteredCatalog.filter((p: any) => p.category === cat);
          if (catProducts.length === 0) return null;

          return (
            // DENSITY FIX: 'py-4' is tight enough to allow ~2.5 sections to fit on mobile
            <section key={cat} className="py-4 snap-start scroll-pt-28">
              {/* Header: Removed border-b for sleek, invisible separation */}
              <div className="container mx-auto px-4 flex justify-between items-end mb-2">
                 <div>
                   <p className="text-[8px] text-muted-foreground uppercase tracking-widest mb-0.5 flex items-center gap-2">
                     <span className="w-3 h-[1px] bg-foreground/20"></span> Collection
                   </p>
                   {/* Compact Title Size */}
                   <h3 className="text-lg md:text-2xl font-black uppercase tracking-tighter leading-none">{cat}</h3>
                 </div>
              </div>
              
              <SmartSlider products={catProducts} />
            </section>
          );
        })}

      </div>
    </div>
  );
}