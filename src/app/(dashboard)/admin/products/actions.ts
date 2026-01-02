'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type VariantInput = {
  size: string;
  color: string;
  sku: string;
  stock: number;
  priceDiff: number; // e.g., +200 KES for XXL
};

// --- 1. GHOST MODE ACTION (NEW) ---
// Toggles the visibility of a product on the storefront without deleting it.
export async function toggleProductVisibility(id: string, currentStatus: boolean) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('products')
    .update({ is_visible: !currentStatus })
    .eq('id', id);

  if (error) throw new Error(`Failed to toggle visibility: ${error.message}`);
  
  revalidatePath('/admin/products');
  // We also revalidate the shop page to ensure the ghosted item disappears immediately
  revalidatePath('/shop'); 
  revalidatePath('/');
}

// --- 2. QUICK EDIT ACTION ---
// Allows instant updates from the inventory table (Price & Stock)
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

// --- 3. CREATE PRODUCT DROP ---
// Handles the complex creation of Product + Variants + Images
export async function createProductDrop(
  formData: FormData, 
  variants: VariantInput[], 
  imageUrls: { url: string; color?: string }[]
) {
  const supabase = await createClient();

  // A. EXTRACT & VALIDATE
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const basePrice = Math.round(parseFloat(formData.get('basePrice') as string) * 100); 
  const category = formData.get('category') as string;
  const gender = formData.get('gender') as string;

  // Sale Price Logic (Optional)
  const salePriceInput = formData.get('salePrice');
  const salePrice = salePriceInput && salePriceInput !== '' 
    ? Math.round(parseFloat(salePriceInput as string) * 100) 
    : null;
  
  if (!title || variants.length === 0) {
    throw new Error("A drop needs a title and at least one variant.");
  }

  // B. CREATE PARENT PRODUCT
  const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  
  const { data: product, error: prodError } = await supabase
    .from('products')
    .insert({
      title,
      slug: `${slug}-${Date.now()}`, // Timestamp ensures uniqueness
      description,
      base_price: basePrice,
      sale_price: salePrice,
      category,
      gender,
      status: 'active',
      is_visible: true // Default to visible
    })
    .select()
    .single();

  if (prodError) throw new Error(`Failed to create drop: ${prodError.message}`);

  // C. CREATE VARIANTS (The Matrix)
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
    // Transaction Rollback: Delete the product if variants fail
    await supabase.from('products').delete().eq('id', product.id);
    throw new Error(`Variant Error: ${varError.message}`);
  }

  // D. LINK IMAGES (With Smart Color Mapping)
  if (imageUrls.length > 0) {
    const imagesToInsert = imageUrls.map((img, index) => ({
      product_id: product.id,
      url: img.url,
      color_tag: img.color || null, 
      display_order: index
    }));
    await supabase.from('product_images').insert(imagesToInsert);
  }

  revalidatePath('/admin/products');
  redirect('/admin/products');
}