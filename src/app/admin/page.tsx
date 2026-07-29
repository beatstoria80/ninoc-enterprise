"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingBag, Plus, Search,
  TrendingUp, Box, LogOut, X, Save, Menu,
  Truck, Trash2, Edit2, Eye, ToggleLeft, ToggleRight,
  Clock, Minus,
  MessageSquare, Send, User, Users, Mail, Phone,
  MapPin, CreditCard, Shield, Star, Factory, FileText, ClipboardCheck, ArrowRightLeft,
  Upload, Printer, ChevronDown, ChevronUp, Bell, ChevronLeft, ChevronRight, Filter, Settings, BookOpen, RefreshCw,
  Tag, ShieldAlert, CheckCircle, AlertCircle, Info, PanelRightClose, PanelRightOpen,
  AlertTriangle, Check, BarChart3, Download
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { compressImage, forceDownloadImage } from '@/lib/utils/imageUtils';

import { OverviewTab } from '@/components/admin/tabs/OverviewTab';
const ProductsTab = dynamic(() => import('@/components/admin/tabs/ProductsTab').then(mod => mod.ProductsTab), { ssr: false });
const UploadTab = dynamic(() => import('@/components/admin/tabs/UploadTab').then(mod => mod.UploadTab), { ssr: false });
const InventoryTab = dynamic(() => import('@/components/admin/tabs/InventoryTab').then(mod => mod.InventoryTab), { ssr: false });
const OrdersTab = dynamic(() => import('@/components/admin/tabs/OrdersTab').then(mod => mod.OrdersTab), { ssr: false });
const LogisticsTab = dynamic(() => import('@/components/admin/tabs/LogisticsTab').then(mod => mod.LogisticsTab), { ssr: false });
const FinanceTab = dynamic(() => import('@/components/admin/tabs/FinanceTab').then(mod => mod.FinanceTab), { ssr: false });
const ProductCostingTab = dynamic(() => import('@/components/admin/tabs/ProductCostingTab').then(mod => mod.ProductCostingTab), { ssr: false });
const PoManager = dynamic(() => import('@/components/admin/PoManager'), { ssr: false });
const DoReceiving = dynamic(() => import('@/components/admin/DoReceiving'), { ssr: false });
const StockLedger = dynamic(() => import('@/components/admin/StockLedger'), { ssr: false });
const FinanceDashboard = dynamic(() => import('@/components/admin/FinanceDashboard'), { ssr: false });
const StockOpname = dynamic(() => import('@/components/admin/StockOpname'), { ssr: false });
const OpexTracker = dynamic(() => import('@/components/admin/OpexTracker'), { ssr: false });
const MessagesTab = dynamic(() => import('@/components/admin/tabs/MessagesTab').then(mod => mod.MessagesTab), { ssr: false });
const CustomersTab = dynamic(() => import('@/components/admin/tabs/CustomersTab').then(mod => mod.CustomersTab), { ssr: false });
const SettingsTab = dynamic(() => import('@/components/admin/tabs/SettingsTab').then(mod => mod.SettingsTab), { ssr: false });
const LogbookTab = dynamic(() => import('@/components/admin/tabs/LogbookTab').then(mod => mod.LogbookTab), { ssr: false });
const ReturTab = dynamic(() => import('@/components/admin/tabs/ReturTab').then(mod => mod.ReturTab), { ssr: false });
const PlaceholderTab = dynamic(() => import('@/components/admin/tabs/PlaceholderTab').then(mod => mod.PlaceholderTab), { ssr: false });
const WABroadcastTab = dynamic(() => import('@/components/admin/tabs/WABroadcastTab').then(mod => mod.WABroadcastTab), { ssr: false });
const EmailBroadcastTab = dynamic(() => import('@/components/admin/tabs/EmailBroadcastTab').then(mod => mod.EmailBroadcastTab), { ssr: false });
const AffiliatesTab = dynamic(() => import('@/components/admin/tabs/AffiliatesTab'), { ssr: false });
const MarketingTab = dynamic(() => import('@/components/admin/tabs/MarketingTab').then(mod => mod.MarketingTab), { ssr: false });
const GoogleAdsTab = dynamic(() => import('@/components/admin/tabs/GoogleAdsTab').then(mod => mod.GoogleAdsTab), { ssr: false });
const WebAnalyticsTab = dynamic(() => import('@/components/admin/tabs/WebAnalyticsTab').then(mod => mod.WebAnalyticsTab), { ssr: false });
const SuppliersTab = dynamic(() => import('@/components/admin/tabs/SuppliersTab').then(mod => mod.SuppliersTab), { ssr: false });
const WarehouseTab = dynamic(() => import('@/components/admin/tabs/WarehouseTab').then(mod => mod.WarehouseTab), { ssr: false });
const POTab = dynamic(() => import('@/components/admin/tabs/POTab').then(mod => mod.POTab), { ssr: false });
const DOTab = dynamic(() => import('@/components/admin/tabs/DOTab').then(mod => mod.DOTab), { ssr: false });
const StockLedgerTab = dynamic(() => import('@/components/admin/tabs/StockLedgerTab').then(mod => mod.StockLedgerTab), { ssr: false });
const SubmissionsTab = dynamic(() => import('@/components/admin/tabs/SubmissionsTab').then(mod => mod.SubmissionsTab), { ssr: false });
import { ProductModal } from "@/components/admin/modals/ProductModal";
import { CustomerModal } from '@/components/admin/CustomerModal';
import { ShippingLabel } from '@/components/admin/ShippingLabel';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SidebarItem } from '@/components/admin/SidebarItem';
import { SeoHelper } from '@/components/admin/SeoHelper';
import { OrderStatus, PaymentStatus, Product, Variant, Order, OrderItem, ShippingAddress, FinanceSummary, ProductCosting, SupplierCostLog, PromoImpact, ChatMessage, ChatSession, Customer } from '@/components/admin/types';
import { isFnBDepartment, isObjectsDepartment } from '@/lib/departmentDomain';
import { useProductForm } from '@/hooks/admin/useProductForm';

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
  const [adminUser, setAdminUser] = useState<{ id: string; email?: string; role?: string } | null>(null);
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pendingReturns, setPendingReturns] = useState(0);
  const [finance, setFinance] = useState<FinanceSummary>({
    totalRevenue: 0,
    todayRevenue: 0,
    monthRevenue: 0,
    pendingPayments: 0,
    completedOrders: 0
  });

  // Modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);
  const [reprintReason, setReprintReason] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [isSeoPanelOpen, setIsSeoPanelOpen] = useState(true);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showUserMenuModal, setShowUserMenuModal] = useState(false);

  // Toast Notification State
  type ToastMessage = { id: number; text: string; type: 'success' | 'error' | 'info' } | null;
  const [toast, setToast] = useState<ToastMessage>(null);
  
  const showToast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToast({ id, text, type });
    setTimeout(() => {
      setToast(prev => prev?.id === id ? null : prev);
    }, 3000);
  }, []);

  // Financial system states
  const [financeTab, setFinanceTab] = useState<'overview' | 'ledger' | 'pl' | 'balance' | 'tax' | 'refunds'>('overview');
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
    const { data: costData } = await supabase.from('product_costings').select('*');
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
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [dbDepartments, setDbDepartments] = useState<any[]>([]);
  const [dbWarehouses, setDbWarehouses] = useState<any[]>([]);

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

      // Fetch orders with items (PAGINATED: limit to 100 to prevent browser OOM)
      const { data: orderData } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .limit(100);
      if (orderData) setOrders(orderData);

      // Fetch Server-Side Aggregated Finance Summary (Bypassing 1000-row PostgREST limits)
      try {
        const financeRes = await fetch('/api/admin/finance-summary').then(r => r.json());
        
        if (financeRes && financeRes.success) {
          // Still calculate pending orders from local orderData since it's just a count of latest
          const pendingOrders = orderData ? orderData.filter(o => o.status === 'pending') : [];
          
          setFinance({
            totalRevenue: financeRes.totalRevenue || 0,
            todayRevenue: financeRes.todayRevenue || 0,
            monthRevenue: financeRes.monthRevenue || 0,
            pendingPayments: pendingOrders.length,
            completedOrders: financeRes.totalOrdersAnalyzed || 0
          });
        }
      } catch (financeErr) {
        console.error('Failed to fetch server-side finance summary:', financeErr);
      }

      // Fetch customers
      const { data: customerData } = await supabase
        .from('customer_profiles')
        .select('*')
        .order('customer_number', { ascending: true });
      if (customerData) setCustomers(customerData);

      // Fetch pending returns count
      const { count: pendingReturnsCount } = await supabase
        .from('retur_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'reviewed']);
      if (pendingReturnsCount !== null) setPendingReturns(pendingReturnsCount);

      // Fetch categories, departments, and warehouses
      const catData = await fetch('/api/admin/categories').then(r => r.json()).catch(() => ([]));
      const cats = Array.isArray(catData) ? catData : (catData?.data || []);
      if (Array.isArray(cats)) setDbCategories(cats);

      const deptData = await fetch('/api/admin/departments').then(r => r.json()).catch(() => ([]));
      const depts = Array.isArray(deptData) ? deptData : (deptData?.data || []);
      if (Array.isArray(depts)) setDbDepartments(depts);

      const whData = await fetch('/api/admin/warehouses').then(r => r.json()).catch(() => ([]));
      const whs = Array.isArray(whData) ? whData : (whData?.data || []);
      if (Array.isArray(whs)) setDbWarehouses(whs);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Product CRUD
  const {
    productForm, setProductForm,
    isEditMode, setIsEditMode,
    editingProduct, setEditingProduct,
    isProductModalOpen, setIsProductModalOpen,
    isUploadingProductImage, setIsUploadingProductImage,
    openProductModal,
    handleProductNameChange,
    addVariant,
    removeVariant,
    updateVariant,
    saveProduct,
    handleProductImageUpload
  } = useProductForm(dbDepartments, dbWarehouses, showToast, fetchData);

  // Derived state for Concept Mall UI/UX conditional hierarchy (supports database UUIDs, slug strings, and category fallbacks)
  const selectedDeptObj = dbDepartments.find(d => d.id === productForm.department_id || d.slug === productForm.department_id || String(d.id) === String(productForm.department_id));
  const isFnB = isFnBDepartment({ department_id: productForm.department_id, slug: selectedDeptObj?.slug, name: selectedDeptObj?.name, category: productForm.category });
  const isObjects = !isFnB && isObjectsDepartment({ department_id: productForm.department_id, slug: selectedDeptObj?.slug, name: selectedDeptObj?.name, category: productForm.category });
  const isFashion = !isFnB && !isObjects;

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

  // Fetch logged-in admin user and their role
  useEffect(() => {
    const fetchAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/admin/login';
        return;
      }
      
      const { data: roleData, error } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('email', user.email)
        .single();
        
      if (error || !roleData) {
        // Not an admin, sign them out of the admin context and redirect
        await supabase.auth.signOut();
        window.location.href = '/admin/login?error=unauthorized';
        return;
      }
      
      setAdminUser({ ...user, role: roleData.role });
    };
    fetchAdmin();
  }, []);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');



  useEffect(() => {
    queueMicrotask(() => {
      fetchData();
      fetchFinancialData();
    });
  }, [fetchData, fetchFinancialData]);

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
        const compressedFile = await compressImage(file);
        formData.append('files', compressedFile);
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
      const res = await fetch('/api/admin/products/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete product');
      
      showToast('Product deleted successfully', 'success');
      fetchData();
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      showToast('Failed to delete product: ' + error.message, 'error');
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
    // Enrich order items with variant data for the label preview
    const enrichedOrder = {
      ...order,
      order_items: order.order_items?.map(item => {
        const product = products.find(p => p.id === item.product_id);
        const variant = product?.variants?.find(v => v.id === item.variant_id);
        return {
          ...item,
          color: variant?.color || item.color,
          size: variant?.size || item.size,
          sku: variant?.sku || item.sku,
        };
      })
    };
    setSelectedOrder(enrichedOrder);
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
  const actionableOrders = orders.filter(o => o.status === 'paid').length;
  const totalStock = products.reduce((sum, p) =>
    sum + (p.variants?.reduce((s, v) => s + v.stock_quantity, 0) || 0), 0
  );
  const lowStockProductsCount = products.filter(p =>
    (p.variants?.reduce((s, v) => s + (v.stock_quantity || 0), 0) || 0) < 5
  ).length;

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

        let metaMap: Record<string, any> = {};
        try {
          const res = await fetch('/api/admin/support/ticket-meta');
          const json = await res.json();
          if (json?.data) metaMap = json.data;
        } catch (e) {
          console.error('Failed to fetch ticket metadata map:', e);
        }

        const sessions: ChatSession[] = ticketsData.map((t) => {
          const ticketMessages = allMessages?.filter(m => m.ticket_id === t.id) || [];
          const meta = metaMap[t.id] || {};
          return {
            id: t.id,
            customer_name: t.subject || `Inquiry ${t.id.split('-')[0]}`,
            customer_email: t.user_id ? 'Registered User' : 'Guest User',
            category: t.category || 'general',
            last_message: ticketMessages[ticketMessages.length - 1]?.message || 'No messages',
            last_message_time: ticketMessages[ticketMessages.length - 1]?.created_at || t.created_at,
            unread_count: ticketMessages.filter(m => !m.is_read && m.sender_role === 'customer').length,
            status: t.status || 'open',
            crm_status: meta.crm_status || t.crm_status || 'general',
            priority: meta.priority || t.priority || 'medium',
            assigned_admin: meta.assigned_admin || t.assigned_admin || null,
            is_taken_over: meta.is_taken_over ?? (t.is_taken_over || false),
            created_at: t.created_at,
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

  // Real-time subscription for customer profiles (membership updates)
  useEffect(() => {
    const channel = supabase
      .channel('admin_customer_profiles_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'customer_profiles' 
      }, () => {
        // Auto refresh data when a new member registers or updates profile
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Real-time subscription for retur requests to update badge count
  useEffect(() => {
    const channel = supabase
      .channel('admin_retur_requests_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'retur_requests' 
      }, () => {
        // Auto refresh data to update pendingReturns count
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

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

    const messageText = newMessage.trim();
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: tempId,
      sender: 'admin',
      message: messageText,
      timestamp: new Date().toISOString(),
      is_read: false
    };

    // 1. OPTIMISTIC UI UPDATE (0ms Instant feedback):
    setNewMessage('');
    setChatSessions(prev => prev.map(s =>
      s.id === activeChatSession.id
        ? { ...s, messages: [...s.messages, optimisticMessage], last_message: messageText, last_message_time: optimisticMessage.timestamp }
        : s
    ));
    setActiveChatSession(prev => prev ? { ...prev, messages: [...prev.messages, optimisticMessage], last_message: messageText, last_message_time: optimisticMessage.timestamp } : null);

    // 2. BACKGROUND ASYNC PERSISTENCE:
    try {
      const { data: savedMessage, error } = await supabase
        .from('support_messages')
        .insert({
          ticket_id: activeChatSession.id,
          sender_id: adminUser?.id || null,
          sender_role: 'admin',
          message: messageText,
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;

      if (savedMessage) {
        setChatSessions(prev => prev.map(s =>
          s.id === activeChatSession.id
            ? { ...s, messages: s.messages.map(m => m.id === tempId ? { ...m, id: savedMessage.id, timestamp: savedMessage.created_at } : m) }
            : s
        ));
        setActiveChatSession(prev => prev ? { ...prev, messages: prev.messages.map(m => m.id === tempId ? { ...m, id: savedMessage.id, timestamp: savedMessage.created_at } : m) } : null);
      }
    } catch (error) {
      console.error('Failed to send message asynchronously:', error);
    }
  };

  const allNavItems: any[] = [
    { id: 'overview', icon: LayoutDashboard, label: 'Dashboard', activeKeys: ['overview'], roles: ['super_admin', 'finance'] },
    { 
      id: 'report', icon: BarChart3, label: 'Finance & Accounting', activeKeys: ['finance', 'accounting', 'opex', 'product_costings'],
      roles: ['super_admin', 'finance'],
      subItems: [
        { id: 'finance', label: 'Finance Dashboard' },
        { id: 'product_costings', label: 'Product Costing Config' },
        { id: 'accounting', label: 'Accounting / Jurnal' },
        { id: 'opex', label: 'Opex Tracker' }
      ]
    },
    { 
      id: 'transaction', icon: ShoppingBag, label: 'Transactions & Logistics', activeKeys: ['orders', 'logistics', 'returns'], badge: (actionableOrders || 0) + (pendingReturns || 0) > 0 ? (actionableOrders || 0) + (pendingReturns || 0) : undefined,
      roles: ['super_admin', 'outbound_logistics'],
      subItems: [
        { id: 'orders', label: 'Online Orders', badge: actionableOrders > 0 ? actionableOrders : undefined },
        { id: 'logistics', label: 'Shipping & Logistics' },
        { id: 'returns', label: 'Retur & Reimbursement', badge: pendingReturns > 0 ? pendingReturns : undefined }
      ]
    },
    { 
      id: 'inventory_wms', icon: Box, label: 'Inventory & WMS', activeKeys: ['inventory', 'warehouse', 'stock_opname', 'po', 'do', 'stock_ledger'],
      roles: ['super_admin', 'finance', 'inbound_warehouse'],
      subItems: [
        { id: 'inventory', label: 'Stock Management', roles: ['super_admin', 'inbound_warehouse'] },
        { id: 'warehouse', label: 'Ninoc Warehouse Hub', roles: ['super_admin', 'inbound_warehouse'] },
        { id: 'stock_opname', label: 'Stock Opname', roles: ['super_admin', 'inbound_warehouse'] },
        { id: 'po', label: 'Purchase Orders (PO)', roles: ['super_admin', 'finance'] },
        { id: 'do', label: 'Receiving (DO)', roles: ['super_admin', 'inbound_warehouse'] },
        { id: 'stock_ledger', label: 'Kartu Stok (Ledger)', roles: ['super_admin', 'inbound_warehouse'] }
      ]
    },
    { 
      id: 'catalog', icon: Package, label: 'Catalog & Content', activeKeys: ['products', 'upload', 'logbook'],
      roles: ['super_admin'],
      subItems: [
        { id: 'products', label: 'Product List' },
        { id: 'upload', label: 'Bulk Asset Manager' },
        { id: 'logbook', label: 'Studio Logbook' }
      ]
    },
    { 
      id: 'supply', icon: Factory, label: 'Partner & Supplier Hub', activeKeys: ['submissions', 'suppliers'],
      roles: ['super_admin', 'finance'],
      subItems: [
        { id: 'suppliers', label: 'Partner Review' },
        { id: 'submissions', label: 'Product Submissions' }
      ]
    },
    { 
      id: 'marketing_group', icon: TrendingUp, label: 'Marketing & Analytics', activeKeys: ['marketing', 'google_ads', 'web_analytics'],
      roles: ['super_admin', 'finance'],
      subItems: [
        { id: 'marketing', label: 'Marketing & ROAS' },
        { id: 'google_ads', label: 'Google Ads Manager' },
        { id: 'web_analytics', label: 'Web Analytics (GA4/GSC)' }
      ]
    },
    { 
      id: 'support_crm', icon: MessageSquare, label: 'CRM & Customer Support', activeKeys: ['messages', 'placeholders', 'wabroadcast', 'email_broadcast', 'customers', 'affiliates'], badge: totalUnreadChats > 0 ? totalUnreadChats : undefined,
      roles: ['super_admin', 'outbound_logistics', 'finance'],
      subItems: [
        { id: 'messages', label: 'Support Chat', badge: totalUnreadChats > 0 ? totalUnreadChats : undefined, roles: ['super_admin', 'outbound_logistics'] },
        { id: 'placeholders', label: 'Quick Reply Templates', roles: ['super_admin', 'outbound_logistics'] },
        { id: 'customers', label: 'Membership Database', badge: customers.length, roles: ['super_admin'] },
        { id: 'affiliates', label: 'Affiliates Network', roles: ['super_admin', 'finance'] },
        { id: 'wabroadcast', label: 'WA Broadcast', roles: ['super_admin'] },
        { id: 'email_broadcast', label: 'Email Broadcast', roles: ['super_admin'] }
      ]
    },
    { id: 'settings', icon: Settings, label: 'System Settings', activeKeys: ['settings'], roles: ['super_admin'] }
  ];

  const userRole = adminUser?.role || 'super_admin'; // default to super_admin for global admin login
  const navItems = allNavItems.filter((item: any) => item.roles.includes(userRole)).map((item: any) => {
    if (item.subItems) {
      return { ...item, subItems: item.subItems.filter((sub: any) => !sub.roles || sub.roles.includes(userRole)) };
    }
    return item;
  });

  const executePrint = async (order: Order, isAuthorizedReprint: boolean) => {
    // Fraud Prevention: Log Print Event
    const newCount = (order.print_count || 0) + 1;
    const printedBy = adminUser?.email || 'Unknown';
    const reasonText = isAuthorizedReprint ? ` - REASON: ${reprintReason}` : '';
    const newPrintedBy = isAuthorizedReprint ? `${printedBy}${reasonText}` : printedBy;
    
    try {
      await supabase
        .from('orders')
        .update({ 
          print_count: newCount, 
          last_printed_by: newPrintedBy,
          last_printed_at: new Date().toISOString()
        })
        .eq('id', order.id);
        
      // Optimistic update
      setSelectedOrder({ ...order, print_count: newCount, last_printed_by: newPrintedBy });
    } catch (e) {
      console.error('Failed to update print count', e);
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Jendela cetak diblokir oleh browser. Mohon izinkan pop-up (Pop-up Blocker) untuk website ini lalu coba lagi.');
      return;
    }
    
    const items = order?.order_items || [];
    const enrichedItems = items.map((item: any) => {
      const product = products.find((p: any) => p.id === item.product_id);
      const variant = product?.variants?.find((v: any) => v.id === item.variant_id);
      return { 
        ...item, 
        sku: variant?.sku || item.sku || 'N/A',
        color: variant?.color || item.color,
        size: variant?.size || item.size
      };
    });
    const totalItems = items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0) || 0;
    
    // Check if it's a duplicate print for the HTML view
    // If it's an authorized reprint, we still show a small watermark to indicate it's a copy
    const watermarkHtml = newCount > 1 ? `
      <div style="position: absolute; top: 50px; left: 50%; transform: translateX(-50%) rotate(-30deg); font-size: 32px; font-weight: 900; color: rgba(0,0,0,0.1); border: 4px solid rgba(0,0,0,0.1); padding: 5px 10px; text-transform: uppercase; letter-spacing: 5px; z-index: 10; pointer-events: none; white-space: nowrap;">
        ${isAuthorizedReprint ? 'AUTHORIZED REPRINT' : 'REPRINT'}
        <div style="font-size: 10px; text-align: center; margin-top: 5px; letter-spacing: 1px;">
          OLEH: ${printedBy}
        </div>
      </div>
    ` : '';

    const maskPhone = (phone: string | undefined) => {
      if (!phone || phone.length < 8) return phone || '-';
      return phone.slice(0, 4) + '-****-' + phone.slice(-4);
    };

    const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Label Pengiriman - NINOC Archive</title>
            <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');
              @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800;900&display=swap');
              
              body { 
                font-family: 'Courier Prime', monospace; 
                margin: 0; 
                padding: 0; 
                background: white; 
                color: #000;
              }
              
              /* Thermal Label Standard Size */
              .label { 
                background: white; 
                width: 100%; 
                height: 100%;
                padding: 0;
                margin: 0; 
                box-sizing: border-box;
                position: relative;
              }

              .label-inner {
                border: 2px solid #000;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
              }

              /* Header Section */
              .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4mm;
                border-bottom: 2px solid #000;
              }
              .brand {
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                font-weight: 900;
                font-style: italic;
                letter-spacing: -0.5px;
              }
              .brand span {
                font-size: 8px;
                font-weight: 600;
                margin-left: 4px;
                font-style: normal;
                letter-spacing: 1px;
              }
              .courier-box {
                display: flex;
                align-items: center;
                gap: 4px;
              }
              .courier-badge {
                background: #000;
                color: #fff;
                font-family: 'Inter', sans-serif;
                font-weight: 800;
                font-size: 10px;
                padding: 2px 4px;
                letter-spacing: 0.5px;
              }

              /* Barcode Section */
              .barcode-section {
                padding: 4mm;
                text-align: center;
                border-bottom: 2px solid #000;
              }
              .barcode-section img {
                width: 100%;
                height: 50px;
                display: block;
                margin: 0 auto;
              }
              .awb-text {
                font-family: 'Courier Prime', monospace;
                font-weight: 700;
                font-size: 14px;
                margin-top: 4px;
                letter-spacing: 2px;
              }

              /* Address Grid */
              .address-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                border-bottom: 2px solid #000;
              }
              .address-box {
                padding: 4mm;
              }
              .address-box.left {
                border-right: 2px solid #000;
              }
              .box-title {
                font-family: 'Inter', sans-serif;
                font-size: 8px;
                font-weight: 700;
                letter-spacing: 1px;
                margin-bottom: 4px;
                text-decoration: underline;
              }
              .person-name {
                font-weight: 700;
                font-size: 12px;
                margin-bottom: 2px;
                font-family: 'Inter', sans-serif;
                text-transform: uppercase;
              }
              .person-phone {
                font-size: 10px;
                margin-bottom: 6px;
              }
              .person-address {
                font-size: 9px;
                line-height: 1.6;
                text-transform: uppercase;
              }

              /* Content Grid */
              .content-grid {
                display: grid;
                grid-template-columns: 2fr 1fr;
                border-bottom: 2px solid #000;
                flex: 1;
              }
              .content-box {
                padding: 4mm;
              }
              .content-box.left {
                border-right: 2px solid #000;
              }
              .item-line {
                font-size: 10px;
                line-height: 1.4;
                margin-bottom: 2px;
                text-transform: uppercase;
              }
              
              .order-id-box {
                text-align: center;
                padding-top: 4mm;
              }
              .order-id-val {
                font-family: 'Inter', sans-serif;
                font-size: 12px;
                font-weight: 800;
                margin-top: 4px;
              }
              .qty-val {
                font-size: 9px;
                margin-top: 8px;
                display: flex;
                justify-content: space-between;
                padding: 0 4px;
              }

              /* Footer */
              .footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 2mm 4mm;
                font-size: 8px;
              }
              .fragile-badge {
                background: #000;
                color: #fff;
                font-family: 'Inter', sans-serif;
                font-weight: 800;
                padding: 2px 6px;
                font-size: 10px;
                letter-spacing: 1px;
              }

              @media print {
                @page { margin: 0; size: 100mm 150mm; }
              }
            </style>
          </head>
          <body>
              <div class="label">
                ${watermarkHtml}
                <div class="label-inner">
                  
                  <div class="header">
                    <div class="brand">NINOC <span>ARCHIVE</span></div>
                    <div class="courier-box">
                      <div class="courier-badge">${(order.courier || 'STD').toUpperCase().slice(0, 5)}</div>
                    </div>
                  </div>

                  <div class="barcode-section">
                    <svg class="barcode"
                      jsbarcode-format="CODE128"
                      jsbarcode-value="${order.tracking_id || 'NNC' + order.id.toUpperCase()}"
                      jsbarcode-textmargin="0"
                      jsbarcode-fontoptions="bold"
                      jsbarcode-height="50"
                      jsbarcode-displayvalue="false"
                      jsbarcode-width="2"
                      jsbarcode-margin="0">
                    </svg>
                    <div class="awb-text">${order.tracking_id || 'NNC' + order.id.toUpperCase()}</div>
                  </div>

                  <div class="address-grid">
                    <div class="address-box left">
                      <div class="box-title">PENERIMA / TO</div>
                      <div class="person-name">${order.shipping_address?.name || 'GUEST'}</div>
                      <div class="person-phone">${maskPhone(order.shipping_address?.phone)}</div>
                      ${order.shipping_address?.address_type ? `<div style="display:inline-block; border:1px solid black; padding:1px 4px; font-size:8px; font-weight:bold; margin-top:2px; margin-bottom:2px;">${order.shipping_address.address_type === 'Home' ? 'Home / Rumah' : 'Office / Kantor'}</div>` : ''}
                      <div class="person-address">
                        ${order.shipping_address?.address || '-'}<br/>
                        ${order.shipping_address?.address?.toUpperCase().includes((order.shipping_address?.city || '').toUpperCase()) ? '' : (order.shipping_address?.city || '-')}
                      </div>
                    </div>
                    <div class="address-box">
                      <div class="box-title">PENGIRIM / FROM</div>
                      <div class="person-name">NINOC STUDIO</div>
                      <div class="person-phone">0821-1983-774</div>
                      <div class="person-address">
                        Kota Bandung<br/>
                        Jawa Barat<br/>
                        40292
                      </div>
                    </div>
                  </div>

                  <div class="content-grid">
                    <div class="content-box left">
                      <div class="box-title">ISI PAKET / CONTENTS</div>
                      ${enrichedItems?.map((i: any) => `
                        <div class="item-line">${i.product_name} ${[i.sku, i.color, i.size].filter(Boolean).length > 0 ? `(${[i.sku, i.color, i.size].filter(Boolean).join(' / ')})` : ''} x${i.quantity}</div>
                      `).join('') || '<div class="item-line">No items found</div>'}
                    </div>
                    <div class="content-box">
                      <div class="order-id-box">
                        <div class="box-title" style="text-decoration:none;">ORDER ID</div>
                        <div class="order-id-val">#${order.id.toUpperCase()}</div>
                      </div>
                      <div class="qty-val">
                        <span>Qty: ${totalItems}</span>
                        <span>~${totalItems * 100}g</span>
                      </div>
                    </div>
                  </div>

                  <div class="footer">
                    <div>${new Date(order.created_at).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</div>
                    <div>NINOC ARCHIVE - BANDUNG, INDONESIA</div>
                    <div class="fragile-badge">FRAGILE</div>
                  </div>

                </div>
              </div>
            
            <script>
              JsBarcode(".barcode").init();
              window.onload = () => { setTimeout(() => { window.print(); }, 800); }
            </script>
          </body>
        </html>
      `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };



  if (!adminUser) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-ink/20 border-t-rose rounded-full animate-spin mb-4"></div>
        <p className="text-xs uppercase tracking-widest text-ink/40 font-medium animate-pulse">Verifying Access...</p>
      </div>
    );
  }

  return (
    <>
    <main className="h-screen w-full bg-gray-50/50 flex overflow-hidden print:hidden">
      {/* MOBILE TOP BAR */}
      <header className="fixed top-0 left-0 right-0 z-[500] bg-white border-b border-gray-100 md:hidden flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <span className="font-display font-medium text-lg italic tracking-tighter text-rose uppercase">NINOC</span>
          <span className="text-[9px] text-gray-300 uppercase tracking-wider">Admin</span>
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
            <div className="p-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="font-display font-medium text-xl italic tracking-tighter text-rose uppercase">NINOC</div>
                <p className="text-[9px] uppercase tracking-[0.4em] text-gray-300 mt-1">Admin Control Center</p>
              </div>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-gray-300 hover:text-rose">
                <X size={16} />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto minimal-scroll py-2">
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
                  subItems={item.subItems?.map((sub: any) => ({
                    label: sub.label,
                    id: sub.id,
                    active: activeTab === sub.id,
                    onClick: () => { setActiveTab(sub.id); setIsMobileMenuOpen(false); },
                    badge: sub.badge
                  }))}
                />
              ))}
            </nav>
            <div className="p-2 border-t border-gray-100">
              <button onClick={() => supabase.auth.signOut().then(() => { window.location.href = '/'; })} className="w-full flex items-center gap-3 px-2 py-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                <LogOut size={16} />
                <span className="text-[10px] uppercase tracking-wider">Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 flex-col bg-white border-r border-gray-100 z-10 shrink-0 h-full overflow-y-auto custom-scrollbar">
        <div className="p-3 sticky top-0 bg-white/80 backdrop-blur-sm z-10 border-b border-gray-50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-display font-medium text-2xl italic tracking-tighter text-rose uppercase">NINOC</span>
            <span className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Internal Portal</span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navItems.map((item) => (
            <SidebarItem 
              key={item.id} 
              icon={item.icon} 
              label={item.label} 
              active={item.activeKeys.includes(activeTab)} 
              onClick={() => {
                if (!item.subItems) setActiveTab(item.activeKeys[0]);
              }}
              badge={item.badge}
              subItems={item.subItems?.map((sub: any) => ({
                label: sub.label,
                id: sub.id,
                active: activeTab === sub.id,
                onClick: () => setActiveTab(sub.id),
                badge: sub.badge
              }))}
            />
          ))}
        </nav>

        <div className="p-2 border-t border-ink/5">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="w-full flex items-center gap-3 px-2 py-1.5 text-ink/80 hover:text-rose hover:bg-rose/5 rounded transition-all"
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
            <span className="text-[10px] font-medium uppercase tracking-wider text-ink/80">
              {['products', 'upload', 'logbook'].includes(activeTab) ? 'Catalog / ' :
               ['orders', 'logistics', 'returns'].includes(activeTab) ? 'Transaction / ' :
               ['inventory', 'warehouse', 'stock_opname', 'po', 'do', 'stock_ledger'].includes(activeTab) ? 'Inventory & WMS / ' :
               ['finance', 'accounting', 'opex', 'product_costings'].includes(activeTab) ? 'Finance & Accounting / ' :
               ['messages', 'placeholders', 'wabroadcast', 'email_broadcast', 'customers', 'affiliates'].includes(activeTab) ? 'CRM & Support / ' :
               ['marketing', 'google_ads', 'web_analytics'].includes(activeTab) ? 'Marketing / ' :
               ['submissions', 'suppliers'].includes(activeTab) ? 'Partner Hub / ' :
               'Dashboard / '}
            </span>
            <h1 className="text-[10px] font-medium text-ink uppercase tracking-wider">
              {activeTab === 'overview' ? 'Overview' :
               activeTab === 'products' ? 'Product List' :
               activeTab === 'upload' ? 'Bulk Asset Manager' :
               activeTab === 'logbook' ? 'Studio Logbook' :
               activeTab === 'orders' ? 'Online Orders' :
               activeTab === 'logistics' ? 'Shipping & Logistics' :
               activeTab === 'returns' ? 'Retur & Reimbursement' :
               activeTab === 'submissions' ? 'Product Submissions' :
               activeTab === 'suppliers' ? 'Partner Review' :
               activeTab === 'warehouse' ? 'Ninoc Warehouse Hub' :
               activeTab === 'customers' ? 'Membership Database' :
               activeTab === 'affiliates' ? 'Affiliates Network' :
               activeTab === 'marketing' ? 'Marketing & ROAS' :
               activeTab === 'google_ads' ? 'Google Ads Manager' :
               activeTab === 'web_analytics' ? 'Web Analytics (GA4/GSC)' :
               activeTab === 'inventory' ? 'Stock Management' :
               activeTab === 'po' ? 'Purchase Orders' :
               activeTab === 'do' ? 'Inbound Receiving' :
               activeTab === 'stock_ledger' ? 'Kartu Stok' :
               activeTab === 'stock_opname' ? 'Stock Opname' :
               activeTab === 'finance' ? 'Finance Dashboard' :
               activeTab === 'product_costings' ? 'Product Costing Config' :
               activeTab === 'accounting' ? 'Accounting / Jurnal' :
               activeTab === 'opex' ? 'Opex Tracker' :
               activeTab === 'messages' ? 'Support Chat' :
               activeTab === 'placeholders' ? 'Quick Reply Templates' :
               activeTab === 'wabroadcast' ? 'WA Broadcast' :
               activeTab === 'email_broadcast' ? 'Email Broadcast' :
               activeTab === 'settings' ? 'System Settings' : activeTab}
            </h1>
          </div>
          
          <div className="flex-1 max-w-md mx-8">
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/90 group-focus-within:text-rose transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari pesanan, produk, atau menu..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-ink/10 rounded-md text-xs md:text-[11px] font-medium focus:outline-none focus:border-rose/50 transition-all placeholder:text-ink/80"
              />
            </div>
          </div>

          <div className="flex-1 flex items-center justify-end gap-5 relative">
            {(showNotificationsModal || showUserMenuModal) && (
              <div 
                onClick={() => {
                  setShowNotificationsModal(false);
                  setShowUserMenuModal(false);
                }} 
                className="fixed inset-0 z-40" 
              />
            )}

            <button 
              onClick={() => {
                setShowNotificationsModal(!showNotificationsModal);
                setShowUserMenuModal(false);
              }}
              className="relative p-1.5 text-ink/80 hover:text-ink transition-colors focus:outline-none z-50"
              title="Notifikasi Sistem"
            >
              <Bell size={16} />
              {pendingOrders > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-rose rounded-full animate-pulse" />
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotificationsModal && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-28 top-12 w-80 bg-white border border-ink/10 rounded-xl shadow-2xl p-4 z-50 text-ink"
                >
                  <div className="flex items-center justify-between border-b border-ink/5 pb-2.5 mb-3">
                    <span className="font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 text-ink">
                      <Bell size={13} className="text-rose" /> Notifikasi Sistem
                    </span>
                    <button onClick={() => setShowNotificationsModal(false)} className="text-ink/40 hover:text-ink transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-1">
                    {pendingOrders > 0 && (
                      <div 
                        onClick={() => { setActiveTab('orders'); setShowNotificationsModal(false); }}
                        className="p-3 bg-rose/5 hover:bg-rose/10 border border-rose/10 rounded-lg cursor-pointer transition-all flex items-start gap-3"
                      >
                        <div className="p-1.5 bg-rose/10 rounded-md text-rose mt-0.5">
                          <Package size={15} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-ink">Pesanan Baru Tertunda</p>
                          <p className="text-[11px] text-ink/70 mt-0.5">Terdapat <span className="font-bold text-rose">{pendingOrders}</span> pesanan menunggu untuk diproses dan dikirim.</p>
                        </div>
                      </div>
                    )}
                    {lowStockProductsCount > 0 && (
                      <div 
                        onClick={() => { setActiveTab('inventory'); setShowNotificationsModal(false); }}
                        className="p-3 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/10 rounded-lg cursor-pointer transition-all flex items-start gap-3"
                      >
                        <div className="p-1.5 bg-amber-500/10 rounded-md text-amber-600 mt-0.5">
                          <AlertTriangle size={15} />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-ink">Stok Menipis</p>
                          <p className="text-[11px] text-ink/70 mt-0.5"><span className="font-bold text-amber-600">{lowStockProductsCount}</span> produk memiliki stok di bawah batas aman (5 unit).</p>
                        </div>
                      </div>
                    )}
                    {pendingOrders === 0 && lowStockProductsCount === 0 && (
                      <div className="py-8 text-center">
                        <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2">
                          <CheckCircle size={20} />
                        </div>
                        <p className="text-xs font-semibold text-ink">Semua Bersih & Aman!</p>
                        <p className="text-[11px] text-ink/60 mt-0.5">Tidak ada pesanan tertunda atau stok menipis saat ini.</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-6 w-px bg-ink/5 mx-1" />

            <div 
              onClick={() => {
                setShowUserMenuModal(!showUserMenuModal);
                setShowNotificationsModal(false);
              }}
              className="flex items-center gap-3 cursor-pointer group relative z-50"
              title="Akun Admin"
            >
              <div className="w-7 h-7 rounded-full bg-ink/5 flex items-center justify-center overflow-hidden border border-ink/5 group-hover:border-rose/20 transition-colors">
                {adminUser?.email ? (
                  <span className="text-[9px] font-medium text-ink uppercase">{adminUser.email.charAt(0)}</span>
                ) : (
                  <User size={12} className="text-ink/90" />
                )}
              </div>
              <span className="text-[10px] font-medium text-ink group-hover:text-rose transition-colors">
                {adminUser?.email?.split('@')[0] || 'Admin User'}
              </span>
            </div>

            {/* User Profile Menu Dropdown */}
            <AnimatePresence>
              {showUserMenuModal && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-12 w-56 bg-white border border-ink/10 rounded-xl shadow-2xl p-2.5 z-50 text-ink"
                >
                  <div className="px-3 py-2.5 bg-ink/[0.02] rounded-lg border border-ink/5 mb-2">
                    <p className="text-xs font-bold text-ink truncate">{adminUser?.email || 'Admin User'}</p>
                    <p className="text-[9px] text-rose font-bold mt-0.5 uppercase tracking-wider">{adminUser?.role || 'Super Admin'}</p>
                  </div>
                  <div className="space-y-1">
                    <button 
                      onClick={() => { setActiveTab('settings'); setShowUserMenuModal(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink/80 hover:text-ink hover:bg-ink/5 rounded-lg transition-all text-left font-medium"
                    >
                      <Settings size={14} className="text-ink/60" />
                      <span>Pengaturan Sistem</span>
                    </button>
                    <button 
                      onClick={() => { setActiveTab('overview'); setShowUserMenuModal(false); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-ink/80 hover:text-ink hover:bg-ink/5 rounded-lg transition-all text-left font-medium"
                    >
                      <LayoutDashboard size={14} className="text-ink/60" />
                      <span>Ringkasan Bisnis</span>
                    </button>
                  </div>
                  <div className="border-t border-ink/5 mt-2 pt-2">
                    <button 
                      onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.href = '/';
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose hover:bg-rose/5 rounded-lg transition-all text-left font-semibold"
                    >
                      <LogOut size={14} />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Content */}
        <section className="flex-1 overflow-hidden flex flex-col p-4 md:px-8 md:py-6">
          
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

          {activeTab === 'po' && <PoManager products={products} />}
          {activeTab === 'do' && <DoReceiving />}
          {activeTab === 'stock_ledger' && <StockLedger />}
          {activeTab === 'stock_opname' && <StockOpname products={products} adminEmail={adminUser?.email || 'admin'} />}

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
              onOrderUpdated={(updatedOrder) => {
                setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
              }}
            />
          )}

          {activeTab === 'logbook' && (
            <LogbookTab />
          )}

          {activeTab === 'returns' && (
            <ReturTab />
          )}

          {activeTab === 'submissions' && (
            <SubmissionsTab />
          )}

          {activeTab === 'suppliers' && (
            <SuppliersTab />
          )}

          {activeTab === 'warehouse' && (
            <WarehouseTab />
          )}

          {activeTab === 'opex' && <OpexTracker adminEmail={adminUser?.email || 'admin'} />}

          {activeTab === 'finance' && (
            <FinanceDashboard />
          )}
          {activeTab === 'product_costings' && (
            <ProductCostingTab />
          )}

          {activeTab === 'accounting' && (
            <FinanceTab
              finance={finance}
              products={products}
              orders={orders}
              financeTab={financeTab}
              setFinanceTab={setFinanceTab}
              productCostings={productCostings}
              setSelectedProductForCosting={setSelectedProductForCosting}
              setCostingForm={setCostingForm}
              setIsCostingModalOpen={setIsCostingModalOpen}
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

          {activeTab === 'google_ads' && (
            <GoogleAdsTab />
          )}

          {activeTab === 'web_analytics' && (
            <WebAnalyticsTab />
          )}

          {activeTab === 'placeholders' && <PlaceholderTab />}

          {activeTab === 'wabroadcast' && <WABroadcastTab />}
          {activeTab === 'email_broadcast' && <EmailBroadcastTab customers={customers} />}

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

          {activeTab === 'affiliates' && <AffiliatesTab />}

          {activeTab === 'marketing' && <MarketingTab />}

          {activeTab === 'settings' && <SettingsTab />}

        </section>
        </div>

      {/* ===== TOAST NOTIFICATION ===== */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={cn(
              "fixed bottom-6 right-6 z-[300] flex items-center gap-3 px-2 py-1.5 rounded-lg shadow-xl shadow-black/5 border",
              toast.type === 'success' ? 'bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]' :
              toast.type === 'error' ? 'bg-[#fef2f2] border-[#fecaca] text-[#991b1b]' :
              'bg-[#eff6ff] border-[#bfdbfe] text-[#1e40af]'
            )}
          >
            {toast.type === 'success' ? <CheckCircle size={20} className="text-[#16a34a]" /> :
             toast.type === 'error' ? <AlertCircle size={20} className="text-[#dc2626]" /> :
             <Info size={20} className="text-[#2563eb]" />}
            <span className="text-xs font-medium pr-4">{toast.text}</span>
            <button onClick={() => setToast(null)} className="absolute right-2 top-2 opacity-50 hover:opacity-100">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ProductModal 
        isProductModalOpen={isProductModalOpen} setIsProductModalOpen={setIsProductModalOpen}
        isEditMode={isEditMode} productForm={productForm} setProductForm={setProductForm}
        dbDepartments={dbDepartments} dbCategories={dbCategories} dbWarehouses={dbWarehouses}
        isUploadingProductImage={isUploadingProductImage} setIsUploadingProductImage={setIsUploadingProductImage}
        saveProduct={saveProduct} 
        addVariant={addVariant} removeVariant={removeVariant} updateVariant={updateVariant} handleProductImageUpload={handleProductImageUpload}
        isFnB={isFnB} isObjects={isObjects}
        isSeoPanelOpen={isSeoPanelOpen} setIsSeoPanelOpen={setIsSeoPanelOpen}
        showToast={showToast} handleProductNameChange={handleProductNameChange}
      />
      {/* ===== COSTING MODAL ===== */}
      <AnimatePresence>
        {isCostingModalOpen && selectedProductForCosting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg my-auto bg-white rounded-2xl flex flex-col max-h-[90vh]"
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

              <div className="p-3 space-y-5 overflow-y-auto flex-1">
                {/* Cost Components */}
                <div className="space-y-3">
                  <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Biaya Component</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Supplier Cost</label>
                      <input type="number" value={costingForm.supplier_cost} onChange={e => setCostingForm({...costingForm, supplier_cost: Number(e.target.value)})} className="w-full px-1.5 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50" />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Shipping Cost</label>
                      <input type="number" value={costingForm.shipping_cost} onChange={e => setCostingForm({...costingForm, shipping_cost: Number(e.target.value)})} className="w-full px-1.5 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50" />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Packaging Cost</label>
                      <input type="number" value={costingForm.packaging_cost} onChange={e => setCostingForm({...costingForm, packaging_cost: Number(e.target.value)})} className="w-full px-1.5 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50" />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Operasional %</label>
                      <input type="number" value={costingForm.operasional_pct} onChange={e => setCostingForm({...costingForm, operasional_pct: Number(e.target.value)})} className="w-full px-1.5 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50" />
                    </div>
                  </div>
                </div>

                {/* Tax */}
                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Tax Rate (%)</label>
                  <input type="number" value={costingForm.tax_rate} onChange={e => setCostingForm({...costingForm, tax_rate: Number(e.target.value)})} className="w-full px-1.5 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50" />
                </div>

                {/* Courier Costs */}
                <div className="space-y-3">
                  <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Biaya Kurir</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Regency</label>
                      <input type="number" value={costingForm.courier_regency_cost} onChange={e => setCostingForm({...costingForm, courier_regency_cost: Number(e.target.value)})} className="w-full px-1.5 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50" />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Inter-Regency</label>
                      <input type="number" value={costingForm.courier_inter_regency_cost} onChange={e => setCostingForm({...costingForm, courier_inter_regency_cost: Number(e.target.value)})} className="w-full px-1.5 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50" />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Same Day</label>
                      <input type="number" value={costingForm.courier_same_day_cost} onChange={e => setCostingForm({...costingForm, courier_same_day_cost: Number(e.target.value)})} className="w-full px-1.5 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50" />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Instant</label>
                      <input type="number" value={costingForm.courier_instant_cost} onChange={e => setCostingForm({...costingForm, courier_instant_cost: Number(e.target.value)})} className="w-full px-1.5 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50" />
                    </div>
                  </div>
                </div>

                {/* Target & Selling Price */}
                <div className="space-y-3 pt-2 border-t border-gray-100">
                  <h3 className="text-[10px] uppercase tracking-widest text-gray-400 font-medium">Margin & Harga Jual</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Target Margin %</label>
                      <input type="number" value={costingForm.target_margin_pct} onChange={e => setCostingForm({...costingForm, target_margin_pct: Number(e.target.value)})} className="w-full px-1.5 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50" />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-gray-500 mb-1">Selling Price</label>
                      <input type="number" value={costingForm.selling_price} onChange={e => setCostingForm({...costingForm, selling_price: Number(e.target.value)})} className="w-full px-1.5 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50" />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-ink/[0.02] rounded-xl p-2 space-y-2">
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

              <div className="sticky bottom-0 bg-white px-1.5 py-1 border-t border-gray-100 flex items-center justify-end gap-3">
                <button onClick={() => setIsCostingModalOpen(false)} className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const baseCost = costingForm.supplier_cost + costingForm.shipping_cost + costingForm.packaging_cost;
                    const withOpr = baseCost * (1 + costingForm.operasional_pct / 100);
                    const withTax = withOpr * (1 + costingForm.tax_rate / 100);
                    const { error } = await supabase.from('product_costings').upsert({
                      product_id: selectedProductForCosting!.id,
                      supplier_cost: costingForm.supplier_cost,
                      shipping_cost: costingForm.shipping_cost,
                      packaging_cost: costingForm.packaging_cost,
                      operational_pct: costingForm.operasional_pct,
                      tax_rate: costingForm.tax_rate,
                      courier_regency_cost: costingForm.courier_regency_cost,
                      courier_inter_regency_cost: costingForm.courier_inter_regency_cost,
                      courier_same_day_cost: costingForm.courier_same_day_cost,
                      courier_instant_cost: costingForm.courier_instant_cost,
                      target_margin_pct: costingForm.target_margin_pct,
                      selling_price: costingForm.selling_price
                    }, { onConflict: 'product_id' });
                    if (error) {
                      showToast(`Gagal menyimpan costing: ${error.message}`, 'error');
                    } else {
                      showToast('Product costing berhasil disimpan!', 'success');
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
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-3"
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
                  <h2 className="text-lg font-medium text-gray-900">{selectedOrder.id}</h2>
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

              <div className="p-3 flex flex-col gap-2">
                {/* Row 1: Status & Tracking */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                  <div className="bg-gray-50 px-1.5 py-1 border-b border-gray-200">
                    <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest">Garment Items</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {selectedOrder.order_items?.map((item, idx) => {
                      const variantSku = item.sku || products.find(p => p.id === item.product_id)?.variants?.find(v => v.id === item.variant_id)?.sku || 'N/A';
                      const variantColor = item.color || products.find(p => p.id === item.product_id)?.variants?.find(v => v.id === item.variant_id)?.color;
                      const variantSize = item.size || products.find(p => p.id === item.product_id)?.variants?.find(v => v.id === item.variant_id)?.size || 'OS';
                      
                      return (
                        <div key={idx} className="flex justify-between items-center p-3 text-xs hover:bg-gray-50/50 transition-colors">
                          <div>
                            <span className="font-medium text-gray-900">{item.product_name || 'PRODUCT'}</span>
                            <div className="flex items-center gap-2 mt-1">
                              {variantColor && (
                                <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">CLR: {variantColor}</span>
                              )}
                              <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">SZ: {variantSize}</span>
                              <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">QTY: {item.quantity}</span>
                              <span className="text-[10px] text-rose font-mono font-bold bg-rose/5 px-1.5 py-0.5 rounded border border-rose/10 uppercase tracking-widest">{variantSku}</span>
                            </div>
                          </div>
                          <span className="font-mono text-gray-900">IDR {item.price_at_purchase.toLocaleString('id-ID')}</span>
                        </div>
                      );
                    })}
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
                    <span className="text-xs font-medium font-mono text-rose">IDR {selectedOrder.total_price.toLocaleString('id-ID')}</span>
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
                    <div className="flex items-center justify-between p-2 bg-white border-b border-gray-200 shrink-0">
                      <p className="text-xs font-medium uppercase tracking-widest text-gray-900">Label Preview</p>
                      <button onClick={() => setIsPrintPreviewOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={16} />
                      </button>
                    </div>
                    
                    {/* Label Canvas Preview - Scaled to fit container */}
                    {/* 
                      scale(0.68) trick: 
                      - ShippingLabel is 100mm × 150mm
                      - After scale(0.68): visual footprint = 68mm × 102mm ≈ 257px × 386px
                      - We size the outer wrapper to the visual size so no dead space or clipping
                    */}
                    <div className="flex-1 overflow-auto bg-gray-50/50 flex items-center justify-center py-6">
                      <div style={{ position: 'relative', width: '68mm', height: '102mm', flexShrink: 0 }}>
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100mm',
                          height: '150mm',
                          transform: 'scale(0.68)',
                          transformOrigin: 'top left',
                          overflow: 'hidden',
                        }}>
                          <div className="bg-white shadow-xl rounded-sm" style={{ width: '100mm', height: '150mm' }}>
                            <ShippingLabel order={selectedOrder} />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2 bg-white border-t border-gray-200 shrink-0">
                      <button
                        onClick={() => {
                          const order = selectedOrder;
                          if (!order) return;
                          
                          if ((order.print_count || 0) > 0) {
                            // Already printed -> Show Authorization Modal
                            setReprintReason('');
                            setIsReprintModalOpen(true);
                          } else {
                            // First time printing -> Execute immediately
                            executePrint(order, false);
                          }
                        }}
                        className="w-full py-1.5 bg-black text-white font-medium text-xs uppercase tracking-widest rounded flex justify-center items-center gap-2 hover:bg-rose transition-colors"
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

      {/* ===== REPRINT AUTHORIZATION MODAL ===== */}
      <AnimatePresence>
        {isReprintModalOpen && selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] bg-black/60 backdrop-blur-sm flex items-center justify-center p-2"
            onClick={() => setIsReprintModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-amber-50 border-b border-amber-200 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertTriangle size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-amber-900 text-xs">Otorisasi Cetak Ulang</h3>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Resi ini sudah pernah dicetak {selectedOrder.print_count || 1}× sebelumnya
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-2">
                {/* Print History Info */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Order ID</span>
                    <span className="font-mono font-semibold text-gray-900">#{(selectedOrder.id || '').toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Terakhir dicetak oleh</span>
                    <span className="font-medium text-gray-900">{selectedOrder.last_printed_by || '-'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Waktu cetak terakhir</span>
                    <span className="font-medium text-gray-900">
                      {selectedOrder.last_printed_at 
                        ? new Date(selectedOrder.last_printed_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : '-'}
                    </span>
                  </div>
                </div>

                {/* Reason Selection */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Alasan Cetak Ulang <span className="text-rose">*</span>
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'Printer Rusak / Mati Lampu', icon: '⚡' },
                      { value: 'Hasil Cetak Tidak Jelas / Buram', icon: '🖨️' },
                      { value: 'Label Robek / Rusak Fisik', icon: '📄' },
                      { value: 'Perubahan Data Pengiriman', icon: '📦' },
                      { value: 'Permintaan Supervisor', icon: '👤' },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                          reprintReason === opt.value
                            ? 'border-rose bg-rose/5'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="reprint-reason"
                          value={opt.value}
                          checked={reprintReason === opt.value}
                          onChange={(e) => setReprintReason(e.target.value)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          reprintReason === opt.value ? 'border-rose bg-rose' : 'border-gray-300'
                        }`}>
                          {reprintReason === opt.value && (
                            <Check size={12} className="text-white" />
                          )}
                        </div>
                        <span className="text-xs">{opt.icon}</span>
                        <span className="text-xs font-medium text-gray-700">{opt.value}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Confirmation Checkbox */}
                <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-3">
                  <div className="mt-0.5">
                    <Info size={14} className="text-blue-500" />
                  </div>
                  <p className="text-[11px] text-blue-700 leading-relaxed">
                    Cetak ulang diperbolehkan selama <strong>stok fisik barang tidak ada selisih</strong>. 
                    Setiap aktivitas cetak ulang akan terekam di sistem audit secara otomatis 
                    (siapa, kapan, dan alasannya).
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => setIsReprintModalOpen(false)}
                  className="flex-1 py-2.5 px-4 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  disabled={!reprintReason}
                  onClick={() => {
                    if (!reprintReason || !selectedOrder) return;
                    setIsReprintModalOpen(false);
                    executePrint(selectedOrder, true);
                    showToast(`Reprint terotorisasi: ${reprintReason}`, 'info');
                  }}
                  className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    reprintReason
                      ? 'bg-amber-500 text-white hover:bg-amber-600 cursor-pointer'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Printer size={14} />
                  Cetak Ulang
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
