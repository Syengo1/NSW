import Link from "next/link";
import { PackageOpen } from "lucide-react";
import ProductCard from "@/components/storefront/ProductCard";

// 1. Strict Typing to replace 'any'
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
  if (products.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-xl p-8 bg-secondary/5 animate-pulse-slow lg:col-span-9">
        <PackageOpen size={48} className="text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-black uppercase tracking-tight">Nothing Here Yet</h3>
        <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
          {/* 2. Properly escaped HTML entities */}
          We couldn&apos;t find matches for <span className="font-bold text-foreground">&quot;{currentQuery || currentCategory}&quot;</span>.
        </p>
        <Link 
          href="/shop" 
          className="mt-6 px-8 py-3 bg-foreground text-background font-bold uppercase tracking-widest text-xs rounded-full hover:opacity-90 transition-transform hover:scale-105 active:scale-95 shadow-xl"
        >
          View All Drops
        </Link>
      </div>
    );
  }

  return (
    <div className="lg:col-span-9">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8">
        {products.map((product) => (
          <div key={product.id} className="group relative animate-fade-in-up">
            
            {/* Status Badges */}
            {product.total_stock === 0 ? (
              <div className="absolute top-3 right-3 z-10 bg-red-600 text-white text-[9px] font-black uppercase px-2 py-1 rounded-sm shadow-lg pointer-events-none">
                Sold Out
              </div>
            ) : (
               product.sale_price && (
                <div className="absolute top-3 right-3 z-10 bg-black text-white dark:bg-white dark:text-black text-[9px] font-black uppercase px-2 py-1 rounded-sm shadow-lg pointer-events-none">
                  Sale
                </div>
               )
            )}

            <ProductCard 
              id={product.id}
              title={product.title}
              slug={product.slug}
              price={product.base_price}
              salePrice={product.sale_price}
              category={product.category}
              image={product.main_image}
              hoverImage={product.hover_image}
              // 3. 'as any' is completely removed thanks to strict typing
              status={product.status} 
              description={product.description}
              totalStock={product.total_stock}
            />
          </div>
        ))}
      </div>
    </div>
  );
}