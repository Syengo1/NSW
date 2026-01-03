-- Speed up searching for variants by product
CREATE INDEX IF NOT EXISTS idx_variants_product_id ON public.variants(product_id);

-- Speed up finding items in an order
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- Speed up finding images for a product
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);

-- Speed up Ledger lookups
CREATE INDEX IF NOT EXISTS idx_ledger_variant_id ON public.inventory_ledger(variant_id);