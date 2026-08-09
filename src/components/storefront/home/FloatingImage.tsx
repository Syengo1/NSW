'use client';

import { motion, Transition } from 'framer-motion';
import Image from 'next/image';

export interface CardState {
  x: number;
  y: number;
  z: number;
  rotate: number;
  scale: number;
  opacity: number;
}

export interface HeroCardConfig {
  id: string;
  src: string;
  width: number;
  height: number;
  desktop: { default: CardState; flip1: CardState; flip2: CardState };
  mobile: { default: CardState; flip1: CardState; flip2: CardState };
}

interface FloatingImageProps {
  card: HeroCardConfig;
  variant: 'default' | 'flip1' | 'flip2';
  isMobile: boolean;
  priority?: boolean;
  transitions: {
    transition1: Transition;
    transition2: Transition;
    transition3: Transition;
  };
}

export default function FloatingImage({ card, variant, isMobile, priority = false, transitions }: FloatingImageProps) {
  const layout = isMobile ? card.mobile : card.desktop;
  
  const activeWidth = isMobile ? Math.round(card.width * 0.65) : card.width;
  const activeHeight = isMobile ? Math.round(card.height * 0.65) : card.height;

  // --- ASYNCHRONOUS WAVE MATH ---
  const waveDuration = 3.5 + (Number(card.id) % 3); 
  const waveDelay = Number(card.id) * 0.2; 

  return (
    <motion.div
      variants={{
        default: { ...layout.default, transition: transitions.transition1 },
        flip1: { ...layout.flip1, transition: transitions.transition2 },
        flip2: { ...layout.flip2, transition: transitions.transition3 }
      }}
      initial="default"
      animate={variant}
      drag
      dragElastic={0.1}
      // POP EFFECT: Scales up strongly to meet the user's finger/cursor
      whileDrag={{ scale: 1.15, zIndex: 50, cursor: 'grabbing' }}
      whileHover={{ scale: 1.08 }} 
      // THE GROUP TRIGGER: Enables the child layers to react to the hover state
      className="group absolute cursor-grab select-none"
      style={{
        width: activeWidth, 
        height: activeHeight,
        transformOrigin: 'center center',
        borderRadius: '16px',
        transformStyle: 'preserve-3d',
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        left: '50%',
        top: '50%',
        marginLeft: -(activeWidth / 2),
        marginTop: -(activeHeight / 2),
      }}
    >
      
      {/* ==========================================
          GPU SHADOW ENGINE
          ========================================== */}
      {/* 1. Base Shadow (Visible at rest, recedes on hover) */}
      <div className="absolute inset-2 rounded-2xl bg-black/20 dark:bg-white/5 blur-lg transition-opacity duration-500 group-hover:opacity-0" />
      
      {/* 2. Deep Interaction Shadow (Expands into a deep shadow or ambient glow) */}
      <div className="absolute -inset-6 rounded-[2.5rem] bg-black/40 dark:bg-white/15 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />


      {/* ==========================================
          ISOLATED WAVE LAYER (Prevents transform collisions)
          ========================================== */}
      <motion.div
        animate={{
          y: ['-2%', '2%'],       
          rotateZ: [-1.5, 1.5],   
        }}
        transition={{
          duration: waveDuration,
          delay: waveDelay,
          repeat: Infinity,
          repeatType: 'mirror',
          ease: 'easeInOut',      
        }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          willChange: 'transform',
          scale: 1.05, // The Scale-Bleed trick to prevent background clipping during rotation
        }}
        // CRITICAL FIX: Overflow is isolated here so the shadows behind it can bleed outward
        className="bg-secondary overflow-hidden" 
      >
        <Image 
          src={card.src} 
          alt={`Hero Drop ${card.id}`} 
          unoptimized 
          fill 
          priority={priority}
          sizes="(max-width: 768px) 30vw, 300px"
          draggable={false}
          className="pointer-events-none object-cover" 
        />
      </motion.div>
      
    </motion.div>
  );
}