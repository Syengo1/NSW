'use client'

import { Home, Search, ShoppingBag, User } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeToggle'

export function StorefrontNav() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/cart', label: 'Cart', icon: ShoppingBag },
    { href: '/profile', label: 'Account', icon: User },
  ]

  return (
    <>
      {/* GLOBAL TOP HEADER (Visible on ALL screens now) */}
      <header className="fixed top-0 w-full z-50 border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link href="/" className="font-black text-xl tracking-tighter">
            NAIROBI <span className="text-muted-foreground">SW</span>
          </Link>
          
          {/* Desktop Navigation (Hidden on mobile) */}
          <nav className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === link.href ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions Area (Toggle + Cart Count, etc) */}
          <div className="flex items-center gap-2">
             <ThemeToggle />
             {/* You can add a mini-cart icon here for Desktop if needed */}
          </div>
        </div>
      </header>

      {/* MOBILE BOTTOM NAV (Hidden on desktop) */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 bg-background border-t pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around items-center h-16">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            return (
              <Link 
                key={link.href} 
                href={link.href}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{link.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}