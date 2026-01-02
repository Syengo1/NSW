import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CartItem = {
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  price: number; // Selling Price (in Cents)
  originalPrice?: number; // Was Price (in Cents) - Optional, for Sale items
  image: string;
  size: string;
  color: string;
  quantity: number;
  maxStock: number;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, delta: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getTotalItems: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      addItem: (newItem) => {
        const items = get().items;
        const existingItem = items.find((i) => i.variantId === newItem.variantId);

        if (existingItem) {
          // Smart Logic: Calculate new quantity safely using the LATEST stock limit
          const newQty = Math.min(
            existingItem.quantity + 1, 
            newItem.maxStock // Use fresh stock data from the incoming add action
          );
          
          set({
            items: items.map((i) =>
              i.variantId === newItem.variantId
                ? { 
                    ...i, 
                    // CRITICAL: Update product details to match live data.
                    // If the admin changed the price or image since the user last added it,
                    // this ensures the cart stays accurate without a page reload.
                    price: newItem.price,
                    originalPrice: newItem.originalPrice,
                    maxStock: newItem.maxStock,
                    image: newItem.image, 
                    quantity: newQty 
                  }
                : i
            ),
            isOpen: true, // Auto-open cart on add
          });
        } else {
          set({ items: [...items, { ...newItem, quantity: 1 }], isOpen: true });
        }
      },

      removeItem: (variantId) => {
        set({ items: get().items.filter((i) => i.variantId !== variantId) });
      },

      updateQuantity: (variantId, delta) => {
        const items = get().items.map((item) => {
          if (item.variantId === variantId) {
            const newQty = item.quantity + delta;
            return {
              ...item,
              // Logical Bounds: Min 1, Max available stock
              quantity: Math.max(1, Math.min(newQty, item.maxStock)),
            };
          }
          return item;
        });
        set({ items });
      },

      clearCart: () => set({ items: [] }),

      getCartTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },
    }),
    {
      name: 'nairobi-streetwear-cart',
      storage: createJSONStorage(() => localStorage),
      version: 2, // Bumped version to signal Schema Change (added originalPrice)
      
      // Foolproof Migration: Ensures old carts (v0 or v1) don't crash the app
      migrate: (persistedState: any, version: number) => {
        if (version < 2) {
          // If coming from an older version, we just return the state as-is.
          // Since 'originalPrice' is optional (?), the old objects are still valid.
          return {
            ...persistedState,
            items: persistedState.items || []
          } as CartState;
        }
        return persistedState as CartState;
      },
    }
  )
);