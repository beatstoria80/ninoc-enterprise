import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Sizes that incur an extra surcharge (XXL and above)
export const SURCHARGE_SIZES = ['XXL', '2XL', '3XL', 'XXXL', '4XL', '5XL'];
export const SIZE_SURCHARGE_AMOUNT = 25000; // Rp 25.000

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
  weight_grams?: number;
  department_id?: string | null;
  category?: string;
  is_perishable?: boolean;
  maxStock?: number; // inventory limit for this variant
  warehouse_id?: string | null;
  origin_postal_code?: string;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Omit<CartItem, 'quantity' | 'size' | 'color' | 'size_surcharge'>, size?: string, color?: string, sizeSurcharge?: number, qty?: number, maxStock?: number) => void;
  removeItem: (id: string, size?: string, color?: string) => void;
  updateQuantity: (id: string, quantity: number, size?: string, color?: string, maxStock?: number) => void;
  clearCart: () => void;
  totalPrice: () => number;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, size, color, sizeSurcharge = 0, qty = 1, maxStock = 999) => {
        const currentItems = get().items;
        const existingItem = currentItems.find(item => item.id === product.id && item.size === size && item.color === color);

        if (existingItem) {
          const newQty = Math.min(maxStock, existingItem.quantity + qty);
          set({
            items: currentItems.map(item =>
              (item.id === product.id && item.size === size && item.color === color)
                ? { 
                    ...item, 
                    quantity: newQty, 
                    maxStock, 
                    image_url: product.image_url || existingItem.image_url,
                    weight_grams: product.weight_grams ?? existingItem.weight_grams,
                    department_id: product.department_id ?? existingItem.department_id,
                    category: product.category ?? existingItem.category,
                    is_perishable: product.is_perishable ?? existingItem.is_perishable,
                    warehouse_id: product.warehouse_id ?? existingItem.warehouse_id,
                    origin_postal_code: product.origin_postal_code ?? existingItem.origin_postal_code,
                    size_surcharge: sizeSurcharge ?? existingItem.size_surcharge
                  }
                : item
            )
          });
        } else {
          const initialQty = Math.min(maxStock, qty);
          set({ items: [...currentItems, { ...product, quantity: initialQty, size, color, size_surcharge: sizeSurcharge, maxStock }] });
        }
      },
      removeItem: (id, size, color) => set({
        items: get().items.filter(item => !(item.id === id && item.size === size && item.color === color))
      }),
      updateQuantity: (id, quantity, size, color, maxStock) => set({
        items: get().items.map(item =>
          (item.id === id && item.size === size && item.color === color)
            ? { ...item, quantity: Math.min(maxStock ?? item.maxStock ?? 999, Math.max(1, quantity)) }
            : item
        )
      }),
      clearCart: () => set({ items: [] }),
      totalPrice: () => get().items.reduce((acc, item) => acc + ((item.price + (item.size_surcharge || 0)) * item.quantity), 0),
    }),
    { 
      name: 'ninoc-cart-storage',
      // Standard localStorage: predictable, robust, and SSR safe
      storage: typeof window !== 'undefined' ? createJSONStorage(() => localStorage) : undefined
    }
  )
);