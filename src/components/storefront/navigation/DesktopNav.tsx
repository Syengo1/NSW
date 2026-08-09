'use client';

import Link from 'next/link';
import { Search, X, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCartStore } from '@/lib/store/cart';
import { NAV_LINKS } from './config';

interface DesktopNavProps {
  pathname: string;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

export function DesktopNav({ pathname, isSearchOpen, setIsSearchOpen }: DesktopNavProps) {
  const items = useCartStore((state) => state.items);
  const toggleCart = useCartStore((state) => state.toggleCart);
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="container mx-auto px-6 h-full flex items-center justify-between">
      
      {/* LOGO */}
      <Link 
        href="/" 
        onClick={() => setIsSearchOpen(false)}
        className="font-black text-xl md:text-2xl tracking-tighter transition-colors duration-500 relative z-20 flex items-center gap-1"
      >
        <span className="text-muted-foreground">OP</span>
        <span className="text-foreground">FITS</span>
      </Link>
      
      {/* DESKTOP LINKS */}
      <nav className={cn(
        "hidden md:flex items-center gap-8 transition-opacity duration-300",
        isSearchOpen ? "opacity-0 pointer-events-none" : "opacity-100"
      )}>
        {NAV_LINKS.map((link) => (
          <Link 
            key={link.href} 
            href={link.href}
            className={cn(
              "text-xs md:text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105",
              pathname === link.href 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* ACTIONS HUB */}
      <div className="flex items-center gap-2 md:gap-4 relative z-20">
         <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="hidden md:flex relative p-2 rounded-full transition-all hover:scale-110 active:scale-95 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            aria-label="Search Catalog"
         >
            {isSearchOpen ? <X size={20} /> : <Search size={20} />}
         </button>

         <ThemeToggle className="text-muted-foreground hover:text-foreground hover:bg-secondary/50" />
         
         <button 
            onClick={toggleCart}
            className="hidden md:flex relative p-2 rounded-full transition-all hover:scale-110 active:scale-95 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
         >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[9px] font-bold text-background animate-in zoom-in">
                {cartCount}
              </span>
            )}
         </button>
      </div>
    </div>
  );
}