'use client';

import { usePathname } from 'next/navigation';
import CartDrawer from "@/components/storefront/CartDrawer";
import { StorefrontNav } from "@/components/storefront/StorefrontNav";
import { cn } from "@/lib/utils";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <div className="min-h-screen relative flex flex-col bg-background">
      {/* 1. Navigation (Fixed on top of everything) */}
      <StorefrontNav />

      {/* 2. Main Content Area 
          PROFESSIONAL FIX: 
          - Mobile: Always add 'pb-20' to clear the fixed Bottom Nav.
          - Desktop: 
            - If Home: 'pt-0' (Hero slides BEHIND navbar).
            - If Other: 'pt-16' or 'pt-20' (Content pushed BELOW navbar).
      */}
      <main 
        className={cn(
          "flex-1 w-full transition-[padding] duration-300 ease-in-out",
          "pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0", // Mobile bottom clearance
          isHomePage ? "pt-0" : "pt-20 md:pt-24" // Desktop top clearance
        )}
      >
        {children}
      </main>

      {/* 3. Global Cart Drawer */}
      <CartDrawer />
    </div>
  );
}