import ShopFilters from "@/components/storefront/shop/ShopFilters";
import ProductGrid from "@/components/storefront/shop/ProductGrid";
import ShopHeader from "@/components/storefront/shop/ShopHeader";
import ShopMainContent from "@/components/storefront/shop/ShopMainContent"; // Ensure this import points to the file we just verified above
import { ShopLayoutProvider } from "@/components/storefront/shop/ShopLayoutContext";
import { getShopData } from "./actions";
import type { Metadata } from "next";

export const revalidate = 60; 

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
  const { products, categories } = await getShopData(params);

  return (
    <ShopLayoutProvider>
      <div className="min-h-screen bg-background text-foreground animate-in fade-in pb-20">
        
        <ShopHeader 
          query={params.q} 
          category={params.category} 
          count={products.length} 
        />

        <div className="container mx-auto px-4 py-4 md:py-8">
          <ShopMainContent 
            filters={
              <ShopFilters 
                categories={categories} 
                currentCategory={params.category} 
                currentQuery={params.q} 
                currentGender={params.gender}
              />
            }
            grid={
              <ProductGrid 
                products={products} 
                currentQuery={params.q} 
                currentCategory={params.category} 
              />
            }
          />
        </div>

      </div>
    </ShopLayoutProvider>
  );
}