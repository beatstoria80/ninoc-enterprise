import { getCurrentSupplier } from '@/lib/services/supplier';
import { getSupplierProductsWithVariants } from '@/lib/services/inventory';
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
          <h1 className="text-2xl font-bold font-display text-gray-900">Virtual Inventory Allocations</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your Virtual Dropship Stock for {pillar === 'FNB' ? 'F&B/Pantry' : 'Fashion/Objects'}. No physical storage required at Hub.</p>
        </div>
        <RequestAllocationModalClient supplierId={supplierId} />
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden">
        {pillar === 'FNB' ? (
          <FnBInventoryTable products={products} />
        ) : (
          <FashionInventoryTable products={products} />
        )}
      </div>
    </div>
  );
}
