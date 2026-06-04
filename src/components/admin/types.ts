// ============ ADMIN DASHBOARD TYPES ============

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'expired';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  specifications?: { label: string; value: string }[] | null;
  price: number;
  category: string;
  image_url: string | null;
  perspective1?: string | null;
  perspective2?: string | null;
  perspective3?: string | null;
  perspective4?: string | null;
  is_featured: boolean;
  price_tag?: string | null;
  badge_text?: string | null;
  created_at: string;
  variants?: Variant[];
}

export interface Variant {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  stock_quantity: number;
}

export interface Order {
  id: string;
  user_id: string | null;
  total_price: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  midtrans_id: string | null;
  snap_token: string | null;
  shipping_address: ShippingAddress | null;
  courier: string | null;
  tracking_id: string | null;
  biteship_order_id?: string | null;
  courier_driver_name?: string | null;
  courier_driver_phone?: string | null;
  courier_link?: string | null;
  estimated_pickup?: string | null;
  estimated_delivery?: string | null;
  printed_at: string | null;
  created_at: string;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name?: string;
  variant_id: string | null;
  size?: string;
  quantity: number;
  price_at_purchase: number;
}

export interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  province?: string;
  postal_code: string;
}

export interface FinanceSummary {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  pendingPayments: number;
  completedOrders: number;
}

export interface ProductCosting {
  id: string;
  product_id: string;
  supplier_cost: number;
  shipping_cost: number;
  packaging_cost: number;
  operasional_pct: number;
  tax_rate: number;
  courier_regency_cost: number;
  courier_inter_regency_cost: number;
  courier_same_day_cost: number;
  courier_instant_cost: number;
  target_margin_pct: number;
  selling_price: number;
}

export interface SupplierCostLog {
  id: string;
  product_id: string;
  product_name?: string;
  old_supplier_cost: number;
  new_supplier_cost: number;
  change_reason: string;
  changed_at: string;
}

export interface PromoImpact {
  id: string;
  product_id: string;
  product_name?: string;
  promo_name: string;
  discount_pct: number;
  discount_amount: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'customer' | 'admin';
  message: string;
  timestamp: string;
  is_read: boolean;
}

export interface ChatSession {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_avatar?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  status: 'open' | 'resolved';
  messages: ChatMessage[];
}

export interface Customer {
  id: string;
  user_id: string;
  customer_number: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  avatar_url: string | null;
  street: string;
  house_number: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  city: string;
  province: string;
  postal_code: string;
  country: string | null;
  is_verified: boolean | null;
  total_orders: number | null;
  total_spent: number | null;
  membership_tier: string | null;
  created_at: string;
}

export interface VoucherActive {
  id: string;
  name: string;
  code: string;
  discount: number;
  min_order: number;
  used_count: number;
  active_until: string;
}

export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'received' | 'completed';
export type ReturnType = 'refund' | 'exchange';

export interface ReturnItem {
  id: string;
  return_id: string;
  order_item_id: string;
  quantity: number;
  reason: string;
}

export interface ReturnRequest {
  id: string;
  order_id: string;
  user_id: string;
  type: ReturnType;
  status: ReturnStatus;
  reason: string;
  admin_notes: string | null;
  refund_amount: number | null;
  created_at: string;
  updated_at: string;
  order?: Order;
  items?: ReturnItem[];
}
