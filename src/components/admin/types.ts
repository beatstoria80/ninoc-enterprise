// ============ ADMIN DASHBOARD TYPES ============

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'expired';

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
  specifications?: { label: string; value: string }[] | null;
  measurements?: { size: string; chest?: string; waist?: string; length: string; leg_opening?: string }[] | null;
  model_info?: string | null;
  price: number;
  category: string;
  sub_category?: string | null;
  image_url: string | null;
  image_alt?: string | null;
  perspective1?: string | null;
  perspective2?: string | null;
  perspective3?: string | null;
  perspective4?: string | null;
  is_featured: boolean;
  price_tag?: string | null;
  badge_text?: string | null;
  affiliate_eligible?: boolean;
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
  variants?: Variant[];
}

export interface Variant {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  stock_quantity: number;
  reorder_point?: number | null;
  sku?: string | null;
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
  print_count?: number;
  last_printed_by?: string;
  last_printed_at?: string;
  notes?: string | null;
  refund_bank_details?: {
    bank_name: string;
    account_number: string;
    account_name: string;
    submitted_at: string;
  } | null;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  product_name?: string;
  variant_id: string | null;
  size?: string;
  color?: string | null;
  sku?: string | null;
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
  address_type?: string;
  shipping_method?: string;
  shipping_cost?: number;
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
  return_cost?: number;
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
  is_auto_reply?: boolean;
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
  crm_status?: 'potential' | 'active' | 'general' | 'bad' | string;
  priority?: 'urgent' | 'high' | 'medium' | 'low' | string;
  assigned_admin?: string | null;
  is_taken_over?: boolean;
  created_at?: string;
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
  birth_date: string | null;
  gender: string | null;
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

export type CollectionStatus = 'active' | 'scheduled' | 'draft';
export type CollectionType = 'manual' | 'smart';

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  banner_url: string | null;
  status: CollectionStatus;
  start_date: string | null;
  end_date: string | null;
  collection_type: CollectionType;
  created_at: string;
  updated_at: string;
  products?: Product[];
}

export interface CollectionProduct {
  id: string;
  collection_id: string;
  product_id: string;
  created_at: string;
}

export type AffiliateTier = 'bronze' | 'silver' | 'gold';
export type AffiliateStatus = 'active' | 'suspended';

export interface Affiliate {
  id: string;
  user_id: string;
  application_id: string | null;
  code: string;
  tier: AffiliateTier;
  commission_rate: number;
  balance: number;
  status: AffiliateStatus;
  created_at: string;
  updated_at: string;
}

export interface AffiliateLink {
  id: string;
  affiliate_id: string;
  code: string;
  destination_url: string;
  clicks: number;
  created_at: string;
}

export type AffiliateCommissionStatus = 'pending' | 'available' | 'paid' | 'rejected';

export interface AffiliateCommission {
  id: string;
  affiliate_id: string;
  order_id: string;
  amount: number;
  status: AffiliateCommissionStatus;
  created_at: string;
  updated_at: string;
}

export type WABroadcastStatus = 'draft' | 'sending' | 'completed' | 'failed';

export interface WABroadcastCampaign {
  id: string;
  campaign_name: string;
  audience_segment: string;
  message_template: string;
  recipient_count: number;
  cost_per_message: number;
  total_cost: number;
  status: WABroadcastStatus;
  sent_at: string | null;
  created_at: string;
  created_by?: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string | null;
  rating: number;
  review_text: string | null;
  author_name: string;
  is_verified_purchase: boolean;
  status: 'published' | 'hidden';
  created_at: string;
}
