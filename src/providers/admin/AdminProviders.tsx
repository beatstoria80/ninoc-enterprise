'use client';

import React, { ReactNode } from 'react';
import { AdminProductsProvider } from './AdminProductsProvider';
import { AdminOrdersProvider } from './AdminOrdersProvider';
import { AdminCustomersProvider } from './AdminCustomersProvider';
import { AdminSupportProvider } from './AdminSupportProvider';

export function AdminProviders({ children }: { children: ReactNode }) {
  return (
    <AdminProductsProvider>
      <AdminOrdersProvider>
        <AdminCustomersProvider>
          <AdminSupportProvider>
            {children}
          </AdminSupportProvider>
        </AdminCustomersProvider>
      </AdminOrdersProvider>
    </AdminProductsProvider>
  );
}
