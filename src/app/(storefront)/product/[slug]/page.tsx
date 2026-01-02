import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductShowcase from "@/components/storefront/ProductShowcase"; 

// 1. DYNAMIC METADATA
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

  if (!product) return { title: 'Product Not Found' };

  const mainImage = product.product_images?.[0]?.url || '/og-placeholder.jpg';

  return {
    title: product.title,
    description: product.description || 'Exclusive drop from Nairobi Streetwear.',
    openGraph: { images: [mainImage] },
  };
}

// 2. MAIN PAGE
export default async function ProductPage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch Logic: 
  // We fetch everything needed for the client interactive logic
  const { data: product } = await supabase
    .from('products')
    .select(`
      id,
      title,
      slug, 
      description,
      base_price,
      sale_price,       
      category,
      product_images ( url, display_order, color_tag ),
      variants ( id, size, color, stock_quantity, price_adjustment, sku )
    `)
    .eq('slug', slug)
    .single();

  if (!product) notFound();

  // Sort images for consistent display order
  product.product_images.sort((a, b) => a.display_order - b.display_order);

  return (
    // Clean wrapper to avoid layout shifts. 
    // The interactivity happens inside ProductShowcase.
    <div className="bg-background min-h-screen">
       <ProductShowcase product={product} />
    </div>
  );
}