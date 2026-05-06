import { createClient } from "@/lib/supabase/server";
import ShopToolbar from "@/components/storefront/ShopToolbar"; 
import ShopFilters from "@/components/storefront/shop/ShopFilters";
import ProductGrid from "@/components/storefront/shop/ProductGrid";

// --- 1. SMART METADATA ---
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const params = await searchParams;
  if (params.q) return { title: `Search: "${params.q}" | OP Fits` };
  if (params.category) return { title: `${params.category} Collection | OP Fits` };
  return { title: 'Shop All Drops | OP Fits' };
}

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
    `)
    .eq('status', 'active')
    .eq('is_visible', true);

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`);
  }

  if (params.category) {
    query = query.eq('category', params.category);
  }

  switch (params.sort) {
    case 'price_asc': query = query.order('base_price', { ascending: true }); break;
    case 'price_desc': query = query.order('base_price', { ascending: false }); break;
    case 'oldest': query = query.order('created_at', { ascending: true }); break;
    default: query = query.order('created_at', { ascending: false }); 
  }

  const { data: rawProducts } = await query;

  // --- 3. DATA PROCESSING ---
  const products = rawProducts?.map(p => {
    // Sort images by display order to guarantee cover and hover images
    const sortedImages = p.product_images?.sort((a, b) => a.display_order - b.display_order) || [];
    
    return {
      ...p,
      total_stock: p.variants.reduce((sum, v) => sum + v.stock_quantity, 0),
      main_image: sortedImages[0]?.url,
      hover_image: sortedImages[1]?.url || null, // Extract second image for hover effect
    };
  }) || [];

  // --- 4. DYNAMIC CATEGORIES ---
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
                   // FIX: Properly escaped quotation marks
                   <>Results for <span className="text-muted-foreground">&quot;{params.q}&quot;</span></>
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

      {/* MAIN LAYOUT */}
      <div className="container mx-auto px-4 py-4 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 md:gap-8 lg:gap-12">
          
          <ShopFilters 
            categories={uniqueCategories} 
            currentCategory={params.category} 
            currentQuery={params.q} 
          />
          
          <ProductGrid 
            products={products} 
            currentCategory={params.category} 
            currentQuery={params.q} 
          />

        </div>
      </div>
    </div>
  );
}