import { CheckoutItem, ShippingDetails, PromoDetails } from './CheckoutValidator';

export interface DatabaseProduct {
  id: string;
  price: number;
  name: string;
  supplier_id?: string | null;
  product_costings?: Array<{ supplier_base_price?: number; supplier_surcharge_cost?: number; ninoc_markup?: number }> | any;
  variants?: Array<{ id: string; size?: string | null; color?: string | null }>;
}

export interface ProcessedOrderItem {
  id: string;
  price: number;
  quantity: number;
  name: string;
  size?: string | null;
  color?: string | null;
  supplier_id?: string | null;
  supplier_hpp?: number;
  ninoc_markup?: number;
}

export class PricingEngine {
  private static readonly SURCHARGE_SIZES = new Set(['XXL', '2XL', '3XL', 'XXXL', '4XL', '5XL']);
  private static readonly SIZE_SURCHARGE_AMOUNT = 25000;
  private static readonly PLATFORM_FEE = 2500;

  /**
   * Calculates gross amount and builds item breakdown using O(1) Map lookups.
   */
  public static calculateOrderBreakdown(
    items: CheckoutItem[],
    dbProducts: DatabaseProduct[],
    shipping: ShippingDetails,
    promo?: PromoDetails
  ): { grossAmount: number; midtransItems: ProcessedOrderItem[]; dbOrderItems: any[]; error?: string } {
    // Build O(1) Product Lookup Map to eliminate O(N^2) inner loops
    const productMap = new Map<string, DatabaseProduct>();
    for (const prod of dbProducts) {
      productMap.set(prod.id, prod);
    }

    let calculatedGrossAmount = 0;
    const midtransItems: ProcessedOrderItem[] = [];
    const dbOrderItems: any[] = [];

    for (const item of items) {
      const dbProduct = productMap.get(item.id);
      if (!dbProduct) {
        return { grossAmount: 0, midtransItems: [], dbOrderItems: [], error: `Product not found: ${item.id}` };
      }

      const isSurchargeSize = item.size ? this.SURCHARGE_SIZES.has(item.size.toUpperCase()) : false;
      const surcharge = isSurchargeSize ? this.SIZE_SURCHARGE_AMOUNT : 0;
      const itemPrice = Number(dbProduct.price) + surcharge;
      calculatedGrossAmount += itemPrice * item.quantity;

      // Extract ledger costings securely
      const costing = Array.isArray(dbProduct.product_costings) ? dbProduct.product_costings[0] : dbProduct.product_costings;
      const supplierBasePrice = costing?.supplier_base_price || 0;
      const supplierSurchargeCost = costing?.supplier_surcharge_cost || 0;
      const finalHpp = supplierBasePrice + (isSurchargeSize ? supplierSurchargeCost : 0);
      const ninocMarkup = costing?.ninoc_markup || (itemPrice - finalHpp);

      const itemName = (dbProduct.name + (surcharge > 0 ? ' (XXL+)' : '')).substring(0, 50);

      midtransItems.push({
        id: item.id,
        price: itemPrice,
        quantity: item.quantity,
        name: itemName,
        size: item.size || null,
        color: item.color || null,
        supplier_id: dbProduct.supplier_id || null,
        supplier_hpp: finalHpp,
        ninoc_markup: ninocMarkup,
      });

      // O(1) Variant matching
      let variantId: string | null = null;
      let variantColor: string | null = null;
      if (dbProduct.variants && dbProduct.variants.length > 0) {
        const matchedVariant = dbProduct.variants.find(
          v => v.size === item.size && (!item.color || v.color === item.color)
        );
        variantId = matchedVariant ? matchedVariant.id : dbProduct.variants[0].id;
        variantColor = matchedVariant ? (matchedVariant.color || null) : null;
      }

      dbOrderItems.push({
        id: crypto.randomUUID(),
        product_id: item.id,
        variant_id: variantId,
        product_name: item.name,
        quantity: item.quantity,
        price_at_purchase: itemPrice,
        size: item.size || null,
        color: item.color || variantColor,
        supplier_id: dbProduct.supplier_id || null,
        supplier_hpp: finalHpp,
        ninoc_markup: ninocMarkup,
      });
    }

    // Add Shipping Cost
    midtransItems.push({
      id: 'SHIPPING',
      price: shipping.cost,
      quantity: 1,
      name: `Courier: ${shipping.method.toUpperCase()}`.substring(0, 50),
    });
    calculatedGrossAmount += shipping.cost;

    // Add Platform Fee
    midtransItems.push({
      id: 'PLATFORM_FEE',
      price: this.PLATFORM_FEE,
      quantity: 1,
      name: 'Platform Fee',
    });
    calculatedGrossAmount += this.PLATFORM_FEE;

    // Apply Promo Code
    if (promo && promo.discountAmount > 0) {
      midtransItems.push({
        id: 'PROMO',
        price: -promo.discountAmount,
        quantity: 1,
        name: `Promo: ${promo.code}`.substring(0, 50),
      });
      calculatedGrossAmount -= promo.discountAmount;
    }

    if (calculatedGrossAmount <= 0) {
      return { grossAmount: 0, midtransItems: [], dbOrderItems: [], error: 'Invalid total price' };
    }

    return { grossAmount: calculatedGrossAmount, midtransItems, dbOrderItems };
  }
}
