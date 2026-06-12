import React, { useState, useEffect, useCallback } from 'react';
import { ClipboardCheck, Search, AlertTriangle, CheckCircle, Save, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface VariantRow {
  variant_id: string;
  product_name: string;
  size: string;
  sku: string;
  system_qty: number;
  physical_qty: number | null;
  difference: number;
  reason: string;
  status: 'pending' | 'matched' | 'discrepancy';
}

export default function StockOpname({ products, adminEmail }: { products: any[]; adminEmail: string }) {
  const [rows, setRows] = useState<VariantRow[]>([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [showOnlyDiscrepancy, setShowOnlyDiscrepancy] = useState(false);
  const [lastOpnameDate, setLastOpnameDate] = useState<string | null>(null);

  const buildRows = useCallback(() => {
    const allRows: VariantRow[] = [];
    products.forEach((p: any) => {
      p.variants?.forEach((v: any) => {
        allRows.push({
          variant_id: v.id,
          product_name: p.name,
          size: v.size || '-',
          sku: v.sku || 'N/A',
          system_qty: v.stock_quantity || 0,
          physical_qty: null,
          difference: 0,
          reason: '',
          status: 'pending',
        });
      });
    });
    setRows(allRows);
  }, [products]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buildRows();
  }, [buildRows]);

  // Fetch last opname date
  useEffect(() => {
    const fetchLast = async () => {
      const { data } = await supabase
        .from('stock_ledgers')
        .select('created_at')
        .eq('type', 'adj_manual')
        .order('created_at', { ascending: false })
        .limit(1);
      if (data && data.length > 0) setLastOpnameDate(data[0].created_at);
    };
    fetchLast();
  }, []);

  const updateRow = (variantId: string, field: 'physical_qty' | 'reason', value: any) => {
    setRows(prev => prev.map(r => {
      if (r.variant_id !== variantId) return r;
      const updated = { ...r, [field]: value };
      if (field === 'physical_qty') {
        const pq = Number(value);
        updated.difference = isNaN(pq) ? 0 : pq - r.system_qty;
        updated.status = isNaN(pq) || value === null || value === '' ? 'pending' : pq === r.system_qty ? 'matched' : 'discrepancy';
      }
      return updated;
    }));
  };

  const handleSaveOpname = async () => {
    const adjustments = rows.filter(r => r.status === 'discrepancy' && r.reason.trim() !== '');
    if (adjustments.length === 0) {
      alert('Tidak ada penyesuaian stok yang perlu disimpan, atau alasan belum diisi.');
      return;
    }

    setSaving(true);
    try {
      for (const adj of adjustments) {
        // Update actual stock in variants table
        const { error: updateErr } = await supabase
          .from('variants')
          .update({ stock_quantity: adj.physical_qty })
          .eq('id', adj.variant_id);

        if (updateErr) throw updateErr;

        // Record in stock ledger
        const { error: ledgerErr } = await supabase
          .from('stock_ledgers')
          .insert({
            variant_id: adj.variant_id,
            type: 'adj_manual',
            qty: adj.difference,
            reference_id: `OPNAME-${new Date().toISOString().slice(0, 10)}`,
            notes: `Stock Opname: ${adj.reason}`,
            created_by: adminEmail
          });

        if (ledgerErr) throw ledgerErr;
      }

      alert(`✅ ${adjustments.length} penyesuaian stok berhasil disimpan ke database dan Kartu Stok (Ledger).`);
      buildRows(); // Reset
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan penyesuaian stok.');
    } finally {
      setSaving(false);
    }
  };

  const filteredRows = rows.filter(r => {
    const matchSearch = search === '' ||
      r.product_name.toLowerCase().includes(search.toLowerCase()) ||
      r.sku.toLowerCase().includes(search.toLowerCase());
    const matchFilter = !showOnlyDiscrepancy || r.status === 'discrepancy';
    return matchSearch && matchFilter;
  });

  const totalDiscrepancies = rows.filter(r => r.status === 'discrepancy').length;
  const totalMatched = rows.filter(r => r.status === 'matched').length;
  const totalPending = rows.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ClipboardCheck size={20} className="text-rose" />
            Stock Opname
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Cocokkan stok fisik di rak dengan stok di sistem. Selisih otomatis tercatat di Kartu Stok.
            {lastOpnameDate && (
              <span className="ml-2 text-gray-400">
                Terakhir opname: {new Date(lastOpnameDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={handleSaveOpname}
          disabled={saving || totalDiscrepancies === 0}
          className={`px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all ${
            totalDiscrepancies > 0 && !saving
              ? 'bg-rose text-white hover:bg-rose/90 cursor-pointer'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Save size={14} />
          {saving ? 'Menyimpan...' : `Simpan ${totalDiscrepancies} Penyesuaian`}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Belum Dihitung</p>
          <p className="text-2xl font-bold text-gray-900">{totalPending}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-green-100 shadow-sm">
          <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1">Cocok ✓</p>
          <p className="text-2xl font-bold text-green-600">{totalMatched}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Selisih ⚠</p>
          <p className="text-2xl font-bold text-amber-600">{totalDiscrepancies}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari produk atau SKU..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose/20 focus:border-rose"
          />
        </div>
        <button
          onClick={() => setShowOnlyDiscrepancy(!showOnlyDiscrepancy)}
          className={`px-3 py-2.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-2 ${
            showOnlyDiscrepancy ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <AlertTriangle size={14} />
          {showOnlyDiscrepancy ? 'Semua' : 'Selisih Saja'}
        </button>
        <button
          onClick={buildRows}
          className="px-3 py-2.5 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 flex items-center gap-2"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500 uppercase text-[10px] tracking-wider">Produk</th>
              <th className="px-4 py-3 font-medium text-gray-500 uppercase text-[10px] tracking-wider">SKU</th>
              <th className="px-4 py-3 font-medium text-gray-500 uppercase text-[10px] tracking-wider text-center">Stok Sistem</th>
              <th className="px-4 py-3 font-medium text-gray-500 uppercase text-[10px] tracking-wider text-center">Stok Fisik</th>
              <th className="px-4 py-3 font-medium text-gray-500 uppercase text-[10px] tracking-wider text-center">Selisih</th>
              <th className="px-4 py-3 font-medium text-gray-500 uppercase text-[10px] tracking-wider">Alasan</th>
              <th className="px-4 py-3 font-medium text-gray-500 uppercase text-[10px] tracking-wider text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredRows.map((row) => (
              <tr key={row.variant_id} className={`transition-colors ${
                row.status === 'discrepancy' ? 'bg-amber-50/30' : row.status === 'matched' ? 'bg-green-50/20' : 'hover:bg-gray-50/50'
              }`}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900 text-xs">{row.product_name}</div>
                  <div className="text-[11px] text-gray-400">Size: {row.size}</div>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-gray-600">{row.sku}</td>
                <td className="px-4 py-3 text-center font-bold text-gray-900">{row.system_qty}</td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    min={0}
                    value={row.physical_qty ?? ''}
                    onChange={(e) => updateRow(row.variant_id, 'physical_qty', e.target.value === '' ? null : Number(e.target.value))}
                    placeholder="—"
                    className={`w-20 text-center py-1.5 px-2 border rounded-md text-sm font-bold focus:outline-none focus:ring-2 focus:ring-rose/20 ${
                      row.status === 'discrepancy' ? 'border-amber-300 bg-amber-50' : row.status === 'matched' ? 'border-green-300 bg-green-50' : 'border-gray-200'
                    }`}
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  {row.physical_qty !== null && (
                    <span className={`font-bold text-sm ${
                      row.difference > 0 ? 'text-green-600' : row.difference < 0 ? 'text-rose' : 'text-gray-400'
                    }`}>
                      {row.difference > 0 ? '+' : ''}{row.difference}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.status === 'discrepancy' && (
                    <select
                      value={row.reason}
                      onChange={(e) => updateRow(row.variant_id, 'reason', e.target.value)}
                      className="w-full px-2 py-1.5 border border-amber-200 rounded-md text-xs bg-white focus:outline-none focus:ring-2 focus:ring-rose/20"
                    >
                      <option value="">Pilih alasan...</option>
                      <option value="Barang reject / QC fail">Barang reject / QC fail</option>
                      <option value="Barang hilang (shrinkage)">Barang hilang (shrinkage)</option>
                      <option value="Salah hitung sebelumnya">Salah hitung sebelumnya</option>
                      <option value="Retur belum tercatat">Retur belum tercatat</option>
                      <option value="Sample / gift promosi">Sample / gift promosi</option>
                      <option value="Kerusakan gudang (banjir/rayap)">Kerusakan gudang (banjir/rayap)</option>
                    </select>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {row.status === 'matched' && (
                    <span className="inline-flex items-center gap-1 text-green-600 text-[10px] font-bold uppercase">
                      <CheckCircle size={12} /> Cocok
                    </span>
                  )}
                  {row.status === 'discrepancy' && (
                    <span className="inline-flex items-center gap-1 text-amber-600 text-[10px] font-bold uppercase">
                      <AlertTriangle size={12} /> Selisih
                    </span>
                  )}
                  {row.status === 'pending' && (
                    <span className="text-gray-300 text-[10px] font-bold uppercase">—</span>
                  )}
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  <ClipboardCheck size={32} className="mx-auto mb-3 text-gray-200" />
                  <p className="font-medium">Tidak ada data ditemukan.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
