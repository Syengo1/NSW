import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CartItem = {
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  originalPrice?: number;
  image: string;
  size: string;
  color: string;
  quantity: number;
  maxStock: number;
};

// NEW: Strict type for incoming fresh data from your database
export type SyncCartItem = {
  variantId: string;
  price: number;
  maxStock: number;
  originalPrice?: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  lastAction: number; // Timestamp for triggering animations across the app
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, delta: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getTotalItems: () => number;
  // NEW: Action to sync local cart with fresh server data
  syncCart: (freshData: SyncCartItem[]) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      lastAction: 0,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

      addItem: (newItem) => {
        const items = get().items;
        const existingItem = items.find((i) => i.variantId === newItem.variantId);
        
        const timestamp = Date.now();

        if (existingItem) {
          const newQty = Math.min(existingItem.quantity + 1, newItem.maxStock);
          set({
            items: items.map((i) =>
              i.variantId === newItem.variantId
                ? { 
                    ...i, 
                    price: newItem.price,
                    originalPrice: newItem.originalPrice,
                    maxStock: newItem.maxStock,
                    image: newItem.image, 
                    quantity: newQty 
                  }
                : i
            ),
            isOpen: true,
            lastAction: timestamp
          });
        } else {
          set({ 
            items: [...items, { ...newItem, quantity: 1 }], 
            isOpen: true,
            lastAction: timestamp
          });
        }
      },

      removeItem: (variantId) => {
        set({ 
          items: get().items.filter((i) => i.variantId !== variantId),
          lastAction: Date.now() 
        });
      },

      updateQuantity: (variantId, delta) => {
        const items = get().items.map((item) => {
          if (item.variantId === variantId) {
            const newQty = item.quantity + delta;
            return {
              ...item,
              quantity: Math.max(1, Math.min(newQty, item.maxStock)),
            };
          }
          return item;
        });
        set({ items, lastAction: Date.now() });
      },

      clearCart: () => set({ items: [], lastAction: Date.now() }),

      getCartTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      // NEW: Implementation of syncCart to prevent stale data
      syncCart: (freshData) => {
        set((state) => {
          const updatedItems = state.items.map((item) => {
            const fresh = freshData.find((f) => f.variantId === item.variantId);
            if (fresh) {
              return {
                ...item,
                price: fresh.price,
                maxStock: fresh.maxStock,
                originalPrice: fresh.originalPrice ?? item.originalPrice,
                // Clamp quantity so users can't buy more than what is newly available
                quantity: Math.min(item.quantity, fresh.maxStock),
              };
            }
            return item;
          });

          // Automatically remove items that just went out of stock (maxStock === 0)
          const validItems = updatedItems.filter((item) => item.maxStock > 0);

          return { items: validItems, lastAction: Date.now() };
        });
      },
    }),
    {
      name: 'nairobi-streetwear-cart',
      storage: createJSONStorage(() => localStorage),
      version: 2,
      // FIX: Replaced 'any' with 'unknown' to satisfy ESLint
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2) {
          // Safely cast unknown to expected shape before migrating
          const state = persistedState as { items?: CartItem[] } | null;
          return { ...state, items: state?.items || [] } as CartState;
        }
        return persistedState as CartState;
      },
    }
  )
);