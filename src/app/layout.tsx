// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Suspense } from "react";
import { PostHogProvider, PostHogPageview } from "@/components/providers/PostHogProvider";
import { Toaster } from "sonner";

// --- FONTS ---
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const oswald = Oswald({ 
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
});

// --- METADATA ---
export const metadata: Metadata = {
  title: {
    default: "OP Fits | Secure The Fit",
    template: "%s | OP Fits"
  },
  description: "Nairobi's premier plug for exclusive streetwear, hyped sneakers, and premium apparel. Hand-picked fits, 100% authentic, delivered fast.",
  keywords: ["Streetwear", "Nairobi", "Kenya", "Fashion", "Drops", "Hoodies", "Urban Culture", "Nike", "Adidas", "Supreme", "Off-White", "New Balance", "Puma", "Reebok", "Limited Edition", "Exclusive", "High-Quality", "Deliver", "Delivery"],
  authors: [{ name: "OP Fits" }],
  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: "OP Fits",
    title: "OP Fits",
    description: "Nairobi's premier plug for exclusive streetwear, hyped sneakers, and premium apparel. Hand-picked fits, 100% authentic, delivered fast.",
  },
  icons: {
    icon: "/icon.svg",
  },
};

// --- VIEWPORT ---
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 🚨 UX FIX: scroll-smooth enables premium, native-feeling anchor link navigation
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        {/* 🚨 PERFORMANCE FIX: Preconnect to external media servers to completely eliminate DNS and TLS handshake delays for LCP images */}
        <link rel="preconnect" href="https://wqrtjgfrjuadksaotbxj.supabase.co" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://ewxf0eupwexd82yb.public.blob.vercel-storage.com" crossOrigin="anonymous" />
        
        {/* CRITICAL FIX: Preconnect for the 3D Hero Framer assets */}
        <link rel="preconnect" href="https://framerusercontent.com" crossOrigin="anonymous" />
      </head>
      
      <body 
        className={`
          ${inter.variable} 
          ${oswald.variable} 
          font-sans 
          antialiased 
          bg-background 
          text-foreground
          min-h-[100dvh] /* 🚨 UX FIX: 100dvh prevents ugly layout shifts when the mobile URL bar collapses */
          flex
          flex-col
          selection:bg-foreground 
          selection:text-background /* 🚨 UI POLISH: Replaces the default blue text-highlight with your premium brand colors */
        `}
      >
        {/* 1. TELEMETRY: Global Provider strictly wraps all logic */}
        <PostHogProvider>
          
          {/* 2. TELEMETRY: Route Tracking securely placed inside the Provider context */}
          <Suspense fallback={null}>
            <PostHogPageview />
          </Suspense>

          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {/* The main application content expands to fill available space */}
            <main className="flex-1 flex flex-col relative">
              {children}
            </main>
            
            {/* 3. GLOBAL UI: Toast Notifications configured for a premium aesthetic */}
            <Toaster 
              position="top-center" 
              richColors 
              closeButton // 🚨 UX FIX: Allows users to dismiss toasts manually
              theme="system" // 🚨 UI FIX: Syncs toast colors directly with your dark/light mode switches
              toastOptions={{
                className: 'rounded-xl shadow-2xl border-border font-sans tracking-wide',
              }}
            />
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}