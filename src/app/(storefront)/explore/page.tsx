// src/app/(storefront)/explore/page.tsx
import { createClient } from '@/lib/supabase/server';
import InfiniteCanvas from '@/components/storefront/InfiniteCanvas';

export const revalidate = 60; // Cache on the Edge for 60 seconds

export const metadata = {
  title: 'Explore Drops | OP Fits',
  description: 'Interactive 3D exploration of our latest streetwear drops.',
};

// We extract the perfect mathematical scatter positions from the original design.
// If the DB has more items than slots, the modulo operator (%) loops back through them.
const CANVAS_SLOTS = [
  { width: 244, top: "46%", left: "59%", parallaxEase: 0.6 },
  { width: 212, top: "2%", left: "50%", parallaxEase: 0.8 },
  { width: 273, top: "61%", left: "72%", parallaxEase: 0.5 },
  { width: 238, top: "52%", left: "91%", parallaxEase: 0.9 },
  { width: 162, top: "12%", left: "21%", parallaxEase: 0.7 },
  { width: 143, top: "65%", left: "31%", parallaxEase: 0.4 },
  { width: 256, top: "81%", left: "19%", parallaxEase: 0.85 },
  { width: 174, top: "34%", left: "3%", parallaxEase: 0.55 },
  { width: 114, top: "24%", left: "83%", parallaxEase: 0.75 },
  { width: 220, top: "15%", left: "75%", parallaxEase: 0.65 },
  { width: 190, top: "85%", left: "45%", parallaxEase: 0.8 },
  { width: 280, top: "40%", left: "15%", parallaxEase: 0.5 },
];

export interface ExploreItem {
  id: string;
  slug: string;
  title: string;
  color: string;
  description: string;
  year: string;
  image: string;
  layout: { width: number; top: string; left: string; parallaxEase: number };
}

export default async function ExplorePage() {
  const supabase = await createClient();

  // 1. Fetch Active Products with their Images and Variants
  const { data: products } = await supabase
    .from('products')
    .select(`
      id, title, slug, category, created_at,
      product_images ( url, display_order, color_tag ),
      variants ( color )
    `)
    .eq('status', 'active')
    .eq('is_visible', true);

  const exploreItems: ExploreItem[] = [];
  let slotIndex = 0;

  // 2. The Flattening Engine: Create a card for EVERY color
  if (products) {
    products.forEach((p) => {
      // Extract unique colors for this product
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const uniqueColors = Array.from(new Set(p.variants.map((v: any) => v.color).filter(Boolean)));

      uniqueColors.forEach((color) => {
        // Find the image that matches this variant's color_tag, fallback to the first image
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const colorImg = p.product_images.find((img: any) => img.color_tag?.toLowerCase() === color.toLowerCase()) 
                         || p.product_images[0];

        if (!colorImg) return;

        // Assign a physical layout slot
        const layout = CANVAS_SLOTS[slotIndex % CANVAS_SLOTS.length];
        slotIndex++;

        exploreItems.push({
          id: `${p.id}-${color}`,
          slug: p.slug,
          title: p.title,
          color: color as string,
          description: p.category, // e.g., "Hoodies", "Footwear"
          year: new Date(p.created_at).getFullYear().toString(),
          image: colorImg.url,
          layout,
        });
      });
    });
  }

  // Fallback to prevent crashes if DB is empty
  if (exploreItems.length === 0) return null; 

  return (
    <main className="relative w-screen h-screen bg-background text-foreground overflow-hidden transition-colors duration-500">
      <InfiniteCanvas items={exploreItems} />
    </main>
  );
}