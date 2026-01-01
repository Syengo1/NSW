import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ProductShowcase from "@/components/storefront/ProductShowcase"; // Import the new component

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

  // Fetch Logic: Now includes 'sale_price' and 'color_tag'
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

  // Sort images to ensure order consistency
  product.product_images.sort((a, b) => a.display_order - b.display_order);

  return (
    // We remove the fixed header stub to let the real StorefrontNav (from layout) show.
    // The ProductShowcase handles the responsiveness.
    <div className="bg-background">
       <ProductShowcase product={product} />
    </div>
  );
}