'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import SmartSlider from './SmartSlider';
import { ArrowRight, SlidersHorizontal, ChevronDown, Check } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

type GenderFilter = 'all' | 'men' | 'women';
type SortType = 'featured' | 'price_asc' | 'price_desc';

// --- STRICT TYPES ---
export interface DBVariant { color: string; stock_quantity: number; }
export interface DBImage { url: string; color_tag?: string | null; display_order?: number; }

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
  variants: DBVariant[];
  product_images: DBImage[];
}

export interface DisplayProduct extends Product {
  display_id: string;
  display_color: string | null;
  display_image: string;
  display_stock: number;
}

interface FeaturedManagerProps {
  allProducts: Product[];
  saleProducts: Product[];
  categories: string[];
}

export default function FeaturedManager({ allProducts, saleProducts, categories }: FeaturedManagerProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('all');
  const [sortBy, setSortBy] = useState<SortType>('featured');
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePreferenceChange = (type: 'gender' | 'sort', value: string) => {
    if (type === 'gender') setGenderFilter(value as GenderFilter);
    if (type === 'sort') setSortBy(value as SortType);
    setIsDropdownOpen(false);
  };

  // --- THE ADVANCED VARIANT FLATTENING ENGINE ---
  const processProducts = useCallback((products: Product[]) => {
    const flattened: DisplayProduct[] = [];

    products.forEach((p) => {
      // 1. Gender Filtering
      if (genderFilter !== 'all' && p.gender && p.gender !== 'unisex' && p.gender !== genderFilter) return;

      // 2. Color Flattening
      if (p.variants && p.variants.length > 0) {
        // Only extract valid colors
        const uniqueColors = Array.from(new Set(p.variants.map(v => v.color).filter(Boolean)));
        
        if (uniqueColors.length > 0) {
          uniqueColors.forEach(color => {
            // Find all images specific to this color, maintaining their display order
            const colorImages = p.product_images.filter(img => img.color_tag?.toLowerCase() === color.toLowerCase());
            
            // Primary image fallback logic
            const colorMainImg = colorImages[0]?.url || p.main_image;
            // Hover image fallback logic (If we found a color-specific front image, but no back image, disable hover to prevent showing a mismatched color)
            const colorHoverImg = colorImages[1]?.url || (colorImages[0] ? null : p.hover_image);
            
            const colorStock = p.variants.filter(v => v.color === color).reduce((acc, v) => acc + v.stock_quantity, 0);

            flattened.push({
              ...p,
              display_id: `${p.id}-${color}`,
              display_color: color,
              display_image: colorMainImg,
              hover_image: colorHoverImg, // CRITICAL FIX: Assigns the correct hover image for this specific color variant
              display_stock: colorStock
            });
          });
        } else {
          // Safe fallback for products with variants but no color string assigned
          flattened.push({
            ...p,
            display_id: p.id,
            display_color: null,
            display_image: p.main_image,
            display_stock: p.total_stock
          });
        }
      } else {
        // Fallback for simple products with no variants
        flattened.push({
          ...p,
          display_id: p.id,
          display_color: null,
          display_image: p.main_image,
          display_stock: p.total_stock
        });
      }
    });

    // 3. Mathematical Sorting
    if (sortBy === 'price_asc') {
      flattened.sort((a, b) => (a.sale_price || a.base_price) - (b.sale_price || b.base_price));
    } else if (sortBy === 'price_desc') {
      flattened.sort((a, b) => (b.sale_price || b.base_price) - (a.sale_price || a.base_price));
    }

    return flattened;
  }, [genderFilter, sortBy]);

  const filteredSales = useMemo(() => processProducts(saleProducts), [processProducts, saleProducts]);
  const filteredCatalog = useMemo(() => processProducts(allProducts), [processProducts, allProducts]);

  return (
    <div className="relative min-h-screen pb-20 bg-background overflow-hidden">
      
      {/* 1. STICKY COMMAND CENTER */}
      <div className="sticky top-16 md:top-20 z-40 pointer-events-none pt-2 pb-2">
        <div className="container mx-auto px-4 flex justify-center md:justify-center">
           <div className="relative inline-block pointer-events-auto" ref={dropdownRef}>
              
              <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={cn(
                  "inline-flex items-center gap-3 px-6 py-3 rounded-full bg-background/80 supports-[backdrop-filter]:bg-background/60 backdrop-blur-2xl border transition-all duration-500 ease-[0.16,1,0.3,1] shadow-xl",
                  isDropdownOpen ? "border-foreground/30 scale-105" : "border-border/50 hover:scale-105 hover:border-foreground/20"
                )}
              >
                 <SlidersHorizontal size={14} className="text-muted-foreground" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-foreground">
                   {genderFilter !== 'all' ? genderFilter : 'Filter'} & Sort
                 </span>
                 <ChevronDown 
                   size={14} 
                   className={cn("text-muted-foreground transition-transform duration-500", isDropdownOpen && "rotate-180")} 
                 />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute top-full left-0 md:left-0 -ml-4 md:ml-0 mt-3 w-[280px] bg-background/95 supports-[backdrop-filter]:bg-background/80 backdrop-blur-3xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden origin-top-left"
                  >
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
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </div>
      </div>

      {/* 2. DYNAMIC CONTENT AREA */}
      <AnimatePresence mode="wait">
        <motion.div
          key={genderFilter + sortBy}
          initial={{ opacity: 0, y: 20}}
          animate={{ opacity: 1, y: 0}}
          exit={{ opacity: 0, y: -20}}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col w-full"
        >
          {/* HOT DEALS SLIDER */}
          {filteredSales.length > 0 && (
            <section className="py-12 relative isolate">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-full bg-red-600/5 blur-[100px] -z-10 rounded-full pointer-events-none" />
              
              <div className="container mx-auto px-4 flex flex-col md:flex-row items-start md:items-end justify-between mb-6 gap-3">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center animate-pulse shrink-0">
                      <Image src="/sale.svg" alt="Sale" width={20} height={20} className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-black uppercase tracking-tighter leading-none text-foreground">HOT DEALS</h3>
                      <p className="text-[9px] uppercase font-bold tracking-widest text-red-500 mt-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" /> Limited Time Offers
                      </p>
                    </div>
                 </div>
                 
                 <Link href="/shop?sort=price_asc" className="group flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-red-500 transition-colors">
                   View All Deals <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                 </Link>
              </div>
              
              <SmartSlider products={filteredSales} isInfinite={true} />
            </section>
          )}

          {/* CATEGORY COLLECTIONS */}
          {categories.map((cat: string) => {
            const catProducts = filteredCatalog.filter((p) => p.category === cat);
            if (catProducts.length === 0) return null;

            return (
              <section key={cat} className="py-12 border-t border-border/30 first:border-0">
                <div className="container mx-auto px-4 flex justify-between items-end mb-8">
                   <div>
                     <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2 flex items-center gap-2">
                       <span className="w-8 h-[1px] bg-foreground/30"></span> The Archives
                     </p>
                     <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none text-foreground">
                       {cat}
                     </h3>
                   </div>
                </div>
                <SmartSlider products={catProducts} />
              </section>
            );
          })}
        </motion.div>
      </AnimatePresence>

    </div>
  );
}