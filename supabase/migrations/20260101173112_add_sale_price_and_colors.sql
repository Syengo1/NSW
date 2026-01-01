-- 1. Add 'sale_price' to the products table
-- Stored in cents (integer) just like base_price. 
-- Nullable because not every item is on sale.
ALTER TABLE "public"."products" 
ADD COLUMN IF NOT EXISTS "sale_price" integer DEFAULT NULL;

-- 2. Add 'color_tag' to the product_images table
-- This links an image (e.g., red_hoodie.jpg) to a specific variant color ("Red").
ALTER TABLE "public"."product_images" 
ADD COLUMN IF NOT EXISTS "color_tag" text DEFAULT NULL;

-- 3. Optimization: Add an index for Sales
-- This makes fetching "All On-Sale Items" blazingly fast in the future.
CREATE INDEX IF NOT EXISTS "products_sale_price_idx" 
ON "public"."products" ("sale_price") 
WHERE "sale_price" IS NOT NULL;