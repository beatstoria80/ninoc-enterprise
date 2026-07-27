import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Package, LineChart, LogOut, LayoutDashboard, Settings, Truck } from 'lucide-react';
import { getCurrentSupplier } from '@/lib/services/supplier';

export default async function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?next=/supplier');
  }

  // Verify if user is a supplier using cached service
  const supplierUser = await getCurrentSupplier();

  if (!supplierUser) {
    // Not a supplier at all, redirect to apply
    redirect('/supplier/apply');
  }

  if (supplierUser.suppliers?.status === 'pending') {
    return (
      <div className="min-h-screen bg-cr noise flex items-center justify-center p-4">
        <div className="bg-white p-8 max-w-md w-full shadow-2xl border border-ink/5 text-center">
          <div className="w-16 h-16 mx-auto bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6">
            <Package size={24} />
          </div>
          <h2 className="text-xl font-display font-medium text-ink mb-2">Application Under Review</h2>
          <p className="text-sm text-ink/60 mb-6">
            Thank you for applying to be a NINOC B2B Manufacturer. Our curation team is currently reviewing your capacity and sample submission. We will notify you via email once your factory is approved.
          </p>
          <Link href="/" className="text-xs md:text-[10px] font-medium uppercase tracking-[0.2em] text-ink hover:text-rose transition-colors">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const supplierName = supplierUser.suppliers?.name || 'Supplier Portal';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-ink text-white/70 flex flex-col hidden md:flex shrink-0">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-display italic text-white mb-1">NINOC B2B</h1>
          <p className="text-xs md:text-[10px] font-medium uppercase tracking-[0.2em]">{supplierName}</p>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2">
          <Link href="/supplier" className="flex items-center gap-3 px-4 py-3 text-sm hover:text-white hover:bg-white/5 rounded-md transition-colors">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>
          <Link href="/supplier/submissions" className="flex items-center gap-3 px-4 py-3 text-sm hover:text-white hover:bg-white/5 rounded-md transition-colors">
            <Package size={18} />
            <span>Submit Products</span>
          </Link>
          <Link href="/supplier/inventory" className="flex items-center gap-3 px-4 py-3 text-sm hover:text-white hover:bg-white/5 rounded-md transition-colors">
            <Package size={18} />
            <span>Allocations</span>
          </Link>
          <Link href="/supplier/logistics" className="flex items-center gap-3 px-4 py-3 text-sm hover:text-white hover:bg-white/5 rounded-md transition-colors">
            <Truck size={18} />
            <span>Logistics & Packing</span>
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
      <main className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-hidden">
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
