'use client';

import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import { X, Terminal, Minimize2, Radio, Activity, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const MESSAGES = [
  "WELCOME TO OP Fits!!!",
  "YOUR TRUSTED ONLINE CLOTHING SHOP...",
  "ALERT :: FREE DELIVERY ON ALL ORDERS ABOVE KES 10,000",
  "NEW DROP :: COMING SOON...",
];

const TYPING_SPEED = 20; 
const DELETING_SPEED = 10; 
const PAUSE_TIME = 1200; 

const getTickerHash = () => {
  const str = MESSAGES.join('|');
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `opfits_ticker_v${Math.abs(hash)}`;
};

const emptySubscribe = () => () => {};

export default function NewsTicker() {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const [isManuallyClosed, setIsManuallyClosed] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const [text, setText] = useState('');
  const [messageIndex, setMessageIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const timer = useRef<NodeJS.Timeout | null>(null);

  const currentHash = getTickerHash();
  
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

  useEffect(() => {
    if (!isMounted || isMinimized || !isVisible || isHovered) return;

    const handleTyping = () => {
      const currentMessage = MESSAGES[messageIndex];
      
      if (isDeleting) {
        setText(prev => prev.substring(0, prev.length - 1));
        if (text === '') {
          setIsDeleting(false);
          setMessageIndex(prev => (prev + 1) % MESSAGES.length);
        }
      } else {
        setText(currentMessage.substring(0, text.length + 1));
        if (text === currentMessage) {
          timer.current = setTimeout(() => setIsDeleting(true), PAUSE_TIME);
          return; 
        }
      }
    };

    const speed = isDeleting ? DELETING_SPEED : TYPING_SPEED;
    timer.current = setTimeout(handleTyping, speed);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [text, isDeleting, messageIndex, isMinimized, isVisible, isHovered, isMounted]);

  if (!isMounted || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        layout
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className={cn(
          "fixed z-50 font-mono shadow-2xl overflow-hidden",
          "bottom-[68px] md:bottom-0",
          isMinimized 
            ? "right-4 left-auto rounded-t-xl border-x border-t border-border/50 bg-background/80 supports-[backdrop-filter]:bg-background/60 backdrop-blur-2xl" 
            : "left-0 right-0 w-full border-t border-border/50 bg-background/90 supports-[backdrop-filter]:bg-background/70 backdrop-blur-xl"
        )}
      >
        {/* Soft, Calming Scanline Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.05)_50%)] z-[-1] bg-[length:100%_4px] pointer-events-none opacity-50 dark:opacity-20" />

        <div className={cn("flex items-center px-4 py-2.5 h-10 transition-all", isMinimized ? "justify-center" : "container mx-auto justify-between")}>
          
          {/* LEFT: SYSTEM STATUS */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative flex items-center justify-center">
              <Terminal size={14} className="text-foreground/80" />
              {!isMinimized && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-primary rounded-full animate-ping" />
              )}
            </div>
            
            {!isMinimized && (
              <div className="hidden md:flex items-center gap-2 text-[9px] text-muted-foreground font-bold tracking-[0.2em] border-r border-border/50 pr-3 select-none">
                <Activity size={10} className="animate-pulse opacity-50" />
                <span>SYS_V.1.0</span>
              </div>
            )}
          </div>

          {/* CENTER: THE TERMINAL FEED */}
          {!isMinimized && (
            <motion.div 
              layout
              className="flex-1 mx-4 overflow-hidden relative group cursor-help"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
               <div className="w-full text-center flex items-center justify-center gap-2">
                  <ChevronRight size={12} className="text-muted-foreground animate-pulse" />
                  <span className="text-[10px] md:text-xs font-bold text-foreground tracking-widest uppercase">
                    {text}
                  </span>
                  <span className={cn(
                    "inline-block w-1.5 h-3.5 bg-foreground align-middle",
                    isDeleting ? "animate-none opacity-100" : "animate-[blink_1s_steps(2)_infinite]"
                  )} />
               </div>
               
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 text-[9px] text-muted-foreground font-bold uppercase tracking-widest backdrop-blur-sm">
                 {"// PAUSED_FOR_READING //"}
               </div>
            </motion.div>
          )}

          {/* RIGHT: WINDOW CONTROLS */}
          <div className={cn("flex items-center gap-1 shrink-0", !isMinimized && "pl-3 border-l border-border/50")}>
            <button 
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1.5 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-md transition-colors active:scale-95"
              title={isMinimized ? "Maximize Feed" : "Minimize Feed"}
            >
              {isMinimized ? (
                <div className="flex items-center gap-2 px-1">
                  <Radio size={12} className="animate-pulse text-primary" />
                  <span className="text-[9px] font-bold text-foreground animate-pulse tracking-widest">LIVE</span>
                </div>
              ) : (
                <Minimize2 size={12} />
              )}
            </button>

            {!isMinimized && (
              <button 
                onClick={handleDismiss}
                className="p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-md transition-colors active:scale-95"
                title="Dismiss"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}