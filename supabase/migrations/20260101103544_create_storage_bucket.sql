-- 1. Create the public bucket 'product-images'
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- 2. POLICY: Everyone can VIEW images (Public)
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'product-images' );

-- 3. POLICY: Only Authenticated Users can UPLOAD (Admins)
create policy "Authenticated Users can Upload"
on storage.objects for insert
with check (
  bucket_id = 'product-images' 
  and auth.role() = 'authenticated'
);

-- 4. POLICY: Only Authenticated Users can UPDATE/DELETE
create policy "Authenticated Users can Update/Delete"
on storage.objects for update
using (
  bucket_id = 'product-images' 
  and auth.role() = 'authenticated'
);

create policy "Authenticated Users can Delete"
on storage.objects for delete
using (
  bucket_id = 'product-images' 
  and auth.role() = 'authenticated'
);