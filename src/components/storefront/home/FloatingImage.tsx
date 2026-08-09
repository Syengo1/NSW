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
      whileDrag={{ scale: 1.05, zIndex: 50, cursor: 'grabbing' }}
      whileHover={{ scale: 1.02 }}
      className="absolute shadow-2xl bg-secondary cursor-grab select-none"
      style={{
        width: activeWidth, 
        height: activeHeight,
        transformOrigin: 'center center',
        overflow: 'hidden', 
        borderRadius: '16px',
        transformStyle: 'preserve-3d',
        // GPU acceleration and anti-flicker properties
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        left: '50%',
        top: '50%',
        marginLeft: -(activeWidth / 2),
        marginTop: -(activeHeight / 2),
      }}
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
  );
}