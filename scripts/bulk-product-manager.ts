/**
 * OP FITS - BULK PRODUCT MANAGER
 * Run this script via: npx tsx scripts/bulk-product-manager.ts
 */

import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// --- 1. INITIALIZE ENVIRONMENT & SUPABASE ---
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ ERROR: Missing Supabase environment variables in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// --- STRICT TYPES ---
interface BulkVariantGroup {
  color: string;
  sizes: string[];
  stockPerSize: number;
}

interface BulkImageGroup {
  color: string;
  urls: string[];
}

interface BulkProduct {
  title: string;
  category: string;
  gender: 'men' | 'women' | 'unisex';
  basePrice: number;
  costPrice: number;
  salePrice: number | null;
  description: string;
  status: 'active' | 'draft' | 'dropping_soon' | 'archived';
  variantGroups: BulkVariantGroup[];
  imageGroups: BulkImageGroup[];
}

// --- 2. THE HIGH-SPEED PAYLOAD ---
const BULK_PAYLOAD: BulkProduct[] = [
  {
    title: "Alexander McQueen",
    category: "Footwear",
    gender: "unisex",
    basePrice: 4200, 
    costPrice: 3800, 
    salePrice: null, 
    description: "Elegance and Comfortability",
    status: 'active',
    variantGroups: [
      { color: "Black", sizes: ["40", "41", "42", "43", "44", "45"], stockPerSize: 15 },
      { color: "White", sizes: ["40", "41", "42", "43", "44", "45"], stockPerSize: 15 },
    ],
    // The script will now auto-detect these local paths, upload them, and swap the links automatically
    imageGroups: [
      { 
        color: "Black", 
        urls: [
          "/data/AM_Black1.avif", 
          "/data/AM_Black2.avif", 
          "/data/AM_Black3.avif", 
          "/data/AM_Black4.avif"
        ] 
      },
      { 
        color: "White", 
        urls: [
          "/data/AM_White1.avif", 
          "/data/AM_White2.avif", 
          "/data/AM_White3.avif", 
          "/data/AM_White4.avif"
        ] 
      },
    ]
  },
  
];

// --- 3. HELPER: GET MIME TYPE ---
function getContentType(ext: string): string {
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg', 'jpeg': 'image/jpeg', 'png': 'image/png',
    'webp': 'image/webp', 'avif': 'image/avif', 'gif': 'image/gif',
    'svg': 'image/svg+xml'
  };
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}

