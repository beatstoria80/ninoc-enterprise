import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Package, LineChart, LayoutDashboard, Settings, Truck, Coffee, UtensilsCrossed, AlertTriangle } from 'lucide-react';
import { getCurrentSupplier } from '@/lib/services/supplier';
import { SupplierLogoutButton } from '@/components/supplier/SupplierLogoutButton';
import { SupplierNotificationListener } from '@/components/supplier/SupplierNotificationListener';
import { PageTransition } from '@/components/supplier/PageTransition';
import { SupplierNavigation } from '@/components/supplier/SupplierNavigation';

export default async function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verify if user is a supplier using cached service.
  // This centralizes the session and database lookup.
  const supplierContext = await getCurrentSupplier();

  if (!supplierContext) {
    redirect('/supplier/apply');
  }

  if (supplierContext.suppliers?.status === 'pending') {
    return (
      <div className="min-h-screen bg-cr noise flex items-center justify-center p-4">
        <div className="bg-white p-8 max-w-md w-full shadow-2xl border border-ink/5 text-center">
          <div className="w-16 h-16 mx-auto bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6">
            <Package size={24} />
          </div>
          <h2 className="text-xl font-display font-medium text-ink mb-2">Application Under Review</h2>
          <p className="text-sm text-ink/60 mb-6">
            Thank you for applying to be a NINOC B2B Partner. Our curation team is currently reviewing your capacity and sample submission. We will notify you via email once your application is approved.
          </p>
          <Link href="/" className="text-xs md:text-[10px] font-medium uppercase tracking-[0.2em] text-ink hover:text-rose transition-colors">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const supplierName = supplierContext.suppliers?.name || 'Supplier Portal';
  const isFNB = supplierContext.pillar === 'FNB';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SupplierNotificationListener userId={supplierContext.user_id} />
      <SupplierNavigation supplierName={supplierName} isFNB={isFNB} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 md:h-screen md:overflow-hidden relative">
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
