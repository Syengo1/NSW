-- 1. ENUMS (Strict types for fashion standards)
create type product_gender as enum ('men', 'women', 'unisex');
create type product_status as enum ('draft', 'active', 'archived', 'dropping_soon');

-- 2. COLLECTIONS (e.g., "Summer Drop 2026", "Graffiti Series")
create table collections (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  banner_image_url text, -- The graffiti overlay background for this collection
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 3. PRODUCTS (The Parent Style)
create table products (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid references collections(id),
  title text not null,          -- "Oversized Graffiti Hoodie"
  slug text unique not null,    -- "oversized-graffiti-hoodie"
  description text,
  base_price integer not null,  -- Stored in CENTS (KES 1000 -> 100000)
  category text not null,       -- "Hoodies", "Sneakers", "Tees"
  gender product_gender default 'unisex',
  status product_status default 'draft',
  
  -- Streetwear Specifics
  is_featured boolean default false,
  drop_date timestamptz,        -- For "Dropping Soon" countdowns
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. VARIANTS (The Sellable Unit: Size + Color)
create table variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  
  size text not null,           -- "S", "M", "L", "XL", "US 10"
  color text not null,          -- "Matte Black", "Neon Green"
  hex_color text,               -- "#000000" (For color swatches)
  sku text unique not null,     -- "HOOD-BLK-XL"
  
  stock_quantity integer default 0,
  price_adjustment integer default 0, -- If XL costs more
  
  is_active boolean default true
);

-- 5. PRODUCT IMAGES
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) on delete cascade,
  variant_id uuid references variants(id), -- Optional: Link specific image to a color
  url text not null,
  alt_text text,
  display_order integer default 0
);

-- 6. ORDERS (Reused logic, tuned for apparel)
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_location text,       -- "Nairobi, Westlands"
  total_amount integer not null,
  status text default 'pending_payment', -- pending, processing, paid, failed, shipped
  
  mpesa_request_id text unique, -- For tracking payments
  mpesa_receipt text,
  
  created_at timestamptz default now()
);

-- 7. ORDER ITEMS (Snapshot of what they bought)
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  variant_id uuid references variants(id),
  
  product_name text not null,   -- Snapshot name (in case product changes later)
  variant_name text not null,   -- "Size: L / Color: Black"
  quantity integer not null,
  price_at_purchase integer not null
);

-- 8. INVENTORY LEDGER (Professional Audit Trail)
create table inventory_ledger (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid references variants(id),
  quantity_change integer not null, -- +50 or -1
  reason text not null,             -- "restock", "sale", "return", "damage"
  reference_id uuid,                -- Link to Order ID if sale
  created_at timestamptz default now()
);