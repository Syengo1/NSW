import Link from "next/link";
import { SlidersHorizontal, XCircle, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShopFiltersProps {
  categories: string[];
  currentCategory?: string;
  currentQuery?: string;
}

export default function ShopFilters({ categories, currentCategory, currentQuery }: ShopFiltersProps) {
  const hasActiveFilters = currentCategory || currentQuery;

  return (
    <>
      {/* =========================================
          MOBILE VIEW: Horizontal Swipeable Pills
          ========================================= */}
      <div className="lg:hidden w-full overflow-x-auto scrollbar-hide py-4 border-b border-border/50 mb-6 bg-background/50 backdrop-blur-sm sticky top-[72px] z-20">
        <div className="flex px-4 gap-2 w-max">
          <Link 
            href="/shop" 
            className={cn(
              "px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border whitespace-nowrap",
              !currentCategory ? "bg-foreground text-background border-foreground" : "bg-transparent text-muted-foreground border-border hover:border-foreground"
            )}
          >
            All Drops
          </Link>
          {categories.map(cat => (
            <Link 
              key={cat} 
              href={`/shop?category=${cat}`}
              className={cn(
                "px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-full transition-all border whitespace-nowrap",
                currentCategory === cat ? "bg-foreground text-background border-foreground" : "bg-transparent text-muted-foreground border-border hover:border-foreground"
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
      <div className="hidden lg:block lg:col-span-3 space-y-8">
        <div className="sticky top-32 space-y-8 animate-slide-in-left">
          
          {hasActiveFilters && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Filter size={10} /> Active Filters
              </h3>
              <div className="flex flex-wrap gap-2">
                {currentCategory && (
                  <Link href="/shop" className="group bg-primary text-primary-foreground pl-3 pr-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 hover:opacity-90 transition-all">
                    {currentCategory} <XCircle size={12} className="opacity-50 group-hover:opacity-100" />
                  </Link>
                )}
                {currentQuery && (
                  <Link href="/shop" className="group bg-primary text-primary-foreground pl-3 pr-2 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 hover:opacity-90 transition-all">
                    Search: {currentQuery} <XCircle size={12} className="opacity-50 group-hover:opacity-100" />
                  </Link>
                )}
                <Link href="/shop" className="text-[10px] underline decoration-muted-foreground/50 text-muted-foreground hover:text-foreground transition-colors ml-1">Clear</Link>
              </div>
            </div>
          )}

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <SlidersHorizontal size={10} /> Collections
            </h3>
            <nav className="space-y-1">
              <Link 
                href="/shop" 
                className={cn(
                  "block px-3 py-2 text-xs font-bold uppercase rounded-md transition-all border border-transparent",
                  !currentCategory ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-border"
                )}
              >
                View All
              </Link>
              {categories.map(cat => (
                <Link 
                  key={cat} 
                  href={`/shop?category=${cat}`}
                  className={cn(
                    "block px-3 py-2 text-xs font-bold uppercase rounded-md transition-all border border-transparent",
                    currentCategory === cat ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-border"
                  )}
                >
                  {cat}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}