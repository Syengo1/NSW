-- 1. UNBLOCK ORDER ITEMS
-- Allow users to see items if they own the parent order
CREATE POLICY "Users can view own order items" ON "public"."order_items"
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM "public"."orders"
    WHERE "orders"."id" = "order_items"."order_id"
    AND (
      "orders"."customer_phone" = auth.uid()::text -- Matches logged-in user phone
      OR 
      auth.role() = 'service_role' -- Allow Admin/Service Role
    )
  )
);

-- 2. UNBLOCK INVENTORY LEDGER
-- Allow Admin (Service Role) to view the ledger
CREATE POLICY "Admins can view ledger" ON "public"."inventory_ledger"
FOR SELECT USING (
  auth.role() = 'service_role'
);

-- 3. ENSURE ADMIN ACCESS (Safety Net)
-- These generic policies ensure the 'service_role' (your Admin Code) is never blocked
CREATE POLICY "Service Role Full Access Orders" ON "public"."orders"
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service Role Full Access Items" ON "public"."order_items"
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service Role Full Access Variants" ON "public"."variants"
FOR ALL USING (auth.role() = 'service_role');