import { createClient } from "@/lib/supabase/server";
import Hero from "@/components/storefront/home/Hero";
import FeaturedManager from "@/components/storefront/home/FeaturedManager";
import NewsTicker from "@/components/storefront/home/NewsTicker";
import Footer from "@/components/storefront/Footer";

// Cache for 60 seconds for performance
export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();

  // 1. FETCH ACTIVE PRODUCTS
  const { data: rawProducts } = await supabase
    .from('products')
    .select(`
      id, title, slug, base_price, sale_price, category, status, description, created_at, gender,
      product_images ( url, display_order ),
      variants ( stock_quantity )
    `)
    .eq('status', 'active')
    .eq('is_visible', true);

  // 2. SMART PROCESSING
  const products = rawProducts?.map(p => {
  // Sort images by their display order
  const sortedImages = p.product_images?.sort((a, b) => a.display_order - b.display_order) || [];
  
  return {
    ...p,
    total_stock: p.variants.reduce((sum, v) => sum + v.stock_quantity, 0),
    main_image: sortedImages[0]?.url,           // First image
    hover_image: sortedImages[1]?.url || null,  // Second image (if it exists)
    discountPct: p.sale_price ? ((p.base_price - p.sale_price) / p.base_price) : 0
  };
}) || [];

  // 3. SEGMENT DATA
  // Sort sales by highest discount first
  const saleProducts = [...products]
    .filter(p => p.sale_price && p.sale_price < p.base_price)
    .sort((a, b) => b.discountPct - a.discountPct);

  // 1. DEFINE YOUR EXACT DESIRED ORDER HERE
  const PREFERRED_ORDER = [
    "Hoodies", 
    "T-Shirts", 
    "Footwear", 
    "Headwear", 
    "Accessories"
  ];

  // 2. EXTRACT AND SORT CATEGORIES INTELLIGENTLY
  const categories = Array.from(new Set(products.map(p => p.category))).sort((a, b) => {
    const indexA = PREFERRED_ORDER.indexOf(a);
    const indexB = PREFERRED_ORDER.indexOf(b);

    // If both exist in your preferred list, sort by their position in the list
    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    
    // If 'a' is in the list but 'b' is not, 'a' gets priority
    if (indexA !== -1) return -1;
    
    // If 'b' is in the list but 'a' is not, 'b' gets priority
    if (indexB !== -1) return 1;
    
    // If neither are in your list (e.g., you added a new category in the admin panel but forgot to add it here), fall back to alphabetical
    return a.localeCompare(b);
  });

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background">
      
      {/* A. HERO SECTION (Now includes welcome text) */}
      <Hero />

      {/* C. FEATURED SHOWCASE (Smart Filter Engine) */}
      <FeaturedManager 
        allProducts={products} 
        saleProducts={saleProducts} 
        categories={categories} 
      />

      {/* D. FOOTER & TICKER */}
      <Footer />
      <NewsTicker />
      
    </main>
  );
}