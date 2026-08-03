'use client';

import { useActionState } from 'react';
import { updateSupplierBankDetails } from './actions';
import { CheckCircle2, Building, CreditCard, UserCircle } from 'lucide-react';

const COMMON_BANKS = [
  'BCA (Bank Central Asia)',
  'Bank Mandiri',
  'BNI (Bank Negara Indonesia)',
  'BRI (Bank Rakyat Indonesia)',
  'Bank Syariah Indonesia (BSI)',
  'CIMB Niaga',
  'Permata Bank',
  'Jago',
  'SeaBank',
  'Other'
];

export function SupplierBankForm({ supplierData }: { supplierData: any }) {
  const [state, formAction, isPending] = useActionState(updateSupplierBankDetails, null);

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
            Banking details securely updated!
          </div>
        )}

        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 mb-2">
          <strong>HPP Payout Policy:</strong> All product fulfillment payouts will be transferred automatically to this primary bank account upon successful Quality Control clearance at the NINOC Central Hub.
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Building size={16} className="text-gray-400" />
              Bank Name
            </label>
            <select 
              name="bank_name"
              required
              defaultValue={supplierData?.bank_name || ''}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-all bg-white"
            >
              <option value="" disabled>Select your bank...</option>
              {COMMON_BANKS.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <CreditCard size={16} className="text-gray-400" />
              Account Number
            </label>
            <input 
              type="text" 
              name="bank_account_number"
              required
              defaultValue={supplierData?.bank_account_number || ''}
              placeholder="e.g. 1234567890"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-all font-mono"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <UserCircle size={16} className="text-gray-400" />
              Account Holder Name
            </label>
            <input 
              type="text" 
              name="bank_account_holder"
              required
              defaultValue={supplierData?.bank_account_holder || ''}
              placeholder="Name exactly as it appears on the bank account"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-ink/20 focus:border-ink transition-all uppercase"
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
          {isPending ? 'Saving...' : 'Save Payout Details'}
        </button>
      </div>
    </form>
  );
}
