'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import ProductCard from '@/components/storefront/ProductCard';
import { ChevronLeft, ChevronRight, ArrowRight, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface SmartSliderProps {
  products: any[];
  isInfinite?: boolean;
}

export default function SmartSlider({ products, isInfinite = false }: SmartSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);
  const [progress, setProgress] = useState(0);

  // --- INTELLIGENCE: DERIVE CATEGORY ---
  const primaryCategory = products[0]?.category || 'Collection';
  const viewAllLink = `/shop?category=${primaryCategory}`;

  // --- LOGIC: INTELLIGENT SCROLL TRACKER ---
  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    
    // 1. Toggle Button Visibility
    setShowLeft(scrollLeft > 20); 
    setShowRight(scrollLeft < scrollWidth - clientWidth - 20);

    // 2. Calculate Progress
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setProgress((scrollLeft / maxScroll) * 100);
    }
  }, []);

  // --- LOGIC: RESIZE & INIT ---
  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [products, checkScroll]);

  // --- LOGIC: NAVIGATION ---
  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.75; 
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  // --- LOGIC: KEYBOARD SUPPORT ---
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') scroll('left');
    if (e.key === 'ArrowRight') scroll('right');
  };

  return (
    <div 
      className="relative group focus-within:ring-0 outline-none" 
      onKeyDown={handleKeyDown}
      tabIndex={0} 
      aria-label={`${primaryCategory} Carousel`}
    >
      {/* --- INTELLIGENCE: FADE MASKS --- */}
      <div className={cn(
        "absolute left-0 top-0 bottom-4 w-8 z-10 bg-gradient-to-r from-background to-transparent transition-opacity duration-300 pointer-events-none",
        showLeft ? "opacity-100" : "opacity-0"
      )} />
      
      <div className={cn(
        "absolute right-0 top-0 bottom-4 w-12 z-10 bg-gradient-to-l from-background to-transparent transition-opacity duration-300 pointer-events-none",
        showRight ? "opacity-100" : "opacity-0"
      )} />

      {/* --- NAVIGATION BUTTONS (Desktop Only) --- */}
      <div className="hidden md:block pointer-events-none absolute inset-0 z-20">
        <button 
          onClick={() => scroll('left')}
          disabled={!showLeft}
          aria-label="Scroll Left"
          className={cn(
            "pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-black/90 backdrop-blur-md shadow-xl border border-black/5 dark:border-white/10 rounded-full p-2.5 transition-all duration-300 ease-out hover:scale-110 active:scale-95 disabled:opacity-0",
            showLeft ? "translate-x-0 opacity-100" : "-translate-x-4 opacity-0"
          )}
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>

        <button 
          onClick={() => scroll('right')}
          disabled={!showRight}
          aria-label="Scroll Right"
          className={cn(
            "pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-black/90 backdrop-blur-md shadow-xl border border-black/5 dark:border-white/10 rounded-full p-2.5 transition-all duration-300 ease-out hover:scale-110 active:scale-95 disabled:opacity-0",
            showRight ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
          )}
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>

      {/* --- SCROLL CONTAINER --- */}
      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className={cn(
          // DENSITY FIX: gap-2 on mobile (tighter), gap-4 on desktop
          // PADDING FIX: pb-2 (was pb-8) to remove dead space at bottom
          "flex gap-2 md:gap-4 overflow-x-auto pb-4 pt-1",
          "scrollbar-hide snap-x snap-mandatory scroll-smooth",
          // Layout Intelligence: 
          "px-4 md:px-0",
          "md:pl-[max(1rem,calc((100vw-1280px)/2+1rem))]",
          "scroll-pl-4 md:scroll-pl-[max(1rem,calc((100vw-1280px)/2+1rem))]"
        )}
      >
        {products.map((product) => (
          <div 
            key={product.id} 
            // DENSITY FIX: w-[150px] on mobile allows 2.5 cards to be seen
            // sm:w-[180px], md:w-[220px] for larger screens
            className="flex-shrink-0 w-[150px] sm:w-[180px] md:w-[220px] snap-start transition-opacity duration-500"
          >
            {/* Pass size='sm' on mobile to ensure fonts scale down properly */}
            <ProductCard 
              id={product.id}
              title={product.title}
              slug={product.slug}
              price={product.base_price}
              salePrice={product.sale_price}
              image={product.main_image}
              category={product.category}
              status={product.status}
              description={product.description}
              totalStock={product.total_stock}
              // Optional: You could pass size="sm" here if you wanted even smaller text on mobile
              size="sm" 
            />
          </div>
        ))}

        {/* --- INTELLIGENT "VIEW ALL" CARD --- */}
        {!isInfinite && (
          <div className="flex-shrink-0 w-[140px] sm:w-[160px] md:w-[200px] snap-start flex items-center justify-center h-full aspect-[3/4.5]">
            <Link 
              href={viewAllLink}
              className="group flex flex-col items-center justify-center gap-2 p-4 text-center border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl w-full h-full hover:border-black dark:hover:border-white hover:bg-neutral-50 dark:hover:bg-white/5 transition-all duration-300"
            >
              <div className="p-3 rounded-full bg-neutral-100 dark:bg-neutral-800 group-hover:scale-110 transition-transform duration-300">
                <LayoutGrid size={20} className="text-neutral-500 group-hover:text-black dark:group-hover:text-white" />
              </div>
              
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">
                  Explore
                </span>
                <span className="block text-xs font-black uppercase tracking-tight line-clamp-1">
                  {primaryCategory}
                </span>
              </div>

              <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest border-b border-transparent group-hover:border-black dark:group-hover:border-white transition-colors pb-0.5">
                View All <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        )}
        
        {/* End Spacer */}
        <div className="w-2 md:w-[calc((100vw-1280px)/2+1rem)] flex-shrink-0" />
      </div>

      {/* --- PROGRESS BAR (Optional: Hidden on very small screens to save space) --- */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-100 dark:bg-neutral-800 mx-4 md:mx-[max(1rem,calc((100vw-1280px)/2+1rem))] rounded-full overflow-hidden opacity-50">
        <div 
          className="h-full bg-black dark:bg-white transition-all duration-300 ease-out"
          style={{ width: `${Math.max(5, progress)}%` }} 
        />
      </div>
    </div>
  );
}