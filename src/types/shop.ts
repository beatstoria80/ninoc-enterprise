export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  description_en?: string;
  price: number;
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
  measurements?: { size: string; chest?: string; waist?: string; length: string; leg_opening?: string }[] | null;
  model_info?: string | null;
}
