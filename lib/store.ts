import { create } from 'zustand';
import { persist } from 'zustand/middleware';


export interface CartItem {
  id: string;      
  name: string;
  price: number;
  image: string;
  quantity: number;
  maxStock: number; 
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getAvailableStock: (productId: string, realStock: number) => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === newItem.id);

        if (existingItem) {
          const newQuantity = Math.min(
            existingItem.quantity + newItem.quantity,
            newItem.maxStock
          );
          
          set({
            items: currentItems.map((item) =>
              item.id === newItem.id ? { ...item, quantity: newQuantity } : item
            ),
          });
        } else {
          set({ items: [...currentItems, newItem] });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, quantity: quantity } : item
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
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