export type CategoryType = 'pakaian' | 'utilities' | 'aksesoris';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  category: CategoryType;
  image_url: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
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
  shipping_address: any;
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
