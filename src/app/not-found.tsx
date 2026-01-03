'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MoveLeft, Home, Terminal, Ghost, Construction } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- CONFIG: INTELLIGENT EXCUSES ---
const EXCUSES = [
  "Our developer went for chai and forgot to code this part.",
  "This page is currently stuck in Nairobi traffic.",
  "404: Drip Not Found. Did you check your wifi?",
  "The page you want is 'Coming Soon' (we hope).",
  "You've ventured too far into the streets. Turn back.",
  "System Error: Too much heat detected in this session.",
  "Looks like this link was stolen. We're investigating.",
];

export default function NotFound() {
  const router = useRouter();
  const [excuse, setExcuse] = useState("");
  const [glitch, setGlitch] = useState(false);

  // 1. SMART LOGIC: Pick a random excuse on mount
  useEffect(() => {
    setExcuse(EXCUSES[Math.floor(Math.random() * EXCUSES.length)]);
    
    // Trigger random "glitch" visual effects
    const interval = setInterval(() => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 200);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black text-white p-4 overflow-hidden relative selection:bg-emerald-500 selection:text-black">
      
      {/* BACKGROUND: MATRIX RAIN / NOISE */}
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] brightness-100 contrast-150 mix-blend-overlay" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-950/90 to-black z-0" />

      {/* CONTENT LAYER */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg space-y-8 animate-in fade-in zoom-in duration-500">
        
        {/* A. THE GLITCH HEADER */}
        <div className="relative">
          <h1 
            className={cn(
              "text-[120px] md:text-[180px] font-black leading-none tracking-tighter select-none transition-all",
              glitch ? "text-emerald-500 translate-x-1" : "text-white"
            )}
          >
            404
          </h1>
          {/* Shadow/Ghost Effect */}
          <h1 className="absolute top-0 left-0 text-[120px] md:text-[180px] font-black leading-none tracking-tighter text-red-600 opacity-50 mix-blend-screen animate-pulse select-none blur-[2px]">
            404
          </h1>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white text-black text-[10px] font-bold uppercase px-2 py-0.5 rotate-[-2deg]">
            System Failure
          </div>
        </div>

        {/* B. THE COMICAL MESSAGE */}
        <div className="space-y-4">
           <div className="flex items-center justify-center gap-2 text-emerald-500 font-mono text-xs uppercase tracking-widest">
             <Terminal size={14} /> <span>Debug_Log_v2.0</span>
           </div>
           
           <h2 className="text-2xl md:text-3xl font-black uppercase italic">
             " {excuse} "
           </h2>
           
           <p className="text-neutral-500 text-sm max-w-xs mx-auto leading-relaxed">
             We looked everywhere.
             This page either doesn't exist or is hiding from you.
           </p>
        </div>

        {/* C. NAVIGATION CONTROLS */}
        <div className="flex flex-col sm:flex-row gap-4 w-full pt-8">
          <button 
            onClick={() => router.back()}
            className="flex-1 group flex items-center justify-center gap-2 px-8 py-4 border border-white/20 rounded-lg hover:bg-white hover:text-black hover:border-white transition-all duration-300"
          >
            <MoveLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-bold uppercase tracking-widest text-xs">Go Back</span>
          </button>

          <Link 
            href="/"
            className="flex-1 group flex items-center justify-center gap-2 px-8 py-4 bg-white text-black rounded-lg hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <Home size={18} />
            <span className="font-bold uppercase tracking-widest text-xs">Return Home</span>
          </Link>
        </div>

        {/* D. EASTER EGG / DEVELOPER TAG */}
        <div className="pt-12 opacity-30 hover:opacity-100 transition-opacity cursor-help" title="It's not a bug, it's a feature.">
           <Ghost size={24} className="animate-bounce" />
        </div>

      </div>
    </div>
  );
}