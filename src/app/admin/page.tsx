"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Plus, Search,
  TrendingUp, Box, LogOut, X, Save, Menu,
  Truck, Trash2, Edit2, Eye, ToggleLeft, ToggleRight,
  Clock, DollarSign, Minus,
  MessageSquare, Send, User, Users, Mail, Phone,
  MapPin, CreditCard, Shield, Star,
  Upload, Printer, ChevronDown, ChevronUp, Bell, ChevronLeft, ChevronRight, Filter, Settings, BookOpen, RefreshCw,
  Tag, ShieldAlert
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { OverviewTab } from '@/components/admin/tabs/OverviewTab';
import { ProductsTab } from '@/components/admin/tabs/ProductsTab';
import { UploadTab } from '@/components/admin/tabs/UploadTab';
import { InventoryTab } from '@/components/admin/tabs/InventoryTab';
import { OrdersTab } from '@/components/admin/tabs/OrdersTab';
import { LogisticsTab } from '@/components/admin/tabs/LogisticsTab';
import { FinanceTab } from '@/components/admin/tabs/FinanceTab';
import { MessagesTab } from '@/components/admin/tabs/MessagesTab';
import { CustomersTab } from '@/components/admin/tabs/CustomersTab';
import { SettingsTab } from '@/components/admin/tabs/SettingsTab';
import { LogbookTab } from '@/components/admin/tabs/LogbookTab';
import { ReturnsTab } from '@/components/admin/tabs/ReturnsTab';
import { PlaceholderTab } from '@/components/admin/tabs/PlaceholderTab';
import { WABroadcastTab } from '@/components/admin/tabs/WABroadcastTab';
import { CustomerModal } from '@/components/admin/CustomerModal';
import { ShippingLabel } from '@/components/admin/ShippingLabel';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SidebarItem } from '@/components/admin/SidebarItem';
import { OrderStatus, PaymentStatus, Product, Variant, Order, OrderItem, ShippingAddress, FinanceSummary, ProductCosting, SupplierCostLog, PromoImpact, ChatMessage, ChatSession, Customer } from '@/components/admin/types';

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============ MAIN ADMIN DASHBOARD ============
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<{ id: string; email?: string } | null>(null);
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [finance, setFinance] = useState<FinanceSummary>({
    totalRevenue: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    pendingPayments: 0,
    completedOrders: 0
  });

  // Modal states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Financial system states
  const [financeTab, setFinanceTab] = useState<'overview' | 'ledger' | 'pl' | 'balance' | 'tax'>('overview');
  const [productCostings, setProductCostings] = useState<Record<string, ProductCosting>>({});
  const [supplierLogs, setSupplierLogs] = useState<SupplierCostLog[]>([]);
  const [activePromos, setActivePromos] = useState<PromoImpact[]>([]);
  const [editingCosting, setEditingCosting] = useState<ProductCosting | null>(null);
  const [isCostingModalOpen, setIsCostingModalOpen] = useState(false);
  const [selectedProductForCosting, setSelectedProductForCosting] = useState<Product | null>(null);
  const [costingForm, setCostingForm] = useState({
    supplier_cost: 0, shipping_cost: 0, packaging_cost: 0,
    operasional_pct: 0, tax_rate: 11,
    courier_regency_cost: 0, courier_inter_regency_cost: 0,
    courier_same_day_cost: 0, courier_instant_cost: 0,
    target_margin_pct: 0, selling_price: 0
  });

  // Sales Analytics state
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [salesChartData, setSalesChartData] = useState<{month: string; sales: number}[]>([]);
  const [profitChartData, setProfitChartData] = useState<{month: string; profit: number}[]>([]);

  // Online Order tab state
  const [orderTab, setOrderTab] = useState<'all' | 'new' | 'paid' | 'sent' | 'completed' | 'canceled'>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [showCourierDropdown, setShowCourierDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [selectedPaymentMethods, setSelectedPaymentMethods] = useState<string[]>([]);
  const [selectedCouriers, setSelectedCouriers] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fetch financial data
  const fetchFinancialData = useCallback(async () => {
    const { data: costData } = await supabase.from('product_costing').select('*');
    if (costData) {
      const map: Record<string, ProductCosting> = {};
      costData.forEach((c: ProductCosting) => { map[c.product_id] = c; });
      setProductCostings(map);
    }
    const { data: logData } = await supabase.from('supplier_cost_log').select('*, products(name)').order('changed_at', { ascending: false }).limit(10);
    if (logData) setSupplierLogs(logData as SupplierCostLog[]);
    const { data: promoData } = await supabase.from('promo_impact').select('*, products(name)').eq('is_active', true);
    if (promoData) setActivePromos(promoData as PromoImpact[]);
  }, []);

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    description: '',
    specifications: [] as { label: string; value: string }[],
    price: '',
    category: 'pakaian',
    image_url: '',
    perspective1: '',
    perspective2: '',
    perspective3: '',
    perspective4: '',
    is_featured: false,
    price_tag: '',
    badge_text: '',
    variants: [{ id: '', size: 'S', color: 'Black', stock_quantity: 0 }]
  });

  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);

  // Customer form states
  const [customerForm, setCustomerForm] = useState({
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
    birth_date: '',
    gender: ''
  });

  // Order detail
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Bulk image upload states
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ name: string; url: string; error?: string }[] | null>(null);
  const [bulkProductLink, setBulkProductLink] = useState(''); // product name to link images to
  const [allUploadHistory, setAllUploadHistory] = useState<{ name: string; url: string; error?: string; timestamp: number }[]>([]);

  type BulkUploadResult = { name: string; url: string; error?: string };

  // Chat states
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatSession, setActiveChatSession] = useState<ChatSession | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // Logistics tab states
  const [logisticsFilter, setLogisticsFilter] = useState<string>('all');
  const [logisticsSelectedOrder, setLogisticsSelectedOrder] = useState<Order | null>(null);

  // Fetch logged-in admin user
  useEffect(() => {
    const fetchAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setAdminUser(user);
    };
    fetchAdmin();
  }, []);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');

  // Fetch all data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch products with variants
      const { data: prodData } = await supabase
        .from('products')
        .select('*, variants(*)')
        .order('created_at', { ascending: false });
      if (prodData) setProducts(prodData);

      // Fetch orders with items
      const { data: orderData } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false });
      if (orderData) setOrders(orderData);

      // Calculate finance
      if (orderData) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const completedOrders = orderData.filter(o =>
          o.status === 'paid' || o.status === 'delivered' || o.status === 'shipped'
        );
        const pendingOrders = orderData.filter(o => o.status === 'pending');

        const calcOrderRevenue = (o: Order) => o.order_items?.reduce((s, i) => s + (i.price_at_purchase * i.quantity), 0) || 0;

        const totalRevenue = completedOrders.reduce((sum, o) => sum + calcOrderRevenue(o), 0);
        const todayRevenue = completedOrders
          .filter(o => new Date(o.created_at) >= today)
          .reduce((sum, o) => sum + calcOrderRevenue(o), 0);
        const monthRevenue = completedOrders
          .filter(o => new Date(o.created_at) >= monthStart)
          .reduce((sum, o) => sum + calcOrderRevenue(o), 0);

        setFinance({
          totalRevenue,
          todayRevenue,
          monthRevenue,
          pendingPayments: pendingOrders.length,
          completedOrders: completedOrders.length
        });
      }

      // Fetch customers
      const { data: customerData } = await supabase
        .from('customer_profiles')
        .select('*')
        .order('customer_number', { ascending: true });
      if (customerData) setCustomers(customerData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchData();
      fetchFinancialData();
    });
  }, [fetchData, fetchFinancialData]);

  // Product CRUD
  const openProductModal = (product?: Product) => {
    if (product) {
      setIsEditMode(true);
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        specifications: product.specifications || [],
        price: product.price.toString(),
        category: product.category,
        image_url: product.image_url || '',
        perspective1: product.perspective1 || '',
        perspective2: product.perspective2 || '',
        perspective3: product.perspective3 || '',
        perspective4: product.perspective4 || '',
        is_featured: product.is_featured,
        price_tag: product.price_tag || '',
        badge_text: product.badge_text || '',
        variants: product.variants?.length ? product.variants.map(v => ({
          id: v.id,
          size: v.size || '',
          color: v.color || '',
          stock_quantity: v.stock_quantity
        })) : [{ id: '', size: 'S', color: 'Black', stock_quantity: 0 }]
      });
    } else {
      setIsEditMode(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        slug: '',
        description: '',
        specifications: [],
        price: '',
        category: 'pakaian',
        image_url: '',
        perspective1: '',
        perspective2: '',
        perspective3: '',
        perspective4: '',
        is_featured: false,
        price_tag: '',
        badge_text: '',
        variants: [{ id: '', size: 'S', color: 'Black', stock_quantity: 0 }]
      });
    }
    setIsProductModalOpen(true);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const handleProductNameChange = (name: string) => {
    setProductForm({
      ...productForm,
      name,
      slug: generateSlug(name)
    });
  };

  const addVariant = () => {
    setProductForm({
      ...productForm,
      variants: [...productForm.variants, { id: '', size: '', color: '', stock_quantity: 0 }]
    });
  };

  const removeVariant = (index: number) => {
    setProductForm({
      ...productForm,
      variants: productForm.variants.filter((_, i) => i !== index)
    });
  };

  const updateVariant = (index: number, field: string, value: string | number) => {
    const newVariants = [...productForm.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setProductForm({ ...productForm, variants: newVariants });
  };

  const cleanAndParsePrice = (priceStr: string) => {
    let cleaned = priceStr.replace(/\./g, '');
    if (cleaned.includes(',')) {
      cleaned = cleaned.split(',')[0];
    }
    if (cleaned.includes('.')) {
      cleaned = cleaned.split('.')[0];
    }
    const parsed = parseInt(cleaned.replace(/[^\d-]/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  const saveProduct = async () => {
    try {
      const productData = {
        name: productForm.name,
        slug: productForm.slug,
        description: productForm.description,
        specifications: productForm.specifications,
        price: cleanAndParsePrice(productForm.price),
        category: productForm.category,
        image_url: productForm.image_url || null,
        perspective1: productForm.perspective1 || null,
        perspective2: productForm.perspective2 || null,
        perspective3: productForm.perspective3 || null,
        perspective4: productForm.perspective4 || null,
        is_featured: productForm.is_featured,
        price_tag: productForm.price_tag || null,
        badge_text: productForm.badge_text || null,
        updated_at: new Date().toISOString()
      };

      let productId: string;

      if (isEditMode && editingProduct) {
        // Update existing product
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id)
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
      } else {
        // Create new product
        const { data, error } = await supabase
          .from('products')
          .insert({ ...productData, created_at: new Date().toISOString() })
          .select()
          .single();
        if (error) throw error;
        productId = data.id;
      }

      // Prepare variants to upsert/insert
      const allVariants = productForm.variants.flatMap(v => {
        const colors = v.color ? v.color.split(',').map(c => c.trim()).filter(Boolean) : [null];
        
        return colors.map((color, index) => {
          const variantObj: any = {
            product_id: productId,
            size: v.size || null,
            color: color,
            stock_quantity: parseInt(String(v.stock_quantity)) || 0
          };
          
          if (v.id && index === 0) {
            variantObj.id = v.id;
          }
          
          return variantObj;
        });
      });

      // Try to safely delete variants that are no longer in the list
      const { data: existingVariants } = await supabase.from('variants').select('id').eq('product_id', productId);
      const newVariantIds = allVariants.map(v => v.id).filter(Boolean);
      const variantsToDelete = existingVariants?.filter(ev => !newVariantIds.includes(ev.id)) || [];

      for (const ev of variantsToDelete) {
        // Try deleting, if it fails due to FK (e.g. order history), soft-delete by setting stock to 0
        const { error: delErr } = await supabase.from('variants').delete().eq('id', ev.id);
        if (delErr) {
          await supabase.from('variants').update({ stock_quantity: 0 }).eq('id', ev.id);
        }
      }

      const variantsToUpdate = allVariants.filter(v => v.id);
      const variantsToInsert = allVariants.filter(v => !v.id);

      if (variantsToUpdate.length > 0) {
        const { error: updateErr } = await supabase.from('variants').upsert(variantsToUpdate);
        if (updateErr) throw updateErr;
      }
      
      if (variantsToInsert.length > 0) {
        const inserts = variantsToInsert.map(v => ({ ...v, created_at: new Date().toISOString() }));
        const { error: insertErr } = await supabase.from('variants').insert(inserts);
        if (insertErr) throw insertErr;
      }

      setIsProductModalOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Failed to save product:', error);
      alert('Failed to save product: ' + (error.message || JSON.stringify(error)));
    }
  };

  // ===== PRODUCT IMAGE UPLOAD (Single) =====
  const handleProductImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploadingProductImage(true);
      const file = event.target.files?.[0];
      if (!file) return;

      // Use API route (server-side with service role key)
      const formData = new FormData();
      formData.append('files', file);
      formData.append('bucket', 'products');

      const res = await fetch('/api/admin/upload-images', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Upload failed');
      }

      if (data.results && data.results[0]?.url) {
        setProductForm(prev => ({ ...prev, image_url: data.results[0].url }));
        alert('Image uploaded successfully!');
      }
    } catch (err) {
      const error = err as Error;
      alert('Error uploading image: ' + (error.message || 'Unknown error'));
    } finally {
      setIsUploadingProductImage(false);
    }
  };

  // ===== BULK UPLOAD HANDLER =====
  const handleBulkImageUpload = async () => {
    if (bulkFiles.length === 0) return;

    // Validate file sizes (max 10MB per file)
    const maxSize = 10 * 1024 * 1024;
    const oversizedFiles = bulkFiles.filter(f => f.size > maxSize);
    if (oversizedFiles.length > 0) {
      alert(`File too large: ${oversizedFiles.map(f => f.name).join(', ')}\nMax size: 10MB per file`);
      return;
    }

    setBulkUploading(true);
    setBulkResults(null);

    try {
      const formData = new FormData();
      for (const file of bulkFiles) {
        formData.append('files', file);
      }
      formData.append('bucket', 'products');

      const res = await fetch('/api/admin/upload-images', {
        method: 'POST',
        body: formData
      });

      const text = await res.text();

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        alert('Server error: ' + text.slice(0, 200));
        return;
      }

      if (!res.ok || data.error) {
        alert('Upload failed: ' + (data.error || `HTTP ${res.status}`));
        return;
      }

      // Save to history (accumulate all uploads)
      const newResults = (data.results as BulkUploadResult[]).map(r => ({
        ...r,
        timestamp: Date.now()
      }));
      setAllUploadHistory(prev => [...prev, ...newResults]);
      setBulkResults(data.results as BulkUploadResult[]);

      // Show summary
      if (data.summary) {
        const { uploaded } = data.summary;
        const total = data.results?.length || 0;
        if (uploaded === 0) {
          alert('Upload failed: All files failed.');
        } else if (uploaded < total) {
          alert(`Partially succeeded: ${uploaded}/${total} files uploaded.`);
        } else {
          alert(`Success: ${uploaded} files uploaded!`);
        }
      }

      // Update product with first successful image
      const firstSuccess = data.results?.find((r: BulkUploadResult) => r.url);
      if (firstSuccess) {
        setProductForm(prev => ({ ...prev, image_url: firstSuccess.url }));
        if (bulkProductLink.trim()) {
          setProductForm(prev => ({
            ...prev,
            name: bulkProductLink.trim(),
            slug: bulkProductLink.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          }));
        }
        setActiveTab('products');
      }
    } catch (err) {
      alert('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setBulkUploading(false);
    }
  };

  const openBulkUpload = () => {
    setBulkFiles([]);
    setBulkResults(null);
    setBulkProductLink('');
    setActiveTab('upload');
  };

  const handleBulkFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 1000) {
      alert('Maximum 1000 files per batch. Please split your selection.');
      setBulkFiles(selected.slice(0, 1000));
    } else {
      setBulkFiles(selected);
    }
  };

  const saveCustomer = async () => {
    try {
      if (selectedCustomer) {
        // Update existing customer
        const { error } = await supabase
          .from('customer_profiles')
          .update({
            email: customerForm.email,
            first_name: customerForm.first_name,
            last_name: customerForm.last_name,
            full_name: customerForm.full_name,
            phone: customerForm.phone,
            street: customerForm.street,
            house_number: customerForm.house_number,
            rt: customerForm.rt,
            rw: customerForm.rw,
            city: customerForm.city,
            province: customerForm.province,
            postal_code: customerForm.postal_code,
            birth_date: customerForm.birth_date || null,
            gender: customerForm.gender || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedCustomer.id);
        if (error) throw error;
      }
      setIsCustomerModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save customer:', error);
      alert('Failed to save customer');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    try {
      await supabase.from('variants').delete().eq('product_id', id);
      await supabase.from('products').delete().eq('id', id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  const toggleFeatured = async (product: Product) => {
    try {
      await supabase
        .from('products')
        .update({ is_featured: !product.is_featured, updated_at: new Date().toISOString() })
        .eq('id', product.id);
      fetchData();
    } catch (error) {
      console.error('Failed to toggle featured:', error);
    }
  };

  // Order management
  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderModalOpen(true);
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      // If marking as shipped, use the dedicated shipping API (sends WA notification)
      if (status === 'shipped') {
        const res = await fetch('/api/whatsapp/shipping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderId,
            tracking_id: null, // tracking_id set separately via updateTrackingId
            courier_name: null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          console.warn('[updateOrderStatus] Shipping API failed:', data.error);
          // Still update the status even if WA fails
        } else if (data.success) {
          console.log('[updateOrderStatus] Shipping WA sent for order', orderId);
        }
      } else {
        await supabase
          .from('orders')
          .update({ status, updated_at: new Date().toISOString() })
          .eq('id', orderId);
      }
      fetchData();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  };

  const updateTrackingId = async (orderId: string, trackingId: string) => {
    try {
      await supabase
        .from('orders')
        .update({ tracking_id: trackingId, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      fetchData();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, tracking_id: trackingId });
      }
    } catch (error) {
      console.error('Failed to update tracking:', error);
    }
  };

  // Filter data
  const filteredOrders = orders.filter(order => {
    const tabMap: Record<string, string[]> = {
      all: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
      new: ['pending'],
      paid: ['paid'],
      sent: ['shipped'],
      completed: ['delivered'],
      canceled: ['cancelled'],
    };
    const matchesTab = tabMap[orderTab]?.includes(order.status) ?? true;
    const matchesSearch = (orderSearch === '' || orderSearch === undefined) && (searchQuery === '' || searchQuery === undefined) ||
      order.id.toLowerCase().includes((orderSearch || searchQuery).toLowerCase()) ||
      order.shipping_address?.name?.toLowerCase().includes((orderSearch || searchQuery).toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesDate = (!dateRange.start || new Date(order.created_at) >= new Date(dateRange.start)) &&
      (!dateRange.end || new Date(order.created_at) <= new Date(dateRange.end));
    return matchesTab && matchesSearch && matchesStatus && matchesDate;
  });

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalStock = products.reduce((sum, p) =>
    sum + (p.variants?.reduce((s, v) => s + v.stock_quantity, 0) || 0), 0
  );

  // Chat - fetch from support_tickets with messages
  const fetchChatSessions = useCallback(async () => {
    try {
      const { data: ticketsData } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (ticketsData) {
        const ticketIds = ticketsData.map(t => t.id);
        const { data: allMessages } = await supabase
          .from('support_messages')
          .select('*')
          .in('ticket_id', ticketIds)
          .order('created_at', { ascending: true });

        const sessions: ChatSession[] = ticketsData.map((t) => {
          const ticketMessages = allMessages?.filter(m => m.ticket_id === t.id) || [];
          return {
            id: t.id,
            customer_name: t.subject || `Inquiry ${t.id.split('-')[0]}`,
            customer_email: t.category || 'general',
            last_message: ticketMessages[ticketMessages.length - 1]?.message || 'No messages',
            last_message_time: ticketMessages[ticketMessages.length - 1]?.created_at || t.created_at,
            unread_count: ticketMessages.filter(m => !m.is_read && m.sender_role === 'customer').length,
            status: t.status || 'open',
            messages: ticketMessages.map(m => ({
              id: m.id,
              sender: m.sender_role as 'customer' | 'admin',
              message: m.message,
              timestamp: m.created_at,
              is_read: m.is_read ?? true,
              is_auto_reply: m.is_auto_reply ?? false
            }))
          };
        });
        setChatSessions(sessions);
      }
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error);
    }
  }, []);

  // Real-time subscription for support messages
  useEffect(() => {
    const channel = supabase
      .channel('admin_support_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'support_messages' 
      }, () => {
        fetchChatSessions();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_tickets'
      }, () => {
        fetchChatSessions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchChatSessions]);

  // Mark messages as read when session is active
  useEffect(() => {
    if (activeChatSession && activeTab === 'messages') {
      const unreadCount = activeChatSession.messages.filter(m => !m.is_read && m.sender === 'customer').length;
      if (unreadCount > 0) {
        supabase
          .from('support_messages')
          .update({ is_read: true })
          .eq('ticket_id', activeChatSession.id)
          .eq('sender_role', 'customer')
          .then(() => {
            fetchChatSessions();
          });
      }
    }
  }, [activeChatSession, activeTab, fetchChatSessions]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchChatSessions();
    });
  }, [fetchChatSessions]);

  const totalUnreadChats = chatSessions.reduce((sum, s) => sum + s.unread_count, 0);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChatSession) return;

    try {
      // Persist to product database
      const { data: savedMessage, error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: activeChatSession.id,
          sender_id: adminUser?.id || '00000000-0000-0000-0000-000000000000',
          sender_role: 'admin',
          message: newMessage.trim(),
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;

      const message: ChatMessage = {
        id: savedMessage.id,
        sender: 'admin',
        message: newMessage.trim(),
        timestamp: savedMessage.created_at,
        is_read: false
      };

      // Update local state
      setChatSessions(prev => prev.map(s =>
        s.id === activeChatSession.id
          ? { ...s, messages: [...s.messages, message], last_message: newMessage }
          : s
      ));
      setActiveChatSession(prev => prev ? { ...prev, messages: [...prev.messages, message] } : null);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const navItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Dashboard', activeKeys: ['overview'] },
    { 
      id: 'catalog', icon: Package, label: 'Product', activeKeys: ['products', 'upload'],
      subItems: [
        { id: 'products', label: 'Product List' },
        { id: 'upload', label: 'Upload Images' }
      ]
    },
    { 
      id: 'transaction', icon: ShoppingCart, label: 'Transaction', activeKeys: ['orders', 'logistics'], badge: pendingOrders,
      subItems: [
        { id: 'orders', label: 'Online Order' },
        { id: 'logistics', label: 'Logistics' }
      ]
    },
    { id: 'logbook', icon: BookOpen, label: 'Studio Logbook', activeKeys: ['logbook'] },
    { id: 'returns', icon: RefreshCw, label: 'Retur', activeKeys: ['returns'] },
    { id: 'customers', icon: Users, label: 'Membership', activeKeys: ['customers'], badge: customers.length },
    { id: 'inventory', icon: Box, label: 'Info Stock', activeKeys: ['inventory'] },
    { id: 'finance', icon: DollarSign, label: 'Report', activeKeys: ['finance'] },
    { id: 'messages', icon: MessageSquare, label: 'Support Chat', activeKeys: ['messages'], badge: totalUnreadChats },
    { id: 'wabroadcast', icon: Send, label: 'WA Broadcast', activeKeys: ['wabroadcast'] },
    { id: 'placeholders', icon: Tag, label: 'Placeholder', activeKeys: ['placeholders'] },
    { id: 'settings', icon: Settings, label: 'Settings', activeKeys: ['settings'] }
  ];

  return (
    <>
    <main className="h-screen w-full bg-gray-50/50 flex overflow-hidden print:hidden">
      {/* MOBILE TOP BAR */}
      <header className="fixed top-0 left-0 right-0 z-[500] bg-white border-b border-gray-100 md:hidden flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <span className="font-display font-medium text-lg italic tracking-tighter text-rose uppercase">NINOC</span>
          <span className="text-[8px] text-gray-300 uppercase tracking-wider">Admin</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-400 hover:text-rose"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      {/* MOBILE SLIDE-OVER MENU */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[600] md:hidden">
          <div className="absolute inset-0 bg-ink/20" onClick={() => setIsMobileMenuOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-2xl flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="font-display font-medium text-xl italic tracking-tighter text-rose uppercase">NINOC</div>
                <p className="text-[8px] uppercase tracking-[0.4em] text-gray-300 mt-1">Admin Control Center</p>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-gray-300 hover:text-rose">
                <X size={16} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto minimal-scroll py-4">
              {navItems.map((item) => (
                <SidebarItem 
                  key={item.id}
                  icon={item.icon} 
                  label={item.label} 
                  active={item.activeKeys.includes(activeTab)} 
                  onClick={() => {
                    if (!item.subItems) {
                      setActiveTab(item.activeKeys[0]);
                      setIsMobileMenuOpen(false);
                    }
                  }} 
                  badge={item.badge}
                  subItems={item.subItems?.map(sub => ({
                    label: sub.label,
                    id: sub.id,
                    active: activeTab === sub.id,
                    onClick: () => {
                      setActiveTab(sub.id);
                      setIsMobileMenuOpen(false);
                    }
                  }))}
                />
              ))}
            </nav>
            <div className="p-4 border-t border-gray-100">
              <button onClick={() => supabase.auth.signOut().then(() => { window.location.href = '/'; })} className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                <LogOut size={16} />
                <span className="text-[10px] uppercase tracking-wider">Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-white border-r border-ink/5 flex-col z-50 shrink-0 h-screen sticky top-0">
        <div className="p-6 border-b border-ink/5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-ink flex items-center justify-center rounded-sm">
              <span className="text-white font-display italic font-medium text-xs">N</span>
            </div>
            <div className="font-display font-medium text-lg italic tracking-tighter text-ink uppercase leading-none">NINOC</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto minimal-scroll py-4">
          {navItems.map((item) => (
            <SidebarItem 
              key={item.id}
              icon={item.icon} 
              label={item.label} 
              active={item.activeKeys.includes(activeTab)} 
              onClick={() => {
                if (!item.subItems) {
                  setActiveTab(item.activeKeys[0]);
                }
              }} 
              badge={item.badge}
              subItems={item.subItems?.map(sub => ({
                label: sub.label,
                id: sub.id,
                active: activeTab === sub.id,
                onClick: () => setActiveTab(sub.id)
              }))}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-ink/5">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-ink/40 hover:text-rose hover:bg-rose/5 rounded transition-all"
          >
            <LogOut size={14} />
            <span className="text-[9px] uppercase tracking-wider font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">
        {/* Desktop Header */}
        <header className="hidden md:flex h-14 bg-white border-b border-ink/5 px-8 items-center justify-between shrink-0">
          <div className="flex-1 flex items-center gap-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-ink/40">
              {['products', 'upload'].includes(activeTab) ? 'Product / ' :
               ['orders', 'logistics'].includes(activeTab) ? 'Transaction / ' :
               ['inventory'].includes(activeTab) ? 'Info Stock / ' :
               ['finance'].includes(activeTab) ? 'Report / ' :
               ['messages', 'placeholders', 'wabroadcast'].includes(activeTab) ? 'Support / ' :
               'Dashboard / '}
            </span>
            <h1 className="text-[10px] font-medium text-ink uppercase tracking-wider">
              {activeTab === 'overview' ? 'Overview' :
               activeTab === 'products' ? 'Product List' :
               activeTab === 'upload' ? 'Upload Images' :
               activeTab === 'orders' ? 'Online Order' :
               activeTab === 'logistics' ? 'Logistics' :
               activeTab === 'customers' ? 'Membership' :
               activeTab === 'inventory' ? 'Stock History' :
               activeTab === 'finance' ? 'Finance' :
               activeTab === 'messages' ? 'Support Chat' :
               activeTab === 'placeholders' || activeTab === 'wabroadcast' ? 'Placeholder / WA Broadcast' :
               activeTab === 'settings' ? 'Settings' : activeTab}
            </h1>
          </div>
          
          <div className="flex-1 max-w-md mx-8">
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30 group-focus-within:text-rose transition-colors" />
              <input
                type="text"
                placeholder="Title"
                className="w-full pl-9 pr-4 py-2 bg-white border border-ink/10 rounded-md text-[11px] font-medium focus:outline-none focus:border-rose/50 transition-all placeholder:text-ink/20"
              />
            </div>
          </div>

          <div className="flex-1 flex items-center justify-end gap-5">
            <button className="relative p-1.5 text-ink/40 hover:text-ink transition-colors">
              <Bell size={16} />
              {pendingOrders > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose rounded-full" />
              )}
            </button>
            <div className="h-6 w-px bg-ink/5 mx-1" />
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-7 h-7 rounded-full bg-ink/5 flex items-center justify-center overflow-hidden border border-ink/5 group-hover:border-rose/20 transition-colors">
                {adminUser?.email ? (
                  <span className="text-[9px] font-medium text-ink uppercase">{adminUser.email.charAt(0)}</span>
                ) : (
                  <User size={12} className="text-ink/50" />
                )}
              </div>
              <span className="text-[10px] font-medium text-ink group-hover:text-rose transition-colors">
                {adminUser?.email?.split('@')[0] || 'Admin User'}
              </span>
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="flex-1 overflow-hidden flex flex-col p-4 pb-0 md:px-6 md:pt-4 md:pb-0">
          
          {activeTab === 'overview' && (
            <OverviewTab 
              finance={finance} 
              products={products} 
              pendingOrders={pendingOrders} 
              orders={orders} 
              setActiveTab={setActiveTab} 
              openOrderDetail={openOrderDetail} 
              salesChartData={salesChartData}
              profitChartData={profitChartData}
            />
          )}

          {activeTab === 'products' && (
            <ProductsTab 
              products={products}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              openProductModal={openProductModal}
              toggleFeatured={toggleFeatured}
              deleteProduct={deleteProduct}
            />
          )}

          {activeTab === 'upload' && (
            <UploadTab 
              bulkFiles={bulkFiles}
              bulkProductLink={bulkProductLink}
              setBulkProductLink={setBulkProductLink}
              setActiveTab={setActiveTab}
              handleBulkFileSelect={handleBulkFileSelect}
              handleBulkImageUpload={handleBulkImageUpload}
              bulkUploading={bulkUploading}
              bulkResults={bulkResults}
              allUploadHistory={allUploadHistory}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryTab 
              products={products}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersTab 
              orders={orders}
              products={products}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              openOrderDetail={openOrderDetail}
            />
          )}

          {activeTab === 'logistics' && (
            <LogisticsTab 
              orders={orders}
              logisticsFilter={logisticsFilter}
              setLogisticsFilter={setLogisticsFilter}
              logisticsSelectedOrder={logisticsSelectedOrder}
              setLogisticsSelectedOrder={setLogisticsSelectedOrder}
              openOrderDetail={openOrderDetail}
            />
          )}

          {activeTab === 'logbook' && (
            <LogbookTab />
          )}

          {activeTab === 'returns' && (
            <ReturnsTab />
          )}

          {activeTab === 'finance' && (
            <FinanceTab 
              finance={finance}
              products={products}
              orders={orders}
              financeTab={financeTab}
              setFinanceTab={setFinanceTab}
              productCostings={productCostings}
              setSelectedProductForCosting={setSelectedProductForCosting}
              setIsCostingModalOpen={setIsCostingModalOpen}
              setCostingForm={setCostingForm}
            />
          )}

          {activeTab === 'messages' && (
            <MessagesTab
              chatSessions={chatSessions}
              activeChatSession={activeChatSession}
              setActiveChatSession={setActiveChatSession}
              newMessage={newMessage}
              setNewMessage={setNewMessage}
              sendMessage={sendMessage}
              fetchChatSessions={fetchChatSessions}
            />
          )}

          {activeTab === 'placeholders' && <PlaceholderTab />}

          {activeTab === 'wabroadcast' && <WABroadcastTab />}

          {activeTab === 'customers' && (
            <CustomersTab 
              customers={customers}
              customerSearchQuery={customerSearchQuery}
              setCustomerSearchQuery={setCustomerSearchQuery}
              setSelectedCustomer={setSelectedCustomer}
              setCustomerForm={setCustomerForm}
              setIsCustomerModalOpen={setIsCustomerModalOpen}
            />
          )}

          {activeTab === 'settings' && <SettingsTab />}

        </section>
        </div>

      {/* ===== PRODUCT MODAL ===== */}
      <AnimatePresence>
        {isProductModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
                <h2 className="text-xl font-medium text-gray-900">
                  {isEditMode ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">Basic Information</h3>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Product Name (SEO Optimized)</label>
                    <textarea
                      value={productForm.name}
                      onChange={(e) => handleProductNameChange(e.target.value)}
                      placeholder="Enter product name..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-rose/50 resize-y leading-relaxed"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Slug URL</label>
                    <input
                      type="text"
                      value={productForm.slug}
                      onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                      placeholder="product-slug"
                      className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-rose/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Price (IDR)</label>
                      <input
                        type="text"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        placeholder="e.g. 149.000"
                        className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-rose/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Category</label>
                      <select
                        value={productForm.category}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-rose/50"
                      >
                        <option value="pakaian">Pakaian</option>
                        <option value="utilities">Utilities</option>
                        <option value="aksesoris">Aksesoris</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">Price Tag (Optional Badge above Price)</label>
                    <select
                      value={productForm.price_tag}
                      onChange={(e) => setProductForm({ ...productForm, price_tag: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                    >
                      <option value="">None (No Tag)</option>
                      <option value="Harga Special">Harga Special</option>
                      <option value="Diskon">Diskon</option>
                      <option value="Price Deal">Price Deal</option>
                      <option value="Limited Edition">Limited Edition</option>
                      <option value="Special Edition">Special Edition</option>
                      <option value="REDEEM">REDEEM</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500">Custom Badge Text</label>
                      <span className="text-[9px] text-gray-400 italic">Overrides default &quot;Studio Edition&quot;</span>
                    </div>
                    <input
                      type="text"
                      value={productForm.badge_text || ''}
                      onChange={(e) => setProductForm({ ...productForm, badge_text: e.target.value })}
                      placeholder="Type custom text or pick below..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50 mb-2"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {['BEST SELLER', 'NEW ARRIVAL', 'LIMITED EDITION', 'EXCLUSIVE', 'PREMIUM QUALITY', 'ORIGINAL DESIGN', 'STUDIO EDITION'].map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setProductForm({ ...productForm, badge_text: preset })}
                          className={cn(
                            "px-2 py-1 text-[9px] uppercase tracking-wider font-medium rounded border transition-all",
                            productForm.badge_text === preset 
                              ? "bg-rose text-white border-rose" 
                              : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                          )}
                        >
                          {preset}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setProductForm({ ...productForm, badge_text: '' })}
                        className="px-2 py-1 text-[9px] uppercase tracking-wider font-medium rounded border border-gray-200 bg-white text-red-500 hover:bg-red-50 hover:border-red-200 transition-all ml-auto"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Description</label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Product description..."
                      rows={3}
                      className="w-full min-h-[60px] px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-rose/50 resize-y"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-end mb-2">
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500">Specifications (Key-Value)</label>
                      <button
                        type="button"
                        onClick={() => setProductForm({ ...productForm, specifications: [...(productForm.specifications || []), { label: '', value: '' }] })}
                        className="text-[9px] uppercase tracking-wider text-rose hover:text-rose/80 font-medium"
                      >
                        + Add Spec
                      </button>
                    </div>
                    <div className="space-y-2">
                      {productForm.specifications?.map((spec, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                          <input
                            type="text"
                            placeholder="e.g. Material"
                            value={spec.label}
                            onChange={(e) => {
                              const newSpecs = [...productForm.specifications];
                              newSpecs[idx].label = e.target.value;
                              setProductForm({ ...productForm, specifications: newSpecs });
                            }}
                            className="w-1/3 px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-rose/50"
                          />
                          <input
                            type="text"
                            placeholder="e.g. 100% Cotton"
                            value={spec.value}
                            onChange={(e) => {
                              const newSpecs = [...productForm.specifications];
                              newSpecs[idx].value = e.target.value;
                              setProductForm({ ...productForm, specifications: newSpecs });
                            }}
                            className="flex-1 px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-rose/50"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const newSpecs = productForm.specifications.filter((_, i) => i !== idx);
                              setProductForm({ ...productForm, specifications: newSpecs });
                            }}
                            className="p-2 text-gray-400 hover:text-rose hover:bg-rose/5 rounded transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">Image URL</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="url"
                        value={productForm.image_url}
                        onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                        placeholder="https://..."
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                      />
                      <label className="relative flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] uppercase tracking-wider font-medium rounded-lg cursor-pointer transition-colors whitespace-nowrap">
                        {isUploadingProductImage ? (
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span>Upload File</span>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProductImageUpload}
                          disabled={isUploadingProductImage}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Additional Images — for product gallery navigation */}
                  <div className="space-y-3">
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500">Additional Images (Gallery)</label>
                    {(['perspective1','perspective2','perspective3','perspective4'] as const).map((field, idx) => (
                      <div key={field} className="flex items-center gap-2">
                        <span className="text-[9px] text-gray-400 w-6 shrink-0 text-right">P{idx + 1}</span>
                        <input
                          type="url"
                          value={productForm[field]}
                          onChange={(e) => setProductForm({ ...productForm, [field]: e.target.value })}
                          placeholder={`https://... (${idx + 1}/${idx + 2}/front/back)`}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded text-[10px] focus:outline-none focus:border-rose/50"
                        />
                        <label className="relative flex items-center justify-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[9px] uppercase tracking-wider font-medium rounded cursor-pointer transition-colors whitespace-nowrap">
                          <span>Upload</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setIsUploadingProductImage(true);
                              try {
                                // Use API route (server-side with service role key)
                                const formData = new FormData();
                                formData.append('files', file);
                                formData.append('bucket', 'products');
                                const res = await fetch('/api/admin/upload-images', {
                                  method: 'POST',
                                  body: formData
                                });
                                const data = await res.json();
                                if (!res.ok || data.error || !data.results?.[0]?.url) {
                                  throw new Error(data.error || 'Upload failed');
                                }
                                setProductForm(prev => ({ ...prev, [field]: data.results[0].url }));
                              } catch (err) {
                                alert('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
                              } finally {
                                setIsUploadingProductImage(false);
                              }
                            }}
                            disabled={isUploadingProductImage}
                          />
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setProductForm({ ...productForm, is_featured: !productForm.is_featured })}
                      className="flex items-center gap-2"
                    >
                      {productForm.is_featured ? (
                        <ToggleRight size={24} className="text-rose" />
                      ) : (
                        <ToggleLeft size={24} className="text-gray-300" />
                      )}
                      <span className="text-sm text-gray-700">Featured Product</span>
                    </button>
                  </div>
                </div>

                {/* Variants Grouped by Color */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Variants & Stock</h3>
                  </div>

                  <div className="space-y-4">
                    {(() => {
                      const colorGroups: { color: string, originalIndices: number[] }[] = [];
                      productForm.variants.forEach((v, idx) => {
                        const color = v.color || '';
                        let group = colorGroups.find(g => g.color === color);
                        if (!group) {
                          group = { color, originalIndices: [] };
                          colorGroups.push(group);
                        }
                        group.originalIndices.push(idx);
                      });

                      return (
                        <>
                          {colorGroups.map((group) => (
                            <div key={group.originalIndices[0]} className="bg-gray-50 rounded-xl p-4 space-y-4 border border-gray-100">
                              <div className="flex items-center justify-between pb-3 border-b border-gray-200 flex-wrap gap-3">
                                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Color:</span>
                                  <input
                                    type="text"
                                    value={group.color}
                                    placeholder="e.g. Black"
                                    onChange={(e) => {
                                      const newVariants = [...productForm.variants];
                                      group.originalIndices.forEach(idx => {
                                        newVariants[idx] = { ...newVariants[idx], color: e.target.value };
                                      });
                                      setProductForm({ ...productForm, variants: newVariants });
                                    }}
                                    className="px-3 py-1.5 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-rose/50 font-medium text-ink w-48"
                                  />
                                </div>
                                <button
                                  onClick={() => {
                                    const newVariants = productForm.variants.filter((_, i) => !group.originalIndices.includes(i));
                                    setProductForm({ ...productForm, variants: newVariants });
                                  }}
                                  className="text-[10px] uppercase tracking-wider text-red-500 hover:text-red-700 font-medium"
                                >
                                  Remove Color
                                </button>

                              <div className="pt-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  {Array.from(new Set(['S', 'M', 'L', 'XL', 'One Size', ...group.originalIndices.map(i => productForm.variants[i].size).filter(Boolean)])).map(size => {
                                    const idx = group.originalIndices.find(i => productForm.variants[i].size === size);
                                    const isSelected = idx !== undefined;
                                    return (
                                      <button
                                        key={size}
                                        onClick={(e) => {
                                          e.preventDefault();
                                          if (isSelected) {
                                            const newVariants = productForm.variants.filter((_, i) => i !== idx);
                                            setProductForm({ ...productForm, variants: newVariants });
                                          } else {
                                            setProductForm({
                                              ...productForm,
                                              variants: [...productForm.variants, { id: '', size: size, color: group.color, stock_quantity: 0 }]
                                            });
                                          }
                                        }}
                                        className={cn(
                                          "px-4 py-2 text-xs font-medium rounded border transition-colors uppercase",
                                          isSelected 
                                            ? "bg-rose border-rose text-white shadow-sm" 
                                            : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                                        )}
                                      >
                                        {size}
                                      </button>
                                    );
                                  })}
                                  <input
                                    type="text"
                                    placeholder="+ Custom Size (Enter)"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const newSize = e.currentTarget.value.trim();
                                        if (newSize) {
                                          setProductForm({
                                            ...productForm,
                                            variants: [...productForm.variants, { id: '', size: newSize, color: group.color, stock_quantity: 0 }]
                                          });
                                          e.currentTarget.value = '';
                                        }
                                      }
                                    }}
                                    className="px-3 py-2 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:border-rose/50 w-36"
                                  />
                                </div>
                                
                                {group.originalIndices.length > 0 && (
                                  <div className="flex flex-col gap-2 border-t border-gray-200 pt-3 mt-3">
                                    <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Set Stock Quantities:</span>
                                    {group.originalIndices.map(idx => {
                                      const variant = productForm.variants[idx];
                                      return (
                                        <div key={idx} className="flex items-center justify-between bg-white px-3 py-2 border border-gray-200 rounded-lg">
                                          <span className="text-xs font-medium text-gray-700">Size {variant.size}</span>
                                          <div className="flex items-center gap-2">
                                             <span className="text-[10px] text-gray-400 font-medium">QTY</span>
                                             <input
                                               type="number"
                                               min="0"
                                               value={variant.stock_quantity}
                                               onChange={(e) => {
                                                 const newVariants = [...productForm.variants];
                                                 newVariants[idx] = { ...newVariants[idx], stock_quantity: parseInt(e.target.value) || 0 };
                                                 setProductForm({ ...productForm, variants: newVariants });
                                               }}
                                               className="w-20 px-2 py-1.5 text-xs border border-gray-300 rounded text-center focus:border-rose/50 outline-none font-medium"
                                             />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          <button
                            onClick={() => {
                              setProductForm({
                                ...productForm,
                                variants: [...productForm.variants, { id: '', size: 'New Size', color: 'New Color', stock_quantity: 0 }]
                              });
                            }}
                            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider text-gray-500 hover:border-rose/50 hover:text-rose transition-colors bg-white font-medium"
                          >
                            <Plus size={14} /> Add New Color Variant
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white px-4 py-3 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProduct}
                  className="px-4 py-2 text-sm bg-rose text-white rounded hover:bg-rose/90 flex items-center gap-2"
                >
                  <Save size={16} />
                  <span className="text-[10px] uppercase tracking-wider">{isEditMode ? 'Update Product' : 'Save Product'}</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== COSTING MODAL ===== */}
      <AnimatePresence>
        {isCostingModalOpen && selectedProductForCosting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Product Costing</h2>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{selectedProductForCosting.name}</p>
                </div>
                <button onClick={() => setIsCostingModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Cost Components */}
                <div className="space-y-3">
                  <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Biaya Component</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Supplier Cost</label>
                      <input type="number" value={costingForm.supplier_cost} onChange={e => setCostingForm({...costingForm, supplier_cost: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50" />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Shipping Cost</label>
                      <input type="number" value={costingForm.shipping_cost} onChange={e => setCostingForm({...costingForm, shipping_cost: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50" />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Packaging Cost</label>
                      <input type="number" value={costingForm.packaging_cost} onChange={e => setCostingForm({...costingForm, packaging_cost: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50" />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Operasional %</label>
                      <input type="number" value={costingForm.operasional_pct} onChange={e => setCostingForm({...costingForm, operasional_pct: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50" />
                    </div>
                  </div>
                </div>

                {/* Tax */}
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Tax Rate (%)</label>
                  <input type="number" value={costingForm.tax_rate} onChange={e => setCostingForm({...costingForm, tax_rate: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50" />
                </div>

                {/* Courier Costs */}
                <div className="space-y-3">
                  <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Biaya Kurir</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Regency</label>
                      <input type="number" value={costingForm.courier_regency_cost} onChange={e => setCostingForm({...costingForm, courier_regency_cost: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50" />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Inter-Regency</label>
                      <input type="number" value={costingForm.courier_inter_regency_cost} onChange={e => setCostingForm({...costingForm, courier_inter_regency_cost: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50" />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Same Day</label>
                      <input type="number" value={costingForm.courier_same_day_cost} onChange={e => setCostingForm({...costingForm, courier_same_day_cost: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50" />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Instant</label>
                      <input type="number" value={costingForm.courier_instant_cost} onChange={e => setCostingForm({...costingForm, courier_instant_cost: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50" />
                    </div>
                  </div>
                </div>

                {/* Target & Selling Price */}
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Margin & Harga Jual</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Target Margin %</label>
                      <input type="number" value={costingForm.target_margin_pct} onChange={e => setCostingForm({...costingForm, target_margin_pct: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50" />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Selling Price</label>
                      <input type="number" value={costingForm.selling_price} onChange={e => setCostingForm({...costingForm, selling_price: Number(e.target.value)})} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50" />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-ink/[0.02] rounded-xl p-4 space-y-2">
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 font-medium">Cost Preview</p>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500">Base Cost</span>
                    <span className="font-medium">IDR {(costingForm.supplier_cost + costingForm.shipping_cost + costingForm.packaging_cost).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500">Operasional ({costingForm.operasional_pct}%)</span>
                    <span className="font-medium">IDR {Math.round((costingForm.supplier_cost + costingForm.shipping_cost + costingForm.packaging_cost) * costingForm.operasional_pct / 100).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span className="text-gray-500">Tax ({costingForm.tax_rate}%)</span>
                    <span className="font-medium">IDR {Math.round((costingForm.supplier_cost + costingForm.shipping_cost + costingForm.packaging_cost) * costingForm.operasional_pct / 100 * costingForm.tax_rate / 100).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between">
                    <span className="text-[10px] font-medium text-gray-700">Total Cost</span>
                    <span className="text-[10px] font-medium text-rose">
                      IDR {Math.round((costingForm.supplier_cost + costingForm.shipping_cost + costingForm.packaging_cost) * (1 + costingForm.operasional_pct / 100) * (1 + costingForm.tax_rate / 100)).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button onClick={() => setIsCostingModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const baseCost = costingForm.supplier_cost + costingForm.shipping_cost + costingForm.packaging_cost;
                    const withOpr = baseCost * (1 + costingForm.operasional_pct / 100);
                    const withTax = withOpr * (1 + costingForm.tax_rate / 100);
                    const { error } = await supabase.from('product_costing').upsert({
                      product_id: selectedProductForCosting!.id,
                      supplier_cost: costingForm.supplier_cost,
                      shipping_cost: costingForm.shipping_cost,
                      packaging_cost: costingForm.packaging_cost,
                      operasional_pct: costingForm.operasional_pct,
                      tax_rate: costingForm.tax_rate,
                      courier_regency_cost: costingForm.courier_regency_cost,
                      courier_inter_regency_cost: costingForm.courier_inter_regency_cost,
                      courier_same_day_cost: costingForm.courier_same_day_cost,
                      courier_instant_cost: costingForm.courier_instant_cost,
                      target_margin_pct: costingForm.target_margin_pct,
                      selling_price: costingForm.selling_price
                    });
                    if (!error) {
                      await fetchFinancialData();
                      setIsCostingModalOpen(false);
                    }
                  }}
                  className="flex items-center gap-2 px-5 py-2 bg-rose text-white rounded-lg hover:bg-rose/90"
                >
                  <Save size={14} />
                  <span className="text-[10px] uppercase tracking-wider">Save Costing</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== ORDER DETAIL MODAL ===== */}
      <AnimatePresence>
        {isOrderModalOpen && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
            onClick={() => {
              setIsOrderModalOpen(false);
              setIsPrintPreviewOpen(false);
            }}
          >
            <div 
              className="flex items-stretch justify-center max-h-[90vh] shadow-2xl rounded-xl max-w-full"
              onClick={e => e.stopPropagation()}
            >
              {/* ORDER DETAIL MODAL CONTENT */}
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className={cn(
                  "bg-white overflow-y-auto transition-all duration-300 flex flex-col relative",
                  isPrintPreviewOpen 
                    ? "w-[95vw] sm:w-[500px] rounded-l-xl rounded-r-none" 
                    : "w-[95vw] sm:w-[672px] rounded-xl"
                )}
              >
              <div className="sticky top-0 bg-white px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">Order Detail</p>
                  <h2 className="text-lg font-medium text-gray-900">{selectedOrder.id.slice(0, 12)}...</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => {
                    setIsPrintPreviewOpen(true);
                  }} className="p-2 bg-black text-white hover:bg-rose rounded-lg flex items-center gap-2 transition-colors">
                    <Printer size={14} />
                    <span className="text-[10px] uppercase font-medium tracking-widest hidden sm:block">Print Resi</span>
                  </button>
                  <button onClick={() => {
                    setIsOrderModalOpen(false);
                    setIsPrintPreviewOpen(false);
                  }} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 flex flex-col gap-4">
                {/* Row 1: Status & Tracking */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Status */}
                  <div className="border border-gray-200 p-3 rounded-lg">
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-2">Order Status</p>
                    <div className="flex flex-wrap gap-1">
                      {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((status) => (
                        <button
                          key={status}
                          onClick={() => updateOrderStatus(selectedOrder.id, status as OrderStatus)}
                          className={cn(
                            "px-2 py-1 text-[9px] uppercase tracking-wider rounded border transition-colors",
                            selectedOrder.status === status
                              ? "bg-rose text-white border-rose"
                              : "bg-white text-gray-600 border-gray-200 hover:border-rose"
                          )}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tracking */}
                  <div className="border border-gray-200 p-3 rounded-lg">
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-2">Airway Bill / Resi</p>
                    <input
                      type="text"
                      defaultValue={selectedOrder.tracking_id || ''}
                      onBlur={(e) => updateTrackingId(selectedOrder.id, e.target.value)}
                      placeholder="Input tracking number..."
                      className="w-full px-3 py-1.5 text-xs font-mono border border-gray-200 rounded focus:outline-none focus:border-rose/50"
                    />
                  </div>
                </div>

                {/* Row 2: Customer Destination */}
                <div className="border border-gray-200 p-3 rounded-lg">
                  <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-2">Destination Manifest</p>
                  <div className="text-xs leading-relaxed text-gray-800">
                    <span className="font-medium uppercase mr-2">{selectedOrder.shipping_address?.name}</span>
                    <span className="text-gray-500 font-mono">
                      {selectedOrder.shipping_address?.phone || '-'}
                    </span>
                    <br />
                    {selectedOrder.shipping_address?.address}, {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.postal_code}
                  </div>
                </div>

                {/* Row 3: Items */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Garment Items</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {selectedOrder.order_items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 text-xs">
                        <div>
                          <span className="font-medium text-gray-900">{item.product_name || 'PRODUCT'}</span>
                          <span className="text-gray-500 ml-2">SZ: {item.size || 'OS'} | QTY: {item.quantity}</span>
                        </div>
                        <span className="font-mono text-gray-900">IDR {item.price_at_purchase.toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Row 4: Summary */}
                <div className="border border-gray-200 rounded-lg p-3 text-[10px] uppercase tracking-wider text-gray-500 flex flex-col gap-2">
                  <div className="flex justify-between">
                    <span>Value Subtotal</span>
                    <span className="text-gray-900 font-mono">IDR {(() => {
                      const sub = selectedOrder.order_items?.reduce((acc, item) => acc + (item.price_at_purchase * item.quantity), 0) || 0;
                      return sub.toLocaleString('id-ID');
                    })()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Logistics</span>
                    <span className="text-gray-900 font-mono">+ IDR {(() => {
                      const sub = selectedOrder.order_items?.reduce((acc, item) => acc + (item.price_at_purchase * item.quantity), 0) || 0;
                      const tax = Math.round(sub * 0.11);
                      const platform = 2500;
                      const shipping = selectedOrder.total_price - sub - tax - platform;
                      return shipping > 0 ? shipping.toLocaleString('id-ID') : '0';
                    })()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>VAT (11%)</span>
                    <span className="text-gray-900 font-mono">+ IDR {(() => {
                      const sub = selectedOrder.order_items?.reduce((acc, item) => acc + (item.price_at_purchase * item.quantity), 0) || 0;
                      return Math.round(sub * 0.11).toLocaleString('id-ID');
                    })()}</span>
                  </div>
                  <div className="flex justify-between pb-2 border-b border-gray-100">
                    <span>Platform Fee</span>
                    <span className="text-gray-900 font-mono">+ IDR 2.500</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="font-medium text-rose">GRAND TOTAL</span>
                    <span className="text-sm font-medium font-mono text-rose">IDR {selectedOrder.total_price.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              {/* HIDDEN PRINTABLE LABEL (RENDERED FOR INNERHTML EXTRACT) */}
              <div id="printable-label" className="hidden">
                <ShippingLabel order={selectedOrder} />
              </div>
            </motion.div>

            {/* PRINT PREVIEW ATTACHED ON RIGHT */}
            <AnimatePresence>
              {isPrintPreviewOpen && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 400, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="bg-gray-100 rounded-r-xl border-l border-gray-200 overflow-hidden hidden sm:flex flex-col z-[210] relative"
                >
                  <div className="w-[400px] h-full flex flex-col">
                    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shrink-0">
                      <p className="text-xs font-medium uppercase tracking-widest text-gray-900">Label Preview</p>
                      <button onClick={() => setIsPrintPreviewOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={16} />
                      </button>
                    </div>
                    
                    {/* Label Canvas Preview - Scaled to fit */}
                    <div className="flex-1 p-6 flex items-center justify-center overflow-auto bg-gray-50/50">
                      <div className="bg-white shadow-lg flex-shrink-0" style={{ width: '10cm', height: '8cm', transform: 'scale(0.75)', transformOrigin: 'center' }}>
                        <ShippingLabel order={selectedOrder} />
                      </div>
                    </div>
                    
                    <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                      <button
                        onClick={() => {
                          const printWindow = window.open('', '_blank', 'width=800,height=600');
                          if (!printWindow) return;
                          const order = selectedOrder;
                          const items = order?.order_items || [];
                          const totalItems = items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0) || 0;
                          const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Label Pengiriman - NINOC</title>
  <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
  <style>
    @page { size: 100mm 150mm; margin: 0; }
    body { margin: 0; padding: 0; background: #fff; font-family: 'Inter', sans-serif; }
    .label { width: 100mm; min-height: 150mm; border: 2px solid #000; box-sizing: border-box; display: flex; flex-direction: column; overflow: hidden; }
    .header { display: flex; border-bottom: 2px solid #000; height: 45px; }
    .brand-box { flex: 1; padding: 0 12px; display: flex; flex-direction: column; justify-content: center; background: #000; color: #fff; }
    .brand-name { font-size: 16px; font-weight: 900; letter-spacing: -0.5px; line-height: 1; }
    .brand-sub { font-size: 7px; font-weight: 600; letter-spacing: 3px; opacity: 0.8; }
    .courier-box { flex: 1; display: flex; align-items: center; justify-content: flex-end; padding: 0 12px; gap: 8px; }
    .courier-name { font-size: 12px; font-weight: 800; }
    .barcode-row { padding: 16px 12px; border-bottom: 2px solid #000; text-align: center; }
    .barcode-text { font-weight: 800; font-size: 14px; letter-spacing: 4px; font-family: monospace; margin-top: 8px; }
    .flex-row { display: flex; border-bottom: 2px solid #000; }
    .col-left { flex: 1.6; padding: 12px; border-right: 2px solid #000; display: flex; flex-direction: column; }
    .col-right { flex: 1; padding: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #fafafa; }
    .inverted-tag { font-size: 8px; font-weight: 800; letter-spacing: 1px; margin-bottom: 8px; background: #000; color: #fff; padding: 3px 8px; display: inline-block; border-radius: 2px; }
    .outline-tag { font-size: 8px; font-weight: 800; letter-spacing: 1px; margin-bottom: 8px; border: 2px solid #000; padding: 1px 6px; display: inline-block; border-radius: 2px; }
    .person-name { font-weight: 900; font-size: 15px; text-transform: uppercase; line-height: 1.1; }
    .person-phone { font-size: 11px; font-weight: 700; margin-top: 4px; font-family: monospace; }
    .person-address { font-size: 11px; font-weight: 500; margin-top: 8px; line-height: 1.4; color: #333; }
    .person-city { font-weight: 800; font-size: 11px; margin-top: 6px; text-transform: uppercase; }
    .person-zip { font-weight: 900; font-size: 13px; margin-top: 2px; letter-spacing: 1px; }
    .content-title { font-size: 9px; font-weight: 800; letter-spacing: 1px; margin-bottom: 6px; color: #666; }
    .item-line { font-size: 10px; font-weight: 600; display: flex; justify-content: space-between; padding: 2px 0; }
    .qr-box { display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .qr-label { font-size: 8px; font-weight: 800; letter-spacing: 1px; margin-top: 8px; color: #666; }
    .order-id-val { font-weight: 900; font-size: 11px; letter-spacing: 1px; font-family: monospace; }
    .meta-pills { display: flex; justify-content: center; gap: 8px; margin-top: 8px; font-size: 9px; font-weight: 800; }
    .pill { background: #e5e5e5; padding: 2px 6px; border-radius: 2px; }
    .footer-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #000; color: #fff; }
    .footer-date { font-size: 9px; font-weight: 600; font-family: monospace; }
    .fragile { font-weight: 900; font-size: 10px; letter-spacing: 2px; }
  </style>
</head>
<body>
  <div class="label">
    <div class="header">
      <div class="brand-box">
        <div class="brand-name">NINOC</div>
        <div class="brand-sub">STORE</div>
      </div>
      <div class="courier-box">
        <span class="courier-name">${order?.courier || 'STANDARD'}</span>
      </div>
    </div>
    <div class="barcode-row">
      ${order?.tracking_id ? `
        <svg class="barcode" jsbarcode-format="CODE128" jsbarcode-value="${order.tracking_id}" jsbarcode-width="2" jsbarcode-height="50" jsbarcode-displayValue="false"></svg>
        <div class="barcode-text">${order.tracking_id}</div>
      ` : `
        <div style="font-weight:700;font-size:12px;padding:16px 0;color:#999;letter-spacing:2px;border:2px dashed #e5e5e5;text-align:center;">AWAITING TRACKING ID</div>
      `}
    </div>
    <div class="flex-row">
      <div class="col-left">
        <div class="inverted-tag">TO / PENERIMA</div>
        <div class="person-name">${order?.shipping_address?.name || 'GUEST'}</div>
        <div class="person-phone">${order?.shipping_address?.phone || '-'}</div>
        <div class="person-address">${order?.shipping_address?.address || '-'}</div>
        <div class="person-city">${order?.shipping_address?.city || '-'}, ${order?.shipping_address?.province || '-'}</div>
        <div class="person-zip">${order?.shipping_address?.postal_code || '-'}</div>
      </div>
      <div class="col-right">
        <div class="outline-tag">FROM / PENGIRIM</div>
        <div style="font-weight:800;font-size:11px;">NINOC STUDIO</div>
        <div style="font-size:9px;font-weight:600;margin-top:2px;font-family:monospace;color:#666;">0812-XXXX-XXXX</div>
        <div style="font-size:9px;font-weight:500;margin-top:6px;line-height:1.4;color:#444;">Bandung, Jawa Barat<br/>Indonesia</div>
      </div>
    </div>
    <div class="flex-row">
      <div class="col-left">
        <div class="content-title">CONTENTS / ISI PAKET</div>
        ${items.map((i: { product_name?: string; size?: string; quantity: number }) => `
          <div class="item-line">
            <span style="text-transform:uppercase;">${i.product_name || 'PRODUCT'} ${i.size ? '['+i.size+']' : ''}</span>
            <span style="font-weight:800;">×${i.quantity}</span>
          </div>
        `).join('')}
      </div>
      <div class="col-right qr-box">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=54x54&data=${encodeURIComponent(order?.id?.toUpperCase() || '')}" alt="QR" width="54" height="54" />
        <div class="qr-label">ORDER ID</div>
        <div class="order-id-val">#${(order?.id || '').slice(0, 8).toUpperCase()}</div>
        <div class="meta-pills">
          <span class="pill">${totalItems} PCS</span>
          <span class="pill">${totalItems * 300}g</span>
        </div>
      </div>
    </div>
    <div class="footer-row">
      <span class="footer-date">${new Date(order?.created_at || '').toLocaleDateString('id-ID', {day:'2-digit',month:'short',year:'numeric'}).toUpperCase()}</span>
      <span class="fragile">FRAGILE</span>
    </div>
  </div>
  <script>
    JsBarcode(".barcode").init();
    window.onload = () => { setTimeout(() => { window.print(); }, 500); }
  </script>
</body>
</html>`;
                          printWindow.document.write(htmlContent);
                          printWindow.document.close();
                        }}
                        className="w-full py-3 bg-black text-white font-medium text-xs uppercase tracking-widest rounded flex justify-center items-center gap-2 hover:bg-rose transition-colors"
                      >
                        <Printer size={16} /> Print to Thermal Printer
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== CUSTOMER MODAL ===== */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customer={selectedCustomer}
        form={customerForm}
        setForm={setCustomerForm}
        onSave={saveCustomer}
      />
    </main>

    {/* ===== PRINTABLE SHIPPING LABEL ===== */}
    {selectedOrder && (
      <div className="hidden print:block w-[10cm] max-w-[10cm] font-sans box-border mx-auto bg-white text-black p-0 m-0">
        <ShippingLabel order={selectedOrder} />
      </div>
    )}
    </>
  );
}
