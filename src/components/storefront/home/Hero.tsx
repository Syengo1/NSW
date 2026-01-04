'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowDown, Pause, Play, Volume2, VolumeX, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// --- CONFIG: DATA SOURCES ---
const PLAYLIST = [
  {
    id: 1,
    type: 'video',
    src: '/nswHero.mp4',
    poster: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070',
    duration: 0, // Video duration is dynamic
  },
  {
    id: 2,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1523396860124-baf00bc49636?q=80&w=2163',
    duration: 3000, 
  },
  {
    id: 3,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=2000',
    duration: 3000,
  }
];

// --- HOOK: ENVIRONMENT AWARENESS ---
function useSmartEnvironment() {
  const [isLowPower, setIsLowPower] = useState(false);
  const [isLowData, setIsLowData] = useState(false);

  useEffect(() => {
    // 1. Check Network Status
    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      const conn = (navigator as any).connection;
      const checkConnection = () => {
        if (conn.saveData || conn.effectiveType === '2g' || conn.effectiveType === 'slow-2g') {
          setIsLowData(true);
        }
      };
      checkConnection();
      conn.addEventListener('change', checkConnection);
      return () => conn.removeEventListener('change', checkConnection);
    }

    // 2. Check Reduced Motion (Respect user accessibility settings)
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => setIsLowPower(e.matches);
    setIsLowPower(mediaQuery.matches);
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  return { isLowPower, isLowData };
}

export default function HeroSection() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true); // Autoplay MUST start muted
  const [progress, setProgress] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null); // THE TRAFFIC COP

  const { isLowData, isLowPower } = useSmartEnvironment();

  const activeMedia = PLAYLIST[currentIdx];
  // Force image mode if Low Data, otherwise respect media type
  const effectiveType = (activeMedia.type === 'video' && isLowData) ? 'image' : activeMedia.type;

  // --- LOGIC: ROBUST PLAYBACK ENGINE ---
  
  const safePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video || isLowPower) return;

    // 1. If we are already loading a play request, do nothing (Prevent Race Condition)
    if (playPromiseRef.current) return;

    // 2. Only try to play if paused
    if (video.paused) {
      try {
        playPromiseRef.current = video.play();
        await playPromiseRef.current;
      } catch (err) {
        // 3. Gracefully handle interruptions
        if ((err as Error).name !== 'AbortError') {
          console.warn("Autoplay prevented:", err);
          setIsPlaying(false); // Update UI to reflect reality
        }
      } finally {
        playPromiseRef.current = null; // Reset traffic cop
      }
    }
  }, [isLowPower]);

  const safePause = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    // 1. Do not interrupt a pending play request
    if (!playPromiseRef.current && !video.paused) {
      video.pause();
    }
  }, []);

  // --- 1. SLIDE MANAGER ---
  const nextSlide = useCallback(() => {
    setProgress(0);
    setCurrentIdx((prev) => (prev + 1) % PLAYLIST.length);
  }, []);

  // --- 2. PROGRESS ENGINE ---
  useEffect(() => {
    if (!isPlaying) return;

    let progressInterval: NodeJS.Timeout;
    let slideTimeout: NodeJS.Timeout;

    // IMAGE LOGIC: Simple Timer
    if (effectiveType === 'image') {
      const duration = activeMedia.duration || 5000;
      const intervalTime = 100;
      const step = 100 / (duration / intervalTime); 
      
      progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + step, 100));
      }, intervalTime);

      slideTimeout = setTimeout(nextSlide, duration);
    }
    // VIDEO LOGIC: Handled via onTimeUpdate and onEnded events below
    // Fallback: If video gets stuck for 10s, auto-advance (Self-Healing)
    else if (effectiveType === 'video') {
       slideTimeout = setTimeout(nextSlide, 15000); 
    }

    return () => {
      clearInterval(progressInterval);
      clearTimeout(slideTimeout);
    };
  }, [currentIdx, isPlaying, effectiveType, activeMedia.duration, nextSlide]);

  // --- 3. VIDEO EVENTS ---
  const handleVideoTimeUpdate = () => {
    if (videoRef.current && effectiveType === 'video') {
      const duration = videoRef.current.duration || 1;
      const currentTime = videoRef.current.currentTime;
      if (duration > 0) {
        setProgress((currentTime / duration) * 100);
      }
    }
  };

  // --- 4. VISIBILITY & VIEWPORT API ---
  useEffect(() => {
    // A. Tab Switching Logic (Page Visibility API)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        safePause();
      } else if (isPlaying && effectiveType === 'video') {
        safePlay();
      }
    };

    // B. Scroll Logic (Intersection Observer)
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        setIsPlaying(isVisible);
        
        if (isVisible && effectiveType === 'video') safePlay();
        else safePause();
      },
      { threshold: 0.5 }
    );

    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer.disconnect();
    };
  }, [effectiveType, isPlaying, safePlay, safePause]);

  // Initial Load Fade-in
  useEffect(() => setIsLoaded(true), []);

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <section 
      ref={containerRef} 
      className="relative h-[100dvh] w-full overflow-hidden bg-black text-white select-none"
    >
      
      {/* --- MEDIA LAYER --- */}
      <div className="absolute inset-0 z-0 bg-neutral-900">
        {PLAYLIST.map((media, index) => {
          const isActive = index === currentIdx;
          const isVideoRender = media.type === 'video' && !isLowData;
          const srcToRender = (media.type === 'video' && isLowData) ? media.poster : media.src;

          return (
            <div 
              key={media.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000 ease-in-out will-change-opacity",
                isActive ? "opacity-100 z-10" : "opacity-0 z-0"
              )}
            >
              {isVideoRender ? (
                <video
                  ref={isActive ? videoRef : null}
                  src={media.src as string}
                  poster={media.poster}
                  muted={isMuted}
                  playsInline
                  autoPlay={!isLowPower}
                  loop={false} 
                  onTimeUpdate={isActive ? handleVideoTimeUpdate : undefined}
                  onEnded={isActive ? nextSlide : undefined}
                  onWaiting={() => console.log("Buffering...")}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="relative h-full w-full overflow-hidden">
                  {/* Optimized Image with Next/Image or standard img for max compatibility in loops */}
                  <img 
                    src={srcToRender} 
                    alt="Hero Visual"
                    className={cn(
                      "h-full w-full object-cover transition-transform duration-[10000ms] ease-out will-change-transform",
                      isActive && isLoaded ? "scale-110" : "scale-100"
                    )}
                  />
                  
                  {/* Low Data Badge */}
                  {media.type === 'video' && isLowData && isActive && (
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white/70 text-[10px] px-2 py-1 rounded border border-white/10 flex items-center gap-1 z-20">
                      <WifiOff size={10} /> Data Saver
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Cinematic Overlays */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-10 brightness-100 contrast-150 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4 pt-20">
        <div className="overflow-hidden mix-blend-screen">
          <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter mb-2 leading-[0.8] animate-in slide-in-from-bottom-20 duration-1000 delay-300 drop-shadow-2xl relative">
            <span className="relative inline-block">Nairobi</span>
            <br className="md:hidden"/> 
            <span className="relative inline-block md:ml-4">Streetwear</span>
          </h1>
        </div>
        
        <p className="text-sm md:text-lg font-bold uppercase tracking-[0.3em] text-neutral-300 max-w-xl mb-10 animate-in fade-in zoom-in duration-1000 delay-500">
          Redefining The Culture. <span className="text-white">Est. 2026</span>
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-700">
           <Link 
             href="/shop?sort=newest" 
             className="group relative bg-white text-black px-8 py-4 font-black uppercase tracking-widest text-xs overflow-hidden"
           >
             <span className="relative z-10 group-hover:text-white transition-colors duration-300">Shop New Drops</span>
             <div className="absolute inset-0 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out" />
           </Link>
           <Link 
             href="/shop?category=Hoodies" 
             className="group relative border border-white text-white px-8 py-4 font-black uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all"
           >
             View Lookbook
           </Link>
        </div>
      </div>

      {/* --- CONTROLS --- */}
      <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full z-30">
        <div 
          className="h-full bg-white shadow-[0_0_15px_white] transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="absolute bottom-8 right-8 z-30 flex items-center gap-4">
        {/* Mute Toggle */}
        {effectiveType === 'video' && (
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full border border-white/20 bg-black/20 backdrop-blur-md hover:bg-white hover:text-black transition-all"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        )}
        
        {/* Play/Pause Toggle */}
        <button 
          onClick={() => {
            if (isPlaying) safePause();
            else safePlay();
            setIsPlaying(!isPlaying);
          }}
          className="p-2 rounded-full border border-white/20 bg-black/20 backdrop-blur-md hover:bg-white hover:text-black transition-all"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </div>

      <button 
        onClick={scrollToContent}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 text-white/50 hover:text-white transition-colors animate-bounce cursor-pointer"
      >
        <ArrowDown size={32} strokeWidth={1} />
      </button>

      <div className="absolute bottom-12 left-8 z-30 flex gap-2">
        {PLAYLIST.map((_, idx) => (
          <button
            key={idx}
            onClick={() => { setCurrentIdx(idx); setProgress(0); }}
            className={cn(
              "h-1 transition-all duration-300",
              currentIdx === idx ? "w-8 bg-white" : "w-4 bg-white/30 hover:bg-white/60"
            )}
          />
        ))}
      </div>

    </section>
  );
}