import { createClient } from "@supabase/supabase-js"; 
import Link from "next/link";
import { Plus } from "lucide-react";
import { InventoryTable } from "@/components/admin/products/InventoryTable";
import ProductsToolbar from "@/components/admin/products/ProductsToolbar";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; status?: string }>;
}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );

  const params = await searchParams;

  let query = supabase
    .from("products")
    .select(`
      id, title, slug, base_price, sale_price, cost_price, category, status, is_visible, created_at,
      collections ( title ),
      product_images ( url ),
      variants ( id, size, color, stock_quantity, sku )
    `);

  if (params.q) {
    const term = params.q;
    query = query.or(`title.ilike.%${term}%,category.ilike.%${term}%,description.ilike.%${term}%`);
  }

  if (params.status && params.status !== 'all') {
    if (params.status === 'hidden') {
      query = query.eq('is_visible', false);
    } else {
      query = query.eq('status', params.status);
    }
  }

  // FIX 1: Strictly type the map so TypeScript knows these are valid database columns
  const sortMap: Record<string, 'created_at' | 'base_price'> = {
    'oldest': 'created_at',
    'price_high': 'base_price',
    'price_low': 'base_price',
    'stock_low': 'base_price', 
    'newest': 'created_at'
  };
  
  if (params.sort === 'stock_low') {
    query = query.order('created_at', { ascending: false });
  } else {
    // We can now pass the variable directly without using 'as any'
    const sortColumn = sortMap[params.sort || 'newest'] || 'created_at';
    query = query.order(sortColumn, { 
      ascending: params.sort === 'oldest' || params.sort === 'price_low' 
    });
  }

  const { data: products } = await query;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">
            {/* FIX 2: Wrapped the aesthetic slashes in a string literal */}
            Inventory <span className="text-muted-foreground text-lg align-middle">{"// Command"}</span>
          </h1>
          <p className="text-muted-foreground text-xs uppercase tracking-widest mt-1">
            {products?.length || 0} Records Found
          </p>
        </div>
        
        <Link 
          href="/admin/products/new" 
          className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-white uppercase tracking-widest bg-black dark:bg-white dark:text-black hover:opacity-90 transition-all rounded-md shadow-lg overflow-hidden"
        >
           <Plus size={16} strokeWidth={3} /> Create Drop
        </Link>
      </div>

      <ProductsToolbar />
      <InventoryTable products={products || []} />
      
    </div>
  );
}