import { redirect } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Package, LineChart, LogOut, LayoutDashboard, Settings } from 'lucide-react';

export default async function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?next=/supplier');
  }

  // Verify if user is a supplier
  const { data: supplierUser } = await supabase
    .from('supplier_users')
    .select('*, suppliers(name)')
    .eq('user_id', session.user.id)
    .single();

  if (!supplierUser) {
    // Not a supplier, redirect to profile or 403
    redirect('/profile');
  }

  const supplierName = supplierUser.suppliers?.name || 'Supplier Portal';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-ink text-white/70 flex flex-col hidden md:flex shrink-0">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-display italic text-white mb-1">NINOC B2B</h1>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em]">{supplierName}</p>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          <Link href="/supplier" className="flex items-center gap-3 px-4 py-3 text-sm hover:text-white hover:bg-white/5 rounded-md transition-colors">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          <Link href="/supplier/inventory" className="flex items-center gap-3 px-4 py-3 text-sm hover:text-white hover:bg-white/5 rounded-md transition-colors">
            <Package size={18} />
            <span>Allocations</span>
          </Link>
          <Link href="/supplier/ledger" className="flex items-center gap-3 px-4 py-3 text-sm hover:text-white hover:bg-white/5 rounded-md transition-colors">
            <LineChart size={18} />
            <span>Sales & Payouts</span>
          </Link>
          <Link href="/supplier/settings" className="flex items-center gap-3 px-4 py-3 text-sm hover:text-white hover:bg-white/5 rounded-md transition-colors">
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button className="flex items-center gap-3 px-4 py-3 w-full text-sm text-rose/80 hover:text-rose hover:bg-white/5 rounded-md transition-colors">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-8 shrink-0">
          <h2 className="text-sm font-medium text-gray-800">Partner Hub</h2>
        </header>
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
