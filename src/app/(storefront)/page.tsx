import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="relative h-screen w-full overflow-hidden flex items-center justify-center bg-background text-foreground">
      
      {/* 1. BACKGROUND LAYERS */}
      <div className="absolute inset-0 z-0">
        {/* Subtle Grid Pattern for structure */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        
        {/* Vignette for focus */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
      </div>

      {/* 2. MAIN CONTENT */}
      <div className="relative z-10 text-center space-y-8 px-4 max-w-7xl mx-auto">
        
        {/* Brand Tagline */}
        <div className="flex items-center justify-center gap-2 animate-fade-in opacity-0" style={{ animationDelay: "0.2s" }}>
          <Sparkles className="w-4 h-4 text-accent" />
          <p className="text-xs md:text-sm font-medium tracking-[0.4em] text-muted-foreground uppercase">
            Nairobi Streetwear • Est. 2026
          </p>
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
        
        {/* Massive Headline */}
        <h1 className="text-7xl md:text-[10rem] font-black tracking-tighter leading-[0.8] uppercase mix-blend-difference animate-slide-up opacity-0" style={{ animationDelay: "0.4s" }}>
          Concrete <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-neutral-600">
            Jungle
          </span>
        </h1>
        
        {/* Call to Actions */}
        <div className="pt-8 flex flex-col md:flex-row gap-6 justify-center items-center animate-fade-in opacity-0" style={{ animationDelay: "0.8s" }}>
          
          <Link 
            href="/shop" 
            className="group relative px-10 py-5 bg-foreground text-background font-bold uppercase tracking-widest hover:bg-neutral-200 transition-all"
          >
            <span className="relative z-10 flex items-center gap-2">
              Shop The Drop <ArrowRight size={16} />
            </span>
            {/* Brutalist Shadow Effect */}
            <div className="absolute inset-0 border border-foreground translate-x-1 translate-y-1 group-hover:translate-x-2 group-hover:translate-y-2 transition-transform border-white mix-blend-difference pointer-events-none" />
          </Link>
          
          <Link 
            href="/collections" 
            className="px-10 py-5 text-foreground border border-border font-bold uppercase tracking-widest hover:bg-white/5 hover:border-white/40 transition-all"
          >
            View Lookbook
          </Link>
        </div>

      </div>

      {/* 3. FLOATING TICKER (Marquee) */}
      <div className="absolute bottom-0 w-full bg-background/80 backdrop-blur-sm border-t border-white/10 py-4 overflow-hidden whitespace-nowrap z-20">
        <div className="animate-marquee inline-block text-xs md:text-sm font-mono text-muted-foreground">
          <span className="mx-4">• NEW COLLECTION DROPPING FRIDAY</span>
          <span className="mx-4">• FREE SHIPPING NAIROBI WIDE</span>
          <span className="mx-4">• LIMITED STOCK AVAILABLE</span>
          <span className="mx-4 text-accent">• EXCLUSIVE DROPS</span>
          <span className="mx-4">• NEW COLLECTION DROPPING FRIDAY</span>
          <span className="mx-4">• FREE SHIPPING NAIROBI WIDE</span>
          <span className="mx-4">• LIMITED STOCK AVAILABLE</span>
        </div>
      </div>
    </div>
  );
}