'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client'; 
import { cn } from '@/lib/utils';
import { ADMIN_LINKS } from '@/config/admin-dashboard';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="w-72 bg-card border-r border-border flex flex-col h-screen fixed left-0 top-0 z-50">
      
      {/* BRAND */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <span className="font-black text-xl tracking-tighter uppercase">
          Nairobi <span className="text-muted-foreground">SW</span>
        </span>
      </div>

      {/* NAV */}
      <nav className="flex-1 p-4 space-y-1">
        {ADMIN_LINKS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-md transition-all",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon size={18} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="p-4 border-t border-border space-y-4">
        <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Theme</span>
            <ThemeToggle />
        </div>

        <Link 
          href="/" 
          target="_blank"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink size={14} /> View Live Site
        </Link>
        
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-2 text-xs text-destructive hover:text-destructive/80 transition-colors font-medium w-full text-left"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  );
}