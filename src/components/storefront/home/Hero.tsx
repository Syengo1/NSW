'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Pause, Play, Volume2, VolumeX, WifiOff, BatteryWarning, MoveDown } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

// --- STRICT TYPES ---
interface NetworkInformation extends EventTarget {
  saveData?: boolean;
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
}

const PLAYLIST = [
  {
    id: 1,
    type: 'video',
    src: 'https://ewxf0eupwexd82yb.public.blob.vercel-storage.com/nswHero.mp4', 
    poster: '/poster.webp',
    duration: 0, 
  },
  {
    id: 2,
    type: 'image',
    src: '/slide3.webp',
    duration: 3000, 
  },
  {
    id: 3,
    type: 'image',
    src: '/slide2.webp',
    duration: 3000,
  }
];

// --- HOOK: ENVIRONMENT AWARENESS ---
function useSmartEnvironment() {
  const [env, setEnv] = useState({ isLowPower: false, isLowData: false, isReady: false });

  useEffect(() => {
    let isLowData = false;
    let isLowPower = false;

    if (typeof navigator !== 'undefined' && 'connection' in navigator) {
      // 🚨 ESLINT FIX: Safely typed Navigator intersection (No 'any')
      const nav = navigator as Navigator & { connection?: NetworkInformation };
      const conn = nav.connection;
      if (conn?.saveData || conn?.effectiveType === '2g' || conn?.effectiveType === 'slow-2g') {
        isLowData = true;
      }
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    isLowPower = mediaQuery.matches;

    // 🚨 REACT 18 FIX: Pushed to end of execution queue to prevent cascading renders
    const timer = setTimeout(() => {
      setEnv({ isLowPower, isLowData, isReady: true });
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return env;
}

export default function HeroSection() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isInView, setIsInView] = useState(true); 
  
  const [userOverride, setUserOverride] = useState(false); 
  const [videoError, setVideoError] = useState(false);

  // 🚨 TS FIX: Explicit initial values for all refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null); 
  const imageTimerRef = useRef<number | null>(null);
  const videoTimerRef = useRef<number | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  const { isLowData, isLowPower, isReady } = useSmartEnvironment();
  const activeMedia = PLAYLIST[currentIdx];

  const shouldPlayVideo = activeMedia.type === 'video' 
    && (userOverride || (!isLowData && !isLowPower))
    && !videoError
    && isInView; 
  
  const effectiveType = shouldPlayVideo ? 'video' : 'image';

  // --- 1. INTERSECTION OBSERVER ---
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // --- 2. PLAYBACK ENGINE ---
  const safePlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !isInView) return;

    if (playPromiseRef.current) return; 

    if (video.paused) {
      try {
        playPromiseRef.current = video.play();
        await playPromiseRef.current;
        setIsPlaying(true);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        console.warn("Autoplay failed. Falling back to poster.", err);
        setVideoError(true); 
      } finally {
        playPromiseRef.current = null;
      }
    }
  }, [isInView]);

  const safePause = useCallback(() => {
    const video = videoRef.current;
    if (video && !playPromiseRef.current && !video.paused) {
      video.pause();
      setIsPlaying(false);
    }
  }, []);

  // --- 3. ZERO-RENDER PROGRESS BAR (60FPS) ---
  const updateProgressDOM = useCallback((percentage: number) => {
    if (progressBarRef.current) {
      // Failsafe to handle NaN before video metadata loads
      const safePct = Number.isNaN(percentage) ? 0 : Math.min(Math.max(percentage, 0), 100);
      progressBarRef.current.style.width = `${safePct}%`;
    }
  }, []);

  const nextSlide = useCallback(() => {
    updateProgressDOM(0);
    setCurrentIdx((prev) => (prev + 1) % PLAYLIST.length);
  }, [updateProgressDOM]);

  // A. 60FPS Image Progress Loop
  useEffect(() => {
    if (effectiveType !== 'image' || !isPlaying || !isInView) {
      if (imageTimerRef.current !== null) cancelAnimationFrame(imageTimerRef.current);
      return;
    }

    const duration = activeMedia.duration || 5000;
    const startTime = performance.now();

    const animateImageProgress = (now: number) => {
      const elapsed = now - startTime;
      const pct = (elapsed / duration) * 100;
      updateProgressDOM(pct);

      if (pct >= 100) nextSlide();
      else imageTimerRef.current = requestAnimationFrame(animateImageProgress);
    };

    imageTimerRef.current = requestAnimationFrame(animateImageProgress);

    return () => {
      if (imageTimerRef.current !== null) cancelAnimationFrame(imageTimerRef.current);
    };
  }, [currentIdx, isPlaying, effectiveType, activeMedia.duration, isInView, nextSlide, updateProgressDOM]);

  // B. 60FPS Video Progress Loop (Replaces the choppy onTimeUpdate event)
  useEffect(() => {
    if (effectiveType !== 'video' || !isPlaying || !isInView) {
      if (videoTimerRef.current !== null) cancelAnimationFrame(videoTimerRef.current);
      return;
    }

    const animateVideoProgress = () => {
      if (videoRef.current) {
        const pct = (videoRef.current.currentTime / (videoRef.current.duration || 1)) * 100;
        updateProgressDOM(pct);
      }
      videoTimerRef.current = requestAnimationFrame(animateVideoProgress);
    };

    videoTimerRef.current = requestAnimationFrame(animateVideoProgress);

    return () => {
      if (videoTimerRef.current !== null) cancelAnimationFrame(videoTimerRef.current);
    };
  }, [effectiveType, isPlaying, isInView, updateProgressDOM]);

  // Sync Engine with Viewport
  useEffect(() => {
    if (!isInView) {
      safePause();
    } else if (effectiveType === 'video' && isPlaying) {
      safePlay();
    }
  }, [isInView, safePause, safePlay, effectiveType, isPlaying]);

  useEffect(() => { setVideoError(false); }, [currentIdx]);

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  const handleForcePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUserOverride(true);
    setVideoError(false);
    setTimeout(() => {
      setIsPlaying(true);
      if (videoRef.current) {
        videoRef.current.muted = false; 
        setIsMuted(false);
        safePlay();
      }
    }, 100);
  };

  return (
    <section 
      ref={containerRef} 
      className="relative h-screen supports-[height:100dvh]:h-[100dvh] w-full overflow-hidden bg-black text-white select-none"
    >
      
      {/* --- MEDIA LAYER --- */}
      <div className="absolute inset-0 z-0 bg-neutral-900">
        {PLAYLIST.map((media, index) => {
          const isActive = index === currentIdx;
          const isVideoRender = media.type === 'video' && shouldPlayVideo;
          const srcToRender = ((media.type === 'video' && !shouldPlayVideo) ? media.poster : media.src) || '';

          return (
            <div 
              key={media.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000 ease-in-out will-change-opacity",
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              )}
            >
              {isVideoRender ? (
                <video
                  ref={isActive ? videoRef : null}
                  src={media.src as string}
                  poster={media.poster}
                  muted={isMuted}
                  playsInline
                  autoPlay={isActive}
                  preload={index === 0 ? "auto" : "metadata"}
                  loop={false} 
                  onEnded={isActive ? nextSlide : undefined}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="relative h-full w-full overflow-hidden">
                  <Image 
                    src={srcToRender} 
                    alt="OP Fits Hero Visual"
                    fill
                    priority={index === 0} 
                    fetchPriority={index === 0 ? "high" : "auto"}
                    sizes="100vw"
                    className={cn(
                      "object-cover transition-transform duration-[10000ms] ease-out will-change-transform",
                      isActive && isReady ? "scale-110" : "scale-100"
                    )}
                  />
                  
                  {media.type === 'video' && isActive && !userOverride && !videoError && isReady && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
                      <div className="bg-black/40 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex flex-col items-center text-center max-w-xs">
                        {isLowData ? (
                           <WifiOff size={32} className="text-white/80 mb-2" />
                        ) : (
                           <BatteryWarning size={32} className="text-white/80 mb-2" />
                        )}
                        <h3 className="text-sm font-bold uppercase tracking-widest mb-1">
                          {isLowData ? 'Data Saver Active' : 'Power Saver Mode'}
                        </h3>
                        <p className="text-xs text-white/60 mb-4">
                          Autoplay paused to save resources.
                        </p>
                        <button 
                          onClick={handleForcePlay}
                          className="flex items-center gap-2 bg-white text-black px-5 py-2 text-xs font-black uppercase tracking-widest hover:scale-105 transition-transform"
                        >
                          <Play size={12} fill="currentColor" />
                          Load Video
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-30 pointer-events-none z-10 brightness-100 contrast-150 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4 pt-20 animate-fade-in-up mix-blend-screen pointer-events-none">
        <h2 className="text-sm md:text-base font-bold uppercase tracking-[0.3em] text-neutral-300 drop-shadow-lg mb-6 animate-in slide-in-from-bottom-5 duration-1000 delay-300">
          Welcome to OP Fits
        </h2>
        <p className="text-3xl md:text-5xl font-black uppercase tracking-tighter max-w-3xl leading-[1.1] drop-shadow-2xl mb-6 animate-in slide-in-from-bottom-10 duration-1000 delay-500">
          Style in Every Fit.
        </p>
        <p className="text-xs md:text-sm text-neutral-300 max-w-xl leading-relaxed drop-shadow-md mb-10 animate-in fade-in zoom-in duration-1000 delay-700">
          Welcome to the Home of Fashionable, Affordable and Authentic Clothing. <br/>
          Join the OP Fits movement and redefine your style with us today.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-1000 pointer-events-auto">
           <Link 
             href="/shop?sort=newest" 
             className="group relative bg-white text-black px-8 py-4 font-black uppercase tracking-widest text-xs overflow-hidden"
           >
             <span className="relative z-10 group-hover:text-white transition-colors duration-300">Shop Now</span>
             <div className="absolute inset-0 bg-black transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300 ease-out" />
           </Link>
           <Link 
             href="/explore" 
             className="group relative border border-white text-white px-8 py-4 font-black uppercase tracking-widest text-xs hover:bg-white hover:text-black transition-all"
           >
             Explore
           </Link>
        </div>
      </div>

      {/* --- CONTROLS --- */}
      <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full z-30">
        <div 
          ref={progressBarRef}
          className="h-full bg-white shadow-[0_0_15px_white] will-change-[width]"
          style={{ width: '0%' }} 
        />
      </div>

      <div className="absolute bottom-8 right-8 z-30 flex items-center gap-4">
        {!userOverride && (isLowData || isLowPower) && !videoError && isReady && (
          <div className="text-[10px] uppercase font-bold text-white/50 border border-white/20 px-2 py-1 rounded">
            Eco Mode
          </div>
        )}

        {effectiveType === 'video' && (
          <button 
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full border border-white/20 bg-black/20 backdrop-blur-md hover:bg-white hover:text-black transition-all"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        )}
        
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
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 text-white/50 hover:text-white transition-colors animate-bounce cursor-pointer flex flex-col items-center"
      >
        <MoveDown size={32} strokeWidth={1} />
      </button>

      <div className="absolute bottom-12 left-8 z-30 flex gap-2">
        {PLAYLIST.map((_, idx) => (
          <button
            key={idx}
            onClick={() => { setCurrentIdx(idx); updateProgressDOM(0); }}
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