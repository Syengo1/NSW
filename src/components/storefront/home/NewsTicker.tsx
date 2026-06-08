'use client';

import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { X, Terminal, Minimize2, Radio, Activity, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- CONFIGURATION ---
const MESSAGES = [
  "WELCOME TO OP Fits!!!",
  "YOUR TRUSTED ONLINE CLOTHING SHOP...",
  "ALERT :: FREE DELIVERY ON ALL ORDERS ABOVE KES 10,000",
  "NEW DROP :: COMING SOON...",
];

const TYPING_SPEED = 20; // ms per char
const DELETING_SPEED = 10; // ms per char
const PAUSE_TIME = 1200; // time to wait before deleting

// 🚨 SMART ENGINE: Generates a unique hash from the current messages.
const getTickerHash = () => {
  const str = MESSAGES.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `opfits_ticker_v${Math.abs(hash)}`;
};

// Required for hydration-safe mounting without useEffect
const emptySubscribe = () => () => {};

export default function NewsTicker() {
  // 1. Safe Hydration (Replaces useEffect + setMounted)
  // This elegantly eliminates the ESLint "setState in effect" warning
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // 2. Local UI States
  const [isManuallyClosed, setIsManuallyClosed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // 3. Typewriter State
  const [text, setText] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Refs for timing control
  const timer = useRef<NodeJS.Timeout | null>(null);

  // --- 🧠 INTELLIGENT VISIBILITY LOGIC ---
  const currentHash = getTickerHash();
  
  // We calculate visibility synchronously during render ONLY AFTER hydration finishes.
  // This completely removes the need for useEffect state cascades.
  const isVisible = 
    isMounted && 
    !isManuallyClosed && 
    typeof window !== 'undefined' && 
    window.localStorage.getItem('opfits_ticker_dismissed_hash') !== currentHash;

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('opfits_ticker_dismissed_hash', currentHash);
    }
    setIsManuallyClosed(true);
  };

  // --- THE INTELLIGENT TYPEWRITER ENGINE ---
  useEffect(() => {
    if (!isMounted || isMinimized || !isVisible || isHovered) return;

    const handleTyping = () => {
      const currentMessage = MESSAGES[messageIndex];
      
      if (isDeleting) {
        // Backspace Logic
        setText(prev => prev.substring(0, prev.length - 1));
        if (text === '') {
          setIsDeleting(false);
          setMessageIndex(prev => (prev + 1) % MESSAGES.length);
        }
      } else {
        // Typing Logic
        setText(currentMessage.substring(0, text.length + 1));
        if (text === currentMessage) {
          // Pause at end of message
          timer.current = setTimeout(() => setIsDeleting(true), PAUSE_TIME);
          return; 
        }
      }
    };

    // Dynamic speed adjustment
    const speed = isDeleting ? DELETING_SPEED : TYPING_SPEED;
    timer.current = setTimeout(handleTyping, speed);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [text, isDeleting, messageIndex, isMinimized, isVisible, isHovered, isMounted]);

  // Prevent hydration mismatches by returning null until the client mounts
  if (!isMounted || !isVisible) return null;

  return (
    <div 
      className={cn(
        "fixed z-50 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] font-mono shadow-2xl",
        // Position Logic: Sticks to bottom (Desktop) or above Nav (Mobile)
        "bottom-[68px] md:bottom-0 left-0 right-0",
        isMinimized 
          ? "w-auto right-4 left-auto rounded-t-lg border-x border-t border-emerald-500/20" 
          : "w-full border-t border-emerald-500/20"
      )}
    >
      {/* GLASSMORPHIC BACKGROUND */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl -z-10" />
      
      {/* SCANLINE EFFECT (Visual Polish) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[-1] bg-[length:100%_4px,6px_100%] pointer-events-none opacity-20" />

      <div className="container mx-auto flex items-center justify-between px-4 py-2.5 h-10">
        
        {/* LEFT: SYSTEM STATUS */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex items-center justify-center">
            <Terminal size={14} className="text-emerald-500" />
            {!isMinimized && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
            )}
          </div>
          
          {!isMinimized && (
            <div className="hidden md:flex items-center gap-2 text-[9px] text-emerald-500/60 font-bold tracking-[0.2em] border-r border-emerald-500/20 pr-3 select-none">
              <Activity size={10} className="animate-pulse" />
              <span>opfits_SYSTEM_V.1.0</span>
            </div>
          )}
        </div>

        {/* CENTER: THE TERMINAL FEED */}
        {!isMinimized && (
          <div 
            className="flex-1 mx-4 overflow-hidden relative group cursor-help"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
             <div className="w-full text-center flex items-center justify-center gap-2">
                <ChevronRight size={12} className="text-emerald-600 animate-pulse" />
                <span className="text-[10px] md:text-xs font-bold text-emerald-400 tracking-widest uppercase drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]">
                  {text}
                </span>
                {/* BLINKING CURSOR */}
                <span className={cn(
                  "inline-block w-2 h-4 bg-emerald-500 align-middle",
                  isDeleting ? "animate-none opacity-100" : "animate-[blink_1s_steps(2)_infinite]"
                )} />
             </div>
             
             {/* HOVER TOOLTIP */}
             <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-[9px] text-emerald-300 font-bold uppercase tracking-widest backdrop-blur-sm">
               {"// PAUSED_FOR_READING //"}
             </div>
          </div>
        )}

        {/* RIGHT: WINDOW CONTROLS */}
        <div className="flex items-center gap-1 pl-3 border-l border-emerald-500/10 shrink-0">
          
          {/* Min/Max */}
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-emerald-500/10 text-emerald-600/70 hover:text-emerald-400 rounded-sm transition-all duration-300 active:scale-95"
            title={isMinimized ? "Maximize Terminal" : "Minimize Terminal"}
          >
            {isMinimized ? (
              <div className="flex items-center gap-2 px-1">
                <Radio size={12} className="animate-pulse text-emerald-500" />
                <span className="text-[9px] font-bold text-emerald-500 animate-pulse">LIVE</span>
              </div>
            ) : (
              <Minimize2 size={12} />
            )}
          </button>

          {/* Close */}
          {!isMinimized && (
            <button 
              onClick={handleDismiss}
              className="p-1.5 hover:bg-red-500/10 text-emerald-600/70 hover:text-red-500 rounded-sm transition-all duration-300 active:scale-95"
              title="Close Connection"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}