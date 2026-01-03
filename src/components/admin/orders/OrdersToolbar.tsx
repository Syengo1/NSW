'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, ListFilter } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

export default function OrdersToolbar() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  // Smart Search: Search Orders, NOT Products
  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) params.set('q', term);
    else params.delete('q');
    // FIX: Redirect to orders, not products
    replace(`/admin/orders?${params.toString()}`);
  }, 300);

  const handleFilter = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all') params.delete('sort');
    else params.set('sort', value);
    replace(`/admin/orders?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center bg-card p-4 rounded-lg border border-border shadow-sm">
      
      {/* SEARCH BAR */}
      <div className="relative w-full md:max-w-md group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={16} />
        <input 
          onChange={(e) => handleSearch(e.target.value)}
          defaultValue={searchParams.get('q')?.toString()}
          placeholder="SEARCH ORDER ID, NAME, PHONE..." 
          className="w-full bg-background border border-border pl-10 pr-4 py-2 text-sm outline-none focus:ring-1 focus:ring-primary rounded-md uppercase tracking-wide"
        />
      </div>

      {/* FILTER DROPDOWN */}
      <div className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-md">
         <ListFilter size={14} className="text-muted-foreground" />
         <select 
           onChange={(e) => handleFilter(e.target.value)}
           defaultValue={searchParams.get('sort') || 'all'}
           className="bg-transparent text-xs font-bold uppercase outline-none cursor-pointer"
         >
           <option value="all">All Orders</option>
           <option value="status_pending">Pending Payment</option>
           <option value="status_paid">Ready to Ship</option>
         </select>
      </div>
    </div>
  );
}