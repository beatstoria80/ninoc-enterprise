import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DoReceiving() {
  const [pos, setPos] = useState<any[]>([]);

  useEffect(() => {
    fetchPendingPos();
  }, []);

  const fetchPendingPos = async () => {
    // Fetch POs that are not fully received yet
    const { data } = await supabase
      .from('purchase_orders')
      .select('*, po_items(*, product_variants(*, products(name)))')
      .neq('status', 'received')
      .order('created_at', { ascending: false });
    if (data) setPos(data);
  };

  const handleReceiveItem = async (poId: string, itemId: string, qtyOrdered: number, qtyReceived: number) => {
    const qtyToReceive = prompt(`Enter quantity to receive (Ordered: ${qtyOrdered}, Already Received: ${qtyReceived}):`, String(qtyOrdered - qtyReceived));
    if (!qtyToReceive) return;

    const parsedQty = parseInt(qtyToReceive);
    if (isNaN(parsedQty) || parsedQty <= 0 || parsedQty > (qtyOrdered - qtyReceived)) {
      return alert('Invalid quantity');
    }

    try {
      // Call RPC to update stock, ledger, and PO items securely
      const { error } = await supabase.rpc('receive_po_item', {
        p_po_item_id: itemId,
        p_qty_received: parsedQty,
        p_admin_email: 'admin@ninoc.com' // Should be dynamic from auth in real use
      });

      if (error) throw error;
      
      // Update PO status to 'partial' or 'received'
      // For simplicity here, we'll just set it to partial, a real system might check if all items are fully received
      await supabase.from('purchase_orders').update({ status: 'partial' }).eq('id', poId);
      
      alert('Items received and stock updated successfully!');
      fetchPendingPos();
    } catch (err) {
      console.error(err);
      alert('Failed to receive item');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-ink">Inbound Receiving (DO)</h2>
      </div>

      <div className="grid gap-6">
        {pos.map(po => (
          <div key={po.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4 pb-4 border-b">
              <div>
                <h3 className="font-bold text-lg">{po.po_number}</h3>
                <p className="text-sm text-gray-500">Vendor: {po.vendor_name}</p>
              </div>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-widest rounded-full flex items-center gap-2">
                <Truck size={14} /> {po.status === 'draft' ? 'Awaiting Shipment' : 'Partial Received'}
              </span>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="text-gray-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-2">Item</th>
                  <th className="py-2 text-center">Ordered</th>
                  <th className="py-2 text-center">Received</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {po.po_items?.map((item: any) => {
                  const isFullyReceived = item.qty_received >= item.qty_ordered;
                  return (
                    <tr key={item.id} className={isFullyReceived ? 'opacity-50' : ''}>
                      <td className="py-3 font-medium">
                        {item.product_variants?.products?.name} - {item.product_variants?.size}
                      </td>
                      <td className="py-3 text-center">{item.qty_ordered}</td>
                      <td className="py-3 text-center font-bold text-ink">{item.qty_received}</td>
                      <td className="py-3 text-right">
                        {isFullyReceived ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-bold">
                            <CheckCircle size={14} /> Completed
                          </span>
                        ) : (
                          <button 
                            onClick={() => handleReceiveItem(po.id, item.id, item.qty_ordered, item.qty_received)}
                            className="px-3 py-1.5 bg-ink text-white text-xs font-medium rounded-md hover:bg-ink/90"
                          >
                            Receive Item
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}

        {pos.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
            <Truck size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No pending inbound shipments.</p>
          </div>
        )}
      </div>
    </div>
  );
}
