import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductShowcase from "@/components/storefront/ProductShowcase"; 

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
  product_images: ProductImage[];
  variants: ProductVariant[];
}

// --- DYNAMIC METADATA ---
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from('products')
    .select('title, description, product_images(url)')
    .eq('slug', slug)
    .single();

  if (!product) return { title: 'Product Not Found | OP Fits' };

  const mainImage = product.product_images?.[0]?.url || '/og-placeholder.jpg';

  return {
    title: `${product.title} | OP Fits`,
    description: product.description || 'Exclusive drop from OP Fits.',
    openGraph: { images: [mainImage] },
  };
}

// --- MAIN PAGE ORCHESTRATOR ---
export default async function ProductPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: product, error } = await supabase
    .from('products')
    .select(`
      id, title, slug, description, base_price, sale_price, category,
      product_images ( url, display_order, color_tag ),
      variants ( id, size, color, stock_quantity, price_adjustment, sku )
    `)
    .eq('slug', slug)
    .single();

  if (error || !product) notFound();

  // Ensure images are always sorted by display_order
  product.product_images.sort((a: ProductImage, b: ProductImage) => a.display_order - b.display_order);

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 md:pb-0">
       <ProductShowcase product={product as FullProduct} />
    </div>
  );
}