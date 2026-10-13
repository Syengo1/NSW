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
  is_visible: boolean;
  product_images: ProductImage[];
  variants: ProductVariant[];
}

// 🚨 ROUTE-SEGMENT REVALIDATION (ISR)
export const revalidate = 60; 

// 🚨 REACT REQUEST MEMOIZATION & SECURE LOOKUP
const getProduct = cache(async (slug: string): Promise<FullProduct | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select(`
      id, title, slug, description, base_price, sale_price, category, status, is_visible,
      product_images ( url, display_order, color_tag, variant_id, alt_text ),
      variants ( id, size, color, stock_quantity, price_adjustment, sku )
    `)
    .eq('slug', slug)
    .eq('is_visible', true)
    .in('status', ['active', 'dropping_soon'])
    .single();

  if (error) {
    // Only return null silently if genuinely not found; log real database errors
    if (error.code !== 'PGRST116') {
      console.error(`[Supabase Error fetching product ${slug}]:`, error);
    }
    return null;
  }

  if (!data) return null;

  // Sort images without mutating the original record
  const sortedImages = [...(data.product_images || [])].sort(
    (a: ProductImage, b: ProductImage) => a.display_order - b.display_order
  );

  return {
    ...data,
    product_images: sortedImages,
  } as FullProduct;
});

// --- PURE VARIANT & COMMERCE RESOLVER ---
function resolveVariantDetails(product: FullProduct, rawColor: string | null) {
  const normalizedRequestedColor = rawColor?.toLowerCase().trim() || null;

  // 1. Validate if the requested color actually exists for this product
  const matchingVariants = normalizedRequestedColor
    ? product.variants.filter(
        (v) => v.color && v.color.toLowerCase().trim() === normalizedRequestedColor
      )
    : [];

  const isValidColor = matchingVariants.length > 0;
  const canonicalColor = isValidColor ? matchingVariants[0].color : null;

  // 2. Resolve matching image
  let matchedImage: string | null = null;
  if (canonicalColor) {
    const lowerColor = canonicalColor.toLowerCase().trim();
    
    // A. Match via color_tag
    const imgByTag = product.product_images.find(
      (img) => img.color_tag && img.color_tag.toLowerCase().trim() === lowerColor
    );

    if (imgByTag) {
      matchedImage = imgByTag.url;
    } else {
      // B. Match via variant_id relationship
      const variantIds = new Set(matchingVariants.map((v) => v.id));
      const imgByVariant = product.product_images.find(
        (img) => img.variant_id && variantIds.has(img.variant_id)
      );
      if (imgByVariant) {
        matchedImage = imgByVariant.url;
      }
    }
  }

  const fallbackImage = product.product_images?.[0]?.url || null;
  const mainImage = matchedImage || fallbackImage;

  // 3. Price resolution (proper null-checking on sale_price and adjustment)
  let priceAdjustment = 0;
  if (matchingVariants.length > 0) {
    priceAdjustment = Math.min(...matchingVariants.map((v) => v.price_adjustment || 0));
  }

  const hasSalePrice = product.sale_price != null;
  const activeBasePrice = product.base_price + priceAdjustment;
  const activeSalePrice = hasSalePrice ? (product.sale_price! + priceAdjustment) : null;
  const finalPriceCents = activeSalePrice != null ? activeSalePrice : activeBasePrice;
  const numericPrice = finalPriceCents / 100;

  const priceInKes = new Intl.NumberFormat('en-KE', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(numericPrice);

  // 4. Stock & availability resolution
  const targetVariants = isValidColor ? matchingVariants : product.variants;
  const totalStock = targetVariants.reduce((acc, v) => acc + (v.stock_quantity || 0), 0);
  const isInStock = totalStock > 0;

  // 5. SKU & Display Title
  const sku = (isValidColor && matchingVariants[0]?.sku) || product.slug;
  const displayTitle = canonicalColor ? `${canonicalColor} ${product.title}` : product.title;

  return {
    canonicalColor,
    mainImage,
    numericPrice,
    priceInKes,
    isInStock,
    sku,
    displayTitle,
  };
}

// --- DYNAMIC LOCALIZED METADATA ---
export async function generateMetadata(
  { params, searchParams }: { 
    params: Promise<{ slug: string }>; 
    searchParams: Promise<{ [key: string]: string | string[] | undefined }> 
  }
): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const rawColor = typeof resolvedSearchParams.color === 'string' ? resolvedSearchParams.color : null;
  
  const product = await getProduct(slug);
  if (!product) return { title: 'Product Not Found | OP Fits' };

  const details = resolveVariantDetails(product, rawColor);
  const siteUrl = 'https://www.opfits.com';
  const canonicalUrl = `${siteUrl}/product/${product.slug}`;
  const shareUrl = `${canonicalUrl}${details.canonicalColor ? `?color=${encodeURIComponent(details.canonicalColor)}` : ''}`;

  const metaDescription = product.description
    ? `${product.description.slice(0, 120)}... Available in Kenya at KES ${details.priceInKes}.`
    : `Shop the authentic ${details.displayTitle} at OP Fits Kenya for KES ${details.priceInKes}. Verified streetwear and sneaker drops in Nairobi.`;

  return {
    title: `${details.displayTitle} in Kenya`,
    description: metaDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${details.displayTitle} - KES ${details.priceInKes}`,
      description: metaDescription,
      url: shareUrl,
      ...(details.mainImage && {
        images: [
          { 
            url: details.mainImage,
            alt: details.displayTitle,
          }
        ],
      }),
      type: "website",
      siteName: "OP Fits",
    },
    twitter: {
      card: "summary_large_image",
      title: `${details.displayTitle} - KES ${details.priceInKes}`,
      description: metaDescription,
      ...(details.mainImage && { images: [details.mainImage] }),
    },
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

  const details = resolveVariantDetails(product, rawColor);

  // Filter valid image URLs
  const validImages = product.product_images
    .map((img) => img.url)
    .filter((url): url is string => Boolean(url));

  const schemaImages = details.mainImage
    ? [details.mainImage, ...validImages.filter((u) => u !== details.mainImage)]
    : validImages;

  // 🚨 JSON-LD STRUCTURED DATA
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: details.displayTitle,
    description: product.description || `Buy the ${details.displayTitle} at OP Fits Kenya.`,
    ...(schemaImages.length > 0 && { image: schemaImages }),
    sku: details.sku,
    category: product.category,
    brand: {
      '@type': 'Brand',
      name: 'OP Fits',
    },
    ...(details.canonicalColor && { color: details.canonicalColor }),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'KES',
      price: details.numericPrice,
      availability: details.isInStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: `https://www.opfits.com/product/${product.slug}${
        details.canonicalColor ? `?color=${encodeURIComponent(details.canonicalColor)}` : ''
      }`,
      seller: {
        '@type': 'Organization',
        name: 'OP Fits',
      },
    },
  };

  // 🚨 SECURITY FIX: Neutralize HTML closing script tags in JSON-LD serialization
  const safeJsonLdString = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdString }}
      />
      <ProductShowcase product={product} />
    </div>
  );
}