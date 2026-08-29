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
  // 🚨 FIX: We isolate the physics lock exclusively to the canvas route
  const isExplorePage = pathname === '/explore';

  return (
    <WalletProvider>
      <div 
        className={cn(
          "min-h-screen relative flex flex-col bg-background selection:bg-foreground selection:text-background",
          // The overflow lock is now safely applied ONLY to the explore page
          isExplorePage && "h-[100dvh] overflow-hidden"
        )}
      >
        
        {/* Hide the laser scrollbar on the canvas since it doesn't scroll vertically */}
        {!isExplorePage && <ScrollProgress />}
        
        {/* NAVIGATION */}
        <StorefrontNav />

        {/* MAIN CONTENT AREA */}
        <main 
          className={cn(
            "flex-1 w-full flex flex-col transition-[padding] duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
            // 1. If Canvas: Strip all padding so coordinates map 1:1 to the screen edges
            isExplorePage && "p-0",
            
            // 2. If Normal Page: Restore standard mobile bottom padding
            !isExplorePage && "pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0",
            
            // 3. If Home Page: Hero slides behind navbar (pt-0). Otherwise, push content below nav.
            !isExplorePage && (isHomePage ? "pt-0" : "pt-20 md:pt-24") 
          )}
        >
          {children}
        </main>

        {/* OVERLAYS & TOASTS */}
        <CartDrawer />
        
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