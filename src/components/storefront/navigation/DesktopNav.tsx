'use client';

import Link from 'next/link';
import { Search, X, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCartStore } from '@/lib/store/cart';
import { NAV_LINKS } from './config';

interface DesktopNavProps {
  pathname: string;
  isTransparent: boolean;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

export function DesktopNav({ pathname, isTransparent, isSearchOpen, setIsSearchOpen }: DesktopNavProps) {
  const items = useCartStore((state) => state.items);
  const toggleCart = useCartStore((state) => state.toggleCart);
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="container mx-auto px-6 h-full flex items-center justify-between">
      
      {/* LOGO */}
      <Link 
        href="/" 
        onClick={() => setIsSearchOpen(false)}
        className={cn(
          "font-black text-xl tracking-tighter transition-colors duration-500 relative z-20",
          isTransparent ? "text-white drop-shadow-md" : "text-foreground"
        )}
      >
        <span className={cn("transition-colors", isTransparent ? "text-white/70" : "text-muted-foreground")}>OP</span>
        <span className="text-2xl">FITS</span>
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
              "text-sm font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105",
              pathname === link.href 
                ? (isTransparent ? "text-white" : "text-foreground") 
                : (isTransparent ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground")
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      {/* ACTIONS HUB */}
      <div className="flex items-center gap-4 relative z-20">
         <button 
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={cn(
              "hidden md:flex relative p-2 rounded-full transition-all hover:scale-110 active:scale-95",
              isTransparent && !isSearchOpen ? "text-white hover:bg-white/10" : "text-foreground hover:bg-secondary"
            )}
            aria-label="Search Catalog"
         >
            {isSearchOpen ? <X size={20} /> : <Search size={20} />}
         </button>

         <ThemeToggle 
            className={isTransparent && !isSearchOpen ? "text-white hover:bg-white/10" : "text-foreground hover:bg-secondary"} 
            />
         
         <button 
            onClick={toggleCart}
            className={cn(
              "hidden md:flex relative p-2 rounded-full transition-all hover:scale-110 active:scale-95",
              isTransparent && !isSearchOpen ? "text-white hover:bg-white/10" : "text-foreground hover:bg-secondary"
            )}
         >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white animate-in zoom-in">
                {cartCount}
              </span>
            )}
         </button>
      </div>
    </div>
  );
}