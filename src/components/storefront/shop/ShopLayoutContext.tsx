'use client';

import { createContext, useContext, useState, ReactNode, useSyncExternalStore } from 'react';

interface ShopLayoutContextType {
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const ShopLayoutContext = createContext<ShopLayoutContextType | undefined>(undefined);

const STORAGE_KEY = 'nsw_shop_sidebar_collapsed';

const emptySubscribe = () => () => {};

export function ShopLayoutProvider({ children }: { children: ReactNode }) {
  // Guarantees perfect server/client hydration matching
  const isHydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  
  // Safely initialize state directly from localStorage.
  // This bypasses the need for useEffect and prevents cascading re-renders.
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return false;
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, String(next));
      }
      return next;
    });
  };

  const setSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsed(collapsed);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, String(collapsed));
    }
  };

  return (
    <ShopLayoutContext.Provider value={{ 
      isSidebarCollapsed: isHydrated ? isSidebarCollapsed : false, 
      toggleSidebar, 
      setSidebarCollapsed 
    }}>
      {children}
    </ShopLayoutContext.Provider>
  );
}

export function useShopLayout() {
  const context = useContext(ShopLayoutContext);
  if (!context) {
    throw new Error('useShopLayout must be used within a ShopLayoutProvider');
  }
  return context;
}