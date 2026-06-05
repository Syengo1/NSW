'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export function FloatingWhatsApp() {
  const pathname = usePathname();

  // 1. THE GATEKEEPER: Instantly hide on Admin and Login routes
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/login')) {
    return null;
  }

  // 2. CONFIGURATION
  const whatsappNumber = "254700000000"; 
  const defaultMessage = "Hi OP Fits, I have an inquiry about a drop.";
  const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <div className="fixed bottom-8 right-6 z-50 flex items-center justify-end animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-both">
      <Link
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center transition-transform duration-300 hover:scale-110 active:scale-95"
        aria-label="Chat with us on WhatsApp"
      >
        
        {/* PREMIUM TOOLTIP */}
        <span className="absolute right-full mr-4 hidden md:flex whitespace-nowrap bg-foreground text-background text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-md shadow-xl opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none">
          Chat with us
          <span className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-foreground" />
        </span>

        {/* NOTIFICATION DOT (Slightly smaller to match the new button size) */}
        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 z-20">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>

        {/* THE BUTTON CONTAINER (Transparent, Smaller, with Drop Shadow) */}
        <div className="w-8 h-8 md:w-8 md:h-8 flex items-center justify-center relative drop-shadow-xl">
          
          {/* LIGHT MODE ICON (Padding removed) */}
          <Image 
            src="/whatsapp-light.svg" 
            alt="WhatsApp" 
            fill 
            className="object-contain dark:hidden" 
          />

          {/* DARK MODE ICON (Padding removed) */}
          <Image 
            src="/whatsapp-dark.svg" 
            alt="WhatsApp" 
            fill 
            className="object-contain hidden dark:block" 
          />

        </div>
      </Link>
    </div>
  );
}