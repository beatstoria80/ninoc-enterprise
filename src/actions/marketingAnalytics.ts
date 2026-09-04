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
  // Execute independent queries in parallel to avoid Waterfall latency
  const [
    { data: productsData },
    { data: costingsData },
    { data: voucherUsages },
    { data: affiliates },
    { data: affiliateClicks },
    { data: affiliateOrders },
    googleAds
  ] = await Promise.all([
    supabase.from('products').select('id, name, price, variants(sku, stock_quantity)'), // Warning: pagination needed at scale
    supabase.from('product_costings').select('*'),
    supabase.from('voucher_usages').select('*, vouchers(code), orders(id, total_price)'),
    supabase.from('affiliates').select('*'),
    supabase.from('affiliate_clicks').select('*'),
    supabase.from('orders').select('id, total_price, affiliate_code').not('affiliate_code', 'is', null),
    getGoogleAdsData()
  ]);
  
  let totalInventoryValue = 0;

  const mergedCostings = (productsData || []).map(p => {
    const c = (costingsData || []).find((cc: any) => cc.product_id === p.id) || {};
    
    // Calculate inventory value for this product
    let productStock = 0;
    if (p.variants) {
      p.variants.forEach((v: any) => {
        productStock += Number(v.stock_quantity) || 0;
      });
    }
    
    const baseCost = Number(c.supplier_cost) || 0;
    const pkgCost = Number(c.packaging_cost) || 0;
    const opCost = Number(c.operational_pct) || 0; 
    const midtransFee = Number(c.midtrans_fee) || 0;
    const biteshipFee = Number(c.biteship_fee) || 0;
    const unitCogs = baseCost + pkgCost + opCost + midtransFee + biteshipFee;
    
    // NaN Safety
    if (!isNaN(unitCogs) && !isNaN(productStock)) {
      totalInventoryValue += (productStock * unitCogs);
    }

    return { 
      supplier_cost: 0, packaging_cost: 0, operational_pct: 0, target_margin_pct: 40,
      ...c, 
      ...p,
      total_stock: productStock
    };
  });
  
  // Map for fast HPP lookup
  const costMap: Record<string, number> = {};
  mergedCostings.forEach(c => {
    const baseCost = Number(c.supplier_cost) || 0;
    const pkgCost = Number(c.packaging_cost) || 0;
    const opCost = Number(c.operational_pct) || 0;
    const midtransFee = Number(c.midtrans_fee) || 0;
    const biteshipFee = Number(c.biteship_fee) || 0;
    costMap[c.id] = baseCost + pkgCost + opCost + midtransFee + biteshipFee;
  });

  // Unique Order IDs processing
  const rawOrderIds = [
    ...(voucherUsages?.map(vu => vu.order_id) || []),
    ...(affiliateOrders?.map(ao => ao.id) || [])
  ].filter(Boolean);
  
  const orderIds = Array.from(new Set(rawOrderIds));

  // Chunking orderIds to prevent "URI Too Long" Error in Supabase/PostgREST
  const CHUNK_SIZE = 100;
  let orderItems: any[] = [];
  
  if (orderIds.length > 0) {
    const chunks = [];
    for (let i = 0; i < orderIds.length; i += CHUNK_SIZE) {
      chunks.push(orderIds.slice(i, i + CHUNK_SIZE));
    }

    // Fetch chunks in parallel
    const itemsResponses = await Promise.all(
      chunks.map(chunk => supabase.from('order_items').select('order_id, product_id, quantity, price_at_purchase').in('order_id', chunk))
    );
    
    itemsResponses.forEach(res => {
      if (res.data) {
        orderItems = orderItems.concat(res.data);
      }
    });
  }

  // Calculate Order COGS
  const orderCogsMap: Record<string, number> = {};
  orderItems.forEach(item => {
    const unitCogs = costMap[item.product_id] || 0;
    const qty = Number(item.quantity) || 0;
    if (!orderCogsMap[item.order_id]) orderCogsMap[item.order_id] = 0;
    orderCogsMap[item.order_id] += (unitCogs * qty);
  });

  // Process Vouchers
  let vUsages = 0, vDiscount = 0, vRevenue = 0, vCogs = 0;
  const vMap: any = {};

  if (voucherUsages) {
    vUsages = voucherUsages.length;
    voucherUsages.forEach(vu => {
      if (!vu.order_id) return; // Edge case: Orphaned voucher usage

      const discount = Number(vu.discount_applied) || 0;
      const rev = Number(vu.orders?.total_price) || 0;
      const cogs = Number(orderCogsMap[vu.order_id]) || 0;
      
      vDiscount += discount;
      vRevenue += rev;
      vCogs += cogs;
      
      const code = vu.vouchers?.code || 'UNKNOWN';
      if (!vMap[code]) vMap[code] = { code, usages: 0, discount: 0, revenue: 0, cogs: 0 };
      vMap[code].usages++;
      vMap[code].discount += discount;
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
      const earnings = Number(af.total_earnings) || 0;
      aCommission += earnings; 
      aMap[af.code] = { name: af.name || 'Unknown', code: af.code, clicks: 0, orders: 0, revenue: 0, cogs: 0, commission: earnings };
    });
  }

  if (affiliateClicks) {
    affiliateClicks.forEach(ac => {
      if (ac.affiliate_code && aMap[ac.affiliate_code]) {
        aMap[ac.affiliate_code].clicks++;
      }
    });
  }

  if (affiliateOrders) {
    affiliateOrders.forEach(ao => {
      const rev = Number(ao.total_price) || 0;
      const cogs = Number(orderCogsMap[ao.id]) || 0;
      aRevenue += rev;
      aCogs += cogs;
      if (ao.affiliate_code && aMap[ao.affiliate_code]) {
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
  
  // Google Ads Spend Processing
  const googleAdsSpend = Number(googleAds?.overview?.totalSpend) || 0;
  
  // Total marketing cost now includes Google Ads spend!
  const totalMarketingCost = vDiscount + aCommission + googleAdsSpend;
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

  const result = { metrics, topVouchers: vTop, topAffiliates: aTop };
  return JSON.parse(JSON.stringify(result));
}
