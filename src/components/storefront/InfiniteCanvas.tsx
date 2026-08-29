// src/components/storefront/InfiniteCanvas.tsx
"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimationFrame, useMotionValue, wrap } from "framer-motion";
import Card from "./Card";
import type { ExploreItem } from "@/app/(storefront)/explore/page";

const DRAG_SPEED = 1;
const SCROLL_SPEED = 1;
const LERP_EASE = 0.08;
const MOMENTUM_MULTIPLIER = 180; 

interface InfiniteCanvasProps {
  items: ExploreItem[];
}

export default function InfiniteCanvas({ items }: InfiniteCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const windowSize = useRef({ w: 0, h: 0 });

  const state = useRef({
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    pointerX: 0.5,
    pointerY: 0.5,
    isDragging: false,
    startX: 0,
    startY: 0,
    scrollStartX: 0,
    scrollStartY: 0,
    lastPointerX: 0,
    lastPointerY: 0,
    velocityX: 0,
    velocityY: 0,
    lastTime: 0,
  });

  const canvasX = useMotionValue(0);
  const canvasY = useMotionValue(0);
  const smoothPointerX = useMotionValue(0.5);
  const smoothPointerY = useMotionValue(0.5);

  useEffect(() => {
    windowSize.current = { w: window.innerWidth, h: window.innerHeight };

    const handleResize = () => {
      windowSize.current = { w: window.innerWidth, h: window.innerHeight };
    };
    
    window.addEventListener("resize", handleResize);

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      state.current.targetX -= e.deltaX * SCROLL_SPEED;
      state.current.targetY -= e.deltaY * SCROLL_SPEED;
    };

    const container = containerRef.current;
    if (container) container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      window.removeEventListener("resize", handleResize);
      if (container) container.removeEventListener("wheel", handleWheel);
    };
  }, []);

  useAnimationFrame(() => {
    if (windowSize.current.w === 0) return;

    state.current.currentX += (state.current.targetX - state.current.currentX) * LERP_EASE;
    state.current.currentY += (state.current.targetY - state.current.currentY) * LERP_EASE;

    const wrappedX = wrap(-windowSize.current.w, 0, state.current.currentX);
    const wrappedY = wrap(-windowSize.current.h, 0, state.current.currentY);
    
    canvasX.set(wrappedX);
    canvasY.set(wrappedY);

    const px = smoothPointerX.get();
    const py = smoothPointerY.get();
    smoothPointerX.set(px + (state.current.pointerX - px) * LERP_EASE);
    smoothPointerY.set(py + (state.current.pointerY - py) * LERP_EASE);
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    state.current.isDragging = true;
    state.current.startX = e.clientX;
    state.current.startY = e.clientY;
    state.current.scrollStartX = state.current.targetX;
    state.current.scrollStartY = state.current.targetY;
    
    state.current.lastPointerX = e.clientX;
    state.current.lastPointerY = e.clientY;
    state.current.lastTime = performance.now();
    state.current.velocityX = 0;
    state.current.velocityY = 0;

    document.documentElement.classList.add("dragging");
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (windowSize.current.w === 0) return;

    state.current.pointerX = e.clientX / windowSize.current.w;
    state.current.pointerY = e.clientY / windowSize.current.h;

    if (state.current.isDragging) {
      const now = performance.now();
      const dt = Math.max(1, now - state.current.lastTime); 

      const dx = e.clientX - state.current.lastPointerX;
      const dy = e.clientY - state.current.lastPointerY;
      state.current.velocityX = dx / dt;
      state.current.velocityY = dy / dt;

      state.current.lastPointerX = e.clientX;
      state.current.lastPointerY = e.clientY;
      state.current.lastTime = now;

      const deltaX = e.clientX - state.current.startX;
      const deltaY = e.clientY - state.current.startY;
      state.current.targetX = state.current.scrollStartX + deltaX * DRAG_SPEED;
      state.current.targetY = state.current.scrollStartY + deltaY * DRAG_SPEED;
    }
  };

  const handlePointerUp = () => {
    if (state.current.isDragging) {
      state.current.targetX += state.current.velocityX * MOMENTUM_MULTIPLIER;
      state.current.targetY += state.current.velocityY * MOMENTUM_MULTIPLIER;
    }
    state.current.isDragging = false;
    document.documentElement.classList.remove("dragging");
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full overflow-hidden touch-none bg-background transition-colors duration-500"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <motion.div
        className="absolute top-0 left-0 w-[200vw] h-[200vh] will-change-transform"
        style={{ x: canvasX, y: canvasY }}
      >
        {[
          { id: "quad-1", x: "0vw", y: "0vh" },
          { id: "quad-2", x: "100vw", y: "0vh" },
          { id: "quad-3", x: "0vw", y: "100vh" },
          { id: "quad-4", x: "100vw", y: "100vh" },
        ].map((quad) => (
          <div
            key={quad.id}
            className="absolute top-0 left-0 w-[100vw] h-[100vh]"
            style={{ transform: `translate(${quad.x}, ${quad.y})` }}
          >
            {/* Map over the dynamic database items payload */}
            {items.map((item) => (
              <Card 
                key={`${quad.id}-${item.id}`} 
                item={item} 
                smoothPointerX={smoothPointerX}
                smoothPointerY={smoothPointerY}
              />
            ))}
          </div>
        ))}
      </motion.div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 mix-blend-difference z-10 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className="w-5 h-5 fill-transparent stroke-white stroke-[1.5px] stroke-linecap-round stroke-linejoin-round">
          <path d="M 7.5 4.583 L 9.117 2.967 C 9.605 2.479 10.395 2.479 10.883 2.967 L 12.5 4.583 M 4.583 7.5 L 2.967 9.117 C 2.479 9.605 2.479 10.395 2.967 10.883 L 4.583 12.5 M 15.417 7.5 L 17.033 9.117 C 17.521 9.605 17.521 10.395 17.033 10.883 L 15.417 12.5 M 12.5 15.417 L 10.883 17.033 C 10.395 17.521 9.605 17.521 9.117 17.033 L 7.5 15.417 M 10 3.333 L 10 10 M 10 10 L 10 16.667 M 10 10 L 3.333 10 M 10 10 L 16.667 10" />
        </svg>
        <span className="text-white font-mono font-medium text-xs tracking-tighter">SCROLL / DRAG</span>
      </div>
    </div>
  );
}