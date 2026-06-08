import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Sizes that incur an extra surcharge (XXL and above)
export const SURCHARGE_SIZES = ['XXL', '2XL', '3XL', 'XXXL', '4XL', '5XL'];
export const SIZE_SURCHARGE_AMOUNT = 15000; // Rp 15.000

export interface CartItem {
  id: string;
  name: string;
  slug?: string;
  price: number;
  image_url: string | null;
  quantity: number;
  size?: string;
  color?: string;
  size_surcharge: number; // extra charge for XXL+ sizes
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Omit<CartItem, 'quantity' | 'size' | 'color' | 'size_surcharge'>, size?: string, color?: string, sizeSurcharge?: number) => void;
  removeItem: (id: string, size?: string, color?: string) => void;
  updateQuantity: (id: string, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  totalPrice: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, size, color, sizeSurcharge = 0) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(item => item.id === product.id && item.size === size && item.color === color);

        if (existingItem) {
          set({
            items: currentItems.map(item =>
              (item.id === product.id && item.size === size && item.color === color)
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          });
        } else {
          set({ items: [...currentItems, { ...product, quantity: 1, size, color, size_surcharge: sizeSurcharge }] });
        }
      },
      removeItem: (id, size, color) => set({
        items: get().items.filter(item => !(item.id === id && item.size === size && item.color === color))
      }),
      updateQuantity: (id, quantity, size, color) => set({
        items: get().items.map(item =>
          (item.id === id && item.size === size && item.color === color)
            ? { ...item, quantity: Math.max(1, quantity) }
            : item
        )
      }),
      clearCart: () => set({ items: [] }),
      totalPrice: () => get().items.reduce((acc, item) => acc + ((item.price + (item.size_surcharge || 0)) * item.quantity), 0),
    }),
    { name: 'ninoc-cart-storage' }
  )
);