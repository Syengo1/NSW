import Link from 'next/link';
import { Compass, ArrowLeft, Sparkles } from 'lucide-react';
//import { cn } from '@/lib/utils';

export const metadata = {
  title: "Explore | Coming Soon",
  description: "Curated lookbooks, community stories, and the culture behind OP Fits.",
};

export default function ExplorePlaceholderPage() {
  return (
    <div className="relative min-h-[85dvh] w-full flex flex-col items-center justify-center overflow-hidden bg-black text-white selection:bg-white selection:text-black">
      
      {/* --- BACKGROUND LAYER --- */}
      {/* 1. Slow Breathing Gradient */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(50,50,50,1),_rgba(0,0,0,1))] animate-pulse duration-[8000ms]" />
      </div>

      {/* 2. The 200-byte Procedural Noise Overlay */}
      <div 
         className="absolute inset-0 opacity-30 pointer-events-none z-10 mix-blend-overlay" 
         style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
      />

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-20 flex flex-col items-center text-center px-6 max-w-2xl mx-auto">
        
        {/* Floating Icon */}
        <div className="mb-8 relative flex items-center justify-center animate-in fade-in zoom-in duration-1000">
           <div className="absolute inset-0 bg-white/10 blur-2xl rounded-full animate-pulse duration-3000" />
           <div className="h-20 w-20 border border-white/20 bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl relative">
             <Compass size={32} strokeWidth={1} className="text-white/80 animate-[spin_20s_linear_infinite]" />
             <Sparkles size={14} className="absolute top-4 right-4 text-white/40" />
           </div>
        </div>

        {/* Typography */}
        <h1 className="text-xs md:text-sm font-bold uppercase tracking-[0.4em] text-white/50 mb-4 animate-in slide-in-from-bottom-5 duration-1000 delay-150">
          Editorial & Culture
        </h1>
        
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-tight mb-6 animate-in slide-in-from-bottom-8 duration-1000 delay-300">
          Exploring <br /> The Vision.
        </h2>
        
        <p className="text-sm text-white/60 leading-relaxed mb-10 max-w-md animate-in fade-in duration-1000 delay-500">
          We are currently curating lookbooks, community stories, and the creative blueprint behind our collections. The culture is loading.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-700">
          <Link 
            href="/shop"
            className="group flex items-center gap-2 bg-white text-black px-8 py-4 text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Shop
          </Link>
          
          <button 
            disabled
            className="px-8 py-4 text-xs font-bold uppercase tracking-widest text-white/40 border border-white/10 cursor-not-allowed bg-white/5 backdrop-blur-sm"
          >
            Coming Soon
          </button>
        </div>

      </div>
    </div>
  );
}