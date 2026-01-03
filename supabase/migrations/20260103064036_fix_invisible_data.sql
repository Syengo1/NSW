-- 1. UNBLOCK ORDER ITEMS (Drop first to avoid conflicts)
DROP POLICY IF EXISTS "View Order Items" ON "public"."order_items";

CREATE POLICY "View Order Items" ON "public"."order_items"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "public"."orders"
    WHERE "orders"."id" = "order_items"."order_id"
    AND (
      -- Match the logged-in user's phone (for customers)
      "orders"."customer_phone" = auth.uid()::text 
      OR 
      -- Allow the Service Role (Admin) to see everything
      auth.role() = 'service_role'
    )
  )
);

-- 2. UNBLOCK INVENTORY LEDGER (Admin Only)
DROP POLICY IF EXISTS "Admins can view ledger" ON "public"."inventory_ledger";

CREATE POLICY "Admins can view ledger" ON "public"."inventory_ledger"
FOR SELECT USING (
  auth.role() = 'service_role'
);

-- 3. UNBLOCK VARIANTS (Public Read)
DROP POLICY IF EXISTS "Public can view variants" ON "public"."variants";

CREATE POLICY "Public can view variants" ON "public"."variants"
FOR SELECT USING ( true );