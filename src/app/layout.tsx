import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Inter, Oswald, Roboto_Mono } from "next/font/google";
import { Suspense } from "react";

import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import {
  PostHogProvider,
  PostHogPageview,
} from "@/components/providers/PostHogProvider";
import { ResourceHints } from "@/components/providers/ResourceHints";
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

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
});

// --- SITE METADATA ---
const siteDescription =
  "Find your next favourite fit at OP Fits. Shop curated streetwear, standout sneakers, and everyday essentials, with delivery options in Nairobi and across Kenya.";

export const metadata: Metadata = {
  // Assumes https://www.opfits.com is your canonical production domain.
  metadataBase: new URL("https://www.opfits.com"),

  applicationName: "OP Fits",

  title: {
    default: "OP Fits | Streetwear & Sneakers in Kenya",
    template: "%s | OP Fits",
  },

  description: siteDescription,

  keywords: [
    "OP Fits",
    "streetwear Kenya",
    "streetwear Nairobi",
    "sneakers Kenya",
    "sneakers Nairobi",
    "urban fashion Kenya",
    "hoodies Kenya",
    "casual wear Kenya",
  ],

  authors: [{ name: "OP Fits" }],
  creator: "OP Fits",
  publisher: "OP Fits",

  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: "OP Fits",
    title: "OP Fits | Secure The Fit",
    description: siteDescription,
    // Next.js automatically injects src/app/opengraph-image.jpg here
  },

  twitter: {
    card: "summary_large_image", // 🚨 UPGRADE: Forces a full-width banner preview instead of a small square
    title: "OP Fits | Secure The Fit",
    description: siteDescription,
    // Next.js automatically injects src/app/opengraph-image.jpg here
  },

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-icon.png",
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
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="scroll-smooth"
    >
      <body
        className={[
          inter.variable,
          oswald.variable,
          robotoMono.variable,
          "font-sans",
          "antialiased",
          "bg-background",
          "text-foreground",
          "min-h-[100dvh]",
          "flex",
          "flex-col",
          "selection:bg-foreground",
          "selection:text-background",
        ].join(" ")}
      >
        {/* External resource connection hints */}
        <ResourceHints />

        {/* Analytics provider */}
        <PostHogProvider>
          <Suspense fallback={null}>
            <PostHogPageview />
          </Suspense>

          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <main className="relative flex flex-1 flex-col">
              {children}
            </main>

            <Toaster
              position="top-center"
              richColors
              closeButton
              theme="system"
              toastOptions={{
                className:
                  "rounded-xl shadow-2xl border-border font-sans tracking-wide",
              }}
            />
          </ThemeProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}