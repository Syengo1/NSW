'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, ArrowUpDown } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce'; // Standard for search inputs

export default function OrdersToolbar() {
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  // Smart Search: Debounced to prevent database spamming
  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    replace(`/admin/orders?${params.toString()}`);
  }, 300);

  // Premium Sort Toggle
  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort', value);
    replace(`/admin/orders?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
      
      {/* SEARCH BAR */}
      <div className="relative w-full md:max-w-md group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-foreground transition-colors" size={16} />
        <input 
          onChange={(e) => handleSearch(e.target.value)}
          defaultValue={searchParams.get('q')?.toString()}
          placeholder="SEARCH ORDER ID, NAME, PHONE OR RECEIPT..." 
          className="w-full bg-card border border-border pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary rounded-md uppercase tracking-wide placeholder:normal-case"
        />
      </div>

      {/* SORT TOOLS */}
      <div className="flex items-center gap-2">
         <span className="text-[10px] font-bold uppercase text-muted-foreground">Sort By:</span>
         <select 
           onChange={(e) => handleSort(e.target.value)}
           defaultValue={searchParams.get('sort') || 'date_desc'}
           className="bg-card border border-border text-xs font-bold uppercase p-2.5 rounded-md outline-none focus:border-primary cursor-pointer"
         >
           <option value="date_desc">Newest First</option>
           <option value="date_asc">Oldest First</option>
           <option value="total_desc">Highest Value</option>
           <option value="status_pending">Pending Payment</option>
         </select>
      </div>
    </div>
  );
}