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
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Omit<CartItem, 'quantity' | 'size' | 'color' | 'size_surcharge'>, size?: string, color?: string, sizeSurcharge?: number) => void;
  removeItem: (id: string, size?: string, color?: string) => void;
  updateQuantity: (id: string, quantity: number, size?: string, color?: string) => void;
  clearCart: () => void;
  totalPrice: () => number;
}

// Cached member state to avoid repetitive expensive parsing
let cachedIsMember: boolean | null = null;

const checkIsMember = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (cachedIsMember !== null) return cachedIsMember;
  
  // O(1) Check for cookies first (Supabase SSR)
  if (typeof document !== 'undefined' && document.cookie) {
    if (/sb-.*-auth-token/.test(document.cookie)) {
      cachedIsMember = true;
      return true;
    }
  }

  // Fallback O(1) approximate check for localStorage
  try {
    const keys = Object.keys(window.localStorage);
    cachedIsMember = keys.some(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    return cachedIsMember;
  } catch (e) {
    return false;
  }
};

const smartCartStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === 'undefined') return null;
    try {
      const local = window.localStorage.getItem(name);
      if (local) return local;
      return window.sessionStorage.getItem(name);
    } catch (e) {
      console.warn('smartCartStorage getItem error:', e);
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === 'undefined') return;
    try {
      const isMember = checkIsMember();

      if (isMember) {
        window.localStorage.setItem(name, value);
        window.sessionStorage.removeItem(name);
      } else {
        window.sessionStorage.setItem(name, value);
        window.localStorage.removeItem(name);
      }
    } catch (e) {
      console.warn('smartCartStorage setItem error:', e);
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(name);
      window.sessionStorage.removeItem(name);
    } catch (e) {
      console.warn('smartCartStorage removeItem error:', e);
    }
  }
};

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
    { 
      name: 'ninoc-cart-storage',
      storage: typeof window !== 'undefined' ? createJSONStorage(() => smartCartStorage) : undefined
    }
  )
);