import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Printer, Search, CheckCircle, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PoManager({ products }: { products: any[] }) {
  const [pos, setPos] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedPo, setSelectedPo] = useState<any>(null);

  // Form State
  const [vendorName, setVendorName] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [poItems, setPoItems] = useState<{variant_id: string, qty: number, unit_cost: number}[]>([]);

  const fetchPos = async () => {
    const { data } = await supabase
      .from('purchase_orders')
      .select('*, po_items(*, product_variants(*, products(name)))')
      .order('created_at', { ascending: false });
    if (data) setPos(data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPos();
  }, []);

  const addPoItem = () => {
    setPoItems([...poItems, { variant_id: '', qty: 0, unit_cost: 0 }]);
  };

  const handleSavePo = async () => {
    if (!vendorName || poItems.length === 0) return alert('Vendor and items required');
    
    const totalAmount = poItems.reduce((sum, item) => sum + (item.qty * item.unit_cost), 0);
    const poNumber = `PO-${Date.now().toString().slice(-6)}`;

    const { data: po, error } = await supabase.from('purchase_orders').insert({
      po_number: poNumber,
      vendor_name: vendorName,
      status: 'draft',
      total_amount: totalAmount,
      expected_date: expectedDate || null
    }).select().single();

    if (error) return console.error(error);

    const itemsToInsert = poItems.map(item => ({
      po_id: po.id,
      variant_id: item.variant_id,
      qty_ordered: item.qty,
      unit_cost: item.unit_cost
    }));

    await supabase.from('po_items').insert(itemsToInsert);
    setIsCreating(false);
    setVendorName('');
    setPoItems([]);
    fetchPos();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print View (Hidden on Screen, Shown on Print) */}
      <div className="hidden print:block fixed inset-0 bg-white p-8 z-[9999] text-black">
        {selectedPo && (
          <div>
            <div className="flex justify-between items-start border-b pb-6 mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tighter">NINOC</h1>
                <p className="text-sm text-gray-500 mt-1">PURCHASE ORDER</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{selectedPo.po_number}</p>
                <p className="text-sm text-gray-500">Date: {new Date(selectedPo.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="font-bold text-gray-700 uppercase text-xs mb-2">Vendor / Supplier</h3>
              <p className="font-medium text-lg">{selectedPo.vendor_name}</p>
              <p className="text-sm text-gray-500">Expected Delivery: {selectedPo.expected_date || 'TBD'}</p>
            </div>

            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-y bg-gray-50">
                  <th className="py-3 px-4">Item Description</th>
                  <th className="py-3 px-4">Qty</th>
                  <th className="py-3 px-4">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {selectedPo.po_items?.map((item: any) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-4 px-4 font-medium">
                      {item.product_variants?.products?.name || 'Unknown Product'} - {item.product_variants?.size}
                    </td>
                    <td className="py-4 px-4">{item.qty_ordered}</td>
                    <td className="py-4 px-4">Rp {item.unit_cost.toLocaleString('id-ID')}</td>
                    <td className="py-4 px-4 text-right font-medium">Rp {(item.qty_ordered * item.unit_cost).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="py-4 px-4 text-right font-bold text-gray-700">GRAND TOTAL</td>
                  <td className="py-4 px-4 text-right font-bold text-lg">Rp {selectedPo.total_amount.toLocaleString('id-ID')}</td>
                </tr>
              </tfoot>
            </table>
            
            <div className="mt-20 flex justify-between px-10">
              <div className="text-center">
                <p className="mb-16 font-medium text-sm text-gray-500">Authorized By (NINOC)</p>
                <div className="border-t border-gray-300 w-48 mx-auto"></div>
              </div>
              <div className="text-center">
                <p className="mb-16 font-medium text-sm text-gray-500">Accepted By (Vendor)</p>
                <div className="border-t border-gray-300 w-48 mx-auto"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Screen View */}
      <div className="print:hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-ink">Purchase Orders</h2>
          <button onClick={() => setIsCreating(!isCreating)} className="px-4 py-2 bg-rose text-white text-sm font-medium rounded-lg hover:bg-rose/90 flex items-center gap-2">
            <Plus size={16} /> New PO
          </button>
        </div>

        {isCreating && (
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
            <h3 className="font-bold text-ink mb-4">Create Purchase Order</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">Vendor Name</label>
                <input type="text" value={vendorName} onChange={e => setVendorName(e.target.value)} className="w-full px-3 py-2 border rounded-md" placeholder="e.g., Konveksi Maju Jaya" />
              </div>
              <div>
                <label className="block text-xs uppercase text-gray-500 mb-1">Expected Delivery</label>
                <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-end">
                <h4 className="text-sm font-medium text-gray-700">Order Items</h4>
                <button onClick={addPoItem} className="text-xs text-rose font-medium">+ Add Row</button>
              </div>
              {poItems.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] uppercase text-gray-400 mb-1">Product Variant</label>
                    <select value={item.variant_id} onChange={e => {
                      const newItems = [...poItems]; newItems[idx].variant_id = e.target.value; setPoItems(newItems);
                    }} className="w-full px-2 py-2 border rounded-md text-sm">
                      <option value="">Select Variant...</option>
                      {products.flatMap(p => p.variants.map((v: any) => (
                        <option key={v.id} value={v.id}>{p.name} - {v.size} (Stock: {v.stock_quantity})</option>
                      )))}
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="block text-[10px] uppercase text-gray-400 mb-1">Qty</label>
                    <input type="number" value={item.qty} onChange={e => {
                      const newItems = [...poItems]; newItems[idx].qty = Number(e.target.value); setPoItems(newItems);
                    }} className="w-full px-2 py-2 border rounded-md text-sm" />
                  </div>
                  <div className="w-32">
                    <label className="block text-[10px] uppercase text-gray-400 mb-1">Unit Cost</label>
                    <input type="number" value={item.unit_cost} onChange={e => {
                      const newItems = [...poItems]; newItems[idx].unit_cost = Number(e.target.value); setPoItems(newItems);
                    }} className="w-full px-2 py-2 border rounded-md text-sm" />
                  </div>
                  <button onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))} className="p-2 text-red-500 hover:bg-red-50 rounded-md mb-0.5">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-3 border-t pt-4">
              <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
              <button onClick={handleSavePo} className="px-4 py-2 bg-ink text-white text-sm rounded-md hover:bg-ink/90">Save & Draft PO</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-medium text-gray-500 uppercase text-xs tracking-wider">PO Number</th>
                <th className="px-6 py-4 font-medium text-gray-500 uppercase text-xs tracking-wider">Vendor</th>
                <th className="px-6 py-4 font-medium text-gray-500 uppercase text-xs tracking-wider">Status</th>
                <th className="px-6 py-4 font-medium text-gray-500 uppercase text-xs tracking-wider text-right">Amount</th>
                <th className="px-6 py-4 font-medium text-gray-500 uppercase text-xs tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pos.map(po => (
                <tr key={po.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-ink">{po.po_number}</td>
                  <td className="px-6 py-4 text-gray-600">{po.vendor_name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                      po.status === 'received' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                    }`}>{po.status}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">Rp {po.total_amount.toLocaleString('id-ID')}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => { setSelectedPo(po); setTimeout(() => handlePrint(), 100); }} 
                      className="p-1.5 text-gray-400 hover:text-ink hover:bg-gray-100 rounded-md"
                    >
                      <Printer size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {pos.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No Purchase Orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
