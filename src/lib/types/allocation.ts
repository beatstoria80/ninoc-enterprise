/**
 * Allocation Module Type Definitions
 * 
 * Shared interfaces for the Supplier Allocation & Curation system.
 * Used by SubmissionsTab (Admin) and RequestAllocationModal (Supplier).
 */

export interface VariantSubmission {
  size: string;
  color: string;
  initial_stock: number;
}

export interface SupplierDetail {
  name: string;
  supplier_code: string | null;
  pillar?: string;
  status?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface Submission {
  id: string;
  supplier_id: string;
  category_id: string | null;
  sub_category_id: string | null;
  product_name: string;
  description: string | null;
  specifications: Record<string, any> | null;
  base_hpp: number;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  images: string[];
  variants_data: VariantSubmission[];
  weight_grams: number;
  material: string | null;
  brand: string | null;
  created_at: string;
  updated_at: string;
  // Joined relations
  suppliers?: SupplierDetail | null;
  categories?: { name: string } | null;
  sub_categories?: { name: string } | null;
}

export interface SupplierBasic {
  id: string;
  name: string;
  pillar: 'FASHION' | 'FNB' | string;
  status: string;
}

export interface SupplierProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  image_url: string | null;
  category: string | null;
  is_perishable: boolean;
  created_at: string;
  product_variants: SupplierProductVariant[];
}

export interface SupplierProductVariant {
  id: string;
  size: string | null;
  color: string | null;
  stock_quantity: number;
  sku: string | null;
}
