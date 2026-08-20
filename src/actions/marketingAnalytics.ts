"use server";

import { createClient } from "@supabase/supabase-js";
import { getGoogleAdsData } from './googleAds';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export interface MarketingMetrics {
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  marketingSpend: number;
  inventoryValue: number;
  googleAds: any;
  netProfit: number;
  roas: number;
  vouchers: {
    totalUsages: number;
    totalDiscountGiven: number;
    totalRevenue: number;
    netProfit: number;
    roas: number;
  };
  affiliates: {
    totalClicks: number;
    totalOrders: number;
    totalCommission: number;
    totalRevenue: number;
    netProfit: number;
    roas: number;
  };
}

export interface TopVoucher {
  code: string;
  usages: number;
  discount: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  netProfit: number;
  roas: number;
}

export interface TopAffiliate {
  code: string;
  name: string;
  clicks: number;
  orders: number;
  revenue: number;
  cogs: number;
  commission: number;
  grossProfit: number;
  netProfit: number;
  roas: number;
  cvr: number;
}

export interface MarketingDashboardData {
  metrics: MarketingMetrics;
  topVouchers: TopVoucher[];
  topAffiliates: TopAffiliate[];
}

export async function getMarketingAnalyticsData(): Promise<MarketingDashboardData> {
  // 1. Fetch Products & Costings
  const { data: productsData } = await supabase.from('products').select('id, name, price, variants(sku, stock_quantity)');
  const { data: costingsData } = await supabase.from('product_costings').select('*');
  
  let totalInventoryValue = 0;

  const mergedCostings = productsData?.map(p => {
    const c = costingsData?.find((cc: any) => cc.product_id === p.id) || {};
    
    // Calculate inventory value for this product
    let productStock = 0;
    if (p.variants) {
      p.variants.forEach((v: any) => {
        productStock += v.stock_quantity || 0;
      });
    }
    
    const baseCost = Number(c.supplier_cost) || 0;
    const pkgCost = Number(c.packaging_cost) || 0;
    const opCost = Number(c.operational_pct) || 0; // treating as IDR
    const midtransFee = Number(c.midtrans_fee) || 0;
    const biteshipFee = Number(c.biteship_fee) || 0;
    const unitCogs = baseCost + pkgCost + opCost + midtransFee + biteshipFee;
    
    totalInventoryValue += (productStock * unitCogs);

    return { 
      supplier_cost: 0, packaging_cost: 0, operational_pct: 0, target_margin_pct: 40,
      ...c, 
      ...p,
      total_stock: productStock
    };
  }) || [];
  
  // Map for fast HPP lookup
  const costMap: Record<string, number> = {};
  mergedCostings.forEach(c => {
    const baseCost = Number(c.supplier_cost) + Number(c.packaging_cost);
    const opCost = Number(c.operational_pct) || 0; // Fixed: Treat as flat IDR instead of percentage
    const midtransFee = Number(c.midtrans_fee) || 0;
    const biteshipFee = Number(c.biteship_fee) || 0;
    costMap[c.id] = baseCost + opCost + midtransFee + biteshipFee; // COGS per unit
  });

  // 2. Fetch Marketing Data
  const { data: voucherUsages } = await supabase.from('voucher_usages').select('*, vouchers(code), orders(id, total_price)');
  const { data: affiliates } = await supabase.from('affiliates').select('*');
  const { data: affiliateClicks } = await supabase.from('affiliate_clicks').select('*');
  const { data: affiliateOrders } = await supabase.from('orders').select('id, total_price, affiliate_code').not('affiliate_code', 'is', null);
  
  // Fetch Order Items for accurate COGS
  const orderIds = [
    ...(voucherUsages?.map(vu => vu.order_id) || []),
    ...(affiliateOrders?.map(ao => ao.id) || [])
  ].filter(Boolean);

  let orderItems: any[] = [];
  if (orderIds.length > 0) {
    const { data: items } = await supabase.from('order_items').select('order_id, product_id, quantity, price_at_purchase').in('order_id', orderIds);
    orderItems = items || [];
  }

  // Calculate Order COGS
  const orderCogsMap: Record<string, number> = {};
  orderItems.forEach(item => {
    const unitCogs = costMap[item.product_id] || 0;
    if (!orderCogsMap[item.order_id]) orderCogsMap[item.order_id] = 0;
    orderCogsMap[item.order_id] += (unitCogs * item.quantity);
  });

  // Process Vouchers
  let vUsages = 0, vDiscount = 0, vRevenue = 0, vCogs = 0;
  const vMap: any = {};

  if (voucherUsages) {
    vUsages = voucherUsages.length;
    voucherUsages.forEach(vu => {
      vDiscount += vu.discount_applied || 0;
      const rev = vu.orders?.total_price || 0;
      const cogs = orderCogsMap[vu.order_id] || 0;
      
      vRevenue += rev;
      vCogs += cogs;
      
      const code = vu.vouchers?.code || 'UNKNOWN';
      if (!vMap[code]) vMap[code] = { code, usages: 0, discount: 0, revenue: 0, cogs: 0 };
      vMap[code].usages++;
      vMap[code].discount += vu.discount_applied || 0;
      vMap[code].revenue += rev;
      vMap[code].cogs += cogs;
    });
  }
  
  const vTop = Object.values(vMap).map((v: any) => {
    const grossProfit = v.revenue - v.cogs;
    const netProfit = grossProfit - v.discount;
    return {
      ...v,
      grossProfit,
      netProfit,
      roas: v.discount > 0 ? (v.revenue / v.discount) : (v.revenue > 0 ? 9999 : 0)
    };
  }).sort((a: any, b: any) => b.netProfit - a.netProfit).slice(0, 5) as TopVoucher[];

  // Process Affiliates
  let aClicks = affiliateClicks?.length || 0;
  let aOrdersCount = affiliateOrders?.length || 0;
  let aRevenue = 0, aCogs = 0, aCommission = 0;
  const aMap: any = {};
  
  if (affiliates) {
    affiliates.forEach(af => {
      aCommission += af.total_earnings || 0; // rough approximation for now, real system links comm to order
      aMap[af.code] = { name: af.name || 'Unknown', code: af.code, clicks: 0, orders: 0, revenue: 0, cogs: 0, commission: af.total_earnings || 0 };
    });
  }

  if (affiliateClicks) {
    affiliateClicks.forEach(ac => {
      if (aMap[ac.affiliate_code]) aMap[ac.affiliate_code].clicks++;
    });
  }

  if (affiliateOrders) {
    affiliateOrders.forEach(ao => {
      const rev = ao.total_price || 0;
      const cogs = orderCogsMap[ao.id] || 0;
      aRevenue += rev;
      aCogs += cogs;
      if (aMap[ao.affiliate_code]) {
        aMap[ao.affiliate_code].orders++;
        aMap[ao.affiliate_code].revenue += rev;
        aMap[ao.affiliate_code].cogs += cogs;
      }
    });
  }
  
  const aTop = Object.values(aMap).filter((a: any) => a.orders > 0 || a.clicks > 0).map((a: any) => {
    const grossProfit = a.revenue - a.cogs;
    const netProfit = grossProfit - a.commission;
    return {
      ...a,
      grossProfit,
      netProfit,
      roas: a.commission > 0 ? (a.revenue / a.commission) : (a.revenue > 0 ? 9999 : 0),
      cvr: a.clicks > 0 ? (a.orders / a.clicks) * 100 : 0
    };
  }).sort((a: any, b: any) => b.netProfit - a.netProfit).slice(0, 5) as TopAffiliate[];

  const totalRev = vRevenue + aRevenue;
  const totalCogs = vCogs + aCogs;
  const totalGrossProfit = totalRev - totalCogs;
  
  // Fetch Google Ads Data via Server Action
  const googleAds = await getGoogleAdsData();
  
  // Total marketing cost now includes Google Ads spend!
  const totalMarketingCost = vDiscount + aCommission + googleAds.totalSpend;
  const totalNetProfit = totalGrossProfit - totalMarketingCost;

  const metrics: MarketingMetrics = {
    totalRevenue: totalRev,
    totalCOGS: totalCogs,
    grossProfit: totalGrossProfit,
    marketingSpend: totalMarketingCost,
    inventoryValue: totalInventoryValue,
    googleAds: googleAds,
    netProfit: totalNetProfit,
    roas: totalMarketingCost > 0 ? (totalRev / totalMarketingCost) : (totalRev > 0 ? 9999 : 0),
    vouchers: {
      totalUsages: vUsages,
      totalDiscountGiven: vDiscount,
      totalRevenue: vRevenue,
      netProfit: (vRevenue - vCogs) - vDiscount,
      roas: vDiscount > 0 ? (vRevenue / vDiscount) : (vRevenue > 0 ? 9999 : 0)
    },
    affiliates: {
      totalClicks: aClicks,
      totalOrders: aOrdersCount,
      totalCommission: aCommission,
      totalRevenue: aRevenue,
      netProfit: (aRevenue - aCogs) - aCommission,
      roas: aCommission > 0 ? (aRevenue / aCommission) : (aRevenue > 0 ? 9999 : 0)
    }
  };

  return { metrics, topVouchers: vTop, topAffiliates: aTop };
}
