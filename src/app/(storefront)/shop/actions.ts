'use server';

import { createClient } from "@/lib/supabase/server";

export interface DBVariant { color: string; stock_quantity: number; }
export interface DBImage { url: string; color_tag?: string | null; display_order?: number; }

export interface DisplayProduct {
  id: string;
  display_id: string;
  title: string;
  slug: string;
  base_price: number;
  sale_price: number | null;
  category: string;
  description: string;
  status: 'active' | 'draft' | 'dropping_soon' | 'archived';
  display_image: string;
  hover_image: string | null;
  display_stock: number;
  display_color: string | null;
  discountPct: number;
  created_at: string;
}

// STRICT TYPING: Defines the exact structure of the data returning from Supabase
interface RawProduct {
  id: string;
  title: string;
  slug: string;
  base_price: number;
  sale_price: number | null;
  category: string;
  description: string | null;
  status: 'active' | 'draft' | 'dropping_soon' | 'archived';
  created_at: string;
  gender: string | null;
  product_images?: DBImage[];
  variants?: DBVariant[];
}

export async function getShopData(params: { q?: string; category?: string; gender?: string; sort?: string }) {
  const supabase = await createClient();

  // 1. Base Query
  let query = supabase
    .from('products')
    .select(`
      id, title, slug, base_price, sale_price, category, status, created_at, description, gender,
      product_images ( url, display_order, color_tag ),
      variants ( color, stock_quantity )
    `)
    .eq('status', 'active')
    .eq('is_visible', true);

  if (params.category) query = query.eq('category', params.category);
  if (params.gender && params.gender !== 'all') {
    query = query.or(`gender.eq.${params.gender},gender.eq.unisex,gender.is.null`);
  }

  const { data, error } = await query;
  
  if (error || !data) return { products: [], categories: [] };

  // Cast the raw data to our strict interface
  const rawProducts = data as RawProduct[];

  // 2. Extract Categories before flattening
  const uniqueCategories = Array.from(new Set(rawProducts.map(p => p.category))).sort();

  // 3. Variant Flattening Engine
  let flattened: DisplayProduct[] = [];

  rawProducts.forEach((p) => {
    const discountPct = p.sale_price ? Math.round(((p.base_price - p.sale_price) / p.base_price) * 100) : 0;
    
    // Type-safe sorting of images
    const sortedImages = p.product_images?.sort((a, b) => (a.display_order || 0) - (b.display_order || 0)) || [];

    if (p.variants && p.variants.length > 0) {
      // Type-safe extraction of colors
      const uniqueColors = Array.from(new Set(p.variants.map(v => v.color).filter(Boolean)));
      
      if (uniqueColors.length > 0) {
        uniqueColors.forEach(color => {
          const colorImages = sortedImages.filter(img => img.color_tag?.toLowerCase() === color.toLowerCase());
          const colorMainImg = colorImages[0]?.url || sortedImages[0]?.url || '';
          const colorHoverImg = colorImages[1]?.url || (colorImages[0] ? null : sortedImages[1]?.url);
          const colorStock = p.variants!.filter(v => v.color === color).reduce((acc, v) => acc + (v.stock_quantity || 0), 0);

          flattened.push({
            id: p.id,
            display_id: `${p.id}-${color}`,
            title: p.title,
            slug: p.slug,
            base_price: p.base_price,
            sale_price: p.sale_price,
            category: p.category,
            description: p.description || '',
            status: p.status,
            display_image: colorMainImg,
            hover_image: colorHoverImg,
            display_stock: colorStock,
            display_color: color,
            discountPct,
            created_at: p.created_at
          });
        });
      } else {
        // Fallback for variants without color tags
        flattened.push({
          id: p.id, 
          display_id: p.id, 
          title: p.title, 
          slug: p.slug, 
          base_price: p.base_price, 
          sale_price: p.sale_price,
          category: p.category, 
          description: p.description || '', 
          status: p.status, 
          display_image: sortedImages[0]?.url || '', 
          hover_image: sortedImages[1]?.url || null,
          display_stock: p.variants!.reduce((acc, v) => acc + (v.stock_quantity || 0), 0),
          display_color: null, 
          discountPct, 
          created_at: p.created_at
        });
      }
    } else {
      flattened.push({
        id: p.id, 
        display_id: p.id, 
        title: p.title, 
        slug: p.slug, 
        base_price: p.base_price, 
        sale_price: p.sale_price,
        category: p.category, 
        description: p.description || '', 
        status: p.status, 
        display_image: sortedImages[0]?.url || '', 
        hover_image: sortedImages[1]?.url || null,
        display_stock: 0, 
        display_color: null, 
        discountPct, 
        created_at: p.created_at
      });
    }
  });

  // 4. In-Memory Deep Search (Searches Title OR specific Color)
  if (params.q) {
    const q = params.q.toLowerCase();
    flattened = flattened.filter(p => 
      p.title.toLowerCase().includes(q) || 
      (p.display_color && p.display_color.toLowerCase().includes(q)) ||
      p.description.toLowerCase().includes(q)
    );
  }

  // 5. Mathematical Sorting
  switch (params.sort) {
    case 'price_asc': flattened.sort((a, b) => (a.sale_price || a.base_price) - (b.sale_price || b.base_price)); break;
    case 'price_desc': flattened.sort((a, b) => (b.sale_price || b.base_price) - (a.sale_price || a.base_price)); break;
    case 'oldest': flattened.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()); break;
    default: flattened.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); 
  }

  return { products: flattened, categories: uniqueCategories };
}