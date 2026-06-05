'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// --- TYPES ---
export interface VariantInput {
  size: string;
  color: string;
  sku: string;
  stock: number;
  priceDiff: number;
}

// --- SECURE CLIENT INSTANTIATION ---
// This guarantees we bypass Row Level Security purely on the server for Admin operations
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================================================
// 1. CREATE NEW PRODUCT DROP
// ============================================================================
export async function createProductDrop(
  formData: FormData,
  variants: VariantInput[],
  imageAssets: { url: string; color?: string }[]
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

  // C. Create Parent Product Record
  const slug = title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      title,
      slug: `${slug}-${Date.now()}`, // Guarantee uniqueness
      description,
      base_price: basePrice,
      sale_price: salePrice,
      cost_price: costPrice, // Log the COGS
      category,
      gender,
      status: 'active',
      is_visible: true 
    })
    .select('id')
    .single();

  if (productError || !product) {
    throw new Error(`Product creation failed: ${productError?.message}`);
  }

  // D. Create Variants & Snapshot Initial Inventory
  if (variants.length > 0) {
    const variantPayload = variants.map(v => ({
      product_id: product.id,
      size: v.size,
      color: v.color,
      sku: v.sku,
      stock_quantity: v.stock,
      price_adjustment: v.priceDiff || 0,
      is_active: true
    }));

    // Insert variants and return their new IDs
    const { data: insertedVariants, error: variantError } = await supabase
      .from('variants')
      .insert(variantPayload)
      .select('id, stock_quantity');

    if (variantError) throw new Error(`Variants failed: ${variantError.message}`);

    // LOGIC UPGRADE: Snapshot the initial stock to the Ledger
    if (insertedVariants && insertedVariants.length > 0) {
      const ledgerPayload = insertedVariants.map(v => ({
        variant_id: v.id,
        quantity_change: v.stock_quantity,
        reason: 'initial_stock_creation'
      }));
      
      const { error: ledgerError } = await supabase
        .from('inventory_ledger')
        .insert(ledgerPayload);
        
      if (ledgerError) console.error("Ledger Snapshot Failed:", ledgerError.message);
    }
  }

  // E. Link Product Images
  if (imageAssets.length > 0) {
    const imagePayload = imageAssets.map((img, index) => ({
      product_id: product.id,
      url: img.url,
      color_tag: img.color || null,
      display_order: index
    }));

    const { error: imageError } = await supabase
      .from('product_images')
      .insert(imagePayload);

    if (imageError) throw new Error(`Image linking failed: ${imageError.message}`);
  }

  // F. Revalidate Cache (Update UI globally)
  revalidatePath('/admin/products');
  revalidatePath('/shop'); 
}

// ============================================================================
// 2. INVENTORY TABLE QUICK EDIT
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

    // Support updating cost price from future admin views
    if (type === 'product_cost_price' && value !== null) {
      const { error } = await supabase.from('products').update({ cost_price: Math.round(value * 100) }).eq('id', id);
      if (error) throw error;
    }

    if (type === 'variant_stock' && value !== null) {
      // LOGIC UPGRADE: Calculate the stock delta so we can log it properly
      const { data: currentVariant } = await supabase
        .from('variants')
        .select('stock_quantity')
        .eq('id', id)
        .single();
        
      const currentStock = currentVariant?.stock_quantity || 0;
      const delta = value - currentStock;

      // 1. Update the actual stock
      const { error: stockError } = await supabase.from('variants').update({ stock_quantity: value }).eq('id', id);
      if (stockError) throw stockError;

      // 2. Log the discrepancy to the ledger if it actually changed
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
// 3. TOGGLE PRODUCT GHOST MODE
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