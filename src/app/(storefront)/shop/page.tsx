import { createClient } from "@/lib/supabase/server";
import ShopToolbar from "@/components/storefront/ShopToolbar"; 
import ShopFilters from "@/components/storefront/shop/ShopFilters";
import ProductGrid from "@/components/storefront/shop/ProductGrid";
import type { Metadata } from "next";

export const revalidate = 60; 

// --- 1. SMART METADATA ---
export async function generateMetadata({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string; category?: string; gender?: string }> 
}): Promise<Metadata> {
  const params = await searchParams;
  const baseDescription = "Browse our entire catalog of globally sourced streetwear and authentic sneakers. Filter by brand, size, and price. Secure your fit before it sells out.";

  let title = "Shop All Drops";

  if (params.q) {
    title = `Search: "${params.q}"`;
  } else if (params.category || params.gender) {
    const genderStr = params.gender && params.gender !== 'all' 
      ? params.gender.charAt(0).toUpperCase() + params.gender.slice(1) + "'s" 
      : "";
    const catStr = params.category || "Collection";
    title = `${genderStr} ${catStr}`.trim();
  }

  return { 
    title,
    description: params.q ? `Search results for "${params.q}". ${baseDescription}` : baseDescription
  };
}

export default async function ShopPage(props: {
  searchParams: Promise<{ category?: string; q?: string; sort?: string; gender?: string }>
}) {
  const params = await props.searchParams;
  const supabase = await createClient();

  // --- 2. INTELLIGENT DATABASE QUERY ---
  let query = supabase
    .from('products')
    .select(`
      id, title, slug, base_price, sale_price, category, status, created_at, description, gender,
      product_images ( url, display_order ),
      variants ( stock_quantity )
    `)
    .eq('status', 'active')
    .eq('is_visible', true);

  // Search Filter
  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,description.ilike.%${params.q}%`);
  }

  // Category Filter
  if (params.category) {
    query = query.eq('category', params.category);
  }

  // 🚨 NEW: Gender Filter (Safely includes Unisex and legacy null items)
  if (params.gender && params.gender !== 'all') {
    query = query.or(`gender.eq.${params.gender},gender.eq.unisex,gender.is.null`);
  }

  // Sorting
  switch (params.sort) {
    case 'price_asc': query = query.order('base_price', { ascending: true }); break;
    case 'price_desc': query = query.order('base_price', { ascending: false }); break;
    case 'oldest': query = query.order('created_at', { ascending: true }); break;
    default: query = query.order('created_at', { ascending: false }); 
  }

  const { data: rawProducts } = await query;

  // --- 3. DATA PROCESSING ---
  const products = rawProducts?.map(p => {
    const sortedImages = p.product_images?.sort(
      (a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order
    ) || [];
    
    return {
      ...p,
      total_stock: p.variants.reduce(
        (sum: number, v: { stock_quantity: number }) => sum + v.stock_quantity, 
        0
      ),
      main_image: sortedImages[0]?.url,
      hover_image: sortedImages[1]?.url || null, 
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
    <div className="min-h-screen bg-background text-foreground animate-in fade-in pb-20">
      
      {/* HEADER BAR */}
      <div className="border-b border-border bg-card/80 backdrop-blur-md sticky top-[80px] md:top-[72px] z-20 shadow-sm transition-all">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="w-full md:w-auto">
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
                {params.q ? (
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
      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 md:gap-8 lg:gap-12">
          
          <ShopFilters 
            categories={uniqueCategories} 
            currentCategory={params.category} 
            currentQuery={params.q} 
            currentGender={params.gender}
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