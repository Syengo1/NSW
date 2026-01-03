"use client";

import { Search, ArrowUpDown, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce"; // Optional: for smoother search

export default function ShopToolbar() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  // 1. SMART SEARCH: Debounced to prevent lag while typing
  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) params.set('q', term);
    else params.delete('q');
    replace(`/shop?${params.toString()}`);
  }, 300);

  // 2. INSTANT SORT: Triggers immediately on selection
  const handleSort = (term: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', term);
    replace(`/shop?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto items-center">
      
      {/* SEARCH BAR */}
      <div className="relative group w-full md:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-primary transition-colors" />
        <input 
          onChange={(e) => handleSearch(e.target.value)}
          defaultValue={searchParams.get('q')?.toString()}
          placeholder="SEARCH COLLECTION..." 
          className="w-full bg-secondary/50 border border-border rounded-full py-2.5 pl-10 pr-4 text-sm focus:bg-background focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-[10px] placeholder:tracking-widest placeholder:uppercase font-medium"
        />
      </div>

      {/* SORT DROPDOWN */}
      <div className="relative w-full md:w-48">
        <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <select 
          onChange={(e) => handleSort(e.target.value)}
          defaultValue={searchParams.get('sort') || 'newest'}
          className="w-full appearance-none bg-secondary/50 border border-border rounded-full py-2.5 pl-10 pr-8 text-xs font-bold uppercase focus:bg-background focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
        >
          <option value="newest">Newest Drops</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="oldest">Oldest Archives</option>
        </select>
        {/* Custom Arrow for UI Polish */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-[10px]">▼</div>
      </div>

    </div>
  );
}