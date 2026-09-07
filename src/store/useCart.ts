import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useState, useEffect } from 'react';
import { SURCHARGE_SIZES, SIZE_SURCHARGE_AMOUNT } from '@/lib/constants/pricing';
import { CartDomainService } from '@/domain/cart/CartDomainService';

// Re-export for backward compatibility — existing consumers import from '@/store/useCart'
export { SURCHARGE_SIZES, SIZE_SURCHARGE_AMOUNT };

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
  warehouse_name?: string;
  bundle_min_qty?: number | null;
  bundle_discount_amount?: number | null;
}

interface CartStore {
  items: CartItem[];
  totalPrice: number;
  addItem: (product: Omit<CartItem, 'quantity' | 'size' | 'color' | 'size_surcharge'>, size?: string, color?: string, sizeSurcharge?: number, qty?: number, maxStock?: number) => { success: boolean; error?: string };
  removeItem: (id: string, size?: string, color?: string) => void;
  updateQuantity: (id: string, quantity: number, size?: string, color?: string, maxStock?: number) => void;
  clearCart: () => void;
  clearAndAddItem: (product: Omit<CartItem, 'quantity' | 'size' | 'color' | 'size_surcharge'>, size?: string, color?: string, sizeSurcharge?: number, qty?: number, maxStock?: number) => void;
}

const calculateTotal = (items: CartItem[]) => {
  return items.reduce((acc, item) => {
    let itemTotal = (item.price + (item.size_surcharge || 0)) * item.quantity;
    if (item.bundle_min_qty && item.bundle_discount_amount && item.quantity >= item.bundle_min_qty) {
      const bundleMultiplier = Math.floor(item.quantity / item.bundle_min_qty);
      itemTotal -= (bundleMultiplier * item.bundle_discount_amount);
    }
    return acc + itemTotal;
  }, 0);
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totalPrice: 0,
      addItem: (product, size, color, sizeSurcharge = 0, qty = 1, maxStock = 999) => {
        const currentItems = get().items;
        
        const validation = CartDomainService.validateWarehouseConflict(currentItems, product);
        if (!validation.isValid) {
          return { success: false, error: validation.error };
        }

        const existingItem = currentItems.find(item => item.id === product.id && item.size === size && item.color === color);
        let newItems;
        if (existingItem) {
          const newQty = Math.min(maxStock, existingItem.quantity + qty);
          newItems = currentItems.map(item =>
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
                  warehouse_name: product.warehouse_name ?? existingItem.warehouse_name,
                  bundle_min_qty: product.bundle_min_qty ?? existingItem.bundle_min_qty,
                  bundle_discount_amount: product.bundle_discount_amount ?? existingItem.bundle_discount_amount,
                  size_surcharge: sizeSurcharge ?? existingItem.size_surcharge
                }
              : item
          );
        } else {
          const initialQty = Math.min(maxStock, qty);
          newItems = [...currentItems, { ...product, quantity: initialQty, size, color, size_surcharge: sizeSurcharge, maxStock }];
        }
        set({ items: newItems, totalPrice: calculateTotal(newItems) });
        return { success: true };
      },
      removeItem: (id, size, color) => {
        const newItems = get().items.filter(item => !(item.id === id && item.size === size && item.color === color));
        set({ items: newItems, totalPrice: calculateTotal(newItems) });
      },
      updateQuantity: (id, quantity, size, color, maxStock) => {
        const newItems = get().items.map(item =>
          (item.id === id && item.size === size && item.color === color)
            ? { ...item, quantity: Math.min(maxStock ?? item.maxStock ?? 999, Math.max(1, quantity)) }
            : item
        );
        set({ items: newItems, totalPrice: calculateTotal(newItems) });
      },
      clearCart: () => set({ items: [], totalPrice: 0 }),
      clearAndAddItem: (product, size, color, sizeSurcharge = 0, qty = 1, maxStock = 999) => {
        const initialQty = Math.min(maxStock, qty);
        const newItem = { ...product, quantity: initialQty, size, color, size_surcharge: sizeSurcharge, maxStock };
        set({ items: [newItem], totalPrice: calculateTotal([newItem]) });
      },
    }),
    { 
      name: 'ninoc-cart-storage',
      // Standard localStorage: predictable, robust, and SSR safe
      storage: typeof window !== 'undefined' ? createJSONStorage(() => localStorage) : undefined
    }
  )
);

export const useHydratedCart = () => {
  const cart = useCart();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setIsHydrated(true);
  }, []);

  return {
    ...cart,
    items: isHydrated ? cart.items : [],
    totalPrice: isHydrated ? cart.totalPrice : 0,
    isHydrated
  };
};

export interface CartUIConflictInfo {
  isOpen: boolean;
  currentWarehouseName: string;
  newWarehouseName: string;
  product: any;
  options: {
    size?: string;
    color?: string;
    sizeSurcharge?: number;
    qty?: number;
    maxStock?: number;
  };
}

interface CartUIStore {
  conflictInfo: CartUIConflictInfo | null;
  setConflictInfo: (info: CartUIConflictInfo | null) => void;
}

export const useCartUI = create<CartUIStore>((set) => ({
  conflictInfo: null,
  setConflictInfo: (info) => set({ conflictInfo: info }),
}));