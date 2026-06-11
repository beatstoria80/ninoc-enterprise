import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MapPin, Plus, Save, Building } from 'lucide-react';

export function WarehouseTab() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: '', address_line: '', city: '', postal_code: '' });

  const fetchWarehouses = async () => {
    setLoading(true);
    const { data } = await supabase.from('warehouses').select('*').order('created_at', { ascending: false });
    if (data) setWarehouses(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWarehouses();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.from('warehouses').insert({
      name: formData.name,
      address_line: formData.address_line,
      city: formData.city,
      postal_code: formData.postal_code,
      is_crossdock_hub: true // Since Model B, all warehouses created here are Ninoc Hubs
    });
    setFormData({ name: '', address_line: '', city: '', postal_code: '' });
    setIsAdding(false);
    fetchWarehouses();
  };

  if (loading) return <div className="p-8 text-center text-ink/40">Loading hubs...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-medium text-ink">NINOC Fulfillment Hubs</h2>
          <p className="text-xs text-ink/60">Configure central warehouses for logistics origins.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-4 py-2 bg-ink text-white text-[10px] uppercase tracking-wider font-medium flex items-center gap-2 rounded hover:bg-rose transition-colors"
        >
          {isAdding ? 'Cancel' : <><Plus size={14} /> Add Hub</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-ink/5 p-6 rounded-xl border border-ink/10">
          <form onSubmit={handleAdd} className="space-y-4 max-w-md">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-ink/50 mb-1">Hub Name</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border border-ink/10 rounded focus:border-rose focus:outline-none text-sm" placeholder="e.g. NINOC Main Hub" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-ink/50 mb-1">Street Address</label>
              <textarea required value={formData.address_line} onChange={e => setFormData({...formData, address_line: e.target.value})} className="w-full px-3 py-2 border border-ink/10 rounded focus:border-rose focus:outline-none text-sm" placeholder="Street Name, No..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-ink/50 mb-1">City</label>
                <input required type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-3 py-2 border border-ink/10 rounded focus:border-rose focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-ink/50 mb-1">Postal Code</label>
                <input required type="text" value={formData.postal_code} onChange={e => setFormData({...formData, postal_code: e.target.value})} className="w-full px-3 py-2 border border-ink/10 rounded focus:border-rose focus:outline-none text-sm" />
              </div>
            </div>
            <button type="submit" className="w-full py-3 bg-ink text-white text-[10px] uppercase tracking-widest font-medium rounded hover:bg-rose transition-colors flex items-center justify-center gap-2">
              <Save size={14} /> Save Warehouse
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.map(wh => (
          <div key={wh.id} className="bg-white p-6 rounded-xl border border-ink/5 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Building size={64} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-ink rounded-lg flex items-center justify-center text-white">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="font-bold text-ink">{wh.name}</h3>
                <span className="inline-flex px-2 py-0.5 bg-rose/10 text-rose text-[9px] uppercase tracking-wider font-medium rounded-full">
                  Central Hub
                </span>
              </div>
            </div>
            <div className="space-y-1 text-sm text-ink/60 relative z-10">
              <p>{wh.address_line}</p>
              <p>{wh.city}, {wh.postal_code}</p>
            </div>
          </div>
        ))}
        {warehouses.length === 0 && !isAdding && (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-ink/10 rounded-xl text-ink/40">
            No fulfillment hubs configured yet.
          </div>
        )}
      </div>
    </div>
  );
}
