import { createClient } from "@/lib/supabase/server";
import Hero from "@/components/storefront/home/Hero";
import FeaturedManager from "@/components/storefront/home/FeaturedManager";
import NewsTicker from "@/components/storefront/home/NewsTicker";
import Footer from "@/components/storefront/Footer";
import { MoveDown } from "lucide-react";

// Cache for 60 seconds for performance
export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();

  // 1. FETCH ACTIVE PRODUCTS
  const { data: rawProducts } = await supabase
    .from('products')
    .select(`
      id, title, slug, base_price, sale_price, category, status, description, created_at,
      product_images ( url, display_order ),
      variants ( stock_quantity )
    `)
    .eq('status', 'active')
    .eq('is_visible', true);

  // 2. SMART PROCESSING
  const products = rawProducts?.map(p => ({
    ...p,
    total_stock: p.variants.reduce((sum, v) => sum + v.stock_quantity, 0),
    main_image: p.product_images?.sort((a, b) => a.display_order - b.display_order)[0]?.url,
    // Calculate Discount % for sorting
    discountPct: p.sale_price ? ((p.base_price - p.sale_price) / p.base_price) : 0
  })) || [];

  // 3. SEGMENT DATA
  // Sort sales by highest discount first
  const saleProducts = [...products]
    .filter(p => p.sale_price && p.sale_price < p.base_price)
    .sort((a, b) => b.discountPct - a.discountPct);

  // Extract Categories dynamically
  const categories = Array.from(new Set(products.map(p => p.category))).sort();

  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background">
      
      {/* A. HERO SECTION */}
      <Hero />

      {/* B. WELCOME / INTRO */}
      <section className="container mx-auto px-6 py-24 md:py-32 flex flex-col items-center text-center space-y-6 animate-fade-in-up">
        <div className="h-16 w-[1px] bg-border mb-4" />
        <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground">
          Welcome to Nairobi Streetwear
        </h2>
        <p className="text-2xl md:text-4xl font-black uppercase tracking-tighter max-w-2xl leading-tight">
          Redefining the culture through fabric, form, and function.
        </p>
        <p className="text-sm text-muted-foreground max-w-lg leading-relaxed">
          We curate pieces that speak to the soul of the city. Bold, authentic, and unapologetically premium. 
          Explore the latest drops and archives below.
        </p>
        <MoveDown className="animate-bounce text-muted-foreground pt-4" size={40} strokeWidth={1} />
      </section>

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