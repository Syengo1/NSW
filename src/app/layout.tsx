// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google"; //[cite: 7]
import "./globals.css"; //[cite: 7]
import { ThemeProvider } from "@/components/theme-provider"; //[cite: 7]
import { Suspense } from "react";
import { PostHogProvider, PostHogPageview } from "@/components/providers/PostHogProvider";
import { Toaster } from "sonner";

// --- FONTS ---
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter", //[cite: 7]
  display: "swap", //[cite: 7]
});

const oswald = Oswald({ 
  subsets: ["latin"],
  variable: "--font-oswald", //[cite: 7]
  display: "swap", //[cite: 7]
});

// --- METADATA ---
export const metadata: Metadata = {
  title: {
    default: "OP Fits | Redefining The Culture", //[cite: 7]
    template: "%s | OP Fits" //[cite: 7]
  },
  description: "Premium streetwear crafted for the bold. Est. 2026 in Nairobi. Limited drops, exclusive fabrics, and authentic culture.", //[cite: 7]
  keywords: ["Streetwear", "Nairobi", "Kenya", "Fashion", "Drops", "Hoodies", "Urban Culture"], //[cite: 7]
  authors: [{ name: "OP Fits" }], //[cite: 7]
  openGraph: {
    type: "website", //[cite: 7]
    locale: "en_KE", //[cite: 7]
    siteName: "OP Fits", //[cite: 7]
    title: "OP Fits", //[cite: 7]
    description: "Premium streetwear crafted for the bold.", //[cite: 7]
  },
  icons: {
    icon: "/favicon.ico", //[cite: 7]
  },
};

// --- VIEWPORT ---
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" }, //[cite: 7]
    { media: "(prefers-color-scheme: dark)", color: "#09090b" }, //[cite: 7]
  ],
  width: "device-width", //[cite: 7]
  initialScale: 1, //[cite: 7]
  maximumScale: 1, //[cite: 7]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`
          ${inter.variable} 
          ${oswald.variable} 
          font-sans 
          antialiased 
          bg-background 
          text-foreground
          min-h-screen
          flex
          flex-col
        `}
      >
        {/* 1. TELEMETRY: Route Tracking */}
        <Suspense fallback={null}>
          <PostHogPageview />
        </Suspense>

        {/* 2. TELEMETRY: Global Provider */}
        <PostHogProvider>
          <ThemeProvider
            attribute="class" //[cite: 7]
            defaultTheme="system" //[cite: 7]
            enableSystem //[cite: 7]
            disableTransitionOnChange //[cite: 7]
          >
            {/* The main application content expands to fill available space */}
            <main className="flex-1 flex flex-col">
              {children}
            </main>
            
            {/* 3. GLOBAL UI: Toast Notifications configured for a premium aesthetic */}
            <Toaster 
              position="top-center" 
              richColors 
              toastOptions={{
                className: 'rounded-md shadow-lg border-border',
              }}
            />
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}