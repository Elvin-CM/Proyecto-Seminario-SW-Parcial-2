import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  maxStock: number;
  addedAt: number;
  expiresAt: number;
}

interface CartState {
  items: CartItem[];
  setItems: (items: CartItem[]) => void;
  addItem: (item: Omit<CartItem, "addedAt" | "expiresAt">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItemMaxStock: (id: string, maxStock: number) => void; // NUEVO
  clearCart: () => void;
  removeExpiredItems: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getAvailableStock: (productId: string, realStock: number) => number;
}

const CART_EXPIRATION_TIME = 15 * 60 * 1000; // 15 min para limpiar el carrito

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      setItems: (items) => set({ items }),

      addItem: (newItem) => {
        const now = Date.now();
        const expiration = now + CART_EXPIRATION_TIME;

        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === newItem.id);

        if (existingItem) {
          const newQuantity = Math.min(
            existingItem.quantity + newItem.quantity,
            newItem.maxStock
          );

          set({
            items: currentItems.map((item) =>
              item.id === newItem.id
                ? {
                    ...item,
                    quantity: newQuantity,
                    maxStock: newItem.maxStock, // NUEVO: actualizar maxStock al re-agregar
                    expiresAt: expiration
                  }
                : item
            ),
          });

        } else {

          const itemWithTime: CartItem = {
            ...newItem,
            addedAt: now,
            expiresAt: expiration
          };

          set({
            items: [...currentItems, itemWithTime],
          });
        }
      },

      removeItem: (id) => {
        set({
          items: get().items.filter((item) => item.id !== id)
        });
      },

      updateQuantity: (id, quantity) => {

        const now = Date.now();
        const expiration = now + CART_EXPIRATION_TIME;

        set({
          items: get().items.map((item) =>
            item.id === id
              ? {
                  ...item,
                  quantity: Math.max(1, Math.min(quantity, item.maxStock)),
                  expiresAt: expiration,
                }
              : item
          ),
        });
      },

      // NUEVO: actualiza solo el maxStock de un item sin tocar el resto
      updateItemMaxStock: (id, maxStock) => {
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, maxStock } : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      removeExpiredItems: () => {
        const now = Date.now();

        set({
          items: get().items.filter((item) => item.expiresAt > now)
        });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + (item.price * item.quantity),
          0
        );
      },

      getAvailableStock: (productId, realStock) => {
        const item = get().items.find((i) => i.id === productId);
        const inCart = item ? item.quantity : 0;
        return realStock - inCart;
      },
    }),
    {
      name: 'shopping-cart-storage',
    }
  )
);

