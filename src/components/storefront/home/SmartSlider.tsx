'use client';

import { useRef, useState, useCallback } from 'react';
import ProductCard from '@/components/storefront/ProductCard';
import { ChevronLeft, ChevronRight, ArrowRight, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import type { DisplayProduct } from './FeaturedManager';

interface SmartSliderProps {
  products: DisplayProduct[];
  isInfinite?: boolean;
}

export default function SmartSlider({ products, isInfinite = false }: SmartSliderProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const primaryCategory = products[0]?.category || 'Collection';
  const viewAllLink = `/shop?category=${primaryCategory}`;

  const { scrollXProgress } = useScroll({ container: scrollRef });

  useMotionValueEvent(scrollXProgress, "change", (latest) => {
    setShowLeft(latest > 0.01);
    setShowRight(latest < 0.99);
  });

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.75; 
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') scroll('left');
    if (e.key === 'ArrowRight') scroll('right');
  };

  return (
    <div 
      className="relative focus-within:ring-0 outline-none" 
      onKeyDown={handleKeyDown}
      tabIndex={0} 
      aria-label={`${primaryCategory} Carousel`}
    >
      <div className={cn(
        "absolute left-0 top-0 bottom-4 w-8 md:w-16 z-10 bg-gradient-to-r from-background to-transparent transition-opacity duration-500 pointer-events-none",
        showLeft ? "opacity-100" : "opacity-0"
      )} />
      
      <div className={cn(
        "absolute right-0 top-0 bottom-4 w-12 md:w-24 z-10 bg-gradient-to-l from-background to-transparent transition-opacity duration-500 pointer-events-none",
        showRight ? "opacity-100" : "opacity-0"
      )} />

      <div className="hidden md:block pointer-events-none absolute inset-0 z-20">
        <button 
          onClick={() => scroll('left')}
          disabled={!showLeft}
          aria-label="Scroll Left"
          className={cn(
            "pointer-events-auto absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-xl shadow-xl border border-border/50 rounded-full p-3 transition-all duration-500 ease-[0.16,1,0.3,1] hover:scale-110 active:scale-95 disabled:opacity-0 disabled:-translate-x-4",
            showLeft ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0"
          )}
        >
          <ChevronLeft size={20} strokeWidth={2} />
        </button>

        <button 
          onClick={() => scroll('right')}
          disabled={!showRight}
          aria-label="Scroll Right"
          className={cn(
            "pointer-events-auto absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 backdrop-blur-xl shadow-xl border border-border/50 rounded-full p-3 transition-all duration-500 ease-[0.16,1,0.3,1] hover:scale-110 active:scale-95 disabled:opacity-0 disabled:translate-x-4",
            showRight ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"
          )}
        >
          <ChevronRight size={20} strokeWidth={2} />
        </button>
      </div>

      <div 
        ref={scrollRef}
        className={cn(
          "flex gap-3 md:gap-5 overflow-x-auto pb-6 pt-2",
          "scrollbar-hide snap-x snap-mandatory scroll-smooth",
          "px-4 md:px-0",
          "md:pl-[max(1rem,calc((100vw-1280px)/2+1rem))]",
          "scroll-pl-4 md:scroll-pl-[max(1rem,calc((100vw-1280px)/2+1rem))]"
        )}
      >
        {products.map((product, idx) => (
          <motion.div 
            key={product.display_id} // Unique ID based on color
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.7, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="flex-shrink-0 w-[160px] sm:w-[200px] md:w-[240px] snap-start"
          >
            <ProductCard 
              id={product.id}
              title={product.title}
              slug={product.slug}
              price={product.base_price}
              salePrice={product.sale_price}
              image={product.display_image} // Passes the color-specific image
              hoverImage={product.hover_image}
              category={product.category}
              status={product.status}
              description={product.description}
              totalStock={product.display_stock} // Passes the color-specific stock
              color={product.display_color} // Deep-link parameter
              size="sm" 
            />
          </motion.div>
        ))}

        {!isInfinite && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="flex-shrink-0 w-[150px] sm:w-[180px] md:w-[220px] snap-start flex items-center justify-center h-full aspect-[3/4.05]"
          >
            <Link 
              href={viewAllLink}
              className="group flex flex-col items-center justify-center gap-3 p-6 text-center border border-dashed border-border/60 rounded-2xl w-full h-full hover:border-foreground hover:bg-secondary/30 transition-all duration-500 ease-out"
            >
              <div className="p-4 rounded-full bg-secondary group-hover:scale-110 transition-transform duration-500 ease-[0.16,1,0.3,1]">
                <LayoutGrid size={24} className="text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Explore
                </span>
                <span className="block text-sm font-black uppercase tracking-tight line-clamp-1">
                  {primaryCategory}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors mt-2">
                View All <ArrowRight size={12} className="group-hover:translate-x-1.5 transition-transform duration-300 ease-out" />
              </div>
            </Link>
          </motion.div>
        )}
        
        <div className="w-4 md:w-[calc((100vw-1280px)/2+1rem)] flex-shrink-0" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-secondary mx-4 md:mx-[max(1rem,calc((100vw-1280px)/2+1rem))] rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-foreground origin-left will-change-transform"
          style={{ scaleX: scrollXProgress }} 
        />
      </div>
    </div>
  );
}