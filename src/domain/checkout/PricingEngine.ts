import { CheckoutItem, ShippingDetails, PromoDetails } from './CheckoutValidator';
import { FlashSaleItem, FlashSaleService } from '@/lib/domain/flashSale';
import {
  SURCHARGE_SIZES,
  SIZE_SURCHARGE_AMOUNT,
  PLATFORM_FEE,
  MAX_ITEM_NAME_LENGTH,
} from '@/lib/constants/pricing';

export interface DatabaseProduct {
  id: string;
  price: number;
  name: string;
  stock_quantity?: number | null;
  stock?: number | null;
  supplier_id?: string | null;
  product_costings?: Array<{ supplier_base_price?: number; supplier_surcharge_cost?: number; ninoc_markup?: number }> | any;
  variants?: Array<{ id: string; size?: string | null; color?: string | null; stock_quantity?: number | null }>;
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

export interface PricingPolicyConfig {
  surchargeSizes: Set<string>;
  sizeSurchargeAmount: number;
  platformFee: number;
  maxItemNameLength: number;
}

const DEFAULT_PRICING_POLICY: PricingPolicyConfig = {
  surchargeSizes: new Set(SURCHARGE_SIZES),
  sizeSurchargeAmount: SIZE_SURCHARGE_AMOUNT,
  platformFee: PLATFORM_FEE,
  maxItemNameLength: MAX_ITEM_NAME_LENGTH,
};

export class PricingEngine {
  private static readonly SURCHARGE_SIZES = DEFAULT_PRICING_POLICY.surchargeSizes;
  private static readonly SIZE_SURCHARGE_AMOUNT = DEFAULT_PRICING_POLICY.sizeSurchargeAmount;
  private static readonly PLATFORM_FEE = DEFAULT_PRICING_POLICY.platformFee;

  private readonly policy: PricingPolicyConfig;

  constructor(policy: Partial<PricingPolicyConfig> = {}) {
    this.policy = { ...DEFAULT_PRICING_POLICY, ...policy };
  }

  /**
   * Calculates gross amount and builds item breakdown using exact case-insensitive O(1) Map lookups.
   * Eliminates arbitrary variants[0] assignment when variant_id is unmatched.
   */
  public calculateOrderBreakdownInstance(
    items: CheckoutItem[],
    dbProducts: DatabaseProduct[],
    shipping: ShippingDetails,
    promo?: PromoDetails,
    activeFlashSales: FlashSaleItem[] = []
  ): { grossAmount: number; midtransItems: ProcessedOrderItem[]; dbOrderItems: any[]; error?: string } {
    const productMap = new Map<string, DatabaseProduct>();
    const variantMap = new Map<string, { id: string; color: string | null }>();

    for (const prod of dbProducts) {
      productMap.set(prod.id, prod);
      if (prod.variants && Array.isArray(prod.variants)) {
        for (const v of prod.variants) {
          const normSize = (v.size || '').toUpperCase().trim();
          const normColor = (v.color || '').toUpperCase().trim();
          variantMap.set(`${prod.id}#${normSize}#${normColor}`, { id: v.id, color: v.color || null });
          if (!variantMap.has(`${prod.id}#${normSize}#`)) {
            variantMap.set(`${prod.id}#${normSize}#`, { id: v.id, color: v.color || null });
          }
        }
      }
    }

    let calculatedGrossAmount = 0;
    const midtransItems: ProcessedOrderItem[] = [];
    const dbOrderItems: any[] = [];

    for (const item of items) {
      const dbProduct = productMap.get(item.id);
      if (!dbProduct) {
        return { grossAmount: 0, midtransItems: [], dbOrderItems: [], error: `Product not found: ${item.id}` };
      }

      const itemSizeUpper = item.size ? item.size.toUpperCase().trim() : '';
      const itemColorUpper = item.color ? item.color.toUpperCase().trim() : '';
      const isSurchargeSize = itemSizeUpper ? this.policy.surchargeSizes.has(itemSizeUpper) : false;
      const surcharge = isSurchargeSize ? this.policy.sizeSurchargeAmount : 0;
      const itemPrice = Number(dbProduct.price) + surcharge;

      // True O(1) Variant Lookup — strictly resolve exact or size-only match
      const exactKey = `${item.id}#${itemSizeUpper}#${itemColorUpper}`;
      const sizeKey = `${item.id}#${itemSizeUpper}#`;
      const matchedVariant = variantMap.get(exactKey) || (itemSizeUpper ? variantMap.get(sizeKey) : undefined);
      
      const variantId = matchedVariant?.id || null;
      const variantColor = matchedVariant?.color || item.color || null;

      // Apply Flash Sale Pricing if eligible
      const flashSaleMatch = FlashSaleService.evaluateFlashSalePricing(item.id, variantId, activeFlashSales);
      let finalItemPrice = itemPrice;
      let flashSaleId = null;
      let flashSaleItemId = null;

      if (flashSaleMatch) {
        // Enforce max qty limit per user
        if (item.quantity > flashSaleMatch.max_qty_per_user) {
           return { grossAmount: 0, midtransItems: [], dbOrderItems: [], error: `Batas pembelian untuk produk ${dbProduct.name} saat Flash Sale adalah ${flashSaleMatch.max_qty_per_user} pcs.` };
        }
        finalItemPrice = Number(flashSaleMatch.flash_sale_price) + surcharge; // Apply base flash price, preserve surcharge
        flashSaleId = flashSaleMatch.flash_sale_id;
        flashSaleItemId = flashSaleMatch.id;
      }
      
      calculatedGrossAmount += finalItemPrice * item.quantity;

      const costing = Array.isArray(dbProduct.product_costings) ? dbProduct.product_costings[0] : dbProduct.product_costings;
      const supplierBasePrice = costing?.supplier_base_price || 0;
      const supplierSurchargeCost = costing?.supplier_surcharge_cost || 0;
      const finalHpp = supplierBasePrice + (isSurchargeSize ? supplierSurchargeCost : 0);
      const ninocMarkup = costing?.ninoc_markup || (finalItemPrice - finalHpp);

      const suffix = surcharge > 0 ? ' (XXL+)' : (flashSaleMatch ? ' [FLASH SALE]' : '');
      const itemName = `${dbProduct.name}${suffix}`.substring(0, this.policy.maxItemNameLength);

      midtransItems.push({
        id: item.id,
        price: finalItemPrice,
        quantity: item.quantity,
        name: itemName,
        size: item.size || null,
        color: item.color || null,
        supplier_id: dbProduct.supplier_id || null,
        supplier_hpp: finalHpp,
        ninoc_markup: ninocMarkup,
      });

      dbOrderItems.push({
        id: crypto.randomUUID(),
        product_id: item.id,
        variant_id: variantId,
        product_name: item.name,
        quantity: item.quantity,
        price_at_purchase: finalItemPrice,
        size: item.size || null,
        color: variantColor,
        supplier_id: dbProduct.supplier_id || null,
        supplier_hpp: finalHpp,
        ninoc_markup: ninocMarkup,
        flash_sale_id: flashSaleId,
        flash_sale_item_id: flashSaleItemId,
        flash_sale_max_qty: flashSaleMatch ? flashSaleMatch.max_qty_per_user : null
      });
    }

    // Sort dbOrderItems by product_id and variant_id to guarantee deterministic row-level lock ordering
    // and prevent PostgreSQL deadlock situations (SQLSTATE 40P01) during concurrent checkouts.
    dbOrderItems.sort((a, b) => {
      const pCompare = a.product_id.localeCompare(b.product_id);
      if (pCompare !== 0) return pCompare;
      return (a.variant_id || '').localeCompare(b.variant_id || '');
    });

    // Add Shipping Cost
    const shipments = (shipping as any).shipments || (Array.isArray(shipping) ? shipping : null);
    if (shipments && shipments.length > 0) {
      let totalShippingCost = 0;
      shipments.forEach((s: any, idx: number) => {
        const cost = Number(s.shipping_cost || s.cost || 0);
        midtransItems.push({
          id: `SHIPPING_${idx}`,
          price: cost,
          quantity: 1,
          name: `Courier: ${s.courier_name || s.method}`.substring(0, this.policy.maxItemNameLength),
        });
        totalShippingCost += cost;
      });
      calculatedGrossAmount += totalShippingCost;
    } else {
      // Legacy single shipping
      midtransItems.push({
        id: 'SHIPPING',
        price: shipping.cost || 0,
        quantity: 1,
        name: `Courier: ${(shipping.method || '').toUpperCase()}`.substring(0, this.policy.maxItemNameLength),
      });
      calculatedGrossAmount += (shipping.cost || 0);
    }

    // Add Platform Fee
    if (this.policy.platformFee > 0) {
      midtransItems.push({
        id: 'PLATFORM_FEE',
        price: this.policy.platformFee,
        quantity: 1,
        name: 'Platform Fee',
      });
      calculatedGrossAmount += this.policy.platformFee;
    }

    // Apply Promo Code
    if (promo && promo.discountAmount > 0) {
      midtransItems.push({
        id: 'PROMO',
        price: -promo.discountAmount,
        quantity: 1,
        name: `Promo: ${promo.code}`.substring(0, this.policy.maxItemNameLength),
      });
      calculatedGrossAmount -= promo.discountAmount;
    }

    if (calculatedGrossAmount <= 0) {
      return { grossAmount: 0, midtransItems: [], dbOrderItems: [], error: 'Invalid total price' };
    }

    return { grossAmount: calculatedGrossAmount, midtransItems, dbOrderItems };
  }

  public static calculateOrderBreakdown(
    items: CheckoutItem[],
    dbProducts: DatabaseProduct[],
    shipping: ShippingDetails,
    promo?: PromoDetails,
    activeFlashSales: FlashSaleItem[] = []
  ): { grossAmount: number; midtransItems: ProcessedOrderItem[]; dbOrderItems: any[]; error?: string } {
    const engine = new PricingEngine();
    return engine.calculateOrderBreakdownInstance(items, dbProducts, shipping, promo, activeFlashSales);
  }
}
