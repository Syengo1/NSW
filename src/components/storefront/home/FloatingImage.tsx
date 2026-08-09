'use client';

import { useEffect } from 'react';
import { motion, Transition, useMotionValue, useSpring } from 'framer-motion';
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
  activeVariant: 'default' | 'flip1' | 'flip2';
  isMobile: boolean;
  priority?: boolean;
  transitions: {
    transition1: Transition;
    transition2: Transition;
    transition3: Transition;
  };
}

export default function FloatingImage({ card, activeVariant, isMobile, priority = false, transitions }: FloatingImageProps) {
  // Seamlessly switch between the mobile and desktop coordinate grids
  const layout = isMobile ? card.mobile : card.desktop;
  
  const activeWidth = isMobile ? Math.round(card.width * 0.65) : card.width;
  const activeHeight = isMobile ? Math.round(card.height * 0.65) : card.height;

  // --- ASYNCHRONOUS WAVE MATH ---
  // Calculates a unique floating rhythm for each card so the whole grid mimics a fluid wave
  const waveDuration = 3.5 + (Number(card.id) % 3); 
  const waveDelay = Number(card.id) * 0.2; 

  // --- DEVICE GRAVITY / SLOSH PHYSICS ---
  const rawTiltX = useMotionValue(0);
  const rawTiltY = useMotionValue(0);

  // The Spring config gives the image "weight". 
  // High mass and lower damping means it resists movement, creating a satisfying "slosh" 
  // when the device is jerked, before settling back into place.
  const gravityX = useSpring(rawTiltX, { damping: 20, stiffness: 120, mass: 1.5 });
  const gravityY = useSpring(rawTiltY, { damping: 20, stiffness: 120, mass: 1.5 });

  useEffect(() => {
    // We only attach the gyro listener on mobile devices to save desktop CPU
    // Safely checks if window and the DeviceOrientation API exist to prevent errors
    if (!isMobile || typeof window === 'undefined' || !window.DeviceOrientationEvent) return;

    const handleOrientation = (event: DeviceOrientationEvent) => {
      const { gamma, beta } = event;
      if (gamma !== null && beta !== null) {
        // gamma: left-to-right tilt (-90 to 90)
        // beta: front-to-back tilt (-180 to 180)
        
        // Clamp the values to prevent the image from flying too far off screen during extreme flips
        const clampedGamma = Math.min(Math.max(gamma, -45), 45);
        const clampedBeta = Math.min(Math.max(beta, -45), 45);

        // Map the -45/45 degree tilt to a -25px to 25px translation offset
        rawTiltX.set((clampedGamma / 45) * 25);
        rawTiltY.set((clampedBeta / 45) * 25);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [isMobile, rawTiltX, rawTiltY]);

  return (
    <motion.div
      variants={{
        default: { ...layout.default, transition: transitions.transition1 },
        flip1: { ...layout.flip1, transition: transitions.transition2 },
        flip2: { ...layout.flip2, transition: transitions.transition3 }
      }}
      initial="default"
      animate={activeVariant}
      // INTERACTIVE PHYSICS: Allows the user to grab and throw the card
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
        // GPU Acceleration
        willChange: 'transform, opacity',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        // MATHEMATICAL ANCHOR: Locks the origin to the dead center of the screen
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
      <div className="absolute inset-2 rounded-2xl bg-black/20 dark:bg-white/5 blur-lg transition-opacity duration-500 group-hover:opacity-0 will-change-opacity" />
      
      {/* 2. Deep Interaction Shadow (Expands into a deep shadow or ambient glow) */}
      <div className="absolute -inset-6 rounded-[2.5rem] bg-black/40 dark:bg-white/15 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none will-change-opacity" />

      {/* ==========================================
          ISOLATED WAVE LAYER (The Continuous Sway)
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
        }}
        // CRITICAL FIX: Overflow is isolated here so the shadows behind it can bleed outward
        className="bg-secondary overflow-hidden" 
      >
        {/* ==========================================
            INNER GRAVITY LAYER (The Device Tilt Physics)
            ========================================== */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            x: gravityX, 
            y: gravityY, 
            // Deep Scale-Bleed: The image is scaled up by 15% so that when the 
            // gravity pushes it 25px off center, the edges never reveal the background.
            scale: 1.15,
            willChange: 'transform',
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
      </motion.div>
      
    </motion.div>
  );
}