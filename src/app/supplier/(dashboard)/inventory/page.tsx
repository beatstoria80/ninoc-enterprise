import { createClient } from '@/utils/supabase/server';
import { Package, Search, Filter, MoreHorizontal, ArrowUpDown } from 'lucide-react';
import Image from 'next/image';

export default async function SupplierInventoryPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) return null;

  const { data: supplierUser } = await supabase
    .from('supplier_users')
    .select('supplier_id')
    .eq('user_id', session.user.id)
    .single();

  const supplierId = supplierUser?.supplier_id;

  let products: any[] = [];
  if (supplierId) {
    const { data } = await supabase
      .from('products')
      .select('id, name, price, stock, image_url, category, created_at')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false });
    
    if (data) products = data;
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-gray-900">Allocations & Inventory</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your product stock allocated across Ninoc Enterprise warehouses.</p>
        </div>
        <button className="bg-ink text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-ink/90 transition-colors">
          Request Allocation
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search products, SKU, or category..." 
              className="w-full pl-9 pr-4 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 w-full sm:w-auto justify-center">
              <Filter size={16} />
              <span>Category</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-gray-900">
                    Stock Allocated <ArrowUpDown size={14} />
                  </div>
                </th>
                <th className="px-6 py-4">Base Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.length > 0 ? (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden relative shrink-0">
                          {product.image_url ? (
                            <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={20} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 truncate max-w-[200px]">{product.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">ID: {product.id.split('-')[0]}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 capitalize">
                      {product.category || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-900">{product.stock || 0} units</span>
                        <span className="text-xs text-gray-500">in 1 Warehouse</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      Rp {product.price?.toLocaleString('id-ID') || 0}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-gray-400 hover:text-ink hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <Package size={24} className="text-gray-400" />
                      </div>
                      <p className="text-gray-900 font-medium mb-1">No products allocated yet</p>
                      <p className="text-gray-500 text-sm max-w-sm mx-auto">
                        Your products will appear here once Ninoc enterprise approves your catalog and allocates warehouse space.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {products.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-sm text-gray-600">
            <span>Showing {products.length} products</span>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50">Previous</button>
              <button className="px-3 py-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
