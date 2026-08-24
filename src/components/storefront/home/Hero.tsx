'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, Transition, useMotionValue, useSpring, useTransform } from 'framer-motion';
import FloatingImage, { HeroCardConfig } from './FloatingImage';
import HeroText from './HeroText';

// --- STRICT TYPE DEFINITION ---
type StartPos = { x: number; y: number; rotate: number };

// --- THE HARMONIC LAYOUT ENGINE ---
const createCard = (
  id: string, src: string, width: number, height: number,
  desktopStart: StartPos,
  mobileStart: StartPos,
  group: 1 | 2
): HeroCardConfig => {
  
  const active = (start: StartPos) => ({ ...start, z: 0, scale: 1, opacity: 1 });
  const inactive = (start: StartPos) => ({ x: start.x * 0.6, y: start.y * 0.6, z: -200, rotate: start.rotate * 0.5, scale: 0.8, opacity: 0 });
  const exit = (start: StartPos) => ({ x: start.x * 1.4, y: start.y * 1.4, z: 200, rotate: start.rotate * 1.5, scale: 1.2, opacity: 0 });

  return {
    id, src, width, height,
    desktop: {
      scene1: group === 1 ? active(desktopStart) : inactive(desktopStart),
      scene2: group === 1 ? exit(desktopStart) : active(desktopStart)
    },
    mobile: {
      scene1: group === 1 ? active(mobileStart) : inactive(mobileStart),
      scene2: group === 1 ? exit(mobileStart) : active(mobileStart)
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

// --- LUXURY SMOOTH EASING CURVE ---
const CINEMATIC_TWEEN: Transition = { 
  duration: 1.2, 
  ease: [0.16, 1, 0.3, 1], 
  type: "tween" 
}; 

export default function HeroSection() {
  const [variant, setVariant] = useState<'scene1' | 'scene2'>('scene1');
  const [isMobile, setIsMobile] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 25, stiffness: 80, mass: 0.8 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [6, -6]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), springConfig);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    // Bypasses React state for butter-smooth 60fps tracking
    mouseX.set(clientX / innerWidth - 0.5);
    mouseY.set(clientY / innerHeight - 0.5);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    const updateMobile = (e: MediaQueryListEvent | MediaQueryList) => setIsMobile(e.matches);
    
    updateMobile(mediaQuery);
    mediaQuery.addEventListener('change', updateMobile);
    return () => mediaQuery.removeEventListener('change', updateMobile);
  }, []);

  // --- FOOLPROOF KINETIC LOOP ---
  useEffect(() => {
    const interval = setInterval(() => {
      setVariant(prev => prev === 'scene1' ? 'scene2' : 'scene1');
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section 
      onMouseMove={handleMouseMove}
      className="relative w-full h-screen supports-[height:100dvh]:h-[100dvh] overflow-hidden bg-white dark:bg-[#050505] text-foreground select-none"
    >
      <motion.div 
        className="absolute inset-0 pointer-events-auto z-0"
        suppressHydrationWarning
        style={{ 
          transformStyle: 'preserve-3d',
          perspective: 1200,
          rotateX, 
          rotateY,
          willChange: 'transform'
        }}
      >
        {/* --- 3D SPACE 1 --- */}
        <motion.div
          variants={{
            scene1: { rotateY: 0, transition: CINEMATIC_TWEEN },
            scene2: { rotateY: -90, transition: CINEMATIC_TWEEN }
          }}
          initial="scene1"
          animate={variant}
          className="absolute inset-0 w-full h-full"
          style={{ 
            transformStyle: 'preserve-3d', zIndex: 2,
            willChange: 'transform'
          }}
        >
          {HERO_CARDS.filter(c => Number(c.id) <= 5).map((card) => (
            <FloatingImage 
              key={card.id} 
              card={card} 
              activeVariant={variant} 
              isMobile={isMobile} 
              priority={true} 
              transition={CINEMATIC_TWEEN} 
            />
          ))}
        </motion.div>

        {/* --- 3D SPACE 2 --- */}
        <motion.div
          variants={{
            scene1: { rotateY: 90, transition: CINEMATIC_TWEEN },
            scene2: { rotateY: 0, transition: CINEMATIC_TWEEN }
          }}
          initial="scene1"
          animate={variant}
          className="absolute inset-0 w-full h-full"
          style={{ 
            transformStyle: 'preserve-3d', zIndex: 2,
            willChange: 'transform'
          }}
        >
          {HERO_CARDS.filter(c => Number(c.id) > 5).map((card) => (
            <FloatingImage 
              key={card.id} 
              card={card} 
              activeVariant={variant} 
              isMobile={isMobile} 
              transition={CINEMATIC_TWEEN} 
            />
          ))}
        </motion.div>
      </motion.div>

      <div className="pt-20 w-full h-full pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <HeroText activeVariant={variant} transition={CINEMATIC_TWEEN} />
      </div>

      {/* --- PREMIUM KINETIC SCROLL INDICATOR --- */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1.2 }}
        onClick={() => {
          // Smoothly scrolls past the hero section, leaving a 72px buffer for the sticky nav
          window.scrollBy({ top: window.innerHeight - 72, behavior: 'smooth' });
        }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3 pointer-events-auto group outline-none"
        aria-label="Scroll to explore"
      >
        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground/40 group-hover:text-foreground transition-colors duration-500">
          Scroll
        </span>
        <div className="w-[1px] h-12 md:h-16 bg-foreground/20 relative overflow-hidden">
          <motion.div
            animate={{ y: ['-100%', '300%'] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
            className="absolute top-0 left-0 w-full h-[35%] bg-foreground"
          />
        </div>
      </motion.button>
      
    </section>
  );
}