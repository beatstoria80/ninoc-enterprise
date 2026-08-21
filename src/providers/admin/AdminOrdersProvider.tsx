'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Order, OrderStatus } from '@/components/admin/types';
import { fetchOrdersAction, updateOrderStatusAction, updateTrackingIdAction } from '@/app/actions/admin/orders';

interface AdminOrdersContextType {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  isLoading: boolean;
  orderTab: 'all' | 'new' | 'paid' | 'sent' | 'completed' | 'canceled';
  setOrderTab: (tab: 'all' | 'new' | 'paid' | 'sent' | 'completed' | 'canceled') => void;
  orderSearch: string;
  setOrderSearch: (query: string) => void;
  fetchOrders: () => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  updateTrackingId: (orderId: string, trackingId: string) => Promise<void>;
  pendingOrdersCount: number;
}

const AdminOrdersContext = createContext<AdminOrdersContextType | undefined>(undefined);

export function AdminOrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [orderTab, setOrderTab] = useState<'all' | 'new' | 'paid' | 'sent' | 'completed' | 'canceled'>('all');
  const [orderSearch, setOrderSearch] = useState('');

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    const result = await fetchOrdersAction();
    if (result.success && result.data) {
      setOrders(result.data as Order[]);
    } else {
      console.error('Failed to fetch orders:', result.error);
    }
    setIsLoading(false);
  }, []);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    const result = await updateOrderStatusAction(orderId, status);
    if (result.success) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    } else {
      alert('Failed to update order status');
    }
  }, []);

  const updateTrackingId = useCallback(async (orderId: string, trackingId: string) => {
    const result = await updateTrackingIdAction(orderId, trackingId);
    if (result.success) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, tracking_id: trackingId } : o));
    } else {
      alert('Failed to update tracking ID');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  return (
    <AdminOrdersContext.Provider value={{
      orders, setOrders, isLoading, orderTab, setOrderTab, orderSearch, setOrderSearch,
      fetchOrders, updateOrderStatus, updateTrackingId, pendingOrdersCount
    }}>
      {children}
    </AdminOrdersContext.Provider>
  );
}

export function useAdminOrders() {
  const context = useContext(AdminOrdersContext);
  if (context === undefined) {
    throw new Error('useAdminOrders must be used within an AdminOrdersProvider');
  }
  return context;
}
