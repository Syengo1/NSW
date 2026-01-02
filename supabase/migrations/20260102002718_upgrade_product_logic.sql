-- 1. ADD GHOST MODE
ALTER TABLE "public"."products" 
ADD COLUMN IF NOT EXISTS "is_visible" boolean DEFAULT true;

-- 2. AUTOMATIC STOCK REDUCTION (The "Foolproof" Logic)
-- Create a function that runs whenever an 'order_item' is created
CREATE OR REPLACE FUNCTION public.decrease_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.variants
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.variant_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach the function to the order_items table
DROP TRIGGER IF EXISTS on_order_item_created ON public.order_items;
CREATE TRIGGER on_order_item_created
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.decrease_stock_on_order();