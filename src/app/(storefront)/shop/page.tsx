import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/storefront/ProductCard";
import { SlidersHorizontal } from "lucide-react";
import Link from "next/link";

// 1. DYNAMIC METADATA
export const metadata = {
  title: 'Shop All | Nairobi Streetwear',
  description: 'Browse the latest drops and exclusive collections.',
};

export const revalidate = 60; // Revalidate every minute

export default async function ShopPage(props: {
  searchParams: Promise<{ category?: string }>
}) {
  const searchParams = await props.searchParams;
  const categoryFilter = searchParams.category;
  const supabase = await createClient();

  // 2. BUILD QUERY
  let query = supabase
    .from('products')
    .select(`
      id,
      title,
      slug,
      base_price,
      category,
      status,
      product_images ( url, display_order )
    `)
    .eq('is_active', true) // Only show active items
    .order('created_at', { ascending: false });

  // Apply Filter if present
  if (categoryFilter) {
    query = query.eq('category', categoryFilter);
  }

  const { data: products } = await query;

  // 3. CATEGORY LIST (For Sidebar)
  // In a real app, you might fetch this dynamically
  const categories = ["Hoodies", "T-Shirts", "Outerwear", "Footwear", "Accessories"];

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4 md:px-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 border-b border-white/10 pb-8 gap-6">
        <div>
          <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85]">
            All <br/><span className="text-neutral-600">Drops</span>
          </h1>
        </div>
        <div className="text-right">
          <p className="text-sm font-mono text-neutral-400 uppercase tracking-widest mb-2">
            {products?.length || 0} Artifacts Found
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* 4. SIDEBAR FILTERS (Sticky on Desktop) */}
        <div className="lg:col-span-3 lg:sticky lg:top-32 h-fit space-y-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent mb-4">
             <SlidersHorizontal size={14} /> Filter By
          </div>
          
          <div className="space-y-2">
            <Link 
              href="/shop"
              className={`block text-sm uppercase font-bold tracking-wide transition-colors ${!categoryFilter ? 'text-white pl-2 border-l-2 border-accent' : 'text-neutral-500 hover:text-white'}`}
            >
              View All
            </Link>
            {categories.map(cat => (
              <Link 
                key={cat} 
                href={`/shop?category=${cat}`}
                className={`block text-sm uppercase font-bold tracking-wide transition-colors ${categoryFilter === cat ? 'text-white pl-2 border-l-2 border-accent' : 'text-neutral-500 hover:text-white'}`}
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>

        {/* 5. PRODUCT GRID */}
        <div className="lg:col-span-9">
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
              {products.map((product) => {
                 // Get primary image
                 const mainImage = product.product_images?.sort((a, b) => a.display_order - b.display_order)[0]?.url;
                 
                 return (
                   <ProductCard 
                     key={product.id}
                     id={product.id}
                     title={product.title}
                     slug={product.slug}
                     price={product.base_price}
                     category={product.category}
                     image={mainImage}
                     status={product.status} // Pass the status enum
                   />
                 );
              })}
            </div>
          ) : (
            <div className="py-20 text-center border border-dashed border-white/10 rounded-xl">
              <p className="text-neutral-500 uppercase tracking-widest text-sm">No products found in this category.</p>
              <Link href="/shop" className="inline-block mt-4 text-white underline underline-offset-4 text-xs font-bold uppercase">
                Clear Filters
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}