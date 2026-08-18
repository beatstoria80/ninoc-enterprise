import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Save, Building, Trash2, Edit2, Activity } from 'lucide-react';
import { WarehouseMonitoring } from './WarehouseMonitoring';

export function WarehouseTab() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHubId, setSelectedHubId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    code: '',
    contact_name: '',
    contact_phone: '',
    contact_phone_2: '',
    street_address: '', 
    district: '',
    city: '', 
    province: '',
    postal_code: '',
    is_primary: false
  });

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/warehouses');
      if (res.ok) {
        const data = await res.json();
        setWarehouses(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchWarehouses();
  }, []);

  if (selectedHubId) {
    return <WarehouseMonitoring hubId={selectedHubId} onBack={() => setSelectedHubId(null)} />;
  }

  const handleEdit = (wh: any) => {
    setFormData({
      name: wh.name || '',
      code: wh.code || '',
      contact_name: wh.contact_name || '',
      contact_phone: wh.contact_phone || '',
      contact_phone_2: wh.contact_phone_2 || '',
      street_address: wh.street_address || '',
      district: wh.district || '',
      city: wh.city || '',
      province: wh.province || '',
      postal_code: wh.postal_code || '',
      is_primary: wh.is_primary || false
    });
    setEditId(wh.id);
    setIsAdding(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/warehouses', {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editId ? { ...formData, id: editId } : formData)
      });
      if (res.ok) {
        setFormData({ 
          name: '', code: '', contact_name: '', contact_phone: '', contact_phone_2: '',
          street_address: '', district: '', city: '', province: '',
          postal_code: '', is_primary: false
        });
        setIsAdding(false);
        setEditId(null);
        fetchWarehouses();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to save warehouse');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving warehouse');
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hub? (Products linked to this hub might lose origin data)')) return;
    try {
      const res = await fetch(`/api/admin/warehouses?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchWarehouses();
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to delete warehouse');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-center text-ink/80">Loading hubs...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-display font-medium text-ink">NINOC Fulfillment Hubs</h2>
          <p className="text-xs text-ink/80">Configure central warehouses and B2B origins for accurate Biteship logistics rates.</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            if (isAdding) setEditId(null);
          }}
          className="px-3 py-1.5 bg-ink text-white text-xs uppercase tracking-wider font-medium flex items-center gap-2 rounded hover:bg-rose transition-colors"
        >
          {isAdding ? 'Cancel' : <><Plus size={14} /> Add Hub</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-5 rounded-xl border border-ink/10 shadow-sm">
          <form onSubmit={handleAdd} className="space-y-4">
            <h3 className="font-medium text-sm border-b border-ink/10 pb-2 mb-3">Warehouse Details (Biteship Standard)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-ink/90 mb-1">Hub Name <span className="text-rose">*</span></label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-2 py-1.5 border border-ink/10 rounded focus:border-rose focus:outline-none text-xs" placeholder="e.g. NINOC Main Hub" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-ink/90 mb-1">Hub Code <span className="text-rose">*</span></label>
                <input required type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full px-2 py-1.5 border border-ink/10 rounded focus:border-rose focus:outline-none text-xs" placeholder="e.g. WH-BDO-01" />
              </div>
              
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-ink/90 mb-1">PIC Name <span className="text-rose">*</span></label>
                <input required type="text" value={formData.contact_name} onChange={e => setFormData({...formData, contact_name: e.target.value})} className="w-full px-2 py-1.5 border border-ink/10 rounded focus:border-rose focus:outline-none text-xs" placeholder="e.g. Budi (Warehouse Admin)" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-ink/90 mb-1">PIC Phone (Primary) <span className="text-rose">*</span></label>
                <input required type="tel" value={formData.contact_phone} onChange={e => setFormData({...formData, contact_phone: e.target.value})} className="w-full px-2 py-1.5 border border-ink/10 rounded focus:border-rose focus:outline-none text-xs" placeholder="e.g. 08123456789" />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-[10px] uppercase tracking-wider text-ink/90 mb-1">PIC Phone 2 (Optional)</label>
                <input type="tel" value={formData.contact_phone_2} onChange={e => setFormData({...formData, contact_phone_2: e.target.value})} className="w-full px-2 py-1.5 border border-ink/10 rounded focus:border-rose focus:outline-none text-xs" placeholder="Opsional, no HP kedua..." />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-wider text-ink/90 mb-1">Street Address <span className="text-rose">*</span></label>
              <textarea required value={formData.street_address} onChange={e => setFormData({...formData, street_address: e.target.value})} className="w-full px-2 py-1.5 border border-ink/10 rounded focus:border-rose focus:outline-none text-xs" placeholder="Complete Street Name, No, RT/RW..." rows={2} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-ink/90 mb-1">District</label>
                <input type="text" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} className="w-full px-2 py-1.5 border border-ink/10 rounded focus:border-rose focus:outline-none text-xs" placeholder="Kecamatan" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-ink/90 mb-1">City</label>
                <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-2 py-1.5 border border-ink/10 rounded focus:border-rose focus:outline-none text-xs" placeholder="Kota/Kabupaten" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-ink/90 mb-1">Province</label>
                <input type="text" value={formData.province} onChange={e => setFormData({...formData, province: e.target.value})} className="w-full px-2 py-1.5 border border-ink/10 rounded focus:border-rose focus:outline-none text-xs" placeholder="Provinsi" />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-ink/90 mb-1">Postal Code <span className="text-rose">*</span></label>
                <input required type="text" value={formData.postal_code} onChange={e => setFormData({...formData, postal_code: e.target.value})} className="w-full px-2 py-1.5 border border-ink/10 rounded focus:border-rose focus:outline-none text-xs" placeholder="e.g. 40292" />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 pb-1 border-t border-ink/10 mt-4">
              <input 
                type="checkbox" 
                id="is_primary"
                checked={formData.is_primary} 
                onChange={e => setFormData({...formData, is_primary: e.target.checked})} 
                className="w-4 h-4 text-rose rounded border-ink/20 focus:ring-rose"
              />
              <label htmlFor="is_primary" className="text-xs font-medium cursor-pointer">Set as Main Hub (Default for Original Ninoc Products)</label>
            </div>

            <div className="flex justify-end pt-2">
              <button disabled={isSubmitting} type="submit" className="px-6 py-2 bg-ink text-white text-xs uppercase tracking-widest font-medium rounded hover:bg-rose transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                <Save size={14} /> {isSubmitting ? 'Saving...' : 'Save Warehouse'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses.map(wh => (
          <div key={wh.id} className="bg-white rounded-xl border border-ink/10 shadow-sm relative overflow-hidden group hover:border-ink/20 transition-all hover:shadow-md flex flex-col">
            <div className="p-4 flex-1">
              <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <Building size={80} />
              </div>
              
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 z-20 transition-opacity">
                <button 
                  onClick={() => handleEdit(wh)}
                  className="p-1.5 bg-ink/10 text-ink rounded hover:bg-ink hover:text-white transition-colors"
                  title="Edit Hub"
                >
                  <Edit2 size={14} />
                </button>
                <button 
                  onClick={() => handleDelete(wh.id)}
                  className="p-1.5 bg-rose/10 text-rose rounded hover:bg-rose hover:text-white transition-colors"
                  title="Delete Hub"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex flex-col mb-4 relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-ink/60 bg-ink/5 px-2 py-0.5 rounded">{wh.code}</span>
                  {wh.is_primary && (
                    <span className="inline-flex px-2 py-0.5 bg-rose/10 text-rose text-[9px] uppercase tracking-wider font-bold rounded-full">
                      Main Hub
                    </span>
                  )}
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 mt-1 shrink-0 bg-ink rounded-lg flex items-center justify-center text-white">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink text-sm">{wh.name}</h3>
                    <p className="text-[11px] font-medium text-ink/80 flex items-center gap-1 mt-0.5">
                      PIC: {wh.contact_name} ({wh.contact_phone})
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-xs text-ink/70 relative z-10 pt-3 border-t border-ink/5">
                <p className="line-clamp-2">{wh.street_address}</p>
                <p>{[wh.district, wh.city, wh.province].filter(Boolean).join(', ')}</p>
                <p className="font-mono text-ink/90 font-medium">ZIP: {wh.postal_code}</p>
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedHubId(wh.id)}
              className="w-full bg-ink/5 hover:bg-ink hover:text-white text-ink text-[10px] uppercase tracking-wider font-bold py-3 px-4 flex items-center justify-center gap-2 transition-colors border-t border-ink/10"
            >
              <Activity size={14} /> View Logistics Activity
            </button>
          </div>
        ))}
        {warehouses.length === 0 && !isAdding && (
          <div className="col-span-full p-12 text-center border-2 border-dashed border-ink/10 rounded-xl text-ink/80 bg-ink/5">
            No fulfillment hubs configured yet.<br/>Click &quot;Add Hub&quot; to configure your first warehouse origin.
          </div>
        )}
      </div>
    </div>
  );
}
