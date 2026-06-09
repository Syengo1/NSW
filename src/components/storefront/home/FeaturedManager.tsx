'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import SmartSlider from './SmartSlider';
import { ArrowRight, SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// --- STRICT TYPES ---
type GenderFilter = 'all' | 'men' | 'women';
type SortType = 'featured' | 'price_asc' | 'price_desc';

export interface Product {
  id: string;
  title: string;
  slug: string;
  base_price: number;
  sale_price: number | null;
  category: string;
  description: string;
  main_image: string;
  hover_image?: string | null; 
  status: 'active' | 'draft' | 'dropping_soon' | 'archived'; 
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
  // --- STATE ---
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [sortBy, setSortBy] = useState<SortType>('featured');
  const [isChanging, setIsChanging] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- LOGIC: CLICK OUTSIDE TO CLOSE ---
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // --- LOGIC: SMOOTH FILTERING & SORTING ---
  const handlePreferenceChange = (type: 'gender' | 'sort', value: string) => {
    setIsChanging(true);
    
    if (type === 'gender') setGenderFilter(value as GenderFilter);
    if (type === 'sort') setSortBy(value as SortType);
    
    setIsDropdownOpen(false);
    setTimeout(() => setIsChanging(false), 300); 
  };

  // --- DATA PIPELINE: FILTER THEN SORT ---
  // 🚨 ESLINT FIX: Wrapped in useCallback to safely track dependencies for the React Compiler
  const processProducts = useCallback((products: Product[]) => {
    // 🚨 ESLINT FIX: Changed 'let' to 'const'. 
    const processed = [...products].filter((p) => {
      if (genderFilter === 'all') return true;
      if (!p.gender) return true; 
      if (genderFilter === 'women') return p.gender === 'women' || p.gender === 'unisex';
      if (genderFilter === 'men') return p.gender === 'men' || p.gender === 'unisex';
      return true;
    });

    // 2. Apply Mathematical Sorting (Sort mutates the array in place, so const is valid)
    if (sortBy === 'price_asc') {
      processed.sort((a, b) => {
        const priceA = a.sale_price || a.base_price;
        const priceB = b.sale_price || b.base_price;
        return priceA - priceB;
      });
    } else if (sortBy === 'price_desc') {
      processed.sort((a, b) => {
        const priceA = a.sale_price || a.base_price;
        const priceB = b.sale_price || b.base_price;
        return priceB - priceA;
      });
    }

    return processed;
  }, [genderFilter, sortBy]);

  // --- MEMOIZED RESULTS ---
  // 🚨 ESLINT FIX: Explicitly tracking 'processProducts' as a dependency
  const filteredSales = useMemo(() => processProducts(saleProducts), [processProducts, saleProducts]);
  const filteredCatalog = useMemo(() => processProducts(allProducts), [processProducts, allProducts]);

  return (
    <div className="relative min-h-screen pb-20 bg-background">
      
      {/* 1. STICKY COMMAND CENTER (Premium Dropdown) */}
      <div className="sticky top-16 z-40 pointer-events-none pt-4 pb-2">
        <div className="container mx-auto px-4 flex justify-center md:justify-start">
           
           <div className="relative inline-block pointer-events-auto" ref={dropdownRef}>
              {/* TRIGGER BUTTON */}
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={cn(
                  "inline-flex items-center gap-3 px-6 py-3 rounded-full bg-background/80 backdrop-blur-2xl border transition-all duration-300 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(255,255,255,0.05)]",
                  isDropdownOpen ? "border-foreground/30 scale-[1.02]" : "border-border/50 hover:scale-[1.02]"
                )}
              >
                 <SlidersHorizontal size={14} className="text-muted-foreground" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                   {genderFilter !== 'all' ? genderFilter : 'Filter'} & Sort
                 </span>
                 <ChevronDown 
                   size={14} 
                   className={cn("text-muted-foreground transition-transform duration-300", isDropdownOpen && "rotate-180")} 
                 />
              </button>

              {/* DROPDOWN MENU */}
              <div 
                className={cn(
                  "absolute top-full left-0 md:left-0 -ml-4 md:ml-0 mt-3 w-[280px] bg-background/95 backdrop-blur-3xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 origin-top-left",
                  isDropdownOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                )}
              >
                 {/* Section A: Gender/Department */}
                 <div className="p-5 border-b border-border/30">
                    <h4 className="text-[9px] uppercase font-black tracking-widest text-muted-foreground mb-3">Department</h4>
                    <div className="flex flex-col gap-1">
                       {['all', 'men', 'women'].map((g) => (
                          <button 
                            key={g}
                            onClick={() => handlePreferenceChange('gender', g)} 
                            className={cn(
                              "flex items-center justify-between text-xs font-bold uppercase tracking-widest p-2.5 rounded-lg transition-colors",
                              genderFilter === g ? "bg-foreground text-background" : "hover:bg-secondary text-foreground"
                            )}
                          >
                             {g} 
                             {genderFilter === g && <Check size={14} strokeWidth={3} />}
                          </button>
                       ))}
                    </div>
                 </div>

                 {/* Section B: Sorting Preferences */}
                 <div className="p-5">
                    <h4 className="text-[9px] uppercase font-black tracking-widest text-muted-foreground mb-3">Sort By</h4>
                    <div className="flex flex-col gap-1">
                       {[
                         { id: 'featured', label: 'Featured Drops' },
                         { id: 'price_asc', label: 'Price: Low to High' },
                         { id: 'price_desc', label: 'Price: High to Low' }
                       ].map((sort) => (
                          <button 
                            key={sort.id}
                            onClick={() => handlePreferenceChange('sort', sort.id)} 
                            className={cn(
                              "flex items-center justify-between text-xs font-bold uppercase tracking-widest p-2.5 rounded-lg transition-colors",
                              sortBy === sort.id ? "bg-foreground text-background" : "hover:bg-secondary text-foreground"
                            )}
                          >
                             {sort.label} 
                             {sortBy === sort.id && <Check size={14} strokeWidth={3} />}
                          </button>
                       ))}
                    </div>
                 </div>
              </div>
           </div>

        </div>
      </div>

      <div className={cn(
        "transition-all duration-500 ease-in-out snap-y snap-mandatory",
        isChanging ? "opacity-40 blur-[4px] scale-[0.98]" : "opacity-100 blur-0 scale-100"
      )}>

        {/* 2. SALES SLIDER (Top Deals) */}
        {filteredSales.length > 0 && (
          <section className="py-12 snap-start scroll-pt-28 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-full bg-red-600/10 dark:bg-red-600/5 blur-[100px] -z-10 pointer-events-none rounded-full" />
            <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[50%] h-[70%] bg-red-500/15 dark:bg-red-500/10 blur-[80px] -z-10 pointer-events-none rounded-full animate-breathe mix-blend-screen" />
            
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-start md:items-end justify-between mb-6 gap-2">
               <div className="flex items-center gap-1">
                  <div className="shadow-lg shadow-red-600 flex items-center justify-center animate-pulse">
                    <Image src="/sale.svg" alt="Sale" width={100} height={100} className="w-auto h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl md:text-xl font-black uppercase tracking-tighter leading-none">HOT DEALS</h3>
                    <p className="text-[8px] uppercase font-bold tracking-widest text-red-500 mt-1 flex items-center gap-1">
                      <span className="w-1 h-1.5 rounded-full bg-red-500 animate-ping" /> Limited Time Offers
                    </p>
                  </div>
               </div>
               
               <Link href="/shop?sort=price_asc" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:text-red-600 transition-colors">
                 View All Drops <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
               </Link>
            </div>
            
            <SmartSlider products={filteredSales} isInfinite={true} />
          </section>
        )}

        {/* 3. CATEGORY COLLECTIONS */}
        {categories.map((cat: string) => {
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