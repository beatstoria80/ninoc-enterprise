import { getCurrentSupplier } from '@/lib/services/supplier';
import { getSupplierProductsWithVariants } from '@/lib/services/inventory';
import { Search, Filter } from 'lucide-react';
import { FashionInventoryTable } from '@/components/supplier/inventory/FashionInventoryTable';
import { FnBInventoryTable } from '@/components/supplier/inventory/FnBInventoryTable';
import RequestAllocationModalClient from './RequestAllocationModalClient';
import { redirect } from 'next/navigation';

export default async function SupplierInventoryPage() {
  const supplierContext = await getCurrentSupplier();
  
  if (!supplierContext) {
    redirect('/login');
  }

  const supplierId = supplierContext.supplier_id;
  const pillar = supplierContext.pillar || 'FASHION';

  let products: any[] = [];
  if (supplierId) {
    products = await getSupplierProductsWithVariants(supplierId);
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-6 mb-6 mt-2">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900">Allocations & Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your Virtual Allocated Stock for {pillar === 'FNB' ? 'F&B/Pantry' : 'Fashion/Objects'}.</p>
        </div>
        <RequestAllocationModalClient supplierId={supplierId} />
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input 
              type="text" 
              placeholder={`Search ${pillar === 'FNB' ? 'menu items' : 'products'}...`} 
              className="w-full pl-9 pr-4 py-1.5 border border-gray-200 text-xs focus:outline-none focus:border-gray-400 font-mono transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-[10px] font-bold uppercase tracking-widest text-gray-700 hover:bg-gray-50 w-full sm:w-auto justify-center transition-colors">
              <Filter size={12} />
              <span>Category</span>
            </button>
          </div>
        </div>

        {pillar === 'FNB' ? (
          <FnBInventoryTable products={products} />
        ) : (
          <FashionInventoryTable products={products} />
        )}
      </div>
    </div>
  );
}