// --- 4. THE EXECUTION ENGINE ---
async function runBulkManager() {
  console.log(`\n🚀 INITIALIZING BULK MANAGER: Processing ${BULK_PAYLOAD.length} products...\n`);

  for (const item of BULK_PAYLOAD) {
    try {
      console.log(`\n📦 PROCESSING: [${item.title}]`);
      
      const basePriceCents = Math.round(item.basePrice * 100);
      const costPriceCents = Math.round((item.costPrice || 0) * 100);
      const salePriceCents = item.salePrice ? Math.round(item.salePrice * 100) : null;

      let productId: string | null = null;
      const { data: existingProduct, error: fetchErr } = await supabase
        .from('products')
        .select('id')
        .ilike('title', item.title)
        .maybeSingle();

      if (fetchErr) throw new Error(`Failed to check existing product: ${fetchErr.message}`);

      if (existingProduct) {
        console.log(`   ➔ Product exists (ID: ${existingProduct.id}). Updating details...`);
        productId = existingProduct.id;

        const { error: updateErr } = await supabase
          .from('products')
          .update({
            base_price: basePriceCents,
            sale_price: salePriceCents,
            cost_price: costPriceCents,
            description: item.description,
            category: item.category,
            gender: item.gender,
            status: item.status
          })
          .eq('id', productId);

        if (updateErr) throw new Error(`Failed to update product: ${updateErr.message}`);
      } else {
        console.log(`   ➔ New Product detected. Creating record...`);
        const slug = item.title.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
        
        const { data: newProduct, error: insertErr } = await supabase
          .from('products')
          .insert({
            title: item.title,
            slug: `${slug}-${Date.now()}`,
            description: item.description,
            base_price: basePriceCents,
            sale_price: salePriceCents,
            cost_price: costPriceCents,
            category: item.category,
            gender: item.gender,
            status: item.status || 'active',
            is_visible: true 
          })
          .select('id')
          .single();

        if (insertErr || !newProduct) throw new Error(`Product creation failed: ${insertErr?.message}`);
        productId = newProduct.id;
      }

      // C. Flatten & Process Variants
      if (item.variantGroups && item.variantGroups.length > 0) {
        const flatVariants = item.variantGroups.flatMap(group => 
          group.sizes.map(size => ({
            color: group.color,
            size: size,
            stock: group.stockPerSize
          }))
        );

        const { data: dbVariants } = await supabase
          .from('variants')
          .select('id, size, color, stock_quantity')
          .eq('product_id', productId);

        for (const v of flatVariants) {
          const existingVariant = dbVariants?.find(
            dbV => dbV.color.toLowerCase() === v.color.toLowerCase() && dbV.size.toUpperCase() === v.size.toUpperCase()
          );

          if (existingVariant) {
             const delta = v.stock - existingVariant.stock_quantity;
             if (delta !== 0) {
               console.log(`      ➔ Updating Variant [${v.color} - ${v.size}] stock by ${delta}...`);
               await supabase.from('variants').update({ stock_quantity: v.stock, is_active: true }).eq('id', existingVariant.id);
               await supabase.from('inventory_ledger').insert({
                 variant_id: existingVariant.id, quantity_change: delta, reason: 'bulk_script_adjustment'
               });
             }
          } else {
            console.log(`      ➔ Inserting NEW Variant [${v.color} - ${v.size}] with stock ${v.stock}...`);
            const colorCode = v.color.substring(0, 3).toUpperCase().replace(/[^A-Z0-9]/g, '');
            const sizeCode = v.size.toUpperCase().replace(/[^A-Z0-9]/g, '');
            const generatedSku = `DROP-${colorCode}-${sizeCode}-${Math.floor(Math.random() * 8999 + 1000)}`;

            const { data: insertedVariant, error: vErr } = await supabase
              .from('variants')
              .insert({
                product_id: productId, size: v.size, color: v.color, sku: generatedSku,
                stock_quantity: v.stock, price_adjustment: 0, is_active: true
              })
              .select('id')
              .single();
              
            if (vErr) throw new Error(`Variant insertion failed: ${vErr.message}`);

            if (v.stock > 0 && insertedVariant) {
               await supabase.from('inventory_ledger').insert({
                 variant_id: insertedVariant.id, quantity_change: v.stock, reason: 'bulk_script_initial_creation'
               });
            }
          }
        }
      }

      // D. LOCAL FILE UPLOAD ENGINE (The Fix)
      if (item.imageGroups && item.imageGroups.length > 0) {
        
        const flatImages = item.imageGroups.flatMap(group => 
          group.urls.map(url => ({ color: group.color, rawUrl: url }))
        );

        const { data: dbImages } = await supabase.from('product_images').select('url').eq('product_id', productId);
        const existingUrls = new Set(dbImages?.map(img => img.url) || []);
        
        const imagePayload = [];
        
        const { data: highestOrderRes } = await supabase
             .from('product_images')
             .select('display_order')
             .eq('product_id', productId)
             .order('display_order', { ascending: false })
             .limit(1)
             .maybeSingle();
             
        let startingOrder = highestOrderRes?.display_order !== undefined ? highestOrderRes.display_order + 1 : 0;

        for (const img of flatImages) {
          let finalUrl = img.rawUrl;

          // If the URL is NOT an external web link, treat it as a local file
          if (!finalUrl.startsWith('http')) {
             // Intelligently map "/data/..." to "C:\Projects\nairobi-streetwear\scripts\data\..."
             let localFilePath = finalUrl;
             if (finalUrl.startsWith('/data/')) {
               localFilePath = path.join(process.cwd(), 'scripts', finalUrl);
             } else if (!path.isAbsolute(localFilePath)) {
               localFilePath = path.join(process.cwd(), localFilePath);
             }

             if (!fs.existsSync(localFilePath)) {
               console.error(`      ⚠️ WARNING: Local file not found: ${localFilePath}. Skipping...`);
               continue; // Skip this file and move to the next one
             }

             console.log(`      ➔ Uploading local image to Supabase: ${path.basename(localFilePath)}...`);
             const fileBuffer = fs.readFileSync(localFilePath);
             const fileExt = path.extname(localFilePath).substring(1);
             const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
             const storagePath = `drop-images/${fileName}`;
             const contentType = getContentType(fileExt);

             const { error: uploadErr } = await supabase.storage
               .from('product-images')
               .upload(storagePath, fileBuffer, {
                 contentType: contentType,
                 upsert: false
               });

             if (uploadErr) {
               console.error(`      ❌ Storage upload failed for ${localFilePath}:`, uploadErr.message);
               continue;
             }

             const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(storagePath);
             finalUrl = publicUrlData.publicUrl;
          }

          // Check if this newly generated/existing URL is already linked to the product
          if (!existingUrls.has(finalUrl)) {
             imagePayload.push({
               product_id: productId,
               url: finalUrl,
               color_tag: img.color || 'Default / All Colors',
               display_order: startingOrder++
             });
             existingUrls.add(finalUrl); // Prevent duplicates in the same run
          }
        }

        if (imagePayload.length > 0) {
           console.log(`   ➔ Linking ${imagePayload.length} image(s) to the database...`);
           const { error: imgErr } = await supabase.from('product_images').insert(imagePayload);
           if (imgErr) throw new Error(`Image insertion failed: ${imgErr.message}`);
        } else {
           console.log(`   ➔ No new images needed linking.`);
        }
      }

      console.log(`✅ SUCCESS: [${item.title}] fully synced!`);
    } catch (error) {
      console.error(`❌ FAILED to process [${item.title}]:`, error instanceof Error ? error.message : String(error));
    }
  }

  console.log(`\n🎉 BULK PROCESSING COMPLETE!`);
}

runBulkManager();