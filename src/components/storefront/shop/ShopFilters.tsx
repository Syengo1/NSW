'use client';

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { SlidersHorizontal, XCircle, Filter, ArrowDownWideNarrow, User, PanelLeftClose } from "lucide-react";
import { useShopLayout } from "./ShopLayoutContext";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ShopFiltersProps {
  categories: string[];
  currentCategory?: string;
  currentQuery?: string;
  currentGender?: string;
}

export default function ShopFilters({ categories = [], currentCategory, currentQuery, currentGender }: ShopFiltersProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get('sort');
  const { isSidebarCollapsed, toggleSidebar } = useShopLayout();
  
  const hasActiveFilters = currentCategory || currentQuery || currentSort || (currentGender && currentGender !== 'all');

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(name, value);
      else params.delete(name);
      return params.toString();
    },
    [searchParams]
  );

  return (
    <>
      {/* =========================================
          MOBILE VIEW: Static Flow (Non-Sticky)
          ========================================= */}
      {/* 
        UI FIX: Removed `sticky`, `top-x`, and `z-30`. 
        The filters now sit beautifully beneath the header and scroll out of the way, 
        giving mobile users the entire screen to browse products.
      */}
      <div className="lg:hidden w-full space-y-3 py-2 border-b border-border/50 mb-6 bg-background">
        <div className="flex overflow-x-auto scrollbar-hide gap-2 w-full">
          {['all', 'men', 'women'].map(gender => {
            const isActive = (currentGender || 'all') === gender;
            return (
              <Link 
                key={gender} 
                href={pathname + '?' + createQueryString('gender', gender === 'all' ? '' : gender)}
                className={cn(
                  "px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border whitespace-nowrap",
                  isActive ? "bg-foreground text-background border-foreground shadow-xs" : "bg-transparent text-muted-foreground border-border hover:border-foreground"
                )}
              >
                {gender}
              </Link>
            );
          })}
        </div>

        <div className="flex overflow-x-auto scrollbar-hide gap-2 w-full pb-1">
          <Link 
            href={pathname + '?' + createQueryString('category', '')}
            className={cn(
              "px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border whitespace-nowrap",
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
                "px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border whitespace-nowrap",
                currentCategory === cat ? "bg-primary text-primary-foreground border-primary" : "bg-transparent text-muted-foreground border-border hover:border-foreground"
              )}
            >
              {cat}
            </Link>
          ))}
        </div>
      </div>

      {/* =========================================
          DESKTOP VIEW: Collapsible Sticky Sidebar
          ========================================= */}
      <AnimatePresence initial={false}>
        {!isSidebarCollapsed && (
          <motion.div 
            initial={{ opacity: 0, width: 0, x: -20 }}
            animate={{ opacity: 1, width: "auto", x: 0 }}
            exit={{ opacity: 0, width: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:block lg:col-span-3 overflow-hidden"
          >
            <div className="sticky top-[180px] space-y-8 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar pr-3">
              
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="text-xs font-black uppercase tracking-wider text-foreground">Filter Catalog</span>
                <button
                  onClick={toggleSidebar}
                  className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground transition-colors"
                  title="Collapse Sidebar"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>

              {hasActiveFilters && (
                <div className="space-y-3">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Filter size={12} /> Active Filters
                  </h3>
                  <div className="flex flex-col gap-1.5 items-start">
                    {currentGender && currentGender !== 'all' && (
                      <Link href={pathname + '?' + createQueryString('gender', '')} className="group bg-primary/10 border border-primary/20 text-primary pl-3 pr-2 py-1.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-primary/20 transition-all w-full justify-between">
                        Dep: {currentGender} <XCircle size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    )}

                    {currentCategory && (
                      <Link href={pathname + '?' + createQueryString('category', '')} className="group bg-primary/10 border border-primary/20 text-primary pl-3 pr-2 py-1.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-primary/20 transition-all w-full justify-between">
                        {currentCategory} <XCircle size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    )}

                    {currentQuery && (
                      <Link href={pathname + '?' + createQueryString('q', '')} className="group bg-primary/10 border border-primary/20 text-primary pl-3 pr-2 py-1.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-2 hover:bg-primary/20 transition-all w-full justify-between">
                        Search: {currentQuery} <XCircle size={14} className="opacity-50 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    )}

                    <Link href={pathname} className="text-[10px] font-bold uppercase tracking-widest underline decoration-muted-foreground/50 text-muted-foreground hover:text-foreground transition-colors mt-1">
                      Clear All
                    </Link>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <User size={12} /> Department
                </h3>
                <div className="flex gap-1.5">
                  {['all', 'men', 'women'].map(gender => {
                    const isActive = (currentGender || 'all') === gender;
                    return (
                      <Link 
                        key={gender} 
                        href={pathname + '?' + createQueryString('gender', gender === 'all' ? '' : gender)}
                        className={cn(
                          "flex-1 text-center py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all border",
                          isActive ? "bg-foreground text-background border-foreground shadow-xs" : "bg-secondary/60 text-muted-foreground border-transparent hover:border-border"
                        )}
                      >
                        {gender}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <SlidersHorizontal size={12} /> Collections
                </h3>
                <nav className="space-y-0.5">
                  <Link 
                    href={pathname + '?' + createQueryString('category', '')} 
                    className={cn(
                      "block px-3 py-2 text-xs font-bold uppercase rounded-lg transition-all border",
                      !currentCategory ? "bg-secondary text-foreground border-border/50 shadow-xs" : "border-transparent text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                    )}
                  >
                    View All
                  </Link>
                  {categories.map(cat => (
                    <Link 
                      key={cat} 
                      href={pathname + '?' + createQueryString('category', cat)}
                      className={cn(
                        "block px-3 py-2 text-xs font-bold uppercase rounded-lg transition-all border",
                        currentCategory === cat ? "bg-secondary text-foreground border-border/50 shadow-xs" : "border-transparent text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                      )}
                    >
                      {cat}
                    </Link>
                  ))}
                </nav>
              </div>

              <div className="pt-4 border-t border-border/50">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                  <ArrowDownWideNarrow size={12} /> Sort By
                </h3>
                <div className="space-y-0.5">
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
                        "block px-3 py-2 text-xs font-bold uppercase rounded-lg transition-all border",
                        (currentSort || '') === sort.id ? "border-border/50 text-foreground bg-secondary" : "border-transparent text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
                      )}
                    >
                      {sort.label}
                    </Link>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}