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
  desktop: { scene1: CardState; scene2: CardState };
  mobile: { scene1: CardState; scene2: CardState };
}

interface FloatingImageProps {
  card: HeroCardConfig;
  activeVariant: 'scene1' | 'scene2';
  isMobile: boolean;
  priority?: boolean;
  transition: Transition;
}

export default function FloatingImage({ card, activeVariant, isMobile, priority = false, transition }: FloatingImageProps) {
  const layout = isMobile ? card.mobile : card.desktop;
  
  const activeWidth = isMobile ? Math.round(card.width * 0.65) : card.width;
  const activeHeight = isMobile ? Math.round(card.height * 0.65) : card.height;

  const waveDuration = 3.5 + (Number(card.id) % 3); 
  const waveDelay = Number(card.id) * 0.2; 

  // CRITICAL FIX: The opacity duration is slashed to 0.4s. 
  // This forces the images to become fully visible instantly as they slide in, eliminating the "lag" illusion.
  const syncTransition = { ...transition, opacity: { duration: 0.4, ease: "linear" } };

  return (
    <motion.div
      variants={{
        scene1: { ...layout.scene1, transition: syncTransition },
        scene2: { ...layout.scene2, transition: syncTransition }
      }}
      initial="scene1"
      animate={activeVariant}
      drag
      dragElastic={0.15}
      whileDrag={{ scale: 1.15, zIndex: 50, cursor: 'grabbing' }}
      whileHover={{ scale: 1.08 }} 
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
      <div className="absolute inset-2 rounded-2xl bg-black/20 dark:bg-white/5 blur-lg transition-opacity duration-500 group-hover:opacity-0 will-change-opacity" />
      <div className="absolute -inset-6 rounded-[2.5rem] bg-black/40 dark:bg-white/15 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none will-change-opacity" />

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
          scale: 1.05, 
        }}
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