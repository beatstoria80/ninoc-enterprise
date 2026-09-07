export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  description_en?: string;
  price: number;
  original_price?: number | null;
  image_url: string;
  image_alt?: string | null;
  category: string;
  perspective1?: string;
  perspective2?: string;
  perspective3?: string;
  perspective4?: string;
  price_tag?: string | null;
  badge_text?: string | null;
  variants?: { id: string; size: string | null; color: string | null; stock_quantity: number }[];
  specifications?: { label: string; value: string }[] | null;
  measurements?: { size: string; chest?: string; shoulder?: string; sleeve?: string; waist?: string; length: string; leg_opening?: string; thigh?: string; hip?: string }[] | null;
  model_info?: string | null;
  variant_label?: string | null;
}
