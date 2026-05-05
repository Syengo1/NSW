'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
// FIX 1: Swapped 'Search' for 'Compass' (Explore Icon)
import { Home, Compass, ShoppingBag, Shirt } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCartStore } from '@/lib/store/cart';

// --- CONFIGURATION ---
const NAV_LINKS = [
  // FIX 2: Updated the link to point to your new Explore/Lookbook page
  { href: '/explore', label: 'Explore', icon: Compass }, 
  { href: '/', label: 'Home', icon: Home },
  { href: '/shop', label: 'Shop', icon: Shirt },
];

export function StorefrontNav() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Store Connection
  const items = useCartStore((state) => state.items);
  const toggleCart = useCartStore((state) => state.toggleCart);
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Logic: Transparent ONLY on Homepage AND at the very top
  const isTransparent = pathname === '/' && !isScrolled;

  // FIX 3: Separated the Hydration state into its own isolated effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // FIX 4: Dedicated effect for scroll physics
  useEffect(() => {
    const handleScroll = () => {
      // Threshold 10px to switch immediately when user starts scrolling
      setIsScrolled(window.scrollY > 10);
    };

    // Run once on mount to check initial position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* ========================================
        DESKTOP HEADER (Fixed Top)
        ======================================== 
      */}
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-[50] transition-all duration-300 ease-in-out",
          // Height: Taller on transparent hero (premium feel), compact when scrolled
          isScrolled ? "h-16" : "h-20",
          
          // Style: Glass when scrolled, Invisible when at top
          isTransparent 
            ? "bg-transparent border-transparent" 
            : "bg-background/80 backdrop-blur-md border-b border-border shadow-sm"
        )}
      >
        <div className="container mx-auto px-6 h-full flex items-center justify-between">
          
          {/* LOGO */}
          <Link 
            href="/" 
            className={cn(
              "font-black text-xl tracking-tighter transition-colors duration-500",
              isTransparent ? "text-white drop-shadow-md" : "text-foreground"
            )}
          >
            <span className={cn("transition-colors", isTransparent ? "text-white/70" : "text-muted-foreground")}>OP</span>FITS
          </Link>
          
          {/* DESKTOP LINKS */}
          <nav className="hidden md:flex items-center gap-8">
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

          {/* ACTIONS (Theme + Cart) */}
          <div className="flex items-center gap-4">
             <ThemeToggle />
             
             <button 
                onClick={toggleCart}
                className={cn(
                  "hidden md:flex relative p-2 rounded-full transition-all hover:scale-110 active:scale-95",
                  isTransparent ? "text-white hover:bg-white/10" : "text-foreground hover:bg-secondary"
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
      </header>

      {/* ========================================
        MOBILE BOTTOM NAV (Fixed Bottom)
        ======================================== 
      */}
      <nav 
        className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 z-[50]",
          "bg-background/95 backdrop-blur-xl border-t border-border",
          "pb-[env(safe-area-inset-bottom)]", // iOS Home Bar
          "shadow-[0_-5px_10px_rgba(0,0,0,0.05)]"
        )}
      >
        <div className="flex justify-around items-center h-16 px-2">
          {NAV_LINKS.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-90 transition-transform",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  {isActive && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full animate-in fade-in zoom-in" />
                  )}
                  <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn("text-[10px] font-bold uppercase tracking-widest", isActive ? "opacity-100" : "opacity-60")}>
                  {link.label}
                </span>
              </Link>
            )
          })}
          
          <button 
             onClick={toggleCart}
             className="flex flex-col items-center justify-center w-full h-full text-muted-foreground active:scale-90 transition-transform border-l border-border/10 ml-1"
           >
              <div className="relative">
                <ShoppingBag size={24} strokeWidth={2} />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-background animate-in zoom-in">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-1">Cart</span>
           </button>
        </div>
      </nav>
    </>
  )
}