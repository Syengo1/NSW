import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductShowcase from "@/components/storefront/ProductShowcase"; 
import { cache } from "react";

// --- STRICT TYPES ---
export interface ProductImage {
  url: string;
  display_order: number;
  color_tag: string | null;
}

export interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock_quantity: number;
  price_adjustment: number;
  sku: string;
}

export interface FullProduct {
  id: string;
  title: string;
  slug: string;
  description: string;
  base_price: number;
  sale_price: number | null;
  category: string;
  status: string;
  product_images: ProductImage[];
  variants: ProductVariant[];
}

// 🚨 PERFORMANCE FIX 1: EDGE CACHING (ISR)
// Revalidates this page on the Vercel Edge Network every 60 seconds. 
// This gives users instant load times while keeping stock/prices fresh.
export const revalidate = 60; 

// 🚨 PERFORMANCE FIX 2: REACT REQUEST MEMOIZATION
// Next.js normally calls the DB twice (once for Metadata, once for the Page). 
// `cache()` wraps the Supabase call so it only executes once per request cycle.
const getProduct = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, title, slug, description, base_price, sale_price, category, status,
      product_images ( url, display_order, color_tag ),
      variants ( id, size, color, stock_quantity, price_adjustment, sku )
    `)
    .eq('slug', slug)
    .single();

  if (error || !data) return null;

  // Ensure images are perfectly sorted
  data.product_images.sort((a: ProductImage, b: ProductImage) => a.display_order - b.display_order);
  
  return data as FullProduct;
});


// --- DYNAMIC LOCALIZED METADATA ---
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) return { title: 'Product Not Found | OP Fits' };

  const currentPrice = product.sale_price ? product.sale_price / 100 : product.base_price / 100;
  const priceInKes = currentPrice.toLocaleString();
  const mainImage = product.product_images?.[0]?.url || '/og-placeholder.jpg';

  // 🚨 SEO FIX: Kenyan Hype & Reseller Localization
  return {
    title: `${product.title} | Buy in Kenya`,
    description: `${product.description || '100% authentic streetwear.'} Get the exclusive ${product.title} for KES ${priceInKes}. Sourced globally, verified authentic, and delivered fast across Nairobi and Kenya.`,
    keywords: [product.title, "Buy sneakers Nairobi", "Streetwear Kenya", "Authentic Clothing", product.category, "OP Fits"],
    openGraph: {
      title: `${product.title} - Available Now in Kenya`,
      description: `Secure the ${product.title} today. 100% authentic.`,
      images: [{ url: mainImage }],
      type: "website",
    },
  };
}


// --- MAIN PAGE ORCHESTRATOR ---
export default async function ProductPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  
  // Fetches instantly from the React cache created by generateMetadata
  const product = await getProduct(slug);

  if (!product) notFound();

  // --- JSON-LD STRUCTURED DATA COMPUTATIONS ---
  const currentPrice = product.sale_price ? product.sale_price / 100 : product.base_price / 100;
  const totalStock = product.variants.reduce((acc, v) => acc + v.stock_quantity, 0);
  const isInStock = totalStock > 0;

  // 🚨 SEO FIX: Google Rich Snippets Generation
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || `Buy the ${product.title} at OP Fits Kenya.`,
    image: product.product_images.map(img => img.url),
    category: product.category,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'KES',
      price: currentPrice,
      availability: isInStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://www.opfits.com/product/${product.slug}`,
      seller: {
        '@type': 'Organization',
        name: 'OP Fits'
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
       {/* Inject JSON-LD directly into the DOM for Googlebot */}
       <script
         type="application/ld+json"
         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
       />
       
       <ProductShowcase product={product} />
    </div>
  );
}