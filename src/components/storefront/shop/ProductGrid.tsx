import Link from "next/link";
import { SearchX } from "lucide-react";
import ProductCard from "@/components/storefront/ProductCard";

// 1. Strict Typing
export interface GridProduct {
  id: string;
  title: string;
  slug: string;
  base_price: number;
  sale_price?: number | null;
  main_image: string;
  hover_image?: string | null;
  category: string;
  status: 'active' | 'draft' | 'dropping_soon' | 'archived';
  description?: string;
  total_stock: number;
}

interface ProductGridProps {
  products: GridProduct[];
  currentQuery?: string;
  currentCategory?: string;
}

export default function ProductGrid({ products, currentQuery, currentCategory }: ProductGridProps) {
  
  // --- EMPTY STATE ---
  if (products.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center border border-border/50 border-dashed rounded-2xl p-8 bg-secondary/10 animate-in fade-in duration-700 lg:col-span-9">
        <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center shadow-sm border border-border/50 mb-6">
          <SearchX size={32} className="text-muted-foreground/50" />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Nothing Here Yet</h3>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
          We couldn&apos;t find any drops matching <span className="font-bold text-foreground underline decoration-border underline-offset-4">&quot;{currentQuery || currentCategory}&quot;</span>. Check your spelling or clear the filters.
        </p>
        <Link 
          href="/shop" 
          className="mt-8 px-8 py-4 bg-foreground text-background font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl"
        >
          View All Drops
        </Link>
      </div>
    );
  }

  // --- POPULATED GRID ---
  return (
    <div className="lg:col-span-9">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8">
        {products.map((product, index) => (
          <div 
            key={product.id} 
            // 🚨 UI FIX: Staggered entrance animation mathematically driven by the index
            className="group relative animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
            style={{ animationDelay: `${index * 75}ms` }}
          >
            
            <ProductCard 
              id={product.id}
              title={product.title}
              slug={product.slug}
              price={product.base_price}
              salePrice={product.sale_price}
              category={product.category}
              image={product.main_image}
              hoverImage={product.hover_image}
              status={product.status} 
              description={product.description}
              totalStock={product.total_stock}
              // 🚨 PERFORMANCE FIX (LCP): The top row (first 4 items) is instantly prioritized for network fetching
              priority={index <= 3}
            />
            
          </div>
        ))}
      </div>
    </div>
  );
}