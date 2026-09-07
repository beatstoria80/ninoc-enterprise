export type CategoryType = 'pakaian' | 'outerwear' | 'footwear' | 'utilities' | 'home' | 'kitchen' | 'ceramics' | 'collectibles' | 'coffee' | 'pastry' | 'rtd' | 'snack' | 'beverage' | 'aksesoris' | string;

export interface Department {
  id: string;
  name: string;
  slug: string;
  gpc_code: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  contact_name: string;
  contact_phone: string;
  street_address: string;
  district: string;
  city: string;
  province: string;
  postal_code: string;
  latitude?: number | null;
  longitude?: number | null;
  is_primary?: boolean;
  is_active?: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  description_en?: string | null;
  price: number;
  original_price?: number | null;
  category: CategoryType;
  sub_category?: string | null;
  image_url: string | null;
  is_featured: boolean;
  department_id?: string | null;
  warehouse_id?: string | null;
  weight_grams?: number | null;
  length_cm?: number | null;
  width_cm?: number | null;
  height_cm?: number | null;
  shelf_life_days?: number | null;
  is_perishable?: boolean;
  departments?: Department | null;
  warehouses?: Warehouse | null;
  created_at: string;
  updated_at: string;
  variant_label?: string | null;
}

export interface Variant {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  stock_quantity: number;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  total_price: number;
  status: 'pending' | 'paid' | 'shipped' | 'cancelled';
  midtrans_id: string | null;
  payment_url: string | null;
  snap_token: string | null;
  shipping_address: Record<string, unknown> | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  price_at_purchase: number;
}
