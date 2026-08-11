'use client';

import { useState } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { ChevronDown, ChevronUp, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import ShopToolbar from "@/components/storefront/ShopToolbar";
import { useShopLayout } from './ShopLayoutContext';
import { cn } from '@/lib/utils';

interface ShopHeaderProps {
  query?: string;
  category?: string;
  count: number;
}

export default function ShopHeader({ query, category, count }: ShopHeaderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isSidebarCollapsed, toggleSidebar } = useShopLayout();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 120 && !isCollapsed) {
      setIsCollapsed(true);
    } else if (latest < 50 && isCollapsed) {
      setIsCollapsed(false);
    }
  });

  const displayTitle = query ? (
    <>Results for <span className="text-muted-foreground">&quot;{query}&quot;</span></>
  ) : (
    category || 'All Drops'
  );

  return (
    /* 
      UI FIXES: 
      1. Adjusted top offsets (top-[76px] md:top-[80px]) to perfectly clear the storefront nav.
      2. Removed the hardcoded `h-[88px]`. The wrapper now fluidly adapts to the height of 
         the stacked mobile elements, completely preventing the toolbar from spilling over.
    */
    <div className="sticky top-[76px] md:top-[80px] z-40 w-full flex justify-center pointer-events-none">
      <motion.div
        layout
        initial={false}
        animate={{
          width: isCollapsed ? "auto" : "100%",
          borderRadius: isCollapsed ? "9999px" : "0px",
          marginTop: isCollapsed ? "12px" : "0px",
        }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "bg-card/95 backdrop-blur-xl border-border origin-top pointer-events-auto flex items-center justify-center will-change-transform shadow-sm",
          isCollapsed ? "border shadow-xl" : "border-b"
        )}
      >
        <AnimatePresence mode="wait" initial={false}>
          {!isCollapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <div className="container mx-auto px-4 py-3.5 md:py-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3.5">
                  
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                      onClick={toggleSidebar}
                      className="hidden lg:flex items-center gap-2 p-2 hover:bg-secondary rounded-lg transition-all text-muted-foreground hover:text-foreground border border-border/50"
                      title={isSidebarCollapsed ? "Expand Filters Sidebar" : "Collapse Filters Sidebar"}
                      aria-label="Toggle Sidebar"
                    >
                      {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {isSidebarCollapsed ? "Show Filters" : "Hide Filters"}
                      </span>
                    </button>

                    <div 
                      className="flex-1 md:flex-initial flex justify-between items-center cursor-pointer md:cursor-default" 
                      onClick={() => setIsCollapsed(true)}
                    >
                      <div>
                        <h1 className="text-xl md:text-2xl font-black uppercase tracking-tighter flex items-center gap-2">
                          {displayTitle}
                        </h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">
                          {count} {count === 1 ? 'Colorway' : 'Colorways'} Found
                        </p>
                      </div>
                      <ChevronUp size={18} className="md:hidden text-muted-foreground opacity-60 hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  
                  <div className="w-full md:w-auto flex items-center justify-between md:justify-end gap-3">
                    <ShopToolbar />
                    <button 
                      onClick={() => setIsCollapsed(true)} 
                      className="hidden md:flex p-2 hover:bg-secondary rounded-full transition-colors group"
                      aria-label="Collapse header"
                    >
                       <ChevronUp size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                    </button>
                  </div>

                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.2 }}
              className="px-2 py-1.5 flex items-center gap-2"
            >
              <button
                onClick={toggleSidebar}
                className="hidden lg:flex items-center p-1.5 hover:bg-secondary/80 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                title={isSidebarCollapsed ? "Expand Filters Sidebar" : "Collapse Filters Sidebar"}
              >
                {isSidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
              </button>

              <button 
                onClick={() => setIsCollapsed(false)} 
                className="flex items-center gap-2.5 px-3.5 py-1.5 hover:bg-secondary/50 rounded-full transition-colors group"
              >
                 <span className="text-xs font-black uppercase tracking-tighter truncate max-w-[140px] md:max-w-xs">
                    {query ? `"${query}"` : (category || 'All Drops')}
                 </span>
                 <span className="w-1 h-1 rounded-full bg-border" />
                 <span className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">
                    {count} {count === 1 ? 'Colorway' : 'Colorways'}
                 </span>
                 <ChevronDown size={14} className="text-muted-foreground ml-1 animate-bounce" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}