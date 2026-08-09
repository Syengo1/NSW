'use client';

import Link from 'next/link';
import { Search, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '@/lib/store/cart';
import { NAV_LINKS } from './config';

interface MobileBottomNavProps {
  pathname: string;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

export function MobileBottomNav({ pathname, isSearchOpen, setIsSearchOpen }: MobileBottomNavProps) {
  const items = useCartStore((state) => state.items);
  const toggleCart = useCartStore((state) => state.toggleCart);
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <nav 
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-[60]",
        "bg-background/80 supports-[backdrop-filter]:bg-background/60 backdrop-blur-2xl border-t border-border/50",
        "pb-[env(safe-area-inset-bottom)]", 
        "shadow-[0_-5px_20px_rgba(0,0,0,0.05)]",
        isSearchOpen && "pointer-events-none opacity-50" 
      )}
    >
      <div className="flex justify-around items-center h-16 px-1">
        
        {/* SEARCH TRIGGER */}
        <button 
           onClick={() => {
             setIsSearchOpen(true);
             window.scrollTo({ top: 0, behavior: 'smooth' });
           }}
           className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground active:scale-95 transition-all"
         >
            <Search size={20} strokeWidth={2.5} />
            <span className="text-[9px] font-bold uppercase tracking-widest mt-1.5">Search</span>
        </button>

        {/* LINKS */}
        {NAV_LINKS.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href && !isSearchOpen;
          return (
            <Link 
              key={link.href} 
              href={link.href}
              onClick={() => setIsSearchOpen(false)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1.5 active:scale-95 transition-all",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                {isActive && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-foreground rounded-full animate-in fade-in zoom-in" />
                )}
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn("text-[9px] font-bold uppercase tracking-widest", isActive ? "opacity-100" : "opacity-70")}>
                {link.label}
              </span>
            </Link>
          )
        })}
        
        {/* CART TRIGGER */}
        <button 
           onClick={() => {
             setIsSearchOpen(false);
             toggleCart();
           }}
           className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-foreground active:scale-95 transition-all border-l border-border/20"
         >
            <div className="relative">
              <ShoppingBag size={20} strokeWidth={2.5} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[9px] font-bold text-background shadow-sm animate-in zoom-in">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest mt-1.5">Cart</span>
         </button>
      </div>
    </nav>
  );
}