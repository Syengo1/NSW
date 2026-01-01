import CartDrawer from "@/components/storefront/CartDrawer";
import { StorefrontNav } from "@/components/storefront/StorefrontNav";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative flex flex-col">
      {/* 1. Unified Navigation 
        Contains both the Desktop Header and Mobile Bottom Bar.
      */}
      <StorefrontNav />

      {/* 2. Main Content Wrapper
        We use conditional padding to ensure content is never hidden behind the navbars.
        
        - md:pt-16: On DESKTOP, push content down 64px (h-16) to clear the Fixed Top Navbar.
        - pb-16:    On MOBILE, push content up 64px (h-16) to clear the Sticky Bottom Navbar.
        - md:pb-0:  On DESKTOP, remove the bottom padding since the nav is at the top.
      */}
      <main className="flex-1 w-full md:pt-16 pb-16 md:pb-0">
        {children}
      </main>

      {/* 3. Global Overlays
        Placed at the end to ensure it renders on top of everything else (z-index wise).
      */}
      <CartDrawer />
    </div>
  );
}