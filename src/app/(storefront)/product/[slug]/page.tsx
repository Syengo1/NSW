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
  variant_id: string | null;
  alt_text: string | null;
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
export const revalidate = 60; 

// 🚨 PERFORMANCE FIX 2: REACT REQUEST MEMOIZATION
const getProduct = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, title, slug, description, base_price, sale_price, category, status,
      product_images ( url, display_order, color_tag, variant_id, alt_text ),
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
export async function generateMetadata(
  { params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  
  // Next.js automatically decodes searchParams (White%2FBlack -> White/Black)
  const rawColor = typeof resolvedSearchParams.color === 'string' ? resolvedSearchParams.color : null;
  
  const product = await getProduct(slug);

  if (!product) return { title: 'Product Not Found | OP Fits' };

  const currentPrice = product.sale_price ? product.sale_price / 100 : product.base_price / 100;
  const priceInKes = currentPrice.toLocaleString();
  
  // 🚨 VARIANT-AWARE OG IMAGE LOGIC
  let matchedVariantImage = null;
  
  if (rawColor) {
    const targetColor = rawColor.toLowerCase().trim();
    
    // 1. Try matching directly via color_tag in product_images
    const imageByColorTag = product.product_images.find(
      img => img.color_tag && img.color_tag.toLowerCase().trim() === targetColor
    );
    
    if (imageByColorTag) {
      matchedVariantImage = imageByColorTag.url;
    } else {
      // 2. Schema Upgrade: Try matching via variants table relationship
      const matchingVariant = product.variants.find(
        v => v.color && v.color.toLowerCase().trim() === targetColor
      );
      
      if (matchingVariant) {
        // Find an image linked explicitly to this variant_id
        const imageByVariantId = product.product_images.find(
          img => img.variant_id === matchingVariant.id
        );
        if (imageByVariantId) {
          matchedVariantImage = imageByVariantId.url;
        }
      }
    }
  }

  // Fallback to the primary image if the specific variant image isn't found
  const mainImage = matchedVariantImage || product.product_images?.[0]?.url || '/og-placeholder.jpg';
  const displayTitle = rawColor ? `${rawColor} ${product.title}` : product.title;

  return {
    title: `${displayTitle} | Buy in Kenya`,
    description: `${product.description || '100% authentic streetwear.'} Get the exclusive ${displayTitle} for KES ${priceInKes}. Sourced globally, verified authentic, and delivered fast across Nairobi and Kenya.`,
    keywords: [product.title, rawColor || "", "Buy sneakers Nairobi", "Streetwear Kenya", "Authentic Clothing", product.category, "OP Fits"],
    openGraph: {
      title: `${displayTitle} - Available Now`,
      description: `Secure the ${displayTitle} today. 100% authentic.`,
      url: `https://www.opfits.com/product/${product.slug}${rawColor ? `?color=${encodeURIComponent(rawColor)}` : ''}`,
      images: [
        { 
          url: mainImage,
          width: 1200, 
          height: 630,
          alt: displayTitle,
        }
      ],
      type: "website",
      siteName: "OP Fits",
    },
    twitter: {
      card: "summary_large_image",
      title: `${displayTitle} - Available Now`,
      description: `Secure the ${displayTitle} today. 100% authentic.`,
      images: [mainImage],
    }
  };
}

// --- MAIN PAGE ORCHESTRATOR ---
export default async function ProductPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const rawColor = typeof resolvedSearchParams.color === 'string' ? resolvedSearchParams.color : null;
  
  const product = await getProduct(slug);

  if (!product) notFound();

  // --- JSON-LD STRUCTURED DATA COMPUTATIONS ---
  const currentPrice = product.sale_price ? product.sale_price / 100 : product.base_price / 100;
  const totalStock = product.variants.reduce((acc, v) => acc + v.stock_quantity, 0);
  const isInStock = totalStock > 0;

  // Resolve Variant Image for Google Rich Snippets
  let matchedVariantImage = null;
  if (rawColor) {
    const targetColor = rawColor.toLowerCase().trim();
    const imageByColorTag = product.product_images.find(img => img.color_tag && img.color_tag.toLowerCase().trim() === targetColor);
    
    if (imageByColorTag) {
      matchedVariantImage = imageByColorTag.url;
    } else {
      const matchingVariant = product.variants.find(v => v.color && v.color.toLowerCase().trim() === targetColor);
      if (matchingVariant) {
        const imageByVariantId = product.product_images.find(img => img.variant_id === matchingVariant.id);
        if (imageByVariantId) matchedVariantImage = imageByVariantId.url;
      }
    }
  }

  const allImages = product.product_images.map(img => img.url);
  const schemaImages = matchedVariantImage 
    ? [matchedVariantImage, ...allImages.filter(url => url !== matchedVariantImage)]
    : allImages;

  const displayTitle = rawColor ? `${rawColor} ${product.title}` : product.title;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: displayTitle,
    description: product.description || `Buy the ${product.title} at OP Fits Kenya.`,
    image: schemaImages,
    category: product.category,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'KES',
      price: currentPrice,
      availability: isInStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `https://www.opfits.com/product/${product.slug}${rawColor ? `?color=${encodeURIComponent(rawColor)}` : ''}`,
      seller: {
        '@type': 'Organization',
        name: 'OP Fits'
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
       <script
         type="application/ld+json"
         dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
       />
       <ProductShowcase product={product} />
    </div>
  );
}