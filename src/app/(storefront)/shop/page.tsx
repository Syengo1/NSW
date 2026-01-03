import { createClient } from "@/lib/supabase/server";
import ProductCard from "@/components/storefront/ProductCard";
import ShopToolbar from "@/components/storefront/ShopToolbar"; 
import Link from "next/link";
import { SlidersHorizontal, XCircle, Filter, PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";

// --- 1. SMART METADATA ---
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const params = await searchParams;
  if (params.q) return { title: `Search: "${params.q}" | Nairobi Streetwear` };
  if (params.category) return { title: `${params.category} Collection | Nairobi Streetwear` };
  return { title: 'Shop All Drops | Nairobi Streetwear' };
}

// Keep data fresh but cached briefly for speed
export const revalidate = 60; 

export default async function ShopPage(props: {
  searchParams: Promise<{ category?: string; q?: string; sort?: string }>
}) {
  const params = await props.searchParams;
  const supabase = await createClient();

  // --- 2. INTELLIGENT DATABASE QUERY ---
  let query = supabase
    .from('products')
    .select(`
      id, title, slug, base_price, sale_price, category, status, created_at, description,
      product_images ( url, display_order ),
      variants ( stock_quantity )
    `) // Added 'description' here to fix the error
    .eq('status', 'active')
    .eq('is_visible', true);

  // A. Search Logic
  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`);
  }

  // B. Category Logic
  if (params.category) {
    query = query.eq('category', params.category);
  }

  // C. Sorting Intelligence
  switch (params.sort) {
    case 'price_asc': query = query.order('base_price', { ascending: true }); break;
    case 'price_desc': query = query.order('base_price', { ascending: false }); break;
    case 'oldest': query = query.order('created_at', { ascending: true }); break;
    default: query = query.order('created_at', { ascending: false }); 
  }

  const { data: rawProducts } = await query;

  // --- 3. DATA PROCESSING ---
  const products = rawProducts?.map(p => ({
    ...p,
    total_stock: p.variants.reduce((sum, v) => sum + v.stock_quantity, 0),
    main_image: p.product_images?.sort((a, b) => a.display_order - b.display_order)[0]?.url
  })) || [];

  // --- 4. DYNAMIC SIDEBAR DATA ---
  const { data: allCategories } = await supabase
    .from('products')
    .select('category')
    .eq('status', 'active')
    .eq('is_visible', true);
    
  const uniqueCategories = Array.from(new Set(allCategories?.map(c => c.category))).sort();

  return (
    <div className="min-h-screen bg-background text-foreground animate-fade-in pb-20">
      
      {/* HEADER BAR */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-30 shadow-sm transition-all">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
            
            <div className="w-full md:w-auto">
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
                {params.q ? (
                   <>Results for <span className="text-muted-foreground">"{params.q}"</span></>
                ) : (
                   params.category || 'All Drops'
                )}
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-1">
                {products.length} {products.length === 1 ? 'Item' : 'Items'} Found
              </p>
            </div>

            <ShopToolbar />

          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* SIDEBAR */}
          <div className="hidden lg:block lg:col-span-3 space-y-8">
            <div className="sticky top-32 space-y-8 animate-slide-in-left">
              
              {(params.category || params.q) && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Filter size={10} /> Active Filters
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {params.category && (
                      <Link href="/shop" className="group bg-primary text-primary-foreground pl-3 pr-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 hover:opacity-90 transition-all">
                        {params.category} <XCircle size={12} className="opacity-50 group-hover:opacity-100" />
                      </Link>
                    )}
                    {params.q && (
                      <Link href="/shop" className="group bg-primary text-primary-foreground pl-3 pr-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 hover:opacity-90 transition-all">
                        Search: {params.q} <XCircle size={12} className="opacity-50 group-hover:opacity-100" />
                      </Link>
                    )}
                    <Link href="/shop" className="text-[10px] underline decoration-muted-foreground/50 text-muted-foreground hover:text-foreground transition-colors ml-1">Clear</Link>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                  <SlidersHorizontal size={10} /> Collections
                </h3>
                <nav className="space-y-1">
                  <Link 
                    href="/shop" 
                    className={cn(
                      "block px-3 py-2 text-xs font-bold uppercase rounded-md transition-all border border-transparent",
                      !params.category ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-border"
                    )}
                  >
                    View All
                  </Link>
                  {uniqueCategories.map(cat => (
                    <Link 
                      key={cat} 
                      href={`/shop?category=${cat}`}
                      className={cn(
                        "block px-3 py-2 text-xs font-bold uppercase rounded-md transition-all border border-transparent",
                        params.category === cat ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-border"
                      )}
                    >
                      {cat}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </div>

          {/* PRODUCT GRID - UPDATED LAYOUT */}
          <div className="lg:col-span-9">
            {products.length > 0 ? (
              // UPDATED: grid-cols-2 (mobile) -> md:grid-cols-3 -> lg:grid-cols-4 (desktop 4 rows request)
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6 lg:gap-8">
                {products.map((product) => (
                  <div key={product.id} className="group relative animate-fade-in-up">
                    
                    {/* Stock & Sale Badges */}
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
                      status={product.status as any}
                      description={product.description} // Now valid!
                      totalStock={product.total_stock}
                    />
                  </div>
                ))}
              </div>
            ) : (
              // Empty State (Fixed Height Class)
              <div className="min-h-[50vh] flex flex-col items-center justify-center text-center border-2 border-dashed border-border rounded-xl p-8 bg-secondary/5 animate-pulse-slow">
                <PackageOpen size={48} className="text-muted-foreground/30 mb-4" />
                <h3 className="text-xl font-black uppercase tracking-tight">Nothing Here Yet</h3>
                <p className="text-muted-foreground text-sm mt-2 max-w-xs mx-auto">
                  We couldn't find matches for <span className="font-bold text-foreground">"{params.q || params.category}"</span>.
                </p>
                <Link 
                  href="/shop" 
                  className="mt-6 px-8 py-3 bg-foreground text-background font-bold uppercase tracking-widest text-xs rounded-full hover:opacity-90 transition-transform hover:scale-105 active:scale-95 shadow-xl"
                >
                  View All Drops
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}