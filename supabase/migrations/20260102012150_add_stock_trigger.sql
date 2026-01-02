-- Function to subtract stock
CREATE OR REPLACE FUNCTION public.decrease_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.variants
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.variant_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to fire on every new order item
DROP TRIGGER IF EXISTS on_order_item_created ON public.order_items;
CREATE TRIGGER on_order_item_created
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.decrease_stock_on_order();