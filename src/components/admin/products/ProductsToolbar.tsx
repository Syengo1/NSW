'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ListFilter, ArrowUpDown } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

export default function ProductsToolbar() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) params.set('q', term);
    else params.delete('q');
    replace(`/admin/products?${params.toString()}`);
  }, 300);

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', value);
    replace(`/admin/products?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center bg-card p-4 rounded-lg border border-border shadow-sm">
      
      {/* SEARCH */}
      <div className="relative w-full md:max-w-md group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={16} />
        <input 
          onChange={(e) => handleSearch(e.target.value)}
          defaultValue={searchParams.get('q')?.toString()}
          placeholder="SEARCH PRODUCTS, SKU, OR CATEGORY..." 
          className="w-full bg-background border border-border pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary rounded-md uppercase tracking-wide"
        />
      </div>

      {/* FILTERS */}
      <div className="flex items-center gap-3 w-full md:w-auto">
         <div className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-md">
           <ListFilter size={14} className="text-muted-foreground" />
           <select 
             onChange={(e) => handleSort(e.target.value)}
             defaultValue={searchParams.get('sort') || 'newest'}
             className="bg-transparent text-xs font-bold uppercase outline-none cursor-pointer w-full md:w-auto"
           >
             <option value="newest">Newest Drops</option>
             <option value="oldest">Oldest First</option>
             <option value="price_high">Price: High to Low</option>
             <option value="price_low">Price: Low to High</option>
             <option value="stock_low">Stock: Low to High</option>
           </select>
         </div>
      </div>
    </div>
  );
}