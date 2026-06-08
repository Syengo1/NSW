import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { AdminMobileMenu } from "@/components/admin/AdminMobileMenu";
import type { Metadata } from "next";
import RealtimeOrderAlerts from '@/components/admin/RealtimeOrderAlerts';

export const metadata: Metadata = {
  title: "Command Center",
  robots: {
    index: false,
    follow: false,
    nocache: true, 
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

  // 1. Base Security Check: Is the user logged in at all?
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect("/login");
  }

  // 🚨 2. PRIVILEGE ESCALATION GUARD: Is this user an Admin?
  // Option A: If you assign roles in Supabase auth metadata:
  const isAdmin = user.app_metadata?.role === 'admin';
  

  if (!isAdmin) {
    // Eject standard customers back to the storefront without tipping them off
    redirect("/"); 
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* THE INVISIBLE LISTENER: Triggers real-time M-Pesa toasts & sounds */}
      <RealtimeOrderAlerts /> 
      
      {/* 1. DESKTOP SIDEBAR (Fixed & Hidden on Mobile) */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      {/* 2. MAIN CONTENT WRAPPER */}
      <div className="flex flex-col min-h-screen lg:pl-72 transition-all duration-300">
        
        {/* MOBILE HEADER (Visible only on mobile/tablet) */}
        <header className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b bg-background/95 backdrop-blur px-4 shadow-sm lg:hidden">
          <AdminMobileMenu /> 
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