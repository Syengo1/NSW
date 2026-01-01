import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CartItem = {
  variantId: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
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
          // If item exists, just increment quantity (up to max stock)
          if (existingItem.quantity < existingItem.maxStock) {
            set({
              items: items.map((i) =>
                i.variantId === newItem.variantId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
              isOpen: true, // Auto-open cart on add
            });
          }
        } else {
          // Add new item
          set({ items: [...items, newItem], isOpen: true });
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
    }),
    {
      name: 'nairobi-streetwear-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);