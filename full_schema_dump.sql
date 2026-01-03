


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."product_gender" AS ENUM (
    'men',
    'women',
    'unisex'
);


ALTER TYPE "public"."product_gender" OWNER TO "postgres";


CREATE TYPE "public"."product_status" AS ENUM (
    'draft',
    'active',
    'archived',
    'dropping_soon'
);


ALTER TYPE "public"."product_status" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrease_stock_on_order"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."decrease_stock_on_order"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_stock"("row_id" "uuid", "amount" integer) RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$
begin
  update variants 
  set stock_quantity = stock_quantity - amount
  where id = row_id;
end;
$$;


ALTER FUNCTION "public"."decrement_stock"("row_id" "uuid", "amount" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."collections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "banner_image_url" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."collections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."inventory_ledger" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "variant_id" "uuid",
    "quantity_change" integer NOT NULL,
    "reason" "text" NOT NULL,
    "reference_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."inventory_ledger" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "variant_id" "uuid",
    "product_name" "text" NOT NULL,
    "variant_name" "text" NOT NULL,
    "quantity" integer NOT NULL,
    "price_at_purchase" integer NOT NULL
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_name" "text" NOT NULL,
    "customer_phone" "text" NOT NULL,
    "customer_location" "text",
    "total_amount" integer NOT NULL,
    "status" "text" DEFAULT 'pending_payment'::"text",
    "mpesa_request_id" "text",
    "mpesa_receipt" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "delivery_method" "text" DEFAULT 'delivery'::"text",
    "recipient_phone" "text",
    "recipient_name" "text",
    "delivery_fee" integer DEFAULT 0,
    "delivery_coordinates" "text",
    "shipping_address_details" "text",
    CONSTRAINT "orders_delivery_fee_check" CHECK (("delivery_fee" >= 0))
);


ALTER TABLE "public"."orders" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."product_images" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "variant_id" "uuid",
    "url" "text" NOT NULL,
    "alt_text" "text",
    "display_order" integer DEFAULT 0,
    "color_tag" "text"
);


ALTER TABLE "public"."product_images" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "collection_id" "uuid",
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "base_price" integer NOT NULL,
    "category" "text" NOT NULL,
    "gender" "public"."product_gender" DEFAULT 'unisex'::"public"."product_gender",
    "status" "public"."product_status" DEFAULT 'draft'::"public"."product_status",
    "is_featured" boolean DEFAULT false,
    "drop_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "sale_price" integer,
    "is_visible" boolean DEFAULT true
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."variants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "size" "text" NOT NULL,
    "color" "text" NOT NULL,
    "hex_color" "text",
    "sku" "text" NOT NULL,
    "stock_quantity" integer DEFAULT 0,
    "price_adjustment" integer DEFAULT 0,
    "is_active" boolean DEFAULT true,
    CONSTRAINT "check_stock_non_negative" CHECK (("stock_quantity" >= 0))
);


ALTER TABLE "public"."variants" OWNER TO "postgres";


ALTER TABLE ONLY "public"."collections"
    ADD CONSTRAINT "collections_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."collections"
    ADD CONSTRAINT "collections_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."inventory_ledger"
    ADD CONSTRAINT "inventory_ledger_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_mpesa_request_id_key" UNIQUE ("mpesa_request_id");



ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."product_images"
    ADD CONSTRAINT "product_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."variants"
    ADD CONSTRAINT "variants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."variants"
    ADD CONSTRAINT "variants_sku_key" UNIQUE ("sku");



CREATE INDEX "idx_ledger_variant_id" ON "public"."inventory_ledger" USING "btree" ("variant_id");



CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");



CREATE INDEX "idx_product_images_product_id" ON "public"."product_images" USING "btree" ("product_id");



CREATE INDEX "idx_variants_product_id" ON "public"."variants" USING "btree" ("product_id");



CREATE INDEX "products_sale_price_idx" ON "public"."products" USING "btree" ("sale_price") WHERE ("sale_price" IS NOT NULL);



CREATE OR REPLACE TRIGGER "on_order_item_created" AFTER INSERT ON "public"."order_items" FOR EACH ROW EXECUTE FUNCTION "public"."decrease_stock_on_order"();



ALTER TABLE ONLY "public"."inventory_ledger"
    ADD CONSTRAINT "inventory_ledger_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id");



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id");



ALTER TABLE ONLY "public"."product_images"
    ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."product_images"
    ADD CONSTRAINT "product_images_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."variants"("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id");



ALTER TABLE ONLY "public"."variants"
    ADD CONSTRAINT "variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can view ledger" ON "public"."inventory_ledger" FOR SELECT USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Anyone can create order items" ON "public"."order_items" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can create orders" ON "public"."orders" FOR INSERT WITH CHECK (true);



CREATE POLICY "Public can view active products" ON "public"."products" FOR SELECT USING ((("status" = 'active'::"public"."product_status") AND ("is_visible" = true)));



CREATE POLICY "Public can view variants" ON "public"."variants" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Service Role Full Access Items" ON "public"."order_items" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service Role Full Access Orders" ON "public"."orders" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Service Role Full Access Variants" ON "public"."variants" USING (("auth"."role"() = 'service_role'::"text"));



CREATE POLICY "Users can view own order items" ON "public"."order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_items"."order_id") AND (("orders"."customer_phone" = ("auth"."uid"())::"text") OR ("auth"."role"() = 'service_role'::"text"))))));



CREATE POLICY "Users can view their own orders" ON "public"."orders" FOR SELECT USING (((("auth"."uid"())::"text" = "customer_phone") OR ("auth"."role"() = 'service_role'::"text")));



ALTER TABLE "public"."inventory_ledger" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."variants" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";































































































































































GRANT ALL ON FUNCTION "public"."decrease_stock_on_order"() TO "anon";
GRANT ALL ON FUNCTION "public"."decrease_stock_on_order"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrease_stock_on_order"() TO "service_role";



GRANT ALL ON FUNCTION "public"."decrement_stock"("row_id" "uuid", "amount" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_stock"("row_id" "uuid", "amount" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_stock"("row_id" "uuid", "amount" integer) TO "service_role";


















GRANT ALL ON TABLE "public"."collections" TO "anon";
GRANT ALL ON TABLE "public"."collections" TO "authenticated";
GRANT ALL ON TABLE "public"."collections" TO "service_role";



GRANT ALL ON TABLE "public"."inventory_ledger" TO "anon";
GRANT ALL ON TABLE "public"."inventory_ledger" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory_ledger" TO "service_role";



GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";



GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";



GRANT ALL ON TABLE "public"."product_images" TO "anon";
GRANT ALL ON TABLE "public"."product_images" TO "authenticated";
GRANT ALL ON TABLE "public"."product_images" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."variants" TO "anon";
GRANT ALL ON TABLE "public"."variants" TO "authenticated";
GRANT ALL ON TABLE "public"."variants" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































