// src/app/(storefront)/layout.tsx
'use client';

import { usePathname } from 'next/navigation';
import CartDrawer from "@/components/storefront/CartDrawer";
import { StorefrontNav } from "@/components/storefront/StorefrontNav";
import { cn } from "@/lib/utils";

// --- GLOBAL PROVIDERS & UI ---
import { WalletProvider } from "@/components/providers/WalletProvider";
import ScrollProgress from "@/components/ui/ScrollProgress";
import { Toaster } from "sonner"; 

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    /* 1. STATE ORCHESTRATION: Wrap the storefront in the Wallet Context */
    <WalletProvider>
      <div className="min-h-screen relative flex flex-col bg-background selection:bg-foreground selection:text-background">
        
        {/* 2. ENHANCED UI: The Desktop Laser Scrollbar */}
        <ScrollProgress />
        
        {/* 3. NAVIGATION (Fixed on top of everything) */}
        <StorefrontNav />

        {/* 4. MAIN CONTENT AREA 
            - Mobile: Always add 'pb-20' to clear the fixed Bottom Nav.
            - Desktop: If Home -> 'pt-0' (Hero slides BEHIND navbar).
            - Desktop: If Other -> 'pt-16' or 'pt-20' (Content pushed BELOW navbar).
            - Added 'flex flex-col' to ensure inner pages can stretch full height if needed.
        */}
        <main 
          className={cn(
            "flex-1 w-full flex flex-col transition-[padding] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
            "pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0", 
            isHomePage ? "pt-0" : "pt-20 md:pt-24" 
          )}
        >
          {children}
        </main>

        {/* 5. OVERLAYS: Cart & Notifications */}
        <CartDrawer />
        
        {/* TOASTER: Essential for the checkout errors/success messages to render globally */}
        <Toaster 
          richColors 
          position="top-center" 
          toastOptions={{
            style: { textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', fontWeight: 'bold' }
          }} 
        />
      </div>
    </WalletProvider>
  );
}