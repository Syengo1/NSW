'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// --- STRICT TYPES ---
export interface VariantInput {
  id?: string; 
  size: string;
  color: string;
  sku: string;
  stock: number;
  priceDiff: number;
}

export interface ImageAsset {
  id?: string;
  url: string;
  color?: string;
}

// --- SECURE CLIENT INSTANTIATION ---
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================================================
// 1. FETCH PRODUCT FOR EDITING (PREFILL LOGIC)
// ============================================================================
export async function getProductForEdit(productId: string) {
  const supabase = getAdminClient();
  
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      variants (*),
      product_images (*)
    `)
    .eq('id', productId)
    .single();

  if (error || !data) {
    throw new Error(`Failed to fetch product for editing: ${error?.message}`);
  }

  return data;
}

// ============================================================================
// 2. UPSERT PRODUCT DROP (CREATE & COMPLETE FULL-PAGE EDIT)
// ============================================================================
export async function upsertProductDrop(
  productId: string | null,
  formData: FormData,
  variants: VariantInput[],
  imageAssets: ImageAsset[]
) {
  const supabase = getAdminClient();

  // A. Extract & Validate Standard Data
  const title = formData.get('title') as string;
  const description = formData.get('description') as string;
  const category = formData.get('category') as string;
  const gender = formData.get('gender') as string;

  if (!title || !category) throw new Error("Missing critical product details.");

  // B. Extract & Validate Financials (Converting to Cents)
  const rawBase = parseFloat(formData.get('basePrice') as string);
  if (isNaN(rawBase)) throw new Error("Base price must be a valid number.");
  const basePrice = Math.round(rawBase * 100); 

  const rawCost = parseFloat(formData.get('costPrice') as string);
  if (isNaN(rawCost)) throw new Error("Supplier cost price must be a valid number.");
  const costPrice = Math.round(rawCost * 100); 

  const salePriceInput = formData.get('salePrice');
  const salePrice = salePriceInput && salePriceInput !== '' 
    ? Math.round(parseFloat(salePriceInput as string) * 100) 
    : null;

  let currentProductId = productId;

  // C. Upsert Parent Product Record
  if (!currentProductId) {
    const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        title,
        slug: `${slug}-${Date.now()}`,
        description,
        base_price: basePrice,
        sale_price: salePrice,
        cost_price: costPrice,
        category,
        gender,
        status: 'active',
        is_visible: true 
      })
      .select('id')
      .single();

    if (productError || !product) throw new Error(`Product creation failed: ${productError?.message}`);
    currentProductId = product.id;
  } else {
    const { error: productError } = await supabase
      .from('products')
      .update({
        title,
        description,
        base_price: basePrice,
        sale_price: salePrice,
        cost_price: costPrice,
        category,
        gender
      })
      .eq('id', currentProductId);

    if (productError) throw new Error(`Product update failed: ${productError.message}`);
  }

  // D. Handle Variants & The Immutable Inventory Ledger
  if (variants.length > 0) {
    const { data: existingVariants } = await supabase
      .from('variants')
      .select('id, stock_quantity, sku')
      .eq('product_id', currentProductId);

    const existingMap = new Map(existingVariants?.map(v => [v.id, v.stock_quantity]) || []);
    const incomingIds = new Set(variants.map(v => v.id).filter(Boolean));

    const variantsToDeactivate = existingVariants?.filter(v => !incomingIds.has(v.id)) || [];
    if (variantsToDeactivate.length > 0) {
      const deacIds = variantsToDeactivate.map(v => v.id);
      await supabase.from('variants').update({ is_active: false }).in('id', deacIds);
    }

    // CRITICAL FIX: Replaced 'any[]' with the exact strict object shape required by the ledger
    const ledgerPayload: { variant_id: string; quantity_change: number; reason: string }[] = [];

    for (const v of variants) {
      if (v.id && existingMap.has(v.id)) {
        const oldStock = existingMap.get(v.id) || 0;
        const delta = v.stock - oldStock; 

        const { error: vErr } = await supabase
          .from('variants')
          .update({
            size: v.size,
            color: v.color,
            sku: v.sku,
            stock_quantity: v.stock,
            price_adjustment: v.priceDiff || 0,
            is_active: true
          })
          .eq('id', v.id);

        if (vErr) throw new Error(`Variant update failed: ${vErr.message}`);

        if (delta !== 0) {
          ledgerPayload.push({
            variant_id: v.id,
            quantity_change: delta,
            reason: 'admin_manual_adjustment'
          });
        }
      } else {
        const { data: newV, error: vErr } = await supabase
          .from('variants')
          .insert({
            product_id: currentProductId,
            size: v.size,
            color: v.color,
            sku: v.sku,
            stock_quantity: v.stock,
            price_adjustment: v.priceDiff || 0,
            is_active: true
          })
          .select('id')
          .single();

        if (vErr || !newV) throw new Error(`Variant insert failed: ${vErr?.message}`);

        if (v.stock > 0) {
          ledgerPayload.push({
            variant_id: newV.id,
            quantity_change: v.stock,
            reason: 'initial_stock_creation'
          });
        }
      }
    }

    if (ledgerPayload.length > 0) {
      const { error: ledgerError } = await supabase.from('inventory_ledger').insert(ledgerPayload);
      if (ledgerError) console.error("Ledger Logging Failed:", ledgerError.message);
    }
  }

  // E. Handle Product Images
  await supabase.from('product_images').delete().eq('product_id', currentProductId);
  
  if (imageAssets.length > 0) {
    const imagePayload = imageAssets.map((img, index) => ({
      product_id: currentProductId,
      url: img.url,
      color_tag: img.color || null,
      display_order: index
    }));

    const { error: imageError } = await supabase.from('product_images').insert(imagePayload);
    if (imageError) throw new Error(`Image linking failed: ${imageError.message}`);
  }

  // F. Revalidate Cache
  revalidatePath('/admin/products');
  revalidatePath('/shop'); 
  revalidatePath(`/product/[slug]`, 'page');
  
  return { success: true, productId: currentProductId };
}

// ============================================================================
// 3. INVENTORY TABLE QUICK EDIT
// ============================================================================
export async function updateQuickEdit(
  type: 'product_price' | 'product_sale_price' | 'product_cost_price' | 'variant_stock', 
  id: string, 
  value: number | null
) {
  const supabase = getAdminClient();

  try {
    if (type === 'product_price' && value !== null) {
      const { error } = await supabase.from('products').update({ base_price: Math.round(value * 100) }).eq('id', id);
      if (error) throw error;
    } 
    
    if (type === 'product_sale_price') {
      const dbValue = value !== null ? Math.round(value * 100) : null;
      const { error } = await supabase.from('products').update({ sale_price: dbValue }).eq('id', id);
      if (error) throw error;
    }

    if (type === 'product_cost_price' && value !== null) {
      const { error } = await supabase.from('products').update({ cost_price: Math.round(value * 100) }).eq('id', id);
      if (error) throw error;
    }

    if (type === 'variant_stock' && value !== null) {
      const { data: currentVariant } = await supabase
        .from('variants')
        .select('stock_quantity')
        .eq('id', id)
        .single();
        
      const currentStock = currentVariant?.stock_quantity || 0;
      const delta = value - currentStock;

      const { error: stockError } = await supabase.from('variants').update({ stock_quantity: value }).eq('id', id);
      if (stockError) throw stockError;

      if (delta !== 0) {
         const { error: logError } = await supabase.from('inventory_ledger').insert({
            variant_id: id,
            quantity_change: delta,
            reason: 'admin_manual_adjustment'
         });
         if (logError) console.error("Manual adjustment ledger logging failed:", logError.message);
      }
    }

    revalidatePath('/admin/products');
    return { success: true };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Quick edit failed";
    return { success: false, message: msg };
  }
}

// ============================================================================
// 4. TOGGLE PRODUCT GHOST MODE
// ============================================================================
export async function toggleProductVisibility(id: string, currentVisibility: boolean) {
  const supabase = getAdminClient();
  const { error } = await supabase
    .from('products')
    .update({ is_visible: !currentVisibility })
    .eq('id', id);

  if (error) throw new Error(error.message);
  
  revalidatePath('/admin/products');
  revalidatePath('/shop');
}