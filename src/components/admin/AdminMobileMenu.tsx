'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom' // <--- Key Import
import { Menu, X, LogOut, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ADMIN_LINKS } from '@/config/admin-dashboard' 
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle' 

export function AdminMobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false) // To ensure client-side rendering
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Lock body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // The content of the drawer (Moved to a variable for clarity)
  const menuContent = (
    <div className="fixed inset-0 z-[9999] flex md:hidden">
      
      {/* 1. The Backdrop (Darker for better contrast) */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* 2. The Menu Panel */}
      <div className="relative flex-1 max-w-[85vw] w-full bg-background border-r-2 border-primary/20 p-6 shadow-2xl animate-in slide-in-from-left duration-300 ease-out flex flex-col h-full">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
            <span className="font-black text-2xl tracking-tighter uppercase select-none">
            Nairobi <span className="text-muted-foreground">SW</span>
          </span>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 text-muted-foreground hover:text-foreground bg-muted/50 rounded-full transition-all active:scale-95"
          >
            <X size={20} />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto space-y-2">
          {ADMIN_LINKS.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-4 px-4 py-4 text-sm font-bold uppercase tracking-wider transition-all rounded-xl",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon size={20} />
                {link.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="pt-6 mt-4 border-t border-border space-y-6">
          <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">Theme</span>
              <ThemeToggle />
          </div>

          <div className="space-y-3">
            <Link 
              href="/" 
              target="_blank"
              className="flex items-center gap-3 px-2 text-xs text-muted-foreground hover:text-foreground font-medium uppercase tracking-wider"
            >
              <ExternalLink size={14} /> View Live Site
            </Link>
            
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-3 px-2 text-xs text-red-500 hover:text-red-400 font-bold uppercase tracking-wider w-full text-left"
            >
              <LogOut size={14} /> Terminate Session
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* The Trigger Button (Stays in the Header) */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Open Admin Menu"
      >
        <Menu size={24} />
      </button>

      {/* The Menu Drawer (Teleported to Body) */}
      {mounted && isOpen && createPortal(menuContent, document.body)}
    </>
  )
}