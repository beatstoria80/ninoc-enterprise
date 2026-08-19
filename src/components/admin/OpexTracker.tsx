import React, { useState, useEffect } from 'react';
import { Wallet, Plus, Trash2, Calendar, TrendingDown, PieChart } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  created_by: string;
  created_at: string;
}

const CATEGORIES = [
  { value: 'packaging', label: 'Packaging (Kardus, Bubble Wrap, Lakban)', icon: '📦' },
  { value: 'shipping_subsidy', label: 'Subsidi Ongkir', icon: '🚚' },
  { value: 'marketing', label: 'Marketing / Ads', icon: '📢' },
  { value: 'salary', label: 'Gaji Karyawan', icon: '👤' },
  { value: 'rent', label: 'Sewa Gudang / Tempat', icon: '🏠' },
  { value: 'utilities', label: 'Listrik, Air, Internet', icon: '💡' },
  { value: 'software', label: 'Software / Server', icon: '💻' },
  { value: 'equipment', label: 'Peralatan Gudang', icon: '🔧' },
  { value: 'payment_gateway', label: 'Biaya Payment Gateway (Midtrans)', icon: '💳' },
  { value: 'other', label: 'Lainnya', icon: '📋' },
];

export default function OpexTracker({ adminEmail }: { adminEmail: string }) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Form
  const [form, setForm] = useState({ category: '', description: '', amount: 0, expense_date: new Date().toISOString().slice(0, 10) });

  const fetchExpenses = async () => {
    const [year, month] = selectedMonth.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(Number(year), Number(month), 0).toISOString().slice(0, 10);

    const { data } = await supabase
      .from('operational_expenses')
      .select('*')
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .order('expense_date', { ascending: false });
    if (data) setExpenses(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  const handleSave = async () => {
    if (!form.category || form.amount <= 0) return alert('Kategori dan jumlah wajib diisi.');

    const { error } = await supabase.from('operational_expenses').insert({
      category: form.category,
      description: form.description,
      amount: form.amount,
      expense_date: form.expense_date,
      created_by: adminEmail
    });

    if (error) { console.error(error); return alert('Gagal menyimpan.'); }
    setIsAdding(false);
    setForm({ category: '', description: '', amount: 0, expense_date: new Date().toISOString().slice(0, 10) });
    fetchExpenses();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pengeluaran ini?')) return;
    await supabase.from('operational_expenses').delete().eq('id', id);
    fetchExpenses();
  };

  // Aggregate by category
  const categoryTotals = CATEGORIES.map(cat => {
    const total = expenses.filter(e => e.category === cat.value).reduce((s, e) => s + Number(e.amount), 0);
    return { ...cat, total };
  }).filter(c => c.total > 0).sort((a, b) => b.total - a.total);

  const totalOpex = expenses.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Wallet size={20} className="text-rose" />
            Operational Expenses (Opex)
          </h2>
          <p className="text-xs text-gray-500 mt-1">Catat biaya operasional harian untuk mengetahui profit bersih yang sebenarnya.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose/20"
            />
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2 bg-rose text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-rose/90 flex items-center gap-2"
          >
            <Plus size={14} /> Tambah
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-rose/10 flex items-center justify-center">
              <TrendingDown size={18} className="text-rose" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Opex Bulan Ini</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">Rp {totalOpex.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
              <PieChart size={18} className="text-blue-500" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Jumlah Transaksi</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{expenses.length}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
              <Wallet size={18} className="text-amber-500" />
            </div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rata-Rata / Hari</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            Rp {expenses.length > 0 ? Math.round(totalOpex / 30).toLocaleString('id-ID') : '0'}
          </p>
        </div>
      </div>

      {/* Category Breakdown */}
      {categoryTotals.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Breakdown per Kategori</h3>
          <div className="space-y-3">
            {categoryTotals.map(cat => {
              const pct = totalOpex > 0 ? Math.round((cat.total / totalOpex) * 100) : 0;
              return (
                <div key={cat.value} className="flex items-center gap-3">
                  <span className="text-lg w-8 text-center">{cat.icon}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{cat.label}</span>
                      <span className="font-bold text-gray-900">Rp {cat.total.toLocaleString('id-ID')} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-rose h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Form */}
      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-4 text-sm">Tambah Pengeluaran</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold tracking-wider">Kategori</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose/20"
              >
                <option value="">Pilih...</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold tracking-wider">Deskripsi</label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="e.g., Beli lakban 10 roll"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose/20"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold tracking-wider">Jumlah (Rp)</label>
              <input
                type="number"
                value={form.amount || ''}
                onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                placeholder="50000"
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose/20"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase text-gray-400 mb-1 font-bold tracking-wider">Tanggal</label>
              <input
                type="date"
                value={form.expense_date}
                onChange={e => setForm({ ...form, expense_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose/20"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsAdding(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md">Batal</button>
            <button onClick={handleSave} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800">Simpan</button>
          </div>
        </div>
      )}

      {/* Expense List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-500 uppercase text-[10px] tracking-wider">Tanggal</th>
                <th className="px-4 py-3 font-medium text-gray-500 uppercase text-[10px] tracking-wider">Kategori</th>
                <th className="px-4 py-3 font-medium text-gray-500 uppercase text-[10px] tracking-wider">Deskripsi</th>
                <th className="px-4 py-3 font-medium text-gray-500 uppercase text-[10px] tracking-wider text-right">Jumlah</th>
                <th className="px-4 py-3 font-medium text-gray-500 uppercase text-[10px] tracking-wider">Oleh</th>
                <th className="px-4 py-3 font-medium text-gray-500 uppercase text-[10px] tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {expenses.map(exp => {
                const cat = CATEGORIES.find(c => c.value === exp.category);
                return (
                  <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {new Date(exp.expense_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                        <span>{cat?.icon || '📋'}</span>
                        <span className="text-gray-700">{cat?.label || exp.category}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{exp.description || '-'}</td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900 text-xs">
                      Rp {Number(exp.amount).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{exp.created_by || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(exp.id)}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    <Wallet size={32} className="mx-auto mb-3 text-gray-200" />
                    <p className="font-medium">Belum ada pengeluaran bulan ini.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
