'use client';

import { motion, Transition } from 'framer-motion';
import Link from 'next/link';

interface HeroTextProps {
  variant: 'default' | 'flip1' | 'flip2';
  transitions: {
    transition1: Transition;
    transition2: Transition;
    transition3: Transition;
  };
}

export default function HeroText({ variant, transitions }: HeroTextProps) {
  return (
    <div 
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
      style={{ perspective: 1200, transformStyle: 'preserve-3d' }}
    >
      {/* Subtle radial shadow to guarantee text contrast against busy cards */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.7)_0%,rgba(255,255,255,0)_60%)] dark:bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.7)_0%,rgba(0,0,0,0)_60%)] opacity-100" />

      {/* TEXT 1 (Visible during Default state) */}
      <motion.div
        variants={{
          default: { rotateY: 0, opacity: 1, pointerEvents: 'auto', transition: transitions.transition1 },
          flip1: { rotateY: -90, opacity: 0, pointerEvents: 'none', transition: transitions.transition2 },
          flip2: { rotateY: -90, opacity: 0, pointerEvents: 'none', transition: transitions.transition3 }
        }}
        initial="default"
        animate={variant}
        transformTemplate={({ rotateY }) => `rotateY(${rotateY})`}
        className="absolute flex flex-col items-center justify-center text-center gap-7 px-4 w-full max-w-[400px]"
        style={{ transformStyle: 'preserve-3d', transformPerspective: 1200 }}
      >
        <h1 className="font-semibold text-[40px] md:text-[49px] leading-[1.1em] tracking-[-0.01em] text-[#050505] dark:text-white drop-shadow-md">
          Source The <br/> Hype
        </h1>
        <p className="font-medium text-[15px] md:text-[17px] leading-[1.5em] tracking-[-0.01em] text-[#666666] dark:text-[#a3a3a3]">
           Your ultimate destination for exclusive streetwear, authentic sneakers, and premium apparel.
        </p>
        <Link 
          href="/shop" 
          className="flex items-center justify-center bg-[#050505] dark:bg-white text-white dark:text-[#050505] px-8 h-[40px] rounded-full font-medium text-[14px] tracking-[-0.01em] hover:scale-[1.05] active:scale-[0.98] transition-transform shadow-lg pointer-events-auto"
        >
          Shop Collection
        </Link>
      </motion.div>

      {/* TEXT 2 (Visible during Flip 2 state) */}
      <motion.div
        variants={{
          default: { rotateY: 90, opacity: 0, pointerEvents: 'none', transition: transitions.transition1 },
          flip1: { rotateY: 90, opacity: 0, pointerEvents: 'none', transition: transitions.transition2 },
          flip2: { rotateY: 0, opacity: 1, pointerEvents: 'auto', transition: transitions.transition3 }
        }}
        initial="default"
        animate={variant}
        transformTemplate={({ rotateY }) => `rotateY(${rotateY})`}
        className="absolute flex flex-col items-center justify-center text-center gap-7 px-4 w-full max-w-[400px]"
        style={{ transformStyle: 'preserve-3d', transformPerspective: 1200 }}
      >
        <h1 className="font-semibold text-[40px] md:text-[49px] leading-[1.1em] tracking-[-0.01em] text-[#050505] dark:text-white drop-shadow-md">
          Secure The <br/> Fit
        </h1>
        <p className="font-medium text-[15px] md:text-[17px] leading-[1.5em] tracking-[-0.01em] text-[#666666] dark:text-[#a3a3a3]">
           Stay ahead of the culture. Authentic Nairobi hardware delivered straight to your door.
        </p>
        <Link 
          href="/shop" 
          className="flex items-center justify-center bg-[#050505] dark:bg-white text-white dark:text-[#050505] px-8 h-[40px] rounded-full font-medium text-[14px] tracking-[-0.01em] hover:scale-[1.05] active:scale-[0.98] transition-transform shadow-lg pointer-events-auto"
        >
          Explore Drops
        </Link>
      </motion.div>
    </div>
  );
}