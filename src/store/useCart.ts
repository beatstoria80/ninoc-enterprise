import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useState, useEffect } from 'react';

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
  totalPrice: number;
  addItem: (product: Omit<CartItem, 'quantity' | 'size' | 'color' | 'size_surcharge'>, size?: string, color?: string, sizeSurcharge?: number, qty?: number, maxStock?: number) => { success: boolean; error?: string };
  removeItem: (id: string, size?: string, color?: string) => void;
  updateQuantity: (id: string, quantity: number, size?: string, color?: string, maxStock?: number) => void;
  clearCart: () => void;
}

const calculateTotal = (items: CartItem[]) => {
  return items.reduce((acc, item) => acc + ((item.price + (item.size_surcharge || 0)) * item.quantity), 0);
};

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      totalPrice: 0,
      addItem: (product, size, color, sizeSurcharge = 0, qty = 1, maxStock = 999) => {
        const currentItems = get().items;
        
        // Single Order Warehouse Conflict Check
        // CRITICAL BUG FIX: Ensure we do not block items that technically share the same physical location
        // but have mismatched metadata (e.g. one has warehouse_id, the other only has origin_postal_code).
        if (currentItems.length > 0) {
          const firstItem = currentItems[0];
          
          const existingWarehouseId = firstItem.warehouse_id;
          const existingPostal = firstItem.origin_postal_code;
          
          const newWarehouseId = product.warehouse_id;
          const newPostal = product.origin_postal_code;

          let isConflict = false;
          
          if (existingWarehouseId || newWarehouseId) {
            // Strict enforcement: if AT LEAST ONE item has a warehouse_id, they MUST match.
            // This blocks mixing a Warehouse Item (Tumbler) with a Generic Item (Kaos).
            if (existingWarehouseId !== newWarehouseId) {
              isConflict = true;
            }
          } else {
            // Fallback: neither item has a warehouse_id.
            // If both have postal codes and they differ, block it.
            if (existingPostal && newPostal && existingPostal !== newPostal) {
              isConflict = true;
            }
          }

          if (isConflict) {
            return { 
              success: false, 
              error: 'Anda tidak dapat menggabungkan produk dari lokasi fasilitas/gudang yang berbeda dalam satu pesanan. Selesaikan atau kosongkan pesanan sebelumnya.' 
            };
          }
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