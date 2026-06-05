import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { AdminMobileMenu } from "@/components/admin/AdminMobileMenu";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Command Center",
  robots: {
    index: false,
    follow: false,
    nocache: true, // Prevents Google from keeping a cached version of the page N/B check refresh works
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Security Check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      {/* 1. DESKTOP SIDEBAR (Fixed & Hidden on Mobile) */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* 2. MAIN CONTENT WRAPPER */}
      <div className="flex flex-col min-h-screen lg:pl-72 transition-all duration-300">
        
        {/* MOBILE HEADER (Visible only on mobile/tablet) */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b bg-background/95 backdrop-blur px-4 shadow-sm lg:hidden">
          <AdminMobileMenu /> {/* Contains the Hamburger Trigger & Drawer */}
          <span className="font-bold text-lg">Dashboard</span>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-8 pt-6">
           <div className="max-w-7xl mx-auto space-y-4">
             {children}
           </div>
        </main>
      </div>
    </div>
  );
}