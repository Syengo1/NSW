-- 1. ADD NEGATIVE STOCK PROTECTION (Foolproof)
-- This prevents stock from ever going below 0, even if the code tries to.
ALTER TABLE public.variants 
ADD CONSTRAINT check_stock_non_negative CHECK (stock_quantity >= 0);

-- 2. UPGRADE THE TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.decrease_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- A. Decrease the Stock
  UPDATE public.variants
  SET stock_quantity = stock_quantity - NEW.quantity
  WHERE id = NEW.variant_id;

  -- B. Create a Ledger Entry (The Snapshot)
  INSERT INTO public.inventory_ledger (
    variant_id, 
    quantity_change, 
    reason, 
    reference_id
  )
  VALUES (
    NEW.variant_id, 
    -NEW.quantity, -- Negative number because it's leaving
    'ORDER_FULFILLMENT', 
    NEW.order_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;