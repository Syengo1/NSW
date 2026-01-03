-- 1. ENABLE RLS ON ALL TABLES
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_ledger ENABLE ROW LEVEL SECURITY;

-- 2. PRODUCTS & VARIANTS (Public Read, Admin Write)
CREATE POLICY "Public can view active products" ON public.products
FOR SELECT USING (status = 'active' AND is_visible = true);

CREATE POLICY "Public can view variants" ON public.variants
FOR SELECT USING (is_active = true);

-- Admin (Service Role) gets full access implicitly, but if you use authenticated admin users:
-- (We assume for now you are using the Dashboard or Service Role for admin actions)

-- 3. ORDERS (Public can Create, Users view their own)
CREATE POLICY "Anyone can create orders" ON public.orders
FOR INSERT WITH CHECK (true); -- Needed for guest checkout

CREATE POLICY "Users can view their own orders" ON public.orders
FOR SELECT USING (auth.uid()::text = customer_phone OR auth.role() = 'service_role');
-- Note: Linking via Phone is tricky for RLS without auth. 
-- For guest checkout, usually, we rely on the session returning the order ID immediately.

-- 4. ORDER ITEMS (Public Create)
CREATE POLICY "Anyone can create order items" ON public.order_items
FOR INSERT WITH CHECK (true);