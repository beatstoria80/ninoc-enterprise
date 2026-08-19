'use client';

import { useActionState } from 'react';
import { updateSupplierProfile } from './actions';
import { Mail, CheckCircle2 } from 'lucide-react';

export function SupplierForm({ supplierData, lang = 'en' }: { supplierData: any, lang?: 'en' | 'id' }) {
  const [state, formAction, isPending] = useActionState(updateSupplierProfile, null);

  return (
    <form action={formAction}>
      <div className="p-6 space-y-6">
        {state?.error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
            {state.error}
          </div>
        )}
        
        {state?.success && (
          <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200 flex items-center gap-2">
            <CheckCircle2 size={16} />
            {lang === 'id' ? 'Profil berhasil diperbarui!' : 'Profile updated successfully!'}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">{lang === 'id' ? 'Nama Perusahaan / Merek' : 'Company / Brand Name'}</label>
          <input 
            type="text" 
            name="name"
            required
            defaultValue={supplierData?.name || ''}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">{lang === 'id' ? 'Deskripsi Bisnis' : 'Business Description'}</label>
          <textarea 
            name="description"
            defaultValue={supplierData?.description || ''}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-all"
            placeholder={lang === 'id' ? "Jelaskan kapasitas produksi, spesialisasi, dan sejarah Anda..." : "Describe your manufacturing capacity, specialties, and history..."}
          ></textarea>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Mail size={16} className="text-gray-400" />
              {lang === 'id' ? 'Email Dukungan' : 'Support Email'}
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
            <label className="text-sm font-medium text-gray-700">{lang === 'id' ? 'Nomor Telepon' : 'Phone Number'}</label>
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
        <button 
          type="submit" 
          disabled={isPending}
          className="bg-ink text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? (lang === 'id' ? 'Menyimpan...' : 'Saving...') : (lang === 'id' ? 'Simpan Perubahan' : 'Save Changes')}
        </button>
      </div>
    </form>
  );
}
