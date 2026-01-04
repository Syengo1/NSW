import { useState, useEffect } from 'react';

export function useScrollControl(threshold = 10) {
  const [isAtTop, setIsAtTop] = useState(true);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down' | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDir = () => {
      const scrollY = window.scrollY;

      // 1. Handle "At Top" Logic (for Transparency)
      // We use a small buffer (10px) to prevent flickering at the very edge
      setIsAtTop(scrollY < 10);

      // 2. Handle Scroll Direction & Visibility (for Bottom Nav)
      if (Math.abs(scrollY - lastScrollY) < threshold) {
        // Ignore tiny movements (debounce/noise)
        ticking = false;
        return;
      }

      const direction = scrollY > lastScrollY ? 'down' : 'up';
      setScrollDirection(direction);

      // Logic: Hide on scroll down, Show on scroll up
      // ALWAYS show if we are near the top (e.g., < 50px) to avoid getting stuck hidden
      if (scrollY < 50) {
        setIsVisible(true);
      } else {
        setIsVisible(direction === 'up');
      }

      lastScrollY = scrollY > 0 ? scrollY : 0; // Prevent negative scroll values (iOS bounce)
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return { isAtTop, scrollDirection, isVisible };
}