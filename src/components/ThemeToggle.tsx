"use client"

import { useState, useEffect } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

// Added className prop so parent navigation bars can seamlessly inject their own hover states 
// (e.g., text-white vs text-foreground)
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 🚨 ESLINT FIX: Push the hydration state update to the end of the execution queue 
  // to prevent React 18 cascading renders.
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, [])

  // 🚨 UI FIX: Instead of returning an invisible div, we return a beautiful skeleton 
  // pulse of the exact same size to entirely prevent Cumulative Layout Shift (CLS).
  if (!mounted) {
    return (
      <button
        disabled
        className={cn("relative p-2 rounded-full", className)}
        aria-label="Loading theme toggle"
      >
        <div className="h-5 w-5 animate-pulse rounded-full bg-muted-foreground/20" />
      </button>
    )
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={cn(
        "relative p-2 rounded-full transition-all hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary overflow-hidden",
        className
      )}
      aria-label="Toggle theme"
    >
      {/* 🚨 ANIMATION UPGRADE: The Sun rotates 90 degrees and shrinks to 0 when dark mode activates */}
      <Sun className="h-5 w-5 transition-all duration-500 rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
      
      {/* 🚨 ANIMATION UPGRADE: The Moon starts shrunk and rotated, then spins into place */}
      <Moon className="absolute top-2 left-2 h-5 w-5 transition-all duration-500 rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
      
      <span className="sr-only">Toggle theme</span>
    </button>
  )
}