'use client';

import { useState, useEffect } from 'react';
import { motion, Transition, useMotionValue, useSpring, useTransform } from 'framer-motion';
import FloatingImage, { HeroCardConfig } from './FloatingImage';
import HeroText from './HeroText';

// --- THE LAYOUT ENGINE ---
// This factory automatically calculates the explosive 3D Z-axis transitions 
// based solely on your starting X and Y coordinates.
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

// --- THE SANDBOX COORDINATES ---
// Tweak the x/y values to freely position images. 0,0 is the dead center of the screen.
const HERO_CARDS: HeroCardConfig[] = [
  // --- GROUP 1: SOURCE THE HYPE ---
  createCard('1', '/hero/zoro_hoodie.webp', 195, 266, 
    { x: -340, y: -180, rotate: -6 }, { x: -90, y: -220, rotate: -4 }, 1), // Top Left
  createCard('2', 'https://framerusercontent.com/images/8yTDdY0yf5joSqDo9rBQ9tNkWs.jpeg', 209, 294, 
    { x: 300, y: -150, rotate: 5 }, { x: 100, y: -180, rotate: 6 }, 1), // Top Right
  createCard('3', 'https://framerusercontent.com/images/3Qn1pE6cMC4bKEa68dyX8ocUJ4.jpeg', 258, 200, 
    { x: -380, y: 80, rotate: -3 }, { x: -110, y: 80, rotate: -2 }, 1), // Mid Left
  createCard('4', '/hero/OPAF1.webp', 313, 224, 
    { x: 40, y: 220, rotate: 4 }, { x: 10, y: 240, rotate: 2 }, 1), // Bottom Mid
  createCard('5', 'https://framerusercontent.com/images/u3F21zAhsNEOjCugJhBXDTPkqk.jpg', 238, 289, 
    { x: 340, y: 150, rotate: -5 }, { x: 110, y: 160, rotate: -4 }, 1), // Bottom Right

  // --- GROUP 2: SECURE THE FIT ---
  createCard('6', '/hero/zoro_hoodie_back.webp', 293, 387, 
    { x: -300, y: -160, rotate: 4 }, { x: -85, y: -170, rotate: 5 }, 2),
  createCard('7', 'https://framerusercontent.com/images/u1kPUKaC2qqQ2wIHuJ1XUGZkW9A.jpg', 209, 294, 
    { x: 320, y: -120, rotate: -6 }, { x: 85, y: -130, rotate: -5 }, 2),
  createCard('8', 'https://framerusercontent.com/images/0tfyyn5MP8bPWxhdTAOayckjMAI.jpg', 258, 355, 
    { x: -350, y: 140, rotate: 6 }, { x: -95, y: 140, rotate: 4 }, 2),
  createCard('9', '/hero/spongebob.webp', 313, 275, 
    { x: -30, y: 240, rotate: -4 }, { x: -10, y: 210, rotate: -3 }, 2),
  createCard('10', 'https://framerusercontent.com/images/BSaz0fXWU2uFOAYeuZvwhgP7Rk.jpeg', 301, 375, 
    { x: 340, y: 190, rotate: 5 }, { x: 95, y: 170, rotate: 4 }, 2),
];

const transitions = {
  transition1: { delay: 0, duration: 0.9, ease: [0.82, 0.03, 0.71, 1], type: "tween" } as Transition,
  transition2: { delay: 0, duration: 0.6, ease: [0.82, 0.03, 0.71, 1], type: "tween" } as Transition,
  transition3: { bounce: 0, delay: 0, duration: 0.6, type: "spring" } as Transition
};

export default function HeroSection() {
  const [variant, setVariant] = useState<'default' | 'flip1' | 'flip2'>('default');
  const [isMobile, setIsMobile] = useState(false);

  // --- MOUSE PARALLAX ENGINE ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const springConfig = { damping: 30, stiffness: 100, mass: 1.5 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set(clientX / innerWidth - 0.5);
    mouseY.set(clientY / innerHeight - 0.5);
  };

  // --- RESPONSIVE DETECTOR ---
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- AUTOMATED KINETIC LOOP ---
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    const runCycle = (current: string) => {
      if (current === 'default') {
        timeout = setTimeout(() => setVariant('flip1'), 4000);
      } else if (current === 'flip1') {
        timeout = setTimeout(() => setVariant('flip2'), 600); 
      } else if (current === 'flip2') {
        timeout = setTimeout(() => setVariant('default'), 4000);
      }
    };

    runCycle(variant);
    return () => clearTimeout(timeout);
  }, [variant]);

  return (
    // The h-screen class ensures the Hero naturally sits below fixed transparent navigation bars
    <section 
      onMouseMove={handleMouseMove}
      className="relative w-full h-screen supports-[height:100dvh]:h-[100dvh] overflow-hidden bg-white dark:bg-[#050505] text-foreground select-none"
    >
      
      {/* ==========================================
          BACKGROUND LAYER: The Parallax 3D Space
          ========================================== */}
      <motion.div 
        className="absolute inset-0 pointer-events-auto z-0"
        style={{ 
          transformStyle: 'preserve-3d',
          perspective: 1200,
          rotateX, 
          rotateY  
        }}
      >
        {HERO_CARDS.map((card) => (
          <FloatingImage 
            key={card.id} 
            card={card} 
            variant={variant} 
            isMobile={isMobile} 
            transitions={transitions} 
          />
        ))}
      </motion.div>

      {/* ==========================================
          FOREGROUND LAYER: The 3D Text Engine
          ========================================== */}
      {/* Added top padding so typography respects the layout bounds created by fixed headers */}
      <div className="pt-20 w-full h-full pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
        <HeroText variant={variant} transitions={transitions} />
      </div>
      
    </section>
  );
}