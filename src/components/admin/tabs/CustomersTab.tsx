import React from 'react';
import { motion } from 'framer-motion';
import { Users, Shield, CreditCard, Star, Search, User, Mail, Phone, MapPin, Plus } from 'lucide-react';
import Image from 'next/image';
import { Customer } from '../types';

export function CustomersTab({
  customers,
  customerSearchQuery,
  setCustomerSearchQuery,
  setSelectedCustomer,
  setCustomerForm,
  setIsCustomerModalOpen
}: {
  customers: Customer[];
  customerSearchQuery: string;
  setCustomerSearchQuery: (s: string) => void;
  setSelectedCustomer: (c: Customer | null) => void;
  setCustomerForm: (f: any) => void;
  setIsCustomerModalOpen: (b: boolean) => void;
}) {
  return (
    <motion.div
      key="customers"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full space-y-2 pb-4"
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Customers</h2>
          <span className="text-[9px] text-gray-400">— {customers.length} members</span>
        </div>
        <button
          onClick={() => {
            setSelectedCustomer(null);
            setCustomerForm({
              email: '',
              first_name: '',
              last_name: '',
              full_name: '',
              phone: '',
              street: '',
              house_number: '',
              rt: '',
              rw: '',
              city: '',
              province: '',
              postal_code: '',
            });
            setIsCustomerModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rose text-white rounded hover:bg-rose/90 transition-colors"
        >
          <Plus size={12} />
          <span className="text-[9px] uppercase tracking-wider">Add</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="shrink-0 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose/10 rounded-lg flex items-center justify-center">
              <Users size={18} className="text-rose" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">Total Members</p>
              <p className="text-lg font-medium text-gray-900">{customers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center">
              <Shield size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">Verified</p>
              <p className="text-lg font-medium text-gray-900">{customers.filter(c => c.is_verified).length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
              <CreditCard size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">Total Spent</p>
              <p className="text-lg font-medium text-gray-900">IDR {(customers.reduce((sum, c) => sum + (c.total_spent || 0), 0)).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Star size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400">Total Orders</p>
              <p className="text-lg font-medium text-gray-900">{customers.reduce((sum, c) => sum + (c.total_orders || 0), 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="shrink-0 relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or customer number..."
          value={customerSearchQuery}
          onChange={(e) => setCustomerSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
        />
      </div>

      {/* Customers Table */}
      <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto minimal-scroll relative bg-white">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500">Customer #</th>
              <th className="px-6 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500">Email</th>
              <th className="px-6 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500">Phone</th>
              <th className="px-6 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500">Location</th>
              <th className="px-6 py-3 text-center text-[10px] uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-3 text-center text-[10px] uppercase tracking-wider text-gray-500">Orders</th>
              <th className="px-6 py-3 text-center text-[10px] uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {customers
              .filter(c => {
                if (!customerSearchQuery) return true;
                const query = customerSearchQuery.toLowerCase();
                return (
                  c.full_name?.toLowerCase().includes(query) ||
                  c.email?.toLowerCase().includes(query) ||
                  `CST-${c.customer_number}`.toLowerCase().includes(query) ||
                  c.phone?.includes(query)
                );
              })
              .map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="font-mono text-sm font-medium text-rose">CST-{String(customer.customer_number).padStart(3, '0')}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                        {customer.avatar_url ? (
                          <Image src={customer.avatar_url} alt="" fill className="object-cover" />
                        ) : (
                          <User size={14} className="text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{customer.full_name || `${customer.first_name} ${customer.last_name}`}</p>
                        <p className="text-[10px] text-gray-400">{customer.membership_tier || 'Member'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Mail size={12} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{customer.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Phone size={12} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{customer.phone || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <MapPin size={12} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{customer.city || customer.province || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {customer.is_verified ? (
                      <span className="text-[9px] uppercase tracking-wider px-2 py-1 bg-emerald-100 text-emerald-600 rounded-full">Verified</span>
                    ) : (
                      <span className="text-[9px] uppercase tracking-wider px-2 py-1 bg-gray-100 text-gray-500 rounded-full">Unverified</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-medium text-gray-900">{customer.total_orders || 0}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setCustomerForm({
                            email: customer.email || '',
                            first_name: customer.first_name || '',
                            last_name: customer.last_name || '',
                            full_name: customer.full_name || '',
                            phone: customer.phone || '',
                            street: customer.street || '',
                            house_number: customer.house_number || '',
                            rt: customer.rt || '',
                            rw: customer.rw || '',
                            city: customer.city || '',
                            province: customer.province || '',
                            postal_code: customer.postal_code || ''
                          });
                          setIsCustomerModalOpen(true);
                        }}
                        className="px-3 py-1.5 text-[10px] uppercase tracking-wider bg-gray-100 text-gray-600 rounded hover:bg-rose hover:text-white transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
        {customers.length === 0 && (
          <div className="p-12 text-center text-gray-400">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No customers registered yet</p>
          </div>
        )}
        </div>
      </div>
    </motion.div>
  );
}
