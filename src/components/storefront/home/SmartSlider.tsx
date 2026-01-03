'use client';

import { useRef, useState, useEffect } from 'react';
import ProductCard from '@/components/storefront/ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SmartSlider({ products, isInfinite = false }: { products: any[], isInfinite?: boolean }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  // Intelligent Scroll Handler
  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 0);
    setShowRight(scrollLeft < scrollWidth - clientWidth - 10); // 10px buffer
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [products]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8; // Scroll 80% of screen width
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    });
  };

  return (
    <div className="relative group">
      {/* Navigation Controls (Smart Visibility) */}
      <button 
        onClick={() => scroll('left')}
        className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 dark:bg-black/90 backdrop-blur shadow-xl rounded-full p-3 transition-all duration-300",
          showLeft ? "opacity-0 group-hover:opacity-100 translate-x-0" : "opacity-0 -translate-x-10 pointer-events-none"
        )}
      >
        <ChevronLeft size={20} />
      </button>

      <button 
        onClick={() => scroll('right')}
        className={cn(
          "absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 dark:bg-black/90 backdrop-blur shadow-xl rounded-full p-3 transition-all duration-300",
          showRight ? "opacity-0 group-hover:opacity-100 translate-x-0" : "opacity-0 translate-x-10 pointer-events-none"
        )}
      >
        <ChevronRight size={20} />
      </button>

      {/* The Scroll Container */}
      <div 
        ref={scrollRef}
        onScroll={checkScroll}
        className={cn(
          "flex gap-4 md:gap-6 overflow-x-auto pb-8 px-4 md:px-0 scrollbar-hide snap-x snap-mandatory",
          // Layout Intelligence: Pad left to align with container on desktop
          "md:pl-[max(1rem,calc((100vw-1280px)/2+1rem))]" 
        )}
      >
        {products.map((product) => (
          <div 
            key={product.id} 
            className="flex-shrink-0 w-[280px] md:w-[320px] snap-start"
          >
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
            />
          </div>
        ))}
        
        {/* Infinite Spacer or 'View All' Card could go here */}
        <div className="w-4 flex-shrink-0" />
      </div>
    </div>
  );
}