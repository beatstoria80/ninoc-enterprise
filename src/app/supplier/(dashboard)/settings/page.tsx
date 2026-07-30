import { createClient } from '@/utils/supabase/server';
import { Settings2, Building2, User, CreditCard, ShieldCheck, Mail } from 'lucide-react';
import { getCurrentSupplier } from '@/lib/services/supplier';
import { UIPreferencesPanel } from '@/components/supplier/settings/UIPreferencesPanel';

export default async function SupplierSettingsPage() {
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
          <button className="w-full text-left px-4 py-3 bg-gray-100 text-ink rounded-xl font-medium text-sm flex items-center gap-3">
            <Building2 size={18} />
            Company Profile
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium text-sm transition-colors flex items-center gap-3">
            <User size={18} />
            Account Details
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium text-sm transition-colors flex items-center gap-3">
            <CreditCard size={18} />
            Bank & Payouts
          </button>
          <button className="w-full text-left px-4 py-3 text-gray-500 hover:bg-gray-50 hover:text-gray-900 rounded-xl font-medium text-sm transition-colors flex items-center gap-3">
            <ShieldCheck size={18} />
            Security
          </button>
        </div>

        <div className="md:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Company Information</h2>
              <p className="text-sm text-gray-500 mt-1">Update your factory or brand details shown to Ninoc enterprise.</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Company / Brand Name</label>
                  <input 
                    type="text" 
                    defaultValue={supplierData?.name || ''}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Business Registration Number (NIB)</label>
                  <input 
                    type="text" 
                    defaultValue="1234567890"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Business Description</label>
                <textarea 
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-all"
                  placeholder="Describe your manufacturing capacity, specialties, and history..."
                ></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail size={16} className="text-gray-400" />
                    Support Email
                  </label>
                  <input 
                    type="email" 
                    defaultValue="contact@brand.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <input 
                    type="tel" 
                    defaultValue="+62 812 3456 7890"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-all"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button className="bg-ink text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-ink/90 transition-colors">
                Save Changes
              </button>
            </div>
          </div>



          <UIPreferencesPanel />
        </div>
      </div>
    </div>
  );
}
