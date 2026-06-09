import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Search, Users, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CatalogSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: any;
}

export function CatalogSettingsDrawer({ isOpen, onClose, catalog }: CatalogSettingsDrawerProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'visibility'>('general');

  if (!catalog) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[2px]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.5 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full md:w-[500px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-medium text-ink">Catalog Settings</h2>
                <p className="text-xs text-gray-500">Managing segment: {catalog.name}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-ink hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tabs Navigation */}
            <div className="shrink-0 flex items-center gap-6 px-4 border-b border-gray-100">
              {[
                { id: 'general', label: 'General Info' },
                { id: 'pricing', label: 'Pricing & Rules' },
                { id: 'visibility', label: 'Visibility & Assigment' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "py-3 text-sm font-medium transition-colors relative",
                    activeTab === tab.id ? "text-ink" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="catalogSettingsTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-ink"
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 minimal-scroll">
              <AnimatePresence mode="wait">
                {activeTab === 'general' && (
                  <motion.div
                    key="general"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-5"
                  >
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-gray-700">Catalog Name</label>
                      <input
                        type="text"
                        defaultValue={catalog.name}
                        className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">Segment Type</label>
                        <select
                          defaultValue={catalog.type}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                        >
                          <option value="B2C">B2C (Retail)</option>
                          <option value="B2B">B2B (Wholesale)</option>
                          <option value="VIP">VIP</option>
                          <option value="Employee">Employee</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">Currency</label>
                        <select
                          defaultValue={catalog.currency}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                        >
                          <option value="IDR">IDR - Indonesian Rupiah</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-medium text-gray-700">Status</label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="status" defaultChecked={catalog.status === 'Active'} className="text-ink focus:ring-ink" />
                          <span className="text-sm">Active</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="status" defaultChecked={catalog.status !== 'Active'} className="text-ink focus:ring-ink" />
                          <span className="text-sm">Draft / Inactive</span>
                        </label>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'pricing' && (
                  <motion.div
                    key="pricing"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex gap-3">
                      <ShieldAlert size={16} className="text-gray-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Pricing rules defined here will override the default retail price for customers assigned to this catalog.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700">Adjustment Method</label>
                        <select
                          className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                          defaultValue={catalog.priceAdjustment === 'None' ? 'none' : catalog.priceAdjustment.includes('%') ? 'percentage' : 'fixed'}
                        >
                          <option value="none">No Adjustment (Use Retail Price)</option>
                          <option value="percentage">Percentage Discount (e.g. -20%)</option>
                          <option value="fixed_discount">Fixed Amount Discount (e.g. -50,000)</option>
                          <option value="fixed">Fixed List Price (Manual per product)</option>
                        </select>
                      </div>

                      {catalog.priceAdjustment !== 'None' && catalog.priceAdjustment !== 'Fixed List' && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-gray-700">Adjustment Value</label>
                          <div className="relative">
                            <input
                              type="number"
                              defaultValue={catalog.priceAdjustment.replace(/[^0-9]/g, '')}
                              className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'visibility' && (
                  <motion.div
                    key="visibility"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    {/* Customer Assignment */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-sm font-medium text-ink">Assigned Customers</h3>
                        <p className="text-xs text-gray-500">Customers who can access this catalog.</p>
                      </div>
                      
                      <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search customer name or email..."
                          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink"
                        />
                      </div>

                      <div className="border border-gray-100 rounded-lg bg-white overflow-hidden">
                        <div className="p-3 border-b border-gray-50 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-rose/10 text-rose flex items-center justify-center font-medium text-xs">
                            TS
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-ink">Tony Stark</p>
                            <p className="text-xs text-gray-500">tony@stark.com</p>
                          </div>
                          <button className="text-xs text-red-500 hover:text-red-600 font-medium">Remove</button>
                        </div>
                        <div className="p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-medium text-xs">
                            PP
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-ink">Peter Parker</p>
                            <p className="text-xs text-gray-500">peter@dailybugle.com</p>
                          </div>
                          <button className="text-xs text-red-500 hover:text-red-600 font-medium">Remove</button>
                        </div>
                      </div>
                      <button className="w-full py-2 border border-dashed border-gray-300 rounded-md text-xs font-medium text-gray-600 hover:text-ink hover:border-gray-400 transition-colors">
                        + Add Bulk via CSV
                      </button>
                    </div>

                    <div className="w-full h-px bg-gray-100" />

                    {/* Product Visibility */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-sm font-medium text-ink">Product Visibility</h3>
                        <p className="text-xs text-gray-500">What products can these customers see?</p>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-gray-50">
                          <input type="radio" name="visibility" defaultChecked className="mt-1 text-ink focus:ring-ink" />
                          <div>
                            <p className="text-sm font-medium text-ink">All Products</p>
                            <p className="text-xs text-gray-500">Customers see all active products in the store.</p>
                          </div>
                        </label>
                        <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                          <input type="radio" name="visibility" className="mt-1 text-ink focus:ring-ink" />
                          <div>
                            <p className="text-sm font-medium text-ink">Custom Product List</p>
                            <p className="text-xs text-gray-500">Handpick specific products or categories available to this segment.</p>
                          </div>
                        </label>
                      </div>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="shrink-0 p-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-ink transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 bg-ink text-white rounded-md text-sm font-medium hover:bg-ink/90 transition-colors"
              >
                <Save size={14} />
                Save Changes
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
