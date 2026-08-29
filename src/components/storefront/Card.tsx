// src/components/storefront/Card.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  motion, 
  MotionValue, 
  useTransform, 
  useMotionTemplate, 
  useSpring,
  useMotionValue
} from "framer-motion";
import type { ExploreItem } from "@/app/(storefront)/explore/page";

interface CardProps {
  item: ExploreItem;
  smoothPointerX: MotionValue<number>;
  smoothPointerY: MotionValue<number>;
}

export default function Card({ item, smoothPointerX, smoothPointerY }: CardProps) {
  const router = useRouter();
  const [isHoveredState, setIsHoveredState] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });

  // 1. GLOBAL PARALLAX PHYSICS 
  const maxOffset = item.layout.width * item.layout.parallaxEase;
  const parallaxX = useTransform(smoothPointerX, [0, 1], [-maxOffset, maxOffset]);
  const parallaxY = useTransform(smoothPointerY, [0, 1], [-maxOffset, maxOffset]);

  const x = useMotionTemplate`calc(-50% + ${parallaxX}px)`;
  const y = useMotionTemplate`calc(-50% + ${parallaxY}px)`;

  // 2. LOCAL 3D TILT & LIGHTING PHYSICS
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const isHovered = useMotionValue(0); 

  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);
  const springHover = useSpring(isHovered, { damping: 20, stiffness: 300, mass: 0.2 });

  const rotateX = useTransform(springY, [0, 1], [8, -8]);
  const rotateY = useTransform(springX, [0, 1], [-8, 8]);

  const glareX = useTransform(springX, [0, 1], [0, 100]);
  const glareY = useTransform(springY, [0, 1], [0, 100]);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.2) 0%, transparent 60%)`;
  
  const shadowX = useTransform(springX, [0, 1], [20, -20]);
  const shadowY = useTransform(springY, [0, 1], [20, -20]);
  const boxShadow = useMotionTemplate`${shadowX}px ${shadowY}px 30px -10px rgba(0,0,0,0.5)`;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPos = (e.clientX - rect.left) / rect.width;
    const yPos = (e.clientY - rect.top) / rect.height;
    mouseX.set(xPos);
    mouseY.set(yPos);
  };

  const handlePointerEnter = () => {
    isHovered.set(1);
    setIsHoveredState(true);
  };

  const handlePointerLeave = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
    isHovered.set(0);
    setIsHoveredState(false);
  };

  // Ensure routing only happens on a pure "click", not at the end of a long "drag" swipe
  const handlePointerDown = (e: React.PointerEvent) => {
    setDragStartPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const distance = Math.sqrt(
      Math.pow(e.clientX - dragStartPos.x, 2) + Math.pow(e.clientY - dragStartPos.y, 2)
    );
    if (distance < 5) {
      router.push(`/product/${item.slug}`);
    }
  };

  return (
    <motion.div
      className="absolute flex flex-col items-start gap-3 shrink-0 cursor-pointer active:cursor-grabbing group"
      style={{
        width: `max(140px, min(45vw, ${item.layout.width}px))`,
        top: item.layout.top,
        left: item.layout.left,
        x, 
        y, 
        zIndex: isHoveredState ? 50 : 1, 
      }}
      initial="initial"
      whileHover="hover"
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <motion.div 
        className="relative w-full overflow-visible flex justify-center items-center rounded-xl z-10"
        style={{
          perspective: 1200,
          aspectRatio: 0.8, // Enforce a uniform 4:5 aspect ratio since DB images can vary
        }}
      >
        <motion.div
          className="relative w-full h-full will-change-transform origin-center rounded-xl overflow-hidden border border-border/50 bg-secondary/20"
          style={{
            rotateX,
            rotateY,
            boxShadow,
            transformStyle: "preserve-3d",
          }}
          variants={{
            initial: { scale: 1 },
            hover: { scale: 1.02 }, 
          }}
          transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
        >
          <motion.div 
            className="absolute inset-0 z-20 pointer-events-none mix-blend-overlay"
            style={{ 
              background: glareBackground,
              opacity: springHover
            }}
          />

          <motion.div
             className="w-full h-full relative"
             variants={{
               initial: { scale: 1, filter: "brightness(1) saturate(1)" },
               hover: { scale: 1.06, filter: "brightness(0.9) saturate(1.1)" },
             }}
             transition={{ type: "spring", bounce: 0.1, duration: 0.6 }}
          >
            <Image
              src={item.image}
              alt={item.title}
              fill
              sizes={`(max-width: 768px) 45vw, ${item.layout.width}px`}
              className="object-cover pointer-events-none select-none"
              priority
            />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Populating real DB data: Title, Color, Category, Year */}
      <div className="flex flex-col items-start gap-1 w-full text-[10px] md:text-[11px] leading-tight text-foreground select-none font-mono px-1">
        <p className="font-bold uppercase tracking-widest">{item.title}</p>
        <p className="text-muted-foreground uppercase tracking-widest">Colorway: {item.color}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-muted-foreground/70 uppercase">{item.description}</span>
          <span className="text-muted-foreground/30">•</span>
          <span className="text-muted-foreground/70">{item.year}</span>
        </div>
      </div>
    </motion.div>
  );
}