'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowDown, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// --- CONFIG: HYBRID PLAYLIST ---
const PLAYLIST = [
  {
    id: 1,
    type: 'video',
    src: 'https://cdn.coverr.co/videos/coverr-walking-in-a-fashion-show-2656/1080p.mp4',
    poster: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070',
    duration: 0, 
  },
  {
    id: 2,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1523396860124-baf00bc49636?q=80&w=2163',
    duration: 6000, 
  },
  {
    id: 3,
    type: 'image',
    src: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=2000',
    duration: 6000,
  }
];

export default function HeroSection() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeMedia = PLAYLIST[currentIdx];

  // --- HELPER: SAFE PLAY ---
  // Fixes "The play() request was interrupted by a call to pause()"
  const safePlay = async () => {
    if (videoRef.current && videoRef.current.paused) {
      try {
        await videoRef.current.play();
      } catch (err) {
        // Ignore abort errors caused by rapid scrolling
        if ((err as Error).name !== 'AbortError') {
          console.error("Video playback failed", err);
        }
      }
    }
  };

  const safePause = () => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  };

  // --- 1. SMART PLAYBACK ENGINE ---
  useEffect(() => {
    if (!isPlaying) return;

    let progressInterval: NodeJS.Timeout;
    let slideTimeout: NodeJS.Timeout;

    const nextSlide = () => {
      setProgress(0);
      setCurrentIdx((prev) => (prev + 1) % PLAYLIST.length);
    };

    if (activeMedia.type === 'image') {
      const duration = activeMedia.duration || 5000;
      const step = 100 / (duration / 100); 
      
      progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + step, 100));
      }, 100);

      slideTimeout = setTimeout(nextSlide, duration);

    } else if (activeMedia.type === 'video') {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        safePlay(); // Use safe play wrapper
      }
    }

    return () => {
      clearInterval(progressInterval);
      clearTimeout(slideTimeout);
    };
  }, [currentIdx, isPlaying, activeMedia.type]); // Added activeMedia.type for stability

  // --- 2. VIDEO EVENTS ---
  const handleVideoTimeUpdate = () => {
    if (videoRef.current && activeMedia.type === 'video') {
      const duration = videoRef.current.duration;
      const currentTime = videoRef.current.currentTime;
      if (duration > 0) {
        setProgress((currentTime / duration) * 100);
      }
    }
  };

  const handleVideoEnded = () => {
    setCurrentIdx((prev) => (prev + 1) % PLAYLIST.length);
  };

  // --- 3. PERFORMANCE AWARENESS (IntersectionObserver) ---
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsPlaying(entry.isIntersecting);
        
        if (entry.isIntersecting) {
          if (activeMedia.type === 'video') safePlay();
        } else {
          safePause();
        }
      },
      { threshold: 0.5 }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [activeMedia.type]); // Re-bind if media type changes

  const scrollToContent = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  return (
    <section 
      ref={containerRef} 
      className="relative h-screen w-full overflow-hidden bg-black text-white select-none"
    >
      
      {/* --- MEDIA LAYER --- */}
      <div className="absolute inset-0 z-0">
        {PLAYLIST.map((media, index) => {
          const isActive = index === currentIdx;
          return (
            <div 
              key={media.id}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                isActive ? "opacity-100 z-10" : "opacity-0 z-0"
              )}
            >
              {media.type === 'video' ? (
                <video
                  ref={isActive ? videoRef : null}
                  muted={isMuted}
                  playsInline
                  loop={false} // We handle looping manually via onEnded
                  poster={media.poster}
                  onTimeUpdate={isActive ? handleVideoTimeUpdate : undefined}
                  onEnded={isActive ? handleVideoEnded : undefined}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="relative h-full w-full overflow-hidden">
                  <img 
                    src={media.src} 
                    alt="Hero"
                    className={cn(
                      "h-full w-full object-cover transition-transform duration-[10000ms] ease-out",
                      isActive ? "scale-110" : "scale-100"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
        
        {/* Cinematic Grain */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-10 brightness-100 contrast-150 mix-blend-overlay" />
        
        {/* Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
      </div>

      {/* --- CONTENT LAYER --- */}
      <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-4 pt-20">
        <div className="overflow-hidden">
          <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter mb-2 leading-[0.8] animate-in slide-in-from-bottom-20 duration-1000 delay-300 drop-shadow-2xl">
            Nairobi <br className="md:hidden"/> Streetwear
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
      <div className="absolute bottom-0 left-0 h-1 bg-white/20 w-full z-30">
        <div 
          className="h-full bg-white shadow-[0_0_10px_white] transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="absolute bottom-8 right-8 z-30 flex items-center gap-4">
        {activeMedia.type === 'video' && (
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
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 text-white/50 hover:text-white transition-colors animate-bounce"
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