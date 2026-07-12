import React, { useState } from 'react';
import { Plus, Settings, Users, FileText, Search } from 'lucide-react';
import { CatalogSettingsDrawer } from './CatalogSettingsDrawer';

export function CatalogsView() {
  const [selectedCatalog, setSelectedCatalog] = useState<any>(null);
  
  // TO DO: Fetch from Supabase via `atelier_settings` or dedicated Catalogs table.
  const catalogs: any[] = [];

  return (
    <div className="flex flex-col h-full space-y-2 relative">
      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search catalogs..."
            className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:border-rose/50"
          />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-ink text-white rounded hover:bg-ink/90 transition-colors">
          <Plus size={12} />
          <span className="text-[9px] uppercase tracking-wider">New Catalog</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto minimal-scroll bg-white border border-gray-100 rounded-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
              <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Catalog Name</th>
              <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Pricing</th>
              <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Customers</th>
              <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider">Products</th>
              <th className="px-2 py-1.5 text-[10px] font-medium text-gray-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {catalogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-gray-500">
                  No catalogs configured yet. Create a new catalog to override default pricing.
                </td>
              </tr>
            ) : (
              catalogs.map(catalog => (
                <tr key={catalog.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-gray-400" />
                      <div>
                        <div className="font-medium text-xs text-ink">{catalog.name}</div>
                        <div className="text-[10px] text-gray-500">Currency: {catalog.currency}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-1.5">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-sm font-medium">
                      {catalog.type}
                    </span>
                  </td>
                  <td className="px-2 py-1.5 text-xs text-gray-600">
                    {catalog.priceAdjustment}
                  </td>
                  <td className="px-2 py-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <Users size={12} className="text-gray-400" />
                      {catalog.customerCount}
                    </div>
                  </td>
                  <td className="px-2 py-1.5 text-xs text-gray-600">
                    {catalog.productCount}
                  </td>
                  <td className="px-2 py-1.5 text-right">
                    <button 
                      onClick={() => setSelectedCatalog(catalog)}
                      className="p-1.5 text-gray-400 hover:text-ink hover:bg-gray-100 rounded transition-all"
                      title="Settings"
                    >
                      <Settings size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CatalogSettingsDrawer 
        isOpen={!!selectedCatalog} 
        onClose={() => setSelectedCatalog(null)} 
        catalog={selectedCatalog} 
      />
    </div>
  );
}
