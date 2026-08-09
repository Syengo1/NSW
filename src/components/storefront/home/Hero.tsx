'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, Transition, useMotionValue, useSpring, useTransform } from 'framer-motion';
import FloatingImage, { HeroCardConfig } from './FloatingImage';
import HeroText from './HeroText';

const createCard = (
  id: string, src: string, width: number, height: number,
  desktopStart: { x: number, y: number, rotate: number },
  mobileStart: { x: number, y: number, rotate: number },
  group: 1 | 2
): HeroCardConfig => {
  return {
    id, src, width, height,
    desktop: {
      default: group === 1 
        ? { ...desktopStart, z: 0, scale: 1, opacity: 1 } 
        : { x: desktopStart.x * 0.2, y: desktopStart.y * 0.2, z: -600, rotate: 0, scale: 0.5, opacity: 0 },
      flip1: group === 1
        ? { x: desktopStart.x * 1.5, y: desktopStart.y * 1.5, z: 400, rotate: desktopStart.rotate * 2, scale: 1.2, opacity: 0 }
        : { x: desktopStart.x * 0.5, y: desktopStart.y * 0.5, z: -300, rotate: desktopStart.rotate * 0.5, scale: 0.8, opacity: 0.5 },
      flip2: group === 1
        ? { x: desktopStart.x * 2, y: desktopStart.y * 2, z: 500, rotate: desktopStart.rotate * 3, scale: 1.5, opacity: 0 }
        : { ...desktopStart, z: 0, scale: 1, opacity: 1 }
    },
    mobile: {
      default: group === 1 
        ? { ...mobileStart, z: 0, scale: 1, opacity: 1 } 
        : { x: mobileStart.x * 0.2, y: mobileStart.y * 0.2, z: -600, rotate: 0, scale: 0.5, opacity: 0 },
      flip1: group === 1
        ? { x: mobileStart.x * 1.5, y: mobileStart.y * 1.5, z: 400, rotate: mobileStart.rotate * 2, scale: 1.2, opacity: 0 }
        : { x: mobileStart.x * 0.5, y: mobileStart.y * 0.5, z: -300, rotate: mobileStart.rotate * 0.5, scale: 0.8, opacity: 0.5 },
      flip2: group === 1
        ? { x: mobileStart.x * 2, y: mobileStart.y * 2, z: 500, rotate: mobileStart.rotate * 3, scale: 1.5, opacity: 0 }
        : { ...mobileStart, z: 0, scale: 1, opacity: 1 }
    }
  };
};

const HERO_CARDS: HeroCardConfig[] = [
  createCard('1', '/hero/zoro_hoodie.webp', 195, 266, { x: -340, y: -180, rotate: -6 }, { x: -90, y: -220, rotate: -4 }, 1),
  createCard('2', 'https://framerusercontent.com/images/8yTDdY0yf5joSqDo9rBQ9tNkWs.jpeg', 209, 294, { x: 300, y: -150, rotate: 5 }, { x: 100, y: -180, rotate: 6 }, 1),
  createCard('3', 'https://framerusercontent.com/images/3Qn1pE6cMC4bKEa68dyX8ocUJ4.jpeg', 258, 200, { x: -380, y: 80, rotate: -3 }, { x: -110, y: 80, rotate: -2 }, 1),
  createCard('4', '/hero/OPAF1.webp', 313, 224, { x: 40, y: 220, rotate: 4 }, { x: 10, y: 240, rotate: 2 }, 1),
  createCard('5', 'https://framerusercontent.com/images/u3F21zAhsNEOjCugJhBXDTPkqk.jpg', 238, 289, { x: 340, y: 150, rotate: -5 }, { x: 110, y: 160, rotate: -4 }, 1),

  createCard('6', '/hero/zoro_hoodie_back.webp', 293, 387, { x: -300, y: -160, rotate: 4 }, { x: -85, y: -170, rotate: 5 }, 2),
  createCard('7', 'https://framerusercontent.com/images/u1kPUKaC2qqQ2wIHuJ1XUGZkW9A.jpg', 209, 294, { x: 320, y: -120, rotate: -6 }, { x: 85, y: -130, rotate: -5 }, 2),
  createCard('8', 'https://framerusercontent.com/images/0tfyyn5MP8bPWxhdTAOayckjMAI.jpg', 258, 355, { x: -350, y: 140, rotate: 6 }, { x: -95, y: 140, rotate: 4 }, 2),
  createCard('9', '/hero/spongebob.webp', 313, 275, { x: -30, y: 240, rotate: -4 }, { x: -10, y: 210, rotate: -3 }, 2),
  createCard('10', 'https://framerusercontent.com/images/BSaz0fXWU2uFOAYeuZvwhgP7Rk.jpeg', 301, 375, { x: 340, y: 190, rotate: 5 }, { x: 95, y: 170, rotate: 4 }, 2),
];

// --- LUXURY SMOOTH EASING CURVES ---
const SMOOTH_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1]; 

// CRITICAL FIX: Slashed transition durations for a snappy, weightless flip
const transitions = {
  transition1: { duration: 0.8, ease: SMOOTH_EASE, type: "tween" } as Transition,
  transition2: { duration: 0.3, ease: SMOOTH_EASE, type: "tween" } as Transition,
  transition3: { duration: 0.5, ease: SMOOTH_EASE, type: "tween" } as Transition
};

export default function HeroSection() {
  const [variant, setVariant] = useState<'default' | 'flip1' | 'flip2'>('default');
  const [isMobile, setIsMobile] = useState(false);

  // --- OPTIMIZED PARALLAX PHYSICS ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // High damping and balanced stiffness for ultra-smooth responsiveness without jitter
  const springConfig = { damping: 25, stiffness: 80, mass: 0.8 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), springConfig);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set(clientX / innerWidth - 0.5);
    mouseY.set(clientY / innerHeight - 0.5);
  }, [mouseX, mouseY]);

  // Zero-reflow breakpoint detector using matchMedia
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateMobile = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    
    updateMobile(mediaQuery);
    mediaQuery.addEventListener('change', updateMobile);
    return () => mediaQuery.removeEventListener('change', updateMobile);
  }, []);

 // --- AUTOMATED KINETIC LOOP ---
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const runCycle = (current: string) => {
      if (current === 'default') {
        timeout = setTimeout(() => setVariant('flip1'), 3500);
      } else if (current === 'flip1') {
        // CRITICAL FIX: Reduced from 800ms to 300ms to instantly chain the flip
        timeout = setTimeout(() => setVariant('flip2'), 50); 
      } else if (current === 'flip2') {
        timeout = setTimeout(() => setVariant('default'), 3500);
      }
    };

    runCycle(variant);
    return () => clearTimeout(timeout);
  }, [variant]);

  return (
    <section 
      onMouseMove={handleMouseMove}
      className="relative w-full h-screen supports-[height:100dvh]:h-[100dvh] overflow-hidden bg-white dark:bg-[#050505] text-foreground select-none"
    >
      <motion.div 
        className="absolute inset-0 pointer-events-auto z-0"
        style={{ 
          transformStyle: 'preserve-3d',
          perspective: 1200,
          rotateX, 
          rotateY,
          willChange: 'transform'
        }}
      >
        {HERO_CARDS.map((card, idx) => (
          <FloatingImage 
            key={card.id} 
            card={card} 
            variant={variant} 
            isMobile={isMobile} 
            priority={idx < 5}
            transitions={transitions} 
          />
        ))}
      </motion.div>

      <div className="pt-20 w-full h-full pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <HeroText variant={variant} transitions={transitions} />
      </div>
    </section>
  );
}