'use client';

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { SlidersHorizontal, XCircle, Filter, ArrowDownWideNarrow, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShopFiltersProps {
  categories: string[];
  currentCategory?: string;
  currentQuery?: string;
  currentGender?: string;
}

export default function ShopFilters({ categories, currentCategory, currentQuery, currentGender }: ShopFiltersProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sort');
  
  const hasActiveFilters = currentCategory || currentQuery || currentSort || (currentGender && currentGender !== 'all');

  // Smart URL Builder: Merges states without destroying existing params
  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  return (
    <>
      {/* =========================================
          MOBILE VIEW: Stacked Swipeable Pills
          ========================================= */}
      <div className="lg:hidden w-full space-y-3 py-4 border-b border-border/50 mb-6 bg-background">
        
        {/* Mobile Gender Pills */}
        <div className="flex overflow-x-auto scrollbar-hide px-4 gap-2 w-full">
          {['all', 'men', 'women'].map(gender => {
            const isActive = (currentGender || 'all') === gender;
            return (
              <Link 
                key={gender} 
                href={pathname + '?' + createQueryString('gender', gender === 'all' ? '' : gender)}
                className={cn(
                  "px-5 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border whitespace-nowrap",
                  isActive ? "bg-foreground text-background border-foreground shadow-md" : "bg-transparent text-muted-foreground border-border hover:border-foreground"
                )}
              >
                {gender}
              </Link>
            );
          })}
        </div>

        {/* Mobile Category Pills */}
        <div className="flex overflow-x-auto scrollbar-hide px-4 gap-2 w-full pb-2">
          <Link 
            href={pathname + '?' + createQueryString('category', '')}
            className={cn(
              "px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border whitespace-nowrap",
              !currentCategory ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-foreground"
            )}
          >
            All Drops
          </Link>
          {categories.map(cat => (
            <Link 
              key={cat} 
              href={pathname + '?' + createQueryString('category', cat)}
              className={cn(
                "px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border whitespace-nowrap",
                currentCategory === cat ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-foreground"
              )}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* =========================================
          DESKTOP VIEW: Sticky Sidebar
          ========================================= */}
      <div className="hidden lg:block lg:col-span-3 space-y-10">
        <div className="sticky top-32 space-y-10 animate-in fade-in slide-in-from-left-4 duration-700">
          
          {hasActiveFilters && (
            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Filter size={12} /> Active Filters
              </h3>
              <div className="flex flex-col gap-2 items-start">
                
                {currentGender && currentGender !== 'all' && (
                  <Link 
                    href={pathname + '?' + createQueryString('gender', '')} 
                    className="group bg-primary text-primary-foreground pl-3 pr-2 py-1.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-2 hover:opacity-90 transition-all shadow-sm w-full justify-between"
                  >
                    Dep: {currentGender} <XCircle size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                  </Link>
                )}

                {currentCategory && (
                  <Link 
                    href={pathname + '?' + createQueryString('category', '')} 
                    className="group bg-primary text-primary-foreground pl-3 pr-2 py-1.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-2 hover:opacity-90 transition-all shadow-sm w-full justify-between"
                  >
                    {currentCategory} <XCircle size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                  </Link>
                )}

                {currentQuery && (
                  <Link 
                    href={pathname + '?' + createQueryString('q', '')} 
                    className="group bg-primary text-primary-foreground pl-3 pr-2 py-1.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-2 hover:opacity-90 transition-all shadow-sm w-full justify-between"
                  >
                    Search: {currentQuery} <XCircle size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                  </Link>
                )}

                <Link href={pathname} className="text-[10px] font-bold uppercase tracking-widest underline decoration-muted-foreground/50 text-muted-foreground hover:text-foreground transition-colors mt-2">
                  Clear All
                </Link>
              </div>
            </div>
          )}

          {/* DEPARTMENT NAV (New Feature) */}
          <div className={cn(hasActiveFilters && "pt-6 border-t border-border/50")}>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <User size={12} /> Department
            </h3>
            <div className="flex gap-2">
              {['all', 'men', 'women'].map(gender => {
                const isActive = (currentGender || 'all') === gender;
                return (
                  <Link 
                    key={gender} 
                    href={pathname + '?' + createQueryString('gender', gender === 'all' ? '' : gender)}
                    className={cn(
                      "flex-1 text-center py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all border",
                      isActive ? "bg-foreground text-background border-foreground shadow-sm" : "bg-transparent text-muted-foreground border-border hover:border-foreground"
                    )}
                  >
                    {gender}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* COLLECTIONS NAV */}
          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <SlidersHorizontal size={12} /> Collections
            </h3>
            <nav className="space-y-1">
              <Link 
                href={pathname + '?' + createQueryString('category', '')} 
                className={cn(
                  "block px-3 py-2.5 text-xs font-bold uppercase rounded-lg transition-all border border-transparent",
                  !currentCategory ? "bg-secondary text-foreground font-black shadow-sm" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground hover:border-border/50"
                )}
              >
                View All
              </Link>
              {categories.map(cat => (
                <Link 
                  key={cat} 
                  href={pathname + '?' + createQueryString('category', cat)}
                  className={cn(
                    "block px-3 py-2.5 text-xs font-bold uppercase rounded-lg transition-all border border-transparent",
                    currentCategory === cat ? "bg-secondary text-foreground font-black shadow-sm" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground hover:border-border/50"
                  )}
                >
                  {cat}
                </Link>
              ))}
            </nav>
          </div>

          {/* SORTING NAV */}
          <div className="pt-6 border-t border-border/50">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <ArrowDownWideNarrow size={12} /> Sort By
            </h3>
            <div className="space-y-1">
              {[
                { id: '', label: 'Featured Drops' },
                { id: 'price_asc', label: 'Price: Low to High' },
                { id: 'price_desc', label: 'Price: High to Low' },
                { id: 'oldest', label: 'Vault / Oldest' }
              ].map(sort => (
                <Link 
                  key={sort.id} 
                  href={pathname + '?' + createQueryString('sort', sort.id)}
                  className={cn(
                    "block px-3 py-2.5 text-xs font-bold uppercase rounded-lg transition-all",
                    (currentSort || '') === sort.id ? "text-foreground font-black bg-secondary" : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
                  )}
                >
                  {sort.label}
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}