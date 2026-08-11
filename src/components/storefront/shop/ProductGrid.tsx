'use client';

import Link from "next/link";
import { SearchX } from "lucide-react";
import ProductCard from "@/components/storefront/ProductCard";
import { motion, AnimatePresence } from "framer-motion";
import type { DisplayProduct } from "@/app/(storefront)/shop/actions";

interface ProductGridProps {
  products: DisplayProduct[];
  currentQuery?: string;
  currentCategory?: string;
}

export default function ProductGrid({ products, currentQuery, currentCategory }: ProductGridProps) {
  
  if (products.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center border border-border/50 border-dashed rounded-2xl p-8 bg-secondary/10 animate-in fade-in duration-700 lg:col-span-9">
        <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center shadow-sm border border-border/50 mb-6">
          <SearchX size={32} className="text-muted-foreground/50" />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Nothing Here Yet</h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
          We couldn&apos;t find any drops matching <span className="font-bold text-foreground underline decoration-border underline-offset-4">&quot;{currentQuery || currentCategory}&quot;</span>.
        </p>
        <Link 
          href="/shop" 
          className="mt-8 px-8 py-4 bg-foreground text-background font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl"
        >
          Clear Filters
        </Link>
      </div>
    );
  }

  return (
    <div className="lg:col-span-9">
      <motion.div 
        layout 
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8"
      >
        <AnimatePresence mode="popLayout">
          {products.map((product, index) => (
            <motion.div 
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ 
                duration: 0.4, 
                ease: [0.16, 1, 0.3, 1],
                delay: index < 12 ? index * 0.05 : 0 // Only stagger the first few to prevent long load waits
              }}
              key={product.display_id} 
              className="group relative"
            >
              <ProductCard 
                id={product.id}
                title={product.title}
                slug={product.slug}
                price={product.base_price}
                salePrice={product.sale_price}
                category={product.category}
                image={product.display_image}
                hoverImage={product.hover_image}
                status={product.status} 
                description={product.description}
                totalStock={product.display_stock}
                color={product.display_color} // Deep links straight to this specific color
                priority={index <= 3}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}