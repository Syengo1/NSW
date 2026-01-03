-- 1. UNBLOCK INVENTORY LEDGER
-- Allow the "service_role" (your Admin Code) to view the ledger
CREATE POLICY "Admins can view ledger" ON "public"."inventory_ledger"
FOR ALL USING (
  auth.role() = 'service_role'
);

-- 2. UNBLOCK ORDER ITEMS
-- Allow Admins to see all items, and Users to see their own
CREATE POLICY "Admins can view all items" ON "public"."order_items"
FOR SELECT USING (
  auth.role() = 'service_role'
);

CREATE POLICY "Users can view own items" ON "public"."order_items"
FOR SELECT USING (
  auth.uid()::text = (
    SELECT customer_phone FROM public.orders WHERE id = order_items.order_id
  )
);

-- 3. GRANT PERMISSIONS (Safety Net)
GRANT ALL ON "public"."inventory_ledger" TO service_role;
GRANT ALL ON "public"."order_items" TO service_role;