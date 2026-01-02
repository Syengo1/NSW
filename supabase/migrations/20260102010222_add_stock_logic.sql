-- 1. Create the Function
-- This function runs automatically whenever a new item is sold
CREATE OR REPLACE FUNCTION public.decrease_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Subtract the quantity ordered from the variants table
  UPDATE public.variants
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.variant_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the Trigger
-- This tells the database: "Watch the order_items table. When a row is INSERTED, run the function above."
DROP TRIGGER IF EXISTS on_order_item_created ON public.order_items;

CREATE TRIGGER on_order_item_created
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.decrease_stock_on_order();