'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, X, Loader2 } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { SearchResult } from './config';

interface SearchOverlayProps {
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

export function SearchOverlay({ isSearchOpen, setIsSearchOpen }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically and clear on close
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      // 🚨 ESLINT FIX 1: Push state clearing to the end of the execution queue
      const timer = setTimeout(() => setSearchQuery(''), 0);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  // Hierarchical Search Logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      // 🚨 ESLINT FIX 2: Push state clearing to the end of the execution queue
      const timer = setTimeout(() => {
        setSearchResults([]);
        setIsSearching(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const fetchSearchResults = async () => {
      setIsSearching(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('products')
        .select('id, title, slug, base_price, sale_price, description, product_images(url)')
        .eq('status', 'active')
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(8);

      if (!error && data) {
        const sortedData = (data as unknown as SearchResult[]).sort((a, b) => {
          const query = searchQuery.toLowerCase();
          const aTitle = a.title.toLowerCase();
          const bTitle = b.title.toLowerCase();
          
          if (aTitle === query && bTitle !== query) return -1;
          if (bTitle === query && aTitle !== query) return 1;
          
          const aHasTitle = aTitle.includes(query);
          const bHasTitle = bTitle.includes(query);
          if (aHasTitle && !bHasTitle) return -1;
          if (!aHasTitle && bHasTitle) return 1;
          
          return 0; 
        });
        setSearchResults(sortedData);
      }
      setIsSearching(false);
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSearchResults();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  return (
    <div className={cn(
      "absolute top-full left-0 w-full bg-background border-b border-border shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden",
      isSearchOpen ? "max-h-[70vh] opacity-100" : "max-h-0 opacity-0 border-transparent"
    )}>
       <div className="container mx-auto px-6 py-8">
          <div className="relative max-w-3xl mx-auto">
             <Search size={24} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
             <input 
               ref={searchInputRef}
               type="text"
               placeholder="Search hoodies, collections, or materials..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-secondary/50 border border-border/50 text-foreground text-lg md:text-xl font-bold rounded-2xl py-5 pl-14 pr-12 outline-none focus:border-primary transition-colors placeholder:text-muted-foreground/50 placeholder:font-medium"
             />
             {isSearching && (
               <Loader2 size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground animate-spin" />
             )}
             {searchQuery && !isSearching && (
               <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                 <X size={20} />
               </button>
             )}
          </div>

          <div className="max-w-3xl mx-auto mt-6">
             {searchResults.length > 0 ? (
               <div className="flex flex-col gap-2">
                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Top Results</p>
                 {searchResults.map((product) => (
                   <Link 
                     key={product.id}
                     href={`/product/${product.slug}`}
                     onClick={() => setIsSearchOpen(false)}
                     className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary transition-colors group"
                   >
                     <div className="relative w-12 h-16 bg-muted rounded-md overflow-hidden flex-shrink-0">
                       {product.product_images?.[0]?.url ? (
                         <Image src={product.product_images[0].url} alt={product.title} fill className="object-cover group-hover:scale-105 transition-transform" sizes="48px" />
                       ) : (
                         <div className="absolute inset-0 bg-secondary" />
                       )}
                     </div>
                     <div className="flex-1 flex flex-col justify-center">
                       <h4 className="text-sm font-bold uppercase tracking-tight group-hover:text-primary transition-colors">{product.title}</h4>
                       <p className="text-[10px] text-muted-foreground line-clamp-1">{product.description || "No description available"}</p>
                     </div>
                     <div className="text-right">
                       {product.sale_price ? (
                         <div className="flex flex-col items-end">
                           <span className="text-xs font-black text-red-500">{formatCurrency(product.sale_price / 100)}</span>
                           <span className="text-[9px] text-muted-foreground line-through">{formatCurrency(product.base_price / 100)}</span>
                         </div>
                       ) : (
                         <span className="text-xs font-black text-foreground">{formatCurrency(product.base_price / 100)}</span>
                       )}
                     </div>
                   </Link>
                 ))}
               </div>
             ) : searchQuery && !isSearching ? (
               <div className="py-12 text-center flex flex-col items-center justify-center">
                  <Search size={32} className="text-muted-foreground/30 mb-3" />
                  <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">No matches found</p>
                  <p className="text-[10px] text-muted-foreground mt-1">Try searching for a different term or material.</p>
               </div>
             ) : null}
          </div>
       </div>
    </div>
  );
}