import { createClient } from '@/utils/supabase/server';
import { Settings2, Building2, User, CreditCard, ShieldCheck, Mail, MapPin, CheckCircle2 } from 'lucide-react';
import { getCurrentSupplier } from '@/lib/services/supplier';
import { UIPreferencesPanel } from '@/components/supplier/settings/UIPreferencesPanel';
import { updateSupplierProfile } from './actions';

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
            <form action={updateSupplierProfile}>
              <div className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Company / Brand Name</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    defaultValue={supplierData?.name || ''}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-all"
                  />
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
                    name="contact_email"
                    defaultValue={supplierData?.contact_email || ''}
                    placeholder="contact@brand.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Phone Number</label>
                  <input 
                    type="tel" 
                    name="contact_phone"
                    defaultValue={supplierData?.contact_phone || ''}
                    placeholder="+62 812 3456 7890"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-all"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button type="submit" className="bg-ink text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-ink/90 transition-colors">
                Save Changes
              </button>
            </div>
            </form>
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
        </div>
      </div>
    </div>
  );
}
