-- 1. Update Orders Table
-- We add 'delivery_method' to track Pickup vs Delivery
-- We add 'recipient' fields for when the payer != receiver
ALTER TABLE "public"."orders" 
ADD COLUMN IF NOT EXISTS "delivery_method" text DEFAULT 'delivery', -- 'pickup' or 'delivery'
ADD COLUMN IF NOT EXISTS "recipient_phone" text, -- The person receiving the goods
ADD COLUMN IF NOT EXISTS "recipient_name" text, -- The person receiving the goods
ADD COLUMN IF NOT EXISTS "delivery_fee" integer DEFAULT 0, -- Stored in Cents
ADD COLUMN IF NOT EXISTS "delivery_coordinates" text, -- 'lat,lng'
ADD COLUMN IF NOT EXISTS "shipping_address_details" text, -- House No, Apt, etc.
ADD COLUMN IF NOT EXISTS "customer_location" text; -- Formatted address string

-- 2. Security (Optional but Recommended)
-- Ensure delivery_fee is never negative
ALTER TABLE "public"."orders" 
ADD CONSTRAINT "orders_delivery_fee_check" CHECK (delivery_fee >= 0);