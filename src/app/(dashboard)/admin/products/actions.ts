'use server';

import { createClient as createAdminClient } from "@supabase/supabase-js"; 
import { createClient as createServerClient } from '@/lib/supabase/server'; // Standard auth client
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type VariantInput = {
  size: string;
  color: string;
  sku: string;
  stock: number;
  priceDiff: number;
};

// --- SECURITY HELPER ---
// Ensures ONLY logged-in admins can trigger these actions
async function verifyAdminAndGetClient() {
  const authClient = await createServerClient();
  const { data: { user }, error } = await authClient.auth.getUser();

  // Validate session (Adjust this check based on how you assign admin roles)
  if (error || !user || user.user_metadata?.role !== 'admin') {
    throw new Error("UNAUTHORIZED: Action denied.");
  }

  // If verified, return the bypass-RLS client to perform the database operations
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

// --- 1. GHOST MODE ACTION ---
export async function toggleProductVisibility(id: string, currentStatus: boolean) {
  const supabase = await verifyAdminAndGetClient(); // SECURITY CHECK
  
  const { error } = await supabase
    .from('products')
    .update({ is_visible: !currentStatus })
    .eq('id', id);

  if (error) throw new Error(`Failed to toggle visibility: ${error.message}`);
  
  revalidatePath('/admin/products');
  revalidatePath('/shop'); 
  revalidatePath('/');
}

// --- 2. QUICK EDIT ACTION ---
export async function updateQuickEdit(
  type: 'product_price' | 'variant_stock', 
  id: string, 
  value: number
) {
  try {
    const supabase = await verifyAdminAndGetClient(); // SECURITY CHECK

    if (type === 'product_price') {
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
  } catch (error: unknown) {
    // FIX: Replaced 'any' with 'unknown' for strict TS safety
    const msg = error instanceof Error ? error.message : "Quick edit failed";
    return { success: false, message: msg };
  }
}

// --- 3. CREATE PRODUCT DROP ---
export async function createProductDrop(
  formData: FormData, 
  variants: VariantInput[], 
  imageUrls: { url: string; color?: string }[]
) {
  const supabase = await verifyAdminAndGetClient(); // SECURITY CHECK

  // A. EXTRACT & VALIDATE
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const gender = formData.get('gender') as string;

  // FIX: Safe parsing to prevent NaN errors
  const rawBase = parseFloat(formData.get('basePrice') as string);
  if (isNaN(rawBase)) throw new Error("Base price must be a valid number.");
  const basePrice = Math.round(rawBase * 100); 

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
      slug: `${slug}-${Date.now()}`,
      description,
      base_price: basePrice,
      sale_price: salePrice,
      category,
      gender,
      status: 'active',
      is_visible: true 
    })
    .select('id') // Only request the ID to save bandwidth
    .single();

  if (prodError || !product) throw new Error(`Failed to create drop: ${prodError?.message}`);

  // C. TRANSACTION WRAPPER (Variants & Images)
  try {
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
    if (varError) throw new Error(`Variant Error: ${varError.message}`);

    if (imageUrls.length > 0) {
      const imagesToInsert = imageUrls.map((img, index) => ({
        product_id: product.id,
        url: img.url,
        color_tag: img.color || null, 
        display_order: index
      }));
      const { error: imgError } = await supabase.from('product_images').insert(imagesToInsert);
      if (imgError) throw new Error(`Image Error: ${imgError.message}`);
    }

  } catch (creationError) {
    // FIX: ROBUST ROLLBACK. If variants OR images fail, we wipe the parent product.
    // Assuming your DB uses `ON DELETE CASCADE`, this will cleanly erase any partial data.
    console.error("Creation failed, initiating rollback...", creationError);
    await supabase.from('products').delete().eq('id', product.id);
    throw creationError; 
  }

  // D. FINALIZE
  revalidatePath('/admin/products');
  redirect('/admin/products');
}