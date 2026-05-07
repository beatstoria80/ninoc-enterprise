export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  hpp: number;
  originalPrice?: number;
  discountTag?: string;
  sku?: string;
  status: string;
  bg: string;
  category: string;
  description: string;
  material?: string;
  image?: string;
  perspective1?: string;
  perspective2?: string;
  perspective3?: string;
  perspective4?: string;
  additionalImages?: string[];
  sizes?: string[];
  stock: number;
  featured?: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export type ViewType = 'home' | 'shop' | 'me' | 'cart' | 'success' | 'product' | 'history' | 'receipt' | 'about' | 'notifications' | 'profile_setup' | 'chat' | 'admin';
