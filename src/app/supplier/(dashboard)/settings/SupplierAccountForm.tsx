'use client';

import { useActionState } from 'react';
import { sendPasswordResetEmail } from './actions';
import { CheckCircle2, ShieldAlert } from 'lucide-react';

export function SupplierAccountForm({ supplierUser, lang = 'en' }: { supplierUser: any, lang?: 'en' | 'id' }) {
  const [state, formAction, isPending] = useActionState(sendPasswordResetEmail, null);

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
            {lang === 'id' ? 'Peran Akun' : 'Account Role'}
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 capitalize">{supplierUser.role}</span>
            {supplierUser.role === 'owner' && (
              <span className="px-2 py-0.5 bg-ink text-white text-[10px] uppercase font-bold rounded">
                {lang === 'id' ? 'Akses Penuh' : 'Full Access'}
              </span>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 block">
            {lang === 'id' ? 'Email Utama' : 'Primary Email'}
          </label>
          <div className="text-sm font-medium text-gray-900">
            {supplierUser.user_id ? (lang === 'id' ? 'Sesi Terautentikasi' : 'Authenticated Session') : (lang === 'id' ? 'Menunggu Verifikasi' : 'Pending Verification')}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {lang === 'id' ? 'Dikelola secara aman melalui Supabase Auth' : 'Managed securely via Supabase Auth'}
          </p>
        </div>
      </div>

      <div className="pt-6 border-t border-gray-100">
        <h3 className="text-sm font-bold text-gray-900 mb-3">
          {lang === 'id' ? 'Keamanan & Kata Sandi' : 'Security & Password'}
        </h3>
        
        {state?.error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-start gap-2">
            <ShieldAlert size={16} className="mt-0.5" />
            {state.error}
          </div>
        )}
        
        {state?.success && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200 flex items-center gap-2">
            <CheckCircle2 size={16} />
            {lang === 'id' ? 'Tautan reset kata sandi telah dikirim ke email terdaftar Anda!' : 'Password reset link sent to your registered email!'}
          </div>
        )}

        <p className="text-sm text-gray-600 mb-4 max-w-lg">
          {lang === 'id' ? (
            "Untuk memastikan integritas data yang ketat, perubahan kata sandi harus diverifikasi melalui alamat email terdaftar Anda. Klik tombol di bawah untuk meminta tautan reset yang aman."
          ) : (
            "To ensure strict data integrity, password changes must be verified via your registered email address. Click the button below to request a secure reset link."
          )}
        </p>

        <form action={formAction}>
          <button 
            type="submit" 
            disabled={isPending || state?.success}
            className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (lang === 'id' ? 'Meminta Tautan...' : 'Requesting Link...') : (lang === 'id' ? 'Minta Reset Kata Sandi' : 'Request Password Reset')}
          </button>
        </form>
      </div>
    </div>
  );
}
