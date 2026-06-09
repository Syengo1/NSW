"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// 🚨 TS FIX: Explicitly extracts the exact props expected by next-themes
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  )
}