'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

// --- CHILD COMPONENTS ---
import { DesktopNav } from './navigation/DesktopNav';
import { SearchOverlay } from './navigation/SearchOverlay';
import { MobileBottomNav } from './navigation/MobileBottomNav';

export function StorefrontNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const isTransparent = pathname === '/' && !isScrolled && !isSearchOpen;

  // 🚨 ESLINT FIX: Push mounting state to the end of the execution queue
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // High-performance scroll monitoring
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent background scrolling when the command overlay is open
  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isSearchOpen]);

  // Prevent rendering UI until client-side hydration is confirmed
  if (!mounted) return null;

  return (
    <>
      <header 
        className={cn(
          "fixed top-0 left-0 right-0 z-[60] transition-all duration-500 ease-in-out",
          isScrolled ? "h-16" : "h-20",
          isTransparent 
            ? "bg-transparent border-transparent" 
            : "bg-background/80 backdrop-blur-xl border-b border-border shadow-sm",
          isSearchOpen && "bg-background border-border" 
        )}
      >
        <DesktopNav 
          pathname={pathname} 
          isTransparent={isTransparent} 
          isSearchOpen={isSearchOpen} 
          setIsSearchOpen={setIsSearchOpen} 
        />
        <SearchOverlay 
          isSearchOpen={isSearchOpen} 
          setIsSearchOpen={setIsSearchOpen} 
        />
      </header>

      {/* OVERLAY BACKDROP */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 z-[40] bg-black/40 backdrop-blur-sm animate-in fade-in" 
          onClick={() => setIsSearchOpen(false)}
        />
      )}

      <MobileBottomNav 
        pathname={pathname} 
        isSearchOpen={isSearchOpen} 
        setIsSearchOpen={setIsSearchOpen} 
      />
    </>
  );
}