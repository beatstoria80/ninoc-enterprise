import { createClient } from '@/utils/supabase/server';
import { Settings2, Building2, User, CreditCard, ShieldCheck, Mail, MapPin, CheckCircle2 } from 'lucide-react';
import { getCurrentSupplier } from '@/lib/services/supplier';
import { UIPreferencesPanel } from '@/components/supplier/settings/UIPreferencesPanel';
import { SupplierForm } from './SupplierForm';
import Link from 'next/link';

export default async function SupplierSettingsPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const tab = searchParams.tab || 'company';
  
  const supplierUser = await getCurrentSupplier();
  
  if (!supplierUser) return null;

  const suppliersObj = supplierUser.suppliers as any;
  const supplierData = Array.isArray(suppliersObj) ? suppliersObj[0] : suppliersObj;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold font-display text-gray-900">Settings Hub</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your brand profile, banking details, and integration preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1 space-y-1">
          <Link href="?tab=company" className={`w-full text-left px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-3 transition-colors ${tab === 'company' ? 'bg-gray-100 text-ink' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
            <Building2 size={18} />
            Company Profile
          </Link>
          <Link href="?tab=account" className={`w-full text-left px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-3 transition-colors ${tab === 'account' ? 'bg-gray-100 text-ink' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
            <User size={18} />
            Account Details
          </Link>
          <Link href="?tab=bank" className={`w-full text-left px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-3 transition-colors ${tab === 'bank' ? 'bg-gray-100 text-ink' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
            <CreditCard size={18} />
            Bank & Payouts
          </Link>
          <Link href="?tab=security" className={`w-full text-left px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-3 transition-colors ${tab === 'security' ? 'bg-gray-100 text-ink' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
            <ShieldCheck size={18} />
            Security
          </Link>
        </div>

        <div className="md:col-span-3 space-y-6">
          {tab === 'company' && (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Company Information</h2>
                  <p className="text-sm text-gray-500 mt-1">Update your factory or brand details shown to Ninoc enterprise.</p>
                </div>
                <SupplierForm supplierData={supplierData} />
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Fulfillment & Warehouse Hub</h2>
                    <p className="text-sm text-gray-500 mt-1">Your assigned Ninoc central warehouse for inbound and outbound logistics.</p>
                  </div>
                  {supplierUser.assignedWarehouse ? (
                    <div className="px-3 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full border border-green-200 flex items-center gap-1.5">
                      <CheckCircle2 size={14} />
                      Connected
                    </div>
                  ) : (
                    <div className="px-3 py-1 bg-yellow-50 text-yellow-700 text-xs font-semibold rounded-full border border-yellow-200 flex items-center gap-1.5">
                      Pending Assignment
                    </div>
                  )}
                </div>
                
                <div className="p-6">
                  {supplierUser.assignedWarehouse ? (
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 flex items-start gap-4">
                      <div className="w-12 h-12 bg-white rounded-lg border border-gray-200 flex items-center justify-center shrink-0 shadow-sm">
                        <MapPin className="text-ink" size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded uppercase tracking-wider">
                            {supplierUser.assignedWarehouse.is_primary ? 'MAIN HUB' : 'CROSSDOCK HUB'}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">{supplierUser.assignedWarehouse.code}</span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900">{supplierUser.assignedWarehouse.name}</h3>
                        <p className="text-sm text-gray-600 mt-1 mb-2">PIC: {supplierUser.assignedWarehouse.contact_name} ({supplierUser.assignedWarehouse.contact_phone})</p>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          {supplierUser.assignedWarehouse.street_address},<br/>
                          {supplierUser.assignedWarehouse.district}, {supplierUser.assignedWarehouse.city}, {supplierUser.assignedWarehouse.province}<br/>
                          ZIP: {supplierUser.assignedWarehouse.postal_code}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-8 border border-gray-100 flex flex-col items-center justify-center text-center">
                      <div className="w-12 h-12 bg-white rounded-full border border-gray-200 flex items-center justify-center mb-3 shadow-sm">
                        <MapPin className="text-gray-300" size={24} />
                      </div>
                      <h3 className="text-sm font-bold text-gray-900">No Warehouse Assigned</h3>
                      <p className="text-sm text-gray-500 mt-1 max-w-sm">
                        Our team is currently reviewing your application. A central fulfillment hub will be assigned shortly based on your product category.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <UIPreferencesPanel />
            </>
          )}

          {tab === 'account' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
              <User size={48} className="text-gray-300 mb-4" />
              <h2 className="text-xl font-bold text-gray-900">Account Details</h2>
              <p className="text-gray-500 mt-2 max-w-sm">Manage your login credentials, sub-users, and role assignments here. This module is currently in development.</p>
            </div>
          )}

          {tab === 'bank' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
              <CreditCard size={48} className="text-gray-300 mb-4" />
              <h2 className="text-xl font-bold text-gray-900">Bank & Payouts</h2>
              <p className="text-gray-500 mt-2 max-w-sm">Configure your banking details for automated HPP payouts and settlements. This module is currently in development.</p>
            </div>
          )}

          {tab === 'security' && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden p-8 text-center flex flex-col items-center justify-center min-h-[400px]">
              <ShieldCheck size={48} className="text-gray-300 mb-4" />
              <h2 className="text-xl font-bold text-gray-900">Security</h2>
              <p className="text-gray-500 mt-2 max-w-sm">Manage two-factor authentication, active sessions, and API tokens. This module is currently in development.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
