'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateScroll = () => {
      // Calculate how far down the user has scrolled as a percentage
      const currentScrollY = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      
      if (scrollHeight > 0) {
        setProgress(Number((currentScrollY / scrollHeight).toFixed(4)) * 100);
      }
    };

    // Use passive: true for maximum 60fps performance
    window.addEventListener('scroll', updateScroll, { passive: true });
    
    // Trigger once on mount
    updateScroll(); 
    
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);

  return (
    // Hidden on mobile (md:block), fixed to the absolute right edge
    <div className="fixed top-0 right-0 w-[3px] h-full bg-transparent z-[9999] hidden md:block pointer-events-none mix-blend-difference">
      
      {/* The glowing track that fills up */}
      <div 
        className={cn(
          "w-full bg-white transition-all duration-100 ease-out will-change-[height]",
          // Add a subtle glow/shadow to make it look like a neon tube or laser
          "shadow-[0_0_10px_rgba(255,255,255,0.8)]" 
        )}
        style={{ height: `${progress}%` }}
      />
    </div>
  );
}