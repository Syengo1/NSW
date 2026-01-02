import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus } from "lucide-react";
import { InventoryTable } from "@/components/admin/products/InventoryTable";
import ProductsToolbar from "@/components/admin/products/ProductsToolbar";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  let query = supabase
    .from("products")
    .select(`
      id, title, slug, base_price, sale_price, category, status, is_visible, created_at,
      collections ( title ),
      product_images ( url ),
      variants ( id, size, color, stock_quantity, sku )
    `);

  if (params.q) {
    query = query.or(`title.ilike.%${params.q}%,category.ilike.%${params.q}%`);
  }

  const sortMap: Record<string, string> = {
    'oldest': 'created_at',
    'price_high': 'base_price',
    'price_low': 'base_price',
    'newest': 'created_at'
  };
  
  query = query.order(sortMap[params.sort || 'newest'] as any, { 
    ascending: params.sort === 'oldest' || params.sort === 'price_low' 
  });

  const { data: products } = await query;

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      <div className="flex justify-between items-center border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">Inventory // Command</h1>
          <p className="text-muted-foreground text-xs uppercase tracking-widest mt-1">{products?.length || 0} Products</p>
        </div>
        <Link href="/admin/products/new" className="px-6 py-3 font-bold bg-black text-white dark:bg-white dark:text-black uppercase tracking-widest rounded-md shadow-lg flex items-center gap-2 hover:opacity-90">
           <Plus size={16} /> Create Drop
        </Link>
      </div>
      <ProductsToolbar />
      <InventoryTable products={products || []} />
    </div>
  );
}