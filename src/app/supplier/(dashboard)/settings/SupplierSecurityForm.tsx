'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export function SupplierSecurityForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const newPassword = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      setLoading(false);
      return;
    }

    try {
      // Client-side secure password update directly to Supabase Auth API
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100 flex gap-3 items-start">
        <ShieldCheck className="shrink-0 text-blue-500 mt-0.5" size={18} />
        <p>
          <strong>Ninoc Guarantee:</strong> Your password is mathematically encrypted (hashed) by Supabase Auth before touching any database. Ninoc engineers, administrators, and staff <strong>cannot</strong> see, decrypt, or access your raw password.
        </p>
      </div>

      <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg border border-green-200 flex items-center gap-2">
            <CheckCircle2 size={16} />
            Password updated securely!
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">New Password</label>
          <input 
            type="password" 
            name="password"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-all"
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
          <input 
            type="password" 
            name="confirmPassword"
            required
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-all"
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="px-6 py-2.5 bg-ink text-white text-sm font-medium rounded-xl hover:bg-rose transition-colors disabled:opacity-70"
        >
          {loading ? 'Encrypting & Saving...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
