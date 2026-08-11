'use client';

import { ReactNode } from 'react';
import { useShopLayout } from './ShopLayoutContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// STRICT TYPING: It expects the rendered Filter and Grid components as props, NOT the raw data.
interface ShopMainContentProps {
  filters: ReactNode;
  grid: ReactNode;
}

export default function ShopMainContent({ filters, grid }: ShopMainContentProps) {
  const { isSidebarCollapsed } = useShopLayout();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-8 transition-all">
      {/* The Sidebar Filters */}
      {filters}
      
      {/* The Resizing Product Grid */}
      <motion.div 
        layout
        className={cn(
          "transition-all duration-500",
          isSidebarCollapsed ? "lg:col-span-12" : "lg:col-span-9"
        )}
      >
        {grid}
      </motion.div>
    </div>
  );
}