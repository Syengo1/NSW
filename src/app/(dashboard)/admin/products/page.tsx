import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { InventoryTable } from "@/components/admin/products/InventoryTable"; // Import the new component

export default async function InventoryPage() {
  const supabase = await createClient();

  // 1. Fetch DEEP data
  // We need actual variant details (stock, sku, etc) to perform the logic
  const { data: products } = await supabase
    .from("products")
    .select(`
      id,
      title,
      slug,
      base_price,
      category,
      status,
      created_at,
      collections ( title ),
      variants ( 
        id, 
        size, 
        color, 
        stock_quantity, 
        sku 
      )
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground">
            Inventory <span className="text-muted-foreground text-lg align-middle">// Management</span>
          </h1>
          <p className="text-muted-foreground text-xs uppercase tracking-widest mt-1">
            Live Stock Levels & Variant Analysis
          </p>
        </div>
        
        <Link 
          href="/admin/products/new" 
          className="group relative inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-white uppercase tracking-widest bg-primary hover:bg-primary/90 transition-all rounded-md shadow-lg shadow-primary/20 overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
             <Plus size={16} strokeWidth={3} /> Create Drop
          </span>
          {/* Subtle shine effect */}
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </Link>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="SEARCH SKU, PRODUCT, OR COLLECTION..." 
            className="w-full bg-background border border-border pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all rounded-md uppercase placeholder:text-muted-foreground/50 font-medium"
          />
        </div>
        
        {/* Quick Stats (Optional but useful) */}
        <div className="hidden md:flex gap-6 text-xs uppercase tracking-widest font-bold text-muted-foreground">
           <span>Total Drops: <span className="text-foreground">{products?.length || 0}</span></span>
        </div>
      </div>

      {/* THE SMART TABLE */}
      {/* We pass the server-fetched data to our Client Component */}
      <InventoryTable products={products || []} />
      
    </div>
  );
}