'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { Product } from '@/components/admin/types';
import { fetchProductsAction, toggleFeaturedAction, deleteProductAction } from '@/app/actions/admin/products';

interface AdminProductsContextType {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  fetchProducts: () => Promise<void>;
  toggleFeatured: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
}

const AdminProductsContext = createContext<AdminProductsContextType | undefined>(undefined);

export function AdminProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await fetchProductsAction();
    if (result.success && result.data) {
      setProducts(result.data as Product[]);
    } else {
      console.error('Failed to fetch products:', result.error);
      setError(result.error || 'Unknown error');
    }
    setIsLoading(false);
  }, []);

  const toggleFeatured = useCallback(async (product: Product) => {
    const result = await toggleFeaturedAction(product.id, !!product.is_featured);
    if (result.success) {
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_featured: !product.is_featured } : p));
    }
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    if (!confirm('Delete this product?')) return;
    const result = await deleteProductAction(id);
    if (result.success) {
      setProducts(prev => prev.filter(p => p.id !== id));
    } else {
      alert('Failed to delete product');
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, [fetchProducts]);

  return (
    <AdminProductsContext.Provider value={{
      products, isLoading, error, searchQuery, setSearchQuery, fetchProducts, toggleFeatured, deleteProduct
    }}>
      {children}
    </AdminProductsContext.Provider>
  );
}

export function useAdminProducts() {
  const context = useContext(AdminProductsContext);
  if (context === undefined) {
    throw new Error('useAdminProducts must be used within an AdminProductsProvider');
  }
  return context;
}
