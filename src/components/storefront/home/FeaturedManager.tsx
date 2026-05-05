'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import SmartSlider from './SmartSlider';
import { Filter, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// --- STRICT TYPES ---
type FilterType = 'all' | 'men' | 'women';

export interface Product {
  id: string;
  title: string;
  slug: string;
  base_price: number;
  sale_price: number | null;
  category: string;
  description: string;
  main_image: string;
  total_stock: number;
  discountPct: number;
  gender: string;
}

interface FeaturedManagerProps {
  allProducts: Product[];
  saleProducts: Product[];
  categories: string[];
}

export default function FeaturedManager({ allProducts, saleProducts, categories }: FeaturedManagerProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [isChanging, setIsChanging] = useState(false);

  // --- LOGIC: SMOOTH FILTERING ---
  const handleFilterChange = (f: FilterType) => {
    if (f === activeFilter) return;
    setIsChanging(true);
    setActiveFilter(f);
    setTimeout(() => setIsChanging(false), 300); 
  };

  // --- FIX: REACT HOOKS EXHAUSTIVE DEPS & MEMOIZATION ---
  // By moving the filter logic directly inside the useMemo, we prevent React from 
  // destroying the memoization on every render, solving the ESLint errors permanently.
  const filteredSales = useMemo(() => {
    return saleProducts.filter((p) => {
      if (activeFilter === 'all') return true;
      
      // Fallback: If an old product was created before you added the gender column, show it by default
      if (!p.gender) return true; 

      // Strict matching based on the exact dropdown values from your Admin Product Creation page
      if (activeFilter === 'women') return p.gender === 'women' || p.gender === 'unisex';
      if (activeFilter === 'men') return p.gender === 'men' || p.gender === 'unisex';
      
      return true;
    });
  }, [activeFilter, saleProducts]);

  const filteredCatalog = useMemo(() => {
    return allProducts.filter((p) => {
      if (activeFilter === 'all') return true;
      
      if (!p.gender) return true; 

      if (activeFilter === 'women') return p.gender === 'women' || p.gender === 'unisex';
      if (activeFilter === 'men') return p.gender === 'men' || p.gender === 'unisex';
      
      return true;
    });
  }, [activeFilter, allProducts]);

  return (
    <div className="relative min-h-screen pb-20 bg-background">
      
      {/* 1. STICKY FILTER CONTROL (Premium Glassmorphism) */}
      <div className="sticky top-16 z-30 pointer-events-none pt-4 pb-2">
        <div className="container mx-auto px-4 flex justify-center md:justify-start">
           <div className="pointer-events-auto inline-flex items-center gap-1 p-1.5 rounded-full bg-background/70 backdrop-blur-2xl border border-border/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] transition-transform hover:scale-[1.02]">
              
              <div className="pl-4 pr-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground border-r border-border/50 mr-1 h-6">
                 <Filter size={12} /> 
                 <span className="hidden sm:inline">Filter</span>
              </div>

              {['all', 'men', 'women'].map((f) => (
                <button
                  key={f}
                  onClick={() => handleFilterChange(f as FilterType)}
                  className={cn(
                    "relative px-6 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
                    activeFilter === f 
                      ? "text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {activeFilter === f && (
                    <span className="absolute inset-0 bg-primary rounded-full -z-10 animate-in zoom-in-95 duration-200 shadow-md" />
                  )}
                  {f}
                </button>
              ))}
           </div>
        </div>
      </div>

      <div className={cn(
        "transition-all duration-500 ease-in-out snap-y snap-mandatory",
        isChanging ? "opacity-40 blur-[2px] scale-[0.98]" : "opacity-100 blur-0 scale-100"
      )}>

        {/* 2. SALES SLIDER (Top Deals) */}
        {filteredSales.length > 0 && (
          <section className="py-12 snap-start scroll-pt-28 relative">
            {/* AMBIENT LIGHTING SYSTEM */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-full bg-red-600/10 dark:bg-red-600/5 blur-[100px] -z-10 pointer-events-none rounded-full" />
            
            {/* 2. Core Heartbeat */}
            <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[50%] h-[70%] bg-red-500/15 dark:bg-red-500/10 blur-[80px] -z-10 pointer-events-none rounded-full animate-breathe mix-blend-screen" />
            
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-start md:items-end justify-between mb-6 gap-2">
               <div className="flex items-center gap-1">
                  {/* FIX: Replaced Lucide Icon with your Custom SVG */}
                  <div className="  shadow-lg shadow-red-600 flex items-center justify-center animate-pulse">
                    <Image 
                      src="/sale.svg" 
                      alt="Sale Icon" 
                      width={18} 
                      height={18}
                      style={{ width: 'auto', height: 'auto' }}
                      className="invert brightness-0"
                    />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-xl font-black uppercase tracking-tighter leading-none">
                      HOT DEALS
                    </h3>
                    <p className="text-[8px] uppercase font-bold tracking-widest text-red-500 mt-1 flex items-center gap-1">
                      <span className="w-1 h-1.5 rounded-full bg-red-500 animate-ping" /> Limited Time Offers
                    </p>
                  </div>
               </div>
               
               <Link 
                 href="/shop?sort=price_asc" 
                 className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-red-600 transition-colors"
               >
                 View All Drops <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
               </Link>
            </div>
            
            <SmartSlider products={filteredSales} isInfinite={true} />
          </section>
        )}

        {/* 3. CATEGORY COLLECTIONS */}
        {categories.map((cat: string) => {
          // FIX: Explicitly typed 'p' as 'Product' to fix the final 'any' error
          const catProducts = filteredCatalog.filter((p: Product) => p.category === cat);
          if (catProducts.length === 0) return null;

          return (
            <section key={cat} className="py-10 snap-start scroll-pt-28 border-t border-border/30 first:border-0">
              <div className="container mx-auto px-4 flex justify-between items-end mb-6">
                 <div>
                   <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5 flex items-center gap-2">
                     <span className="w-6 h-[2px] bg-foreground/20"></span> The Archives
                   </p>
                   <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none">
                     {cat}
                   </h3>
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