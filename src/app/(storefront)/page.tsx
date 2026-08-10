import { createClient } from "@/lib/supabase/server";
import Hero from "@/components/storefront/home/Hero";
import FeaturedManager, { Product } from "@/components/storefront/home/FeaturedManager";
import NewsTicker from "@/components/storefront/home/NewsTicker";
import Footer from "@/components/storefront/Footer";
import type { Metadata } from "next";

// Cache for 60 seconds for performance
export const revalidate = 60;

// --- SPECIFIC HOMEPAGE METADATA ---
export const metadata: Metadata = {
  title: "OP Fits | Curated Hype & Streetwear in Kenya",
  description: "Nairobi's premier plug for exclusive streetwear, hyped sneakers, and premium apparel. Hand-picked fits, 100% authentic, delivered fast across Kenya.",
};

export default async function HomePage() {
  const supabase = await createClient();

  // 1. FETCH ACTIVE PRODUCTS
  // CRITICAL FIX: Added `color` to variants and `color_tag` to product_images to satisfy the Flattening Engine
  const { data: rawProducts } = await supabase
    .from('products')
    .select(`
      id, title, slug, base_price, sale_price, category, status, description, created_at, gender,
      product_images ( url, display_order, color_tag ),
      variants ( stock_quantity, color )
    `)
    .eq('status', 'active')
    .eq('is_visible', true);

  // 2. SMART PROCESSING & STRICT TYPING
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products: Product[] = (rawProducts || []).map((p: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortedImages = p.product_images?.sort((a: any, b: any) => a.display_order - b.display_order) || [];
    
    return {
      id: p.id,
      title: p.title,
      slug: p.slug,
      base_price: p.base_price,
      sale_price: p.sale_price,
      category: p.category,
      status: p.status,
      description: p.description || '',
      gender: p.gender || 'unisex',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      total_stock: p.variants?.reduce((sum: number, v: any) => sum + (v.stock_quantity || 0), 0) || 0,
      main_image: sortedImages[0]?.url || '',           
      hover_image: sortedImages[1]?.url || null,  
      discountPct: p.sale_price ? Math.round(((p.base_price - p.sale_price) / p.base_price) * 100) : 0,
      product_images: sortedImages,
      variants: p.variants || []
    };
  });

  // 3. SEGMENT DATA
  const saleProducts = [...products]
    .filter(p => p.sale_price && p.sale_price < p.base_price)
    .sort((a, b) => b.discountPct - a.discountPct);

  // 4. INTELLIGENT CATEGORY SORTING
  const PREFERRED_ORDER = [
    "Hoodies", 
    "T-Shirts", 
    "Footwear", 
    "Headwear", 
    "Accessories"
  ];

  const categories = Array.from(new Set(products.map(p => p.category))).sort((a, b) => {
    const indexA = PREFERRED_ORDER.indexOf(a);
    const indexB = PREFERRED_ORDER.indexOf(b);

    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;
    
    return a.localeCompare(b);
  });

  return (
    <>
      {/* A. HERO SECTION */}
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
    </>
  );
}