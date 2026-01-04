import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google"; // 1. Import Oswald
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

// 2. Configure Fonts with CSS Variables
// This injects the font data into the CSS variables your globals.css expects
const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const oswald = Oswald({ 
  subsets: ["latin"],
  variable: "--font-oswald", // Matches the var(--font-oswald) in your CSS
  display: "swap",
});

// 3. World Class Metadata Configuration
export const metadata: Metadata = {
  title: {
    default: "Nairobi Streetwear | Redefining The Culture",
    template: "%s | Nairobi Streetwear"
  },
  description: "Premium streetwear crafted for the bold. Est. 2026 in Nairobi. Limited drops, exclusive fabrics, and authentic culture.",
  keywords: ["Streetwear", "Nairobi", "Kenya", "Fashion", "Drops", "Hoodies", "Urban Culture"],
  authors: [{ name: "Nairobi Streetwear" }],
  openGraph: {
    type: "website",
    locale: "en_KE",
    siteName: "Nairobi Streetwear",
    title: "Nairobi Streetwear",
    description: "Premium streetwear crafted for the bold.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

// 4. Mobile Viewport & Theme Colors
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" }, // Zinc-950
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Prevents auto-zoom on inputs for a "native app" feel
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
        `}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}