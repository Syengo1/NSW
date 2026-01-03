SET session_replication_role = replica;

-- 1. ADMIN USER (Preserving your specific ID for image ownership)
INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "created_at", "updated_at", "is_super_admin", "phone_change", "email_change", "reauthentication_token") VALUES
('00000000-0000-0000-0000-000000000000', '3f0bc40a-de60-4cd3-9045-581b40da4c7c', 'authenticated', 'authenticated', 'admin@nairobistreetwear.com', '$2a$10$fCc3JbkjAj7E/8rfnVQtCeSWLT7w4qExReoQSfqpsjlD.4va9VaNS', '2026-01-01 12:45:16.0621+00', '2026-01-02 07:52:01.54142+00', '{"provider": "email", "providers": ["email"]}', '{"role": "admin", "email_verified": true}', '2026-01-01 12:45:16.040609+00', '2026-01-03 13:04:19.014107+00', NULL, '', '', '')
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
('3f0bc40a-de60-4cd3-9045-581b40da4c7c', '3f0bc40a-de60-4cd3-9045-581b40da4c7c', '{"sub": "3f0bc40a-de60-4cd3-9045-581b40da4c7c", "email": "admin@nairobistreetwear.com", "email_verified": false, "phone_verified": false}', 'email', '2026-01-01 12:45:16.051213+00', '2026-01-01 12:45:16.051317+00', '2026-01-01 12:45:16.051317+00', '4136a721-9b8c-4010-b861-b94b496cbe11')
ON CONFLICT ("id") DO NOTHING;

-- 2. STORAGE BUCKETS (Handling conflicts safely)
INSERT INTO "storage"."buckets" ("id", "name", "public", "avif_autodetection", "created_at", "updated_at") VALUES
('product-images', 'product-images', true, false, '2026-01-01 12:44:47.802057+00', '2026-01-01 12:44:47.802057+00')
ON CONFLICT ("id") DO NOTHING;

-- 3. PRODUCTS
INSERT INTO "public"."products" ("id", "title", "slug", "description", "base_price", "category", "gender", "status", "is_featured", "sale_price", "is_visible", "created_at", "updated_at") VALUES
('d75a0ba0-377b-4343-984b-8edd074d50f5', 'spongebob hoodie', 'spongebob-hoodie-1767289427060', '', 500000, 'Hoodies', 'unisex', 'active', false, 100, true, '2026-01-01 17:43:47.094083+00', '2026-01-01 17:43:47.094083+00'),
('2b1c3cd5-9d44-45ec-a52a-5917ea3713df', 'zoro hoodie', 'zoro-hoodie-1767272009938', 'Quality', 100, 'Hoodies', 'unisex', 'active', false, NULL, true, '2026-01-01 12:53:29.984101+00', '2026-01-01 12:53:29.984101+00')
ON CONFLICT ("id") DO NOTHING;

-- 4. VARIANTS
INSERT INTO "public"."variants" ("id", "product_id", "size", "color", "stock_quantity", "price_adjustment", "is_active", "sku") VALUES
('937837af-a9ad-40b4-924b-97acbb8cfada', '2b1c3cd5-9d44-45ec-a52a-5917ea3713df', 'L', 'Black', 9, 0, true, 'DROP-BLA-L-543'),
('e7c4186b-6392-49ed-abe9-e3e006d823dc', '2b1c3cd5-9d44-45ec-a52a-5917ea3713df', 'S', 'Black', 10, 0, true, 'DROP-BLA-S-336'),
('f405b157-098d-49b8-8923-028a52ea1fd1', '2b1c3cd5-9d44-45ec-a52a-5917ea3713df', 'M', 'Black', 10, 0, true, 'DROP-BLA-M-445'),
('4c2b3253-f849-42e9-a6b1-c48736a4a060', '2b1c3cd5-9d44-45ec-a52a-5917ea3713df', 'XL', 'Black', 10, 0, true, 'DROP-BLA-XL-934'),
('c7ffe422-632e-423b-9af5-6555ee8a9501', '2b1c3cd5-9d44-45ec-a52a-5917ea3713df', 'S', 'Off-White', 10, 0, true, 'DROP-OFF-S-520'),
('1631a907-76de-4c37-b569-cb4cd81c327b', '2b1c3cd5-9d44-45ec-a52a-5917ea3713df', 'M', 'Off-White', 10, 0, true, 'DROP-OFF-M-345'),
('0af450b0-f47a-45ee-8461-0b7856dedbf7', '2b1c3cd5-9d44-45ec-a52a-5917ea3713df', 'L', 'Off-White', 10, 0, true, 'DROP-OFF-L-178'),
('badfff2e-f67f-4032-893e-42f69a712f32', '2b1c3cd5-9d44-45ec-a52a-5917ea3713df', 'XL', 'Off-White', 10, 0, true, 'DROP-OFF-XL-43'),
('c8441db3-b09b-402f-9244-7e2caa2a4809', 'd75a0ba0-377b-4343-984b-8edd074d50f5', 'M', 'yellow', 10, 0, true, 'DROP-YEL-M-554'),
('8fb447a4-84e3-4411-bf57-b9e283eb0b3b', 'd75a0ba0-377b-4343-984b-8edd074d50f5', 'L', 'yellow', 10, 0, true, 'DROP-YEL-L-729'),
('473f5d74-a9ea-4922-8175-ba5796e8b1f1', 'd75a0ba0-377b-4343-984b-8edd074d50f5', 'XL', 'yellow', 8, 0, true, 'DROP-YEL-XL-577'),
('804c84c1-7b19-42d5-932f-db8dda8ce28c', 'd75a0ba0-377b-4343-984b-8edd074d50f5', 'S', 'yellow', 9, 0, true, 'DROP-YEL-S-764')
ON CONFLICT ("id") DO NOTHING;

-- 5. STORAGE OBJECTS (Images)
INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id") VALUES
('9a31f976-a498-47ab-8319-94bc40623044', 'product-images', 'drop-images/1767271994369-qi9xm2nqm.png', '3f0bc40a-de60-4cd3-9045-581b40da4c7c', '2026-01-01 12:53:15.56487+00', '2026-01-01 12:53:15.56487+00', '2026-01-01 12:53:15.56487+00', '{"eTag": "\"7c83d25f357d0ea104a44e77df223c10\"", "size": 4332184, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-01T12:53:15.247Z", "contentLength": 4332184, "httpStatusCode": 200}', 'f5371f9f-ceae-45c5-9bc6-2f0272cf546e', '3f0bc40a-de60-4cd3-9045-581b40da4c7c'),
('c9c0f2ef-3b5e-44d5-80e6-ba22ce9f69e5', 'product-images', 'drop-images/1767289417875-u7xwob1i8.png', '3f0bc40a-de60-4cd3-9045-581b40da4c7c', '2026-01-01 17:43:39.012558+00', '2026-01-01 17:43:39.012558+00', '2026-01-01 17:43:39.012558+00', '{"eTag": "\"ede954ae24bcaa0fd82b1424708b99bc\"", "size": 1417698, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-01-01T17:43:38.716Z", "contentLength": 1417698, "httpStatusCode": 200}', '620a06ec-be68-4cea-9979-70252914fb85', '3f0bc40a-de60-4cd3-9045-581b40da4c7c')
ON CONFLICT ("id") DO NOTHING;

-- 6. LINK IMAGES TO PRODUCTS
INSERT INTO "public"."product_images" ("id", "product_id", "url") VALUES
('473dd149-b67a-4faa-810d-d30515a8f8fe', '2b1c3cd5-9d44-45ec-a52a-5917ea3713df', 'http://127.0.0.1:54321/storage/v1/object/public/product-images/drop-images/1767271994369-qi9xm2nqm.png'),
('3394924f-7307-42e8-bb9e-98a8328a76ab', 'd75a0ba0-377b-4343-984b-8edd074d50f5', 'http://127.0.0.1:54321/storage/v1/object/public/product-images/drop-images/1767289417875-u7xwob1i8.png')
ON CONFLICT ("id") DO NOTHING;

RESET ALL;