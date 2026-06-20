import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { FinanceSummary, Product, Order, ProductCosting } from '../types';

export function FinanceTab({
  finance,
  products,
  orders,
  financeTab,
  setFinanceTab,
  productCostings,
  setSelectedProductForCosting,
  setCostingForm,
  setIsCostingModalOpen
}: {
  finance: FinanceSummary;
  products: Product[];
  orders: Order[];
  financeTab: 'overview' | 'ledger' | 'pl' | 'balance' | 'tax' | 'refunds';
  setFinanceTab: (t: 'overview' | 'ledger' | 'pl' | 'balance' | 'tax' | 'refunds') => void;
  productCostings: Record<string, ProductCosting>;
  setSelectedProductForCosting: (p: Product) => void;
  setCostingForm: (f: any) => void;
  setIsCostingModalOpen: (b: boolean) => void;
}) {
  // Accounting Mocks
  const grossRevenue = finance.totalRevenue;
  const cogs = grossRevenue * 0.3;
  const grossProfit = grossRevenue - cogs;
  
  const opex = {
    marketing: grossRevenue * 0.05,
    salary: 15000000,
    server: 500000,
    misc: 2000000
  };
  const totalOpex = Object.values(opex).reduce((a, b) => a + b, 0);
  
  const netIncomeBeforeTax = grossProfit - totalOpex;
  const pphFinalTax = grossRevenue * 0.005; 
  const netIncomeAfterTax = netIncomeBeforeTax - pphFinalTax;

  const assets = {
    cash: 50000000 + netIncomeAfterTax,
    inventory: 45000000,
    receivables: finance.pendingPayments * 500000
  };
  const totalAssets = Object.values(assets).reduce((a, b) => a + b, 0);

  const liabilities = {
    payables: 10000000,
    taxPayable: pphFinalTax
  };
  const totalLiabilities = Object.values(liabilities).reduce((a, b) => a + b, 0);

  const equity = {
    paidInCapital: 80000000,
    retainedEarnings: totalAssets - totalLiabilities - 80000000
  };
  const totalEquity = Object.values(equity).reduce((a, b) => a + b, 0);

  return (
    <motion.div
      key="finance"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-0 h-full flex flex-col"
    >
      {/* Header & Internal Nav */}
      <div className="flex flex-col gap-2 pb-2 border-b border-ink/10 shrink-0">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-medium text-ink uppercase tracking-wide">Financial Command</h2>
          <span className="text-[9px] text-ink/80">— accounting & tax reports</span>
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'ledger', label: 'Ledger' },
            { id: 'pl', label: 'Income Statement' },
            { id: 'balance', label: 'Balance Sheet' },
            { id: 'tax', label: 'Corporate Tax (PT)' },
            { id: 'refunds', label: 'Manual Refunds' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFinanceTab(tab.id as any)}
              className={cn(
                "px-2 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors border",
                financeTab === tab.id ? "bg-ink text-white border-ink" : "bg-white text-ink/80 border-ink/10 hover:border-ink/30 hover:text-ink"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {/* OVERVIEW */}
        {financeTab === 'overview' && (
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-ink/10">
              <div className="p-2 bg-white border-b md:border-b-0 md:border-r border-ink/10">
                <p className="text-[9px] uppercase tracking-widest text-ink/80 mb-0.5">Total Revenue</p>
                <p className="text-sm md:text-[13px] font-mono font-medium text-ink">IDR {grossRevenue.toLocaleString('id-ID')}</p>
                <p className="text-[8px] text-ink/60 mt-1 uppercase tracking-wider">{finance.completedOrders} completed transactions</p>
              </div>
              <div className="p-2 bg-white border-b md:border-b-0 md:border-r border-ink/10">
                <p className="text-[9px] uppercase tracking-widest text-ink/80 mb-0.5">Net Income (Est)</p>
                <p className="text-sm md:text-[13px] font-mono font-medium text-ink">IDR {netIncomeAfterTax.toLocaleString('id-ID', {maximumFractionDigits:0})}</p>
                <p className="text-[8px] text-ink/60 mt-1 uppercase tracking-wider">After Opex & Tax</p>
              </div>
              <div className="p-2 bg-white">
                <p className="text-[9px] uppercase tracking-widest text-ink/80 mb-0.5">Pending Receivables</p>
                <p className="text-sm md:text-[13px] font-mono font-medium text-ink">{finance.pendingPayments}</p>
                <p className="text-[8px] text-ink/60 mt-1 uppercase tracking-wider">Awaiting settlement</p>
              </div>
            </div>

            {/* Product Costing Section */}
            <div className="border border-ink/10 bg-white">
              <div className="p-2 border-b border-ink/10 flex items-center justify-between bg-ink/[0.02]">
                <div>
                  <h3 className="text-xs md:text-[11px] font-medium text-ink uppercase tracking-widest">Product Costing</h3>
                  <p className="text-[9px] text-ink/80 mt-0.5 uppercase tracking-wider">{products.length} articles registered</p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    onChange={e => {
                      const prod = products.find(p => p.id === e.target.value);
                      if (prod) {
                        setSelectedProductForCosting(prod);
                        const existing = productCostings[prod.id];
                        if (existing) {
                          setCostingForm({
                            supplier_cost: existing.supplier_cost,
                            shipping_cost: existing.shipping_cost,
                            packaging_cost: existing.packaging_cost,
                            operasional_pct: existing.operasional_pct,
                            tax_rate: existing.tax_rate,
                            courier_regency_cost: existing.courier_regency_cost,
                            courier_inter_regency_cost: existing.courier_inter_regency_cost,
                            courier_same_day_cost: existing.courier_same_day_cost,
                            courier_instant_cost: existing.courier_instant_cost,
                            target_margin_pct: existing.target_margin_pct,
                            selling_price: existing.selling_price
                          });
                        } else {
                          setCostingForm({
                            supplier_cost: 0, shipping_cost: 0, packaging_cost: 0,
                            operasional_pct: 0, tax_rate: 11,
                            courier_regency_cost: 0, courier_inter_regency_cost: 0,
                            courier_same_day_cost: 0, courier_instant_cost: 0,
                            target_margin_pct: 0, selling_price: Number(prod.price) || 0
                          });
                        }
                        setIsCostingModalOpen(true);
                      }
                    }}
                    className="text-[10px] border border-ink/10 px-3 py-1.5 bg-white focus:outline-none"
                    value=""
                  >
                    <option value="" disabled>+ Set Costing</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <div className="grid grid-cols-12 gap-0 border-b border-ink/10 bg-ink/[0.02] min-w-[900px]">
                  <div className="col-span-3 p-3 text-[9px] font-medium uppercase tracking-widest text-ink/80 border-r border-ink/5">Article</div>
                  <div className="col-span-2 p-3 text-[9px] font-medium uppercase tracking-widest text-ink/80 border-r border-ink/5 text-right">Supplier Cost</div>
                  <div className="col-span-2 p-3 text-[9px] font-medium uppercase tracking-widest text-ink/80 border-r border-ink/5 text-right">Operational (Est)</div>
                  <div className="col-span-1 p-3 text-[9px] font-medium uppercase tracking-widest text-ink/80 border-r border-ink/5 text-right">Logistics</div>
                  <div className="col-span-2 p-3 text-[9px] font-medium uppercase tracking-widest text-ink/80 border-r border-ink/5 text-right">Sell Price</div>
                  <div className="col-span-2 p-3 text-[9px] font-medium uppercase tracking-widest text-ink/80 text-right">Net Margin</div>
                </div>
                <div className="min-w-[900px]">
                  {Object.entries(productCostings).map(([id, cost]) => {
                    const prod = products.find(p => p.id === id);
                    if (!prod) return null;
                    const opCost = (cost.selling_price * (cost.operasional_pct / 100));
                    const taxCost = (cost.selling_price * (cost.tax_rate / 100));
                    const totalCost = cost.supplier_cost + cost.shipping_cost + cost.packaging_cost + opCost + taxCost;
                    const netMargin = cost.selling_price - totalCost;
                    const marginPct = cost.selling_price > 0 ? (netMargin / cost.selling_price) * 100 : 0;
                    return (
                      <div key={id} className="grid grid-cols-12 gap-0 border-b border-ink/5 hover:bg-ink/[0.01] cursor-pointer" onClick={() => {
                        setSelectedProductForCosting(prod);
                        setCostingForm({ ...cost });
                        setIsCostingModalOpen(true);
                      }}>
                        <div className="col-span-3 p-3 border-r border-ink/5">
                          <p className="text-[10px] font-medium text-ink uppercase">{prod.name}</p>
                          <p className="text-[9px] text-ink/80 uppercase tracking-wider">{prod.category}</p>
                        </div>
                        <div className="col-span-2 p-3 text-[10px] font-mono text-ink border-r border-ink/5 text-right">{cost.supplier_cost.toLocaleString('id-ID')}</div>
                        <div className="col-span-2 p-3 border-r border-ink/5 text-right">
                          <p className="text-[10px] font-mono text-ink">{opCost.toLocaleString('id-ID', {maximumFractionDigits:0})}</p>
                          <p className="text-[9px] text-ink/80 font-mono">{cost.operasional_pct}%</p>
                        </div>
                        <div className="col-span-1 p-3 text-[10px] font-mono text-ink border-r border-ink/5 text-right">{cost.shipping_cost.toLocaleString('id-ID')}</div>
                        <div className="col-span-2 p-3 text-[10px] font-mono font-medium text-ink border-r border-ink/5 text-right">{cost.selling_price.toLocaleString('id-ID')}</div>
                        <div className="col-span-2 p-3 text-right">
                          <span className={cn("text-[10px] font-mono font-medium", marginPct > 30 ? "text-ink" : marginPct > 15 ? "text-amber-600" : "text-rose")}>
                            {netMargin.toLocaleString('id-ID', {maximumFractionDigits:0})}
                          </span>
                          <span className="text-[9px] font-mono text-ink/80 ml-1">({marginPct.toFixed(1)}%)</span>
                        </div>
                      </div>
                    );
                  })}
                  {Object.keys(productCostings).length === 0 && (
                    <div className="p-3 text-center text-[9px] uppercase tracking-widest text-ink/90">
                      No product costings configured yet — select a product above
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LEDGER */}
        {financeTab === 'ledger' && (
          <div className="border border-ink/10 bg-white">
            <div className="grid grid-cols-12 gap-0 border-b border-ink/10 bg-ink/[0.02] overflow-x-auto min-w-[800px]">
              <div className="col-span-2 p-3 text-[9px] font-medium uppercase tracking-widest text-ink/80 border-r border-ink/10">Date</div>
              <div className="col-span-4 p-3 text-[9px] font-medium uppercase tracking-widest text-ink/80 border-r border-ink/10">Description</div>
              <div className="col-span-2 p-3 text-[9px] font-medium uppercase tracking-widest text-ink/80 border-r border-ink/10 text-right">Debit (IDR)</div>
              <div className="col-span-2 p-3 text-[9px] font-medium uppercase tracking-widest text-ink/80 border-r border-ink/10 text-right">Credit (IDR)</div>
              <div className="col-span-2 p-3 text-[9px] font-medium uppercase tracking-widest text-ink/80 text-right">Balance</div>
            </div>
            <div className="min-w-[800px]">
              {orders.slice(0, 10).map((o, i) => (
                <div key={i} className="grid grid-cols-12 gap-0 border-b border-ink/5 hover:bg-ink/[0.01]">
                  <div className="col-span-2 p-3 text-[10px] font-mono text-ink border-r border-ink/10">{new Date(o.created_at).toLocaleDateString('id-ID')}</div>
                  <div className="col-span-4 p-3 text-[10px] text-ink border-r border-ink/10 truncate uppercase">Sales - Order #{o.id.slice(0,8)}</div>
                  <div className="col-span-2 p-3 text-[10px] font-mono text-ink border-r border-ink/10 text-right">{o.total_price.toLocaleString('id-ID')}</div>
                  <div className="col-span-2 p-3 text-[10px] font-mono text-ink border-r border-ink/10 text-right">-</div>
                  <div className="col-span-2 p-3 text-[10px] font-mono text-ink text-right">...</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INCOME STATEMENT */}
        {financeTab === 'pl' && (
          <div className="max-w-3xl mx-auto border border-ink/10 bg-white">
            <div className="p-2 border-b border-ink/10 text-center bg-ink/[0.02]">
              <h3 className="text-xs md:text-[11px] font-medium uppercase tracking-widest text-ink">Income Statement</h3>
              <p className="text-[9px] font-mono text-ink/80 mt-1">For the period ending {new Date().toLocaleDateString('id-ID')}</p>
            </div>
            
            {/* Revenue */}
            <div className="p-2 border-b border-ink/10">
              <p className="text-[9px] font-medium uppercase tracking-widest text-ink/80 mb-3">Revenue</p>
              <div className="flex justify-between text-xs md:text-[11px] font-mono mb-2">
                <span>Gross Sales</span>
                <span>{grossRevenue.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-xs md:text-[11px] font-mono mb-2">
                <span>Discounts/Returns</span>
                <span>(0)</span>
              </div>
              <div className="flex justify-between text-xs md:text-[11px] font-mono font-medium border-t border-ink/10 pt-2 mt-2">
                <span>Net Sales</span>
                <span>{grossRevenue.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* COGS */}
            <div className="p-2 border-b border-ink/10">
              <p className="text-[9px] font-medium uppercase tracking-widest text-ink/80 mb-3">Cost of Goods Sold (COGS)</p>
              <div className="flex justify-between text-xs md:text-[11px] font-mono mb-2">
                <span>Production & Sourcing</span>
                <span>({cogs.toLocaleString('id-ID', {maximumFractionDigits:0})})</span>
              </div>
              <div className="flex justify-between text-xs md:text-[11px] font-mono font-medium border-t border-ink/10 pt-2 mt-2">
                <span>Gross Profit</span>
                <span>{grossProfit.toLocaleString('id-ID', {maximumFractionDigits:0})}</span>
              </div>
            </div>

            {/* OPEX */}
            <div className="p-2 border-b border-ink/10">
              <p className="text-[9px] font-medium uppercase tracking-widest text-ink/80 mb-3">Operating Expenses</p>
              <div className="flex justify-between text-xs md:text-[11px] font-mono mb-2">
                <span>Marketing & Ads</span>
                <span>({opex.marketing.toLocaleString('id-ID', {maximumFractionDigits:0})})</span>
              </div>
              <div className="flex justify-between text-xs md:text-[11px] font-mono mb-2">
                <span>Salaries & Wages</span>
                <span>({opex.salary.toLocaleString('id-ID', {maximumFractionDigits:0})})</span>
              </div>
              <div className="flex justify-between text-xs md:text-[11px] font-mono mb-2">
                <span>Server & IT</span>
                <span>({opex.server.toLocaleString('id-ID', {maximumFractionDigits:0})})</span>
              </div>
              <div className="flex justify-between text-xs md:text-[11px] font-mono mb-2">
                <span>General & Administrative</span>
                <span>({opex.misc.toLocaleString('id-ID', {maximumFractionDigits:0})})</span>
              </div>
              <div className="flex justify-between text-xs md:text-[11px] font-mono font-medium border-t border-ink/10 pt-2 mt-2">
                <span>Total Opex</span>
                <span>({totalOpex.toLocaleString('id-ID', {maximumFractionDigits:0})})</span>
              </div>
            </div>

            {/* Net Income */}
            <div className="p-2 bg-ink/[0.02]">
              <div className="flex justify-between text-xs md:text-[11px] font-mono mb-2">
                <span>Net Income Before Tax</span>
                <span>{netIncomeBeforeTax.toLocaleString('id-ID', {maximumFractionDigits:0})}</span>
              </div>
              <div className="flex justify-between text-xs md:text-[11px] font-mono mb-2 text-rose">
                <span>Income Tax Expense</span>
                <span>({pphFinalTax.toLocaleString('id-ID', {maximumFractionDigits:0})})</span>
              </div>
              <div className="flex justify-between text-[12px] font-mono font-medium border-t-2 border-ink pt-2 mt-2">
                <span>Net Income</span>
                <span>{netIncomeAfterTax.toLocaleString('id-ID', {maximumFractionDigits:0})}</span>
              </div>
            </div>
          </div>
        )}

        {/* BALANCE SHEET */}
        {financeTab === 'balance' && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-0 border border-ink/10 bg-white">
            <div className="col-span-1 md:col-span-2 p-2 border-b border-ink/10 text-center bg-ink/[0.02]">
              <h3 className="text-xs md:text-[11px] font-medium uppercase tracking-widest text-ink">Balance Sheet</h3>
              <p className="text-[9px] font-mono text-ink/80 mt-1">As of {new Date().toLocaleDateString('id-ID')}</p>
            </div>
            
            {/* Assets */}
            <div className="p-3 border-b md:border-b-0 md:border-r border-ink/10">
              <p className="text-[10px] font-medium uppercase tracking-widest text-ink mb-4 border-b border-ink/10 pb-2">Assets</p>
              
              <p className="text-[9px] uppercase tracking-widest text-ink/80 mb-2">Current Assets</p>
              <div className="flex justify-between text-[10px] font-mono mb-2">
                <span>Cash & Equivalents</span>
                <span>{assets.cash.toLocaleString('id-ID', {maximumFractionDigits:0})}</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono mb-2">
                <span>Accounts Receivable</span>
                <span>{assets.receivables.toLocaleString('id-ID', {maximumFractionDigits:0})}</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono mb-4">
                <span>Inventory</span>
                <span>{assets.inventory.toLocaleString('id-ID', {maximumFractionDigits:0})}</span>
              </div>

              <div className="flex justify-between text-xs md:text-[11px] font-mono font-medium border-t-2 border-ink pt-2 mt-6">
                <span>Total Assets</span>
                <span>{totalAssets.toLocaleString('id-ID', {maximumFractionDigits:0})}</span>
              </div>
            </div>

            {/* Liabilities & Equity */}
            <div className="p-3">
              <p className="text-[10px] font-medium uppercase tracking-widest text-ink mb-4 border-b border-ink/10 pb-2">Liabilities & Equity</p>
              
              <p className="text-[9px] uppercase tracking-widest text-ink/80 mb-2">Liabilities</p>
              <div className="flex justify-between text-[10px] font-mono mb-2">
                <span>Accounts Payable</span>
                <span>{liabilities.payables.toLocaleString('id-ID', {maximumFractionDigits:0})}</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono mb-4">
                <span>Tax Payable</span>
                <span>{liabilities.taxPayable.toLocaleString('id-ID', {maximumFractionDigits:0})}</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono font-medium border-t border-ink/10 pt-2 mb-6">
                <span>Total Liabilities</span>
                <span>{totalLiabilities.toLocaleString('id-ID', {maximumFractionDigits:0})}</span>
              </div>

              <p className="text-[9px] uppercase tracking-widest text-ink/80 mb-2">Equity</p>
              <div className="flex justify-between text-[10px] font-mono mb-2">
                <span>Paid-in Capital</span>
                <span>{equity.paidInCapital.toLocaleString('id-ID', {maximumFractionDigits:0})}</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono mb-4">
                <span>Retained Earnings</span>
                <span>{equity.retainedEarnings.toLocaleString('id-ID', {maximumFractionDigits:0})}</span>
              </div>
              <div className="flex justify-between text-[10px] font-mono font-medium border-t border-ink/10 pt-2 mb-6">
                <span>Total Equity</span>
                <span>{totalEquity.toLocaleString('id-ID', {maximumFractionDigits:0})}</span>
              </div>

              <div className="flex justify-between text-xs md:text-[11px] font-mono font-medium border-t-2 border-ink pt-2 mt-auto">
                <span>Total Liab. & Equity</span>
                <span>{(totalLiabilities + totalEquity).toLocaleString('id-ID', {maximumFractionDigits:0})}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAX REPORT PT PERORANGAN */}
        {financeTab === 'tax' && (
          <div className="max-w-2xl mx-auto border border-ink/10 bg-white">
            <div className="p-5 border-b border-ink/10 bg-ink/[0.02] flex items-center justify-between">
              <div>
                <h3 className="text-xs md:text-[11px] font-medium uppercase tracking-widest text-ink">Tax Report Computation</h3>
                <p className="text-[9px] font-mono text-ink/80 mt-1">PT Perorangan - PPh Final UMKM (PP 55/2022)</p>
              </div>
              <div className="px-3 py-1 bg-white border border-ink/10 text-[9px] font-mono uppercase tracking-widest text-ink/80">Rate: 0.5%</div>
            </div>
            
            <div className="p-3 space-y-3">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-ink/80 mb-1">Tax Base (Dasar Pengenaan Pajak)</p>
                <div className="flex items-center justify-between py-2 border-b border-ink/10">
                  <span className="text-xs md:text-[11px] font-mono uppercase text-ink">Gross Revenue (Omzet)</span>
                  <span className="text-[12px] font-mono text-ink">IDR {grossRevenue.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div>
                <p className="text-[9px] uppercase tracking-widest text-ink/80 mb-1">Computation (Perhitungan)</p>
                <div className="flex items-center justify-between py-2 border-b border-ink/10 text-ink/80">
                  <span className="text-[10px] font-mono uppercase">Gross Revenue x 0.5%</span>
                  <span className="text-[10px] font-mono">{grossRevenue.toLocaleString('id-ID')} x 0.005</span>
                </div>
              </div>

              <div className="bg-ink/[0.02] border border-ink/10 p-2 mt-4 flex items-center justify-between">
                <span className="text-xs md:text-[11px] font-medium uppercase tracking-widest text-ink">Total Tax Payable (PPh Terutang)</span>
                <span className="text-[14px] font-mono font-medium text-rose">IDR {pphFinalTax.toLocaleString('id-ID', {maximumFractionDigits:0})}</span>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button className="px-2 py-1 border border-ink/10 text-ink text-[10px] uppercase font-medium tracking-wider hover:bg-ink/[0.02]">
                  Download PDF
                </button>
                <button className="px-2 py-1 bg-ink text-white text-[10px] uppercase font-medium tracking-wider hover:bg-ink/90">
                  Generate e-Billing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MANUAL REFUNDS */}
        {financeTab === 'refunds' && (
          <div className="border border-ink/10 bg-white">
            <div className="p-3 border-b border-ink/10 bg-ink/[0.02]">
              <h3 className="text-xs md:text-[11px] font-medium uppercase tracking-widest text-ink">Manual Refund Operations</h3>
              <p className="text-[9px] font-mono text-ink/80 mt-1">Manage VA/Bank Transfer refunds that cannot be auto-refunded by Midtrans</p>
            </div>
            
            <div className="overflow-x-auto">
              <div className="grid grid-cols-12 gap-0 border-b border-ink/10 bg-ink/[0.02] min-w-[900px]">
                <div className="col-span-2 p-3 text-[9px] font-medium uppercase tracking-widest text-ink/80 border-r border-ink/5">Order ID</div>
                <div className="col-span-3 p-3 text-[9px] font-medium uppercase tracking-widest text-ink/80 border-r border-ink/5">Customer</div>
                <div className="col-span-2 p-3 text-[9px] font-medium uppercase tracking-widest text-ink/80 border-r border-ink/5 text-right">Amount</div>
                <div className="col-span-2 p-3 text-[9px] font-medium uppercase tracking-widest text-ink/80 border-r border-ink/5 text-center">Status</div>
                <div className="col-span-3 p-3 text-[9px] font-medium uppercase tracking-widest text-ink/80 text-right">Actions</div>
              </div>
              <div className="min-w-[900px]">
                {orders
                  .filter(o => o.status === 'cancelled' && o.notes && (o.notes.includes('Manual Refund Required') || o.notes.includes('Manual Refund Completed')))
                  .map(order => {
                    const isCompleted = order.notes?.includes('Manual Refund Completed');
                    const customerName = (order.shipping_address as any)?.name || (order.shipping_address as any)?.first_name || 'Guest';
                    const customerPhone = (order.shipping_address as any)?.phone || '-';
                    
                    return (
                      <div key={order.id} className="grid grid-cols-12 gap-0 border-b border-ink/5 hover:bg-ink/[0.01]">
                        <div className="col-span-2 p-3 border-r border-ink/5">
                          <p className="text-[10px] font-mono font-medium text-ink">#{order.id.toUpperCase()}</p>
                          <p className="text-[9px] text-ink/80 mt-1">{new Date(order.created_at).toLocaleDateString('id-ID')}</p>
                        </div>
                        <div className="col-span-3 p-3 border-r border-ink/5">
                          <p className="text-[10px] font-medium text-ink">{customerName}</p>
                          <p className="text-[9px] text-ink/80 font-mono mt-1">{customerPhone}</p>
                        </div>
                        <div className="col-span-2 p-3 text-[10px] font-mono font-medium text-ink border-r border-ink/5 text-right">
                          {order.total_price.toLocaleString('id-ID')}
                        </div>
                        <div className="col-span-2 p-3 border-r border-ink/5 text-center">
                          {isCompleted ? (
                            <span className="inline-block px-2 py-0.5 border border-emerald-200 bg-emerald-50 text-emerald-700 text-[9px] uppercase tracking-wider">Refunded</span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 border border-amber-200 bg-amber-50 text-amber-700 text-[9px] uppercase tracking-wider">Waiting</span>
                          )}
                        </div>
                        <div className="col-span-3 p-3 flex items-center justify-end gap-2">
                          {!isCompleted && (
                            <>
                              <button 
                                onClick={() => {
                                  const phone = customerPhone.replace(/\D/g, '');
                                  const waPhone = phone.startsWith('0') ? '62' + phone.substring(1) : phone;
                                  const msg = `Halo Kak, kami dari Ninoc Store.\n\nPesanan Anda #${order.id.toUpperCase()} batal. Krn pembayaran menggunakan VA/Transfer Bank, kami butuh nomor rekening Kakak untuk proses Refund.\n\nNama Bank:\nNo Rekening:\nAtas Nama:\n\nTerima kasih!`;
                                  window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`, '_blank');
                                }}
                                className="px-2 py-1 text-[9px] uppercase tracking-wider border border-ink/10 hover:border-ink/30 transition-colors"
                              >
                                WA Minta Rekening
                              </button>
                              <button 
                                onClick={async () => {
                                  if (!window.confirm(`Mark order #${order.id.toUpperCase()} as Refunded?`)) return;
                                  try {
                                    const res = await fetch('/api/admin/finance/refund', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ order_id: order.id, action: 'mark_completed' })
                                    });
                                    if (!res.ok) throw new Error(await res.text());
                                    alert('Berhasil!');
                                    window.location.reload();
                                  } catch (e: any) { alert(e.message); }
                                }}
                                className="px-2 py-1 text-[9px] uppercase tracking-wider bg-ink text-white hover:bg-ink/90 transition-colors"
                              >
                                Mark Refunded
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
