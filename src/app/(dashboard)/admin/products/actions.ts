'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type VariantInput = {
  size: string;
  color: string;
  sku: string;
  stock: number;
  priceDiff: number;
};

// --- NEW: Update Action for Quick Edits ---
export async function updateQuickEdit(
  type: 'product_price' | 'variant_stock', 
  id: string, 
  value: number
) {
  const supabase = await createClient();

  try {
    if (type === 'product_price') {
      // Store price in cents (multiply by 100)
      const { error } = await supabase
        .from('products')
        .update({ base_price: Math.round(value * 100) })
        .eq('id', id);
      if (error) throw error;
    } 
    
    if (type === 'variant_stock') {
      const { error } = await supabase
        .from('variants')
        .update({ stock_quantity: value })
        .eq('id', id);
      if (error) throw error;
    }

    revalidatePath('/admin/products');
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- UPDATED: Create Drop with Sale Price & Color Images ---
export async function createProductDrop(
  formData: FormData, 
  variants: VariantInput[], 
  imageUrls: { url: string; color?: string }[] // Updated Type
) {
  const supabase = await createClient();

  // 1. EXTRACT
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const basePrice = Math.round(parseFloat(formData.get('basePrice') as string) * 100); 
  
  // New: Sale Price Logic
  const salePriceInput = formData.get('salePrice');
  const salePrice = salePriceInput ? Math.round(parseFloat(salePriceInput as string) * 100) : null;

  const category = formData.get('category') as string;
  const gender = formData.get('gender') as string;
  
  // 2. CREATE PRODUCT
  const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  
  const { data: product, error: prodError } = await supabase
    .from('products')
    .insert({
      title,
      slug: `${slug}-${Date.now()}`,
      description,
      base_price: basePrice,
      sale_price: salePrice, // Saved to DB
      category,
      gender,
      status: 'active'
    })
    .select()
    .single();

  if (prodError) throw new Error(`Failed to create drop: ${prodError.message}`);

  // 3. CREATE VARIANTS
  const variantsToInsert = variants.map(v => ({
    product_id: product.id,
    size: v.size,
    color: v.color,
    sku: v.sku.toUpperCase(),
    stock_quantity: v.stock,
    price_adjustment: v.priceDiff,
    is_active: true
  }));

  const { error: varError } = await supabase.from('variants').insert(variantsToInsert);
  
  if (varError) {
    await supabase.from('products').delete().eq('id', product.id);
    throw new Error(`Variant Error: ${varError.message}`);
  }

  // 4. LINK IMAGES (With Color Mapping)
  if (imageUrls.length > 0) {
    const imagesToInsert = imageUrls.map((img, index) => ({
      product_id: product.id,
      url: img.url,
      color_tag: img.color || null, // Store which color this image belongs to
      display_order: index
    }));
    await supabase.from('product_images').insert(imagesToInsert);
  }

  revalidatePath('/admin/products');
  redirect('/admin/products');
}