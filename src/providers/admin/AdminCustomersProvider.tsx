'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Customer } from '@/components/admin/types';
import { fetchCustomersAction, fetchPendingReturnsCountAction } from '@/app/actions/admin/customers';

interface AdminCustomersContextType {
  customers: Customer[];
  isLoading: boolean;
  fetchCustomers: () => Promise<void>;
  pendingReturnsCount: number;
}

const AdminCustomersContext = createContext<AdminCustomersContextType | undefined>(undefined);

export function AdminCustomersProvider({ children }: { children: ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingReturnsCount, setPendingReturnsCount] = useState(0);

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchCustomersAction();
    if (result.success && result.data) {
      setCustomers(result.data as Customer[]);
    } else {
      console.error('Failed to fetch customers:', result.error);
    }
    
    const returnsResult = await fetchPendingReturnsCountAction();
    if (returnsResult.success) {
      setPendingReturnsCount(returnsResult.count || 0);
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCustomers();
  }, [fetchCustomers]);

  return (
    <AdminCustomersContext.Provider value={{
      customers, isLoading, fetchCustomers, pendingReturnsCount
    }}>
      {children}
    </AdminCustomersContext.Provider>
  );
}

export function useAdminCustomers() {
  const context = useContext(AdminCustomersContext);
  if (context === undefined) {
    throw new Error('useAdminCustomers must be used within an AdminCustomersProvider');
  }
  return context;
}
