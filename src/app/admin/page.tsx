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
  AlertTriangle, Check, BarChart3
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
import { ProductCostingTab } from '@/components/admin/tabs/ProductCostingTab';
import PoManager from '@/components/admin/PoManager';
import DoReceiving from '@/components/admin/DoReceiving';
import StockLedger from '@/components/admin/StockLedger';
import FinanceDashboard from '@/components/admin/FinanceDashboard';
import StockOpname from '@/components/admin/StockOpname';
import OpexTracker from '@/components/admin/OpexTracker';
import { MessagesTab } from '@/components/admin/tabs/MessagesTab';
import { CustomersTab } from '@/components/admin/tabs/CustomersTab';
import { SettingsTab } from '@/components/admin/tabs/SettingsTab';
import { LogbookTab } from '@/components/admin/tabs/LogbookTab';
import { ReturTab } from '@/components/admin/tabs/ReturTab';
import { PlaceholderTab } from '@/components/admin/tabs/PlaceholderTab';
import { WABroadcastTab } from '@/components/admin/tabs/WABroadcastTab';
import { EmailBroadcastTab } from '@/components/admin/tabs/EmailBroadcastTab';
import AffiliatesTab from '@/components/admin/tabs/AffiliatesTab';
import { MarketingTab } from '@/components/admin/tabs/MarketingTab';
import { GoogleAdsTab } from '@/components/admin/tabs/GoogleAdsTab';
import { WebAnalyticsTab } from '@/components/admin/tabs/WebAnalyticsTab';
import { SuppliersTab } from '@/components/admin/tabs/SuppliersTab';
import { WarehouseTab } from '@/components/admin/tabs/WarehouseTab';
import { POTab } from '@/components/admin/tabs/POTab';
import { DOTab } from '@/components/admin/tabs/DOTab';
import { StockLedgerTab } from '@/components/admin/tabs/StockLedgerTab';
import { SubmissionsTab } from '@/components/admin/tabs/SubmissionsTab';
import { CustomerModal } from '@/components/admin/CustomerModal';
import { ShippingLabel } from '@/components/admin/ShippingLabel';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SidebarItem } from '@/components/admin/SidebarItem';
import { SeoHelper } from '@/components/admin/SeoHelper';
import { OrderStatus, PaymentStatus, Product, Variant, Order, OrderItem, ShippingAddress, FinanceSummary, ProductCosting, SupplierCostLog, PromoImpact, ChatMessage, ChatSession, Customer } from '@/components/admin/types';
import { isFnBDepartment, isObjectsDepartment } from '@/lib/departmentDomain';

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper to compress images before upload (Bypass Vercel 4.5MB limit)
const compressImage = async (file: File): Promise<File> => {
  if (!file.type.startsWith('image/')) return file;
  if (file.type === 'image/svg+xml' || file.size < 500 * 1024) return file; // Skip SVG & < 500KB
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new globalThis.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1920;
        
        if (width > height && width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);
        
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              resolve(new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() }));
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.85
        );
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

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
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [isReprintModalOpen, setIsReprintModalOpen] = useState(false);
  const [reprintReason, setReprintReason] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    description: '',
    description_en: '',
    specifications: [] as { label: string; value: string }[],
    measurements: [] as { size: string; chest?: string; waist?: string; length: string; leg_opening?: string }[],
    model_info: '',
    price: '',
    category: 'pakaian',
    department_id: '',
    warehouse_id: '',
    weight_grams: 500,
    length_cm: 20,
    width_cm: 20,
    height_cm: 5,
    shelf_life_days: '',
    is_perishable: false,
    image_url: '',
    image_alt: '',
    perspective1: '',
    perspective2: '',
    perspective3: '',
    perspective4: '',
    is_featured: false,
    affiliate_eligible: false,
    price_tag: '',
    badge_text: '',
    variant_label: '',
    variants: [] as { id: string; size: string; color: string; stock_quantity: number; sku?: string }[]
  });

  const [isUploadingProductImage, setIsUploadingProductImage] = useState(false);

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
      if (user) {
        let role = 'super_admin'; // default fallback for safety during transition
        const { data: roleData } = await supabase
          .from('admin_roles')
          .select('role')
          .eq('email', user.email)
          .single();
        if (roleData) {
          role = roleData.role;
        }
        setAdminUser({ ...user, role });
      }
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
          (o.status === 'paid' || o.status === 'delivered' || o.status === 'shipped') &&
          (o.payment_status === 'success' || o.payment_status === 'settlement')
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
      
      const cat = (product.category || '').toLowerCase();
      const isFnBCat = ['coffee', 'pastry', 'rtd', 'snack', 'beverage', 'pantry'].some(k => cat.includes(k));
      const isObjCat = !isFnBCat && ['home', 'kitchen', 'utilities', 'ceramics', 'objects'].some(k => cat.includes(k));
      const defaultSpec = isFnBCat 
        ? { label: 'Roast Profile', value: 'Medium Roast' } 
        : isObjCat 
          ? { label: 'Material', value: 'Artisan Ceramic' } 
          : { label: 'Jenis Pakaian', value: 'Kaos' };

      setProductForm({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        description_en: product.description_en || '',
        specifications: product.specifications?.length ? product.specifications : [defaultSpec],
        measurements: product.measurements || [],
        model_info: product.model_info || '',
        price: (product.price ?? 0).toString(),
        category: product.sub_category || product.category || 'pakaian',
        department_id: product.department_id || dbDepartments?.find(d => {
          if (isFnBCat) return d.slug === 'pantry' || (d.name || '').toLowerCase().includes('pantry');
          if (isObjCat) return d.slug === 'objects' || (d.name || '').toLowerCase().includes('objects');
          return d.slug === 'apparel' || (d.name || '').toLowerCase().includes('apparel');
        })?.id || dbDepartments?.[0]?.id || '',
        warehouse_id: product.warehouse_id || dbWarehouses?.find(w => w.is_primary)?.id || dbWarehouses?.[0]?.id || '',
        weight_grams: typeof product.weight_grams === 'number' && !isNaN(product.weight_grams) ? product.weight_grams : 500,
        length_cm: typeof product.length_cm === 'number' && !isNaN(product.length_cm) ? product.length_cm : 20,
        width_cm: typeof product.width_cm === 'number' && !isNaN(product.width_cm) ? product.width_cm : 20,
        height_cm: typeof product.height_cm === 'number' && !isNaN(product.height_cm) ? product.height_cm : 5,
        shelf_life_days: product.shelf_life_days ? String(product.shelf_life_days) : '',
        is_perishable: Boolean(product.is_perishable),
        image_url: product.image_url || product.specifications?.find(s => s.label?.toLowerCase().startsWith('colorimage:'))?.value || '',
        image_alt: product.image_alt || (product.name ? `${product.name} - Official Product View` : ''),
        perspective1: product.perspective1 || product.specifications?.find(s => s.label?.toLowerCase().startsWith('colorp1:'))?.value || '',
        perspective2: product.perspective2 || product.specifications?.find(s => s.label?.toLowerCase().startsWith('colorp2:'))?.value || '',
        perspective3: product.perspective3 || product.specifications?.find(s => s.label?.toLowerCase().startsWith('colorp3:'))?.value || '',
        perspective4: product.perspective4 || product.specifications?.find(s => s.label?.toLowerCase().startsWith('colorp4:'))?.value || '',
        is_featured: Boolean(product.is_featured),
        affiliate_eligible: Boolean(product.affiliate_eligible),
        price_tag: product.price_tag || '',
        badge_text: product.badge_text || '',
        variant_label: product.variant_label || '',
        variants: product.variants?.length ? product.variants.map(v => {
          const parsedStock = typeof v.stock_quantity === 'number' && !isNaN(v.stock_quantity) 
            ? v.stock_quantity 
            : parseInt(String(v.stock_quantity || 0), 10);
          return {
            id: v.id || '',
            size: v.size || '',
            color: v.color || '',
            stock_quantity: isNaN(parsedStock) ? 0 : parsedStock,
            sku: v.sku || ''
          };
        }) : []
      });
    } else {
      setIsEditMode(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        slug: '',
        description: '',
        description_en: '',
        specifications: [{ label: 'Fit', value: 'Standar' }],
        measurements: [],
        model_info: '',
        price: '',
        category: 'pakaian',
        department_id: dbDepartments?.find(d => d.slug === 'apparel' || (d.name || '').toLowerCase().includes('apparel'))?.id || dbDepartments?.[0]?.id || '',
        warehouse_id: dbWarehouses?.find(w => w.is_primary)?.id || dbWarehouses?.[0]?.id || '',
        weight_grams: 500,
        length_cm: 20,
        width_cm: 20,
        height_cm: 5,
        shelf_life_days: '',
        is_perishable: false,
        image_url: '',
        image_alt: '',
        perspective1: '',
        perspective2: '',
        perspective3: '',
        perspective4: '',
        is_featured: false,
        affiliate_eligible: false,
        price_tag: '',
        badge_text: '',
        variant_label: '',
        variants: []
      });
    }
    setIsProductModalOpen(true);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  };

  const handleProductNameChange = (name: string) => {
    setProductForm(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
      image_alt: (!prev.image_alt || prev.image_alt === prev.name || prev.image_alt.endsWith(' - Official Product View')) ? `${name} - Official Product View` : prev.image_alt
    }));
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
      const hasColors = productForm.variants.some(v => v.color);
      let finalSpecs = (productForm.specifications || []).filter(s => {
        if (!s || typeof s.label !== 'string') return false;
        if (typeof s.value !== 'string' || s.value.trim() === '' || s.value === 'null' || s.value === 'undefined') {
          if (s.label.toLowerCase().startsWith('colorimage:') || s.label.toLowerCase().startsWith('colorp')) {
            return false;
          }
        }
        return true;
      });

      let finalImageUrl = productForm.image_url?.trim() || null;
      let finalImageAlt = productForm.image_alt?.trim() || productForm.name || null;
      let finalP1 = productForm.perspective1?.trim() || null;
      let finalP2 = productForm.perspective2?.trim() || null;
      let finalP3 = productForm.perspective3?.trim() || null;
      let finalP4 = productForm.perspective4?.trim() || null;

      if (hasColors && finalSpecs) {
        const rawFirstColor = productForm.variants.find(v => v.color)?.color;
        const firstColor = rawFirstColor ? rawFirstColor.split(',')[0].trim() : null;
        if (firstColor) {
           finalImageUrl = finalSpecs.find(s => s.label.toUpperCase() === `COLORIMAGE:${firstColor.toUpperCase()}`)?.value || finalImageUrl;
           finalP1 = finalSpecs.find(s => s.label.toUpperCase() === `COLORP1:${firstColor.toUpperCase()}`)?.value || finalP1;
           finalP2 = finalSpecs.find(s => s.label.toUpperCase() === `COLORP2:${firstColor.toUpperCase()}`)?.value || finalP2;
           finalP3 = finalSpecs.find(s => s.label.toUpperCase() === `COLORP3:${firstColor.toUpperCase()}`)?.value || finalP3;
           finalP4 = finalSpecs.find(s => s.label.toUpperCase() === `COLORP4:${firstColor.toUpperCase()}`)?.value || finalP4;
           
           if (!finalImageUrl) {
             finalImageUrl = finalP1 || finalP2 || finalP3 || finalP4 || null;
           }

           const syncSpec = (prefix: string, val: string | null) => {
             if (!val) return;
             const label = `${prefix}:${firstColor}`;
             const idx = finalSpecs.findIndex(s => s.label.toUpperCase() === label.toUpperCase());
             if (idx >= 0) finalSpecs[idx].value = val;
             else finalSpecs.push({ label, value: val });
           };
           syncSpec('ColorImage', finalImageUrl);
           syncSpec('ColorP1', finalP1);
           syncSpec('ColorP2', finalP2);
           syncSpec('ColorP3', finalP3);
           syncSpec('ColorP4', finalP4);

           const firstP5 = finalSpecs.find(s => s.label.toUpperCase() === `COLORP5:${firstColor.toUpperCase()}`)?.value;
           const existingGlobalP5Idx = finalSpecs.findIndex(s => s.label === 'GlobalP5');
           if (firstP5) {
             if (existingGlobalP5Idx >= 0) finalSpecs[existingGlobalP5Idx].value = firstP5;
             else finalSpecs.push({ label: 'GlobalP5', value: firstP5 });
           } else if (existingGlobalP5Idx >= 0) {
             finalSpecs.splice(existingGlobalP5Idx, 1);
           }
        }
      } else if (!finalImageUrl) {
        finalImageUrl = finalP1 || finalP2 || finalP3 || finalP4 || null;
      }

      const productData = {
        name: productForm.name,
        slug: productForm.slug,
        description: productForm.description,
        description_en: productForm.description_en || null,
        specifications: finalSpecs,
        measurements: productForm.measurements.length > 0 ? productForm.measurements : null,
        model_info: productForm.model_info || null,
        price: cleanAndParsePrice(productForm.price),
        category: productForm.category,
        sub_category: (productForm as any).sub_category || productForm.category || null,
        department_id: (productForm as any).department_id || null,
        warehouse_id: (productForm as any).warehouse_id || null,
        weight_grams: parseInt(String((productForm as any).weight_grams)) || 500,
        length_cm: parseInt(String((productForm as any).length_cm)) || 20,
        width_cm: parseInt(String((productForm as any).width_cm)) || 20,
        height_cm: parseInt(String((productForm as any).height_cm)) || 5,
        shelf_life_days: (productForm as any).shelf_life_days ? parseInt(String((productForm as any).shelf_life_days)) : null,
        is_perishable: Boolean((productForm as any).is_perishable),
        image_url: finalImageUrl,
        image_alt: finalImageAlt,
        perspective1: finalP1,
        perspective2: finalP2,
        perspective3: finalP3,
        perspective4: finalP4,
        is_featured: productForm.is_featured,
        affiliate_eligible: productForm.affiliate_eligible,
        price_tag: productForm.price_tag || null,
        badge_text: productForm.badge_text || null,
        variant_label: productForm.variant_label || null,
        updated_at: new Date().toISOString()
      };

      // Use server API to bypass RLS and save securely
      const res = await fetch('/api/admin/products/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEditMode,
          editingProductId: editingProduct?.id,
          productData,
          allVariants: productForm.variants.flatMap(v => {
            const colors = v.color ? v.color.split(',').map(c => c.trim()).filter(Boolean) : [null];
            return colors.map((color, index) => {
              const variantObj: any = {
                size: v.size || null,
                color: color,
                sku: v.sku || null,
                stock_quantity: parseInt(String(v.stock_quantity)) || 0
              };
              if (v.id && index === 0) variantObj.id = v.id;
              return variantObj;
            });
          })
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save product via API');

      setIsProductModalOpen(false);
      
      if (data.costingMissing) {
        showToast('Success: Product saved! ⚠️ PEMBERITAHUAN: Jangan lupa isi HPP/Costing untuk SKU ini di menu Marketing & ROAS agar data Finance akurat.', 'info');
      } else {
        showToast('Success: Product saved successfully!', 'success');
      }
      
      fetchData();

      // Background Ping to Google Indexing API
      if (productForm.slug) {
        fetch('/api/admin/seo/index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: `https://ninoc.store/shop/${productForm.slug}`,
            action: 'URL_UPDATED'
          })
        }).then(res => res.json()).then(data => {
           if (data.success) {
             setTimeout(() => showToast('Google Indexing Requested!', 'success'), 1500);
           }
        }).catch(err => console.error('Google Indexing API error:', err));
      }
    } catch (error: any) {
      console.error('Failed to save product:', error);
      showToast('Failed to save product: ' + (error.message || JSON.stringify(error)), 'error');
    }
  };

  // ===== PRODUCT IMAGE UPLOAD (Single) =====
  const handleProductImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploadingProductImage(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const compressedFile = await compressImage(file);

      // Use API route (server-side with service role key)
      const formData = new FormData();
      formData.append('files', compressedFile);
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
        setProductForm(prev => ({ 
          ...prev, 
          image_url: data.results[0].url,
          image_alt: prev.image_alt ? prev.image_alt : prev.name ? `${prev.name} - Official Product View` : 'NINOC Official Product View'
        }));
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

      {/* ===== PRODUCT MODAL ===== */}
      <AnimatePresence>
        {isProductModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-ink/40 backdrop-blur-sm flex items-center justify-center p-4 lg:p-6"
          >
            <div className="flex items-start justify-center gap-4 w-full max-w-[1200px] max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
              
              {/* MAIN PRODUCT MODAL */}
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="w-full lg:max-w-3xl flex flex-col bg-white rounded-2xl shadow-2xl ring-1 ring-ink/5 relative overflow-hidden flex-shrink-0 max-h-[90vh]"
              >
                <div className="bg-white px-5 py-4 border-b border-ink/5 flex items-center justify-between z-10 flex-shrink-0">
                  <div className="flex flex-col">
                    <h2 className="text-lg font-semibold text-ink tracking-tight">
                      {isEditMode ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <p className="text-[10px] text-ink/50 uppercase tracking-wider mt-0.5">Manage your product catalog</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {!isSeoPanelOpen && (
                      <button 
                        type="button"
                        onClick={() => setIsSeoPanelOpen(true)}
                        className="px-3 py-1.5 text-rose bg-rose/5 hover:bg-rose/10 rounded-lg text-[11px] font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Search size={14} />
                        SEO Helper
                      </button>
                    )}
                    <button type="button" onClick={() => setIsProductModalOpen(false)} className="p-2 text-ink/50 hover:text-ink hover:bg-ink/5 rounded-full transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-4 min-h-0">
                  {/* STEP 1: CONCEPT MALL PILLAR & ORIGIN WAREHOUSE (VERY TOP HIERARCHY) */}
                  <div className="p-3 bg-gradient-to-r from-gray-900 via-gray-800 to-ink text-white rounded-xl shadow-sm space-y-2.5 border border-gray-700/50">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-widest text-white flex items-center gap-1.5">
                        <span>🏢</span> STEP 1: ENTERPRISE PILLAR & LOKASI GUDANG ASAL
                      </h4>
                      <span className="text-[9px] bg-rose/90 text-white px-2 py-0.5 rounded-full font-mono uppercase tracking-wider">
                        {isFnB ? 'F&B / Pantry Hub' : isObjects ? 'Objects & Home Goods' : 'Apparel'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-0.5">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-300 mb-1 font-semibold">Pilih Department Pillar</label>
                        <select
                          value={productForm.department_id}
                          onChange={(e) => {
                            const newDept = e.target.value;
                            const selDept = dbDepartments.find(d => d.id === newDept || d.slug === newDept || String(d.id) === String(newDept));
                            const deptNameClean = (selDept?.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                            const isPantrySel = newDept === '3' || newDept === 'pantry' || selDept?.slug === 'pantry' || ['pantry', 'f&b', 'cafe', 'roastery', 'coffee', 'pastry', 'rtd', 'snack', 'beverage', 'kopi'].some(k => deptNameClean.includes(k));
                            const isObjectsSel = !isPantrySel && (newDept === '2' || newDept === 'objects' || selDept?.slug === 'objects' || ['objects', 'consumer', 'home', 'kitchen', 'utilities', 'collectibles', 'ceramics', 'goods', 'homeware', 'lifestyle', 'keramik'].some(k => deptNameClean.includes(k)));

                            let newCat = productForm.category;
                            let newWh = productForm.warehouse_id;
                            let newPerishable = productForm.is_perishable;
                            let newSpecs = [...(productForm.specifications || [])];

                            const fbWh = dbWarehouses.find(w => (w.name || '').toLowerCase().includes('roastery') || (w.name || '').toLowerCase().includes('f&b') || w.code === 'WH-BANDUNG-FB')?.id || 'wh-2';
                            const mainWh = dbWarehouses.find(w => w.is_primary || w.code === 'WH-BANDUNG-01')?.id || dbWarehouses[0]?.id || 'wh-1';

                            if (isPantrySel) {
                              newCat = 'coffee';
                              newWh = fbWh;
                              newPerishable = true;
                              newSpecs = [{ label: 'Roast Level', value: 'Medium Roast' }];
                            } else if (isObjectsSel) {
                              newCat = 'utilities';
                              newWh = mainWh;
                              newPerishable = false;
                              newSpecs = [{ label: 'Material', value: 'High-Grade Ceramic' }];
                            } else {
                              newCat = 'pakaian';
                              newWh = mainWh;
                              newPerishable = false;
                              newSpecs = [{ label: 'Fit', value: 'Standar' }];
                            }
                            setProductForm({
                              ...productForm,
                              department_id: newDept,
                              category: newCat,
                              warehouse_id: newWh,
                              is_perishable: newPerishable,
                              specifications: newSpecs
                            });
                          }}
                          className="w-full px-2 py-1.5 border border-white/20 rounded-lg text-xs focus:outline-none focus:border-rose bg-gray-900 text-white font-medium shadow-inner"
                        >
                          <option value="">-- Pilih Department Pillar --</option>
                          {dbDepartments.map(d => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                          {!dbDepartments.length && (
                            <>
                              <option value="1">Apparel (Garment Fashion)</option>
                              <option value="2">Objects & Consumer Goods (Home & Dining)</option>
                              <option value="3">Pantry & Café (F&B / Kopi / Pastry)</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-300 mb-1 font-semibold">Gudang Asal Pengiriman (Biteship Origin)</label>
                        <select
                          value={productForm.warehouse_id}
                          onChange={(e) => setProductForm({ ...productForm, warehouse_id: e.target.value })}
                          className="w-full px-2 py-1.5 border border-white/20 rounded-lg text-xs focus:outline-none focus:border-rose bg-gray-900 text-white font-medium shadow-inner"
                        >
                          <option value="">-- Pilih Gudang Asal --</option>
                          {dbWarehouses.map(w => (
                            <option key={w.id} value={w.id}>{w.name} ({w.code})</option>
                          ))}
                          {!dbWarehouses.length && (
                            <>
                              <option value="wh-1">Gudang Utama NINOC (WH-BANDUNG-01)</option>
                              <option value="wh-2">NINOC Pantry Roastery Hub (WH-BANDUNG-FB)</option>
                            </>
                          )}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* STEP 2: BASIC INFORMATION */}
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2 flex items-center justify-between">
                      <span>STEP 2: INFORMASI DASAR & SEO</span>
                      <span className="text-[10px] font-normal text-gray-400 capitalize">{isFnB ? 'Produk Makanan / Minuman' : isObjects ? 'Produk Peralatan / Home' : 'Produk Fashion / Pakaian'}</span>
                    </h3>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Nama Produk (SEO Optimized)</label>
                      <textarea
                        value={productForm.name}
                        onChange={(e) => handleProductNameChange(e.target.value)}
                        placeholder={isFnB ? "e.g. NINOC Priangan Artisan Roasted Coffee Beans 250g..." : "Enter product name..."}
                        rows={2}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 resize-y leading-relaxed font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Slug URL</label>
                      <input
                        type="text"
                        value={productForm.slug}
                        onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                        placeholder="product-slug-url"
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 font-mono text-[11px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Harga (IDR)</label>
                        <input
                          type="text"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                          placeholder="e.g. 149000"
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 font-semibold text-ink"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Kategori Spesifik Pillar</label>
                        <select
                          value={productForm.category}
                          onChange={(e) => {
                            const val = e.target.value;
                            const newSpecs = [...(productForm.specifications || [])];
                            const jenisIdx = newSpecs.findIndex(s => s.label === 'Jenis Pakaian');
                            if (jenisIdx >= 0) newSpecs[jenisIdx].value = val;
                            setProductForm({ ...productForm, category: val, sub_category: val, specifications: newSpecs } as any);
                          }}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 bg-white font-medium"
                        >
                          {(() => {
                            let filtered = dbCategories.length > 0 ? dbCategories.filter(c => {
                              if (c.slug === 'pakaian-unisex' || c.slug === 'baju-unisex') return false;
                              if (isFnB) return c.slug.includes('coffee') || c.slug.includes('kopi') || c.slug.includes('pastry') || c.slug.includes('snack') || c.slug.includes('rtd') || c.slug.includes('fnb') || c.slug.includes('beverage');
                              if (isObjects) return c.slug.includes('home') || c.slug.includes('kitchen') || c.slug.includes('utilities') || c.slug.includes('objects') || c.slug.includes('collectibles') || c.slug.includes('art');
                              return !c.slug.includes('coffee') && !c.slug.includes('kopi') && !c.slug.includes('pastry') && !c.slug.includes('snack') && !c.slug.includes('rtd') && !c.slug.includes('home') && !c.slug.includes('kitchen');
                            }) : [];
                            
                            // If we have categories but none match the strict filters, fallback to showing all categories
                            if (dbCategories.length > 0 && filtered.length === 0) {
                              filtered = dbCategories;
                            }

                            const presets = isFnB ? [
                              { slug: 'coffee', name: 'Biji Kopi / Roasted Beans' },
                              { slug: 'pastry', name: 'Pastry & Bakery' },
                              { slug: 'rtd', name: 'Minuman RTD / Beverages' },
                              { slug: 'snack', name: 'Camilan / Gourmet Snacks' }
                            ] : isObjects ? [
                              { slug: 'utilities', name: 'Utilities & Alat Tulis' },
                              { slug: 'home', name: 'Peralatan Rumah / Home Goods' },
                              { slug: 'kitchen', name: 'Kitchen & Dining' },
                              { slug: 'collectibles', name: 'Seni / Collectibles' }
                            ] : [
                              { slug: 'kaos', name: 'Kaos / T-Shirt (Atasan)' },
                              { slug: 'hoodie', name: 'Hoodie / Pullover (Atasan)' },
                              { slug: 'sweater', name: 'Sweater / Crewneck (Atasan)' },
                              { slug: 'kemeja', name: 'Kemeja / Flannel (Atasan)' },
                              { slug: 'jaket', name: 'Jaket & Outerwear (Atasan)' },
                              { slug: 'celana-panjang', name: 'Celana Panjang / Cargo / Trousers (Bawahan)' },
                              { slug: 'celana-pendek', name: 'Celana Pendek / Shorts (Bawahan)' },
                              { slug: 'rok-dress', name: 'Rok & Dress (Bawahan)' },
                              { slug: 'aksesoris', name: 'Aksesoris / Headwear & Bags' },
                              { slug: 'unisex', name: 'Unisex / Couple Set' },
                              { slug: 'archive', name: 'Arsip / Studio Edition' }
                            ];
                            // Deduplicate semantic overlaps between dbCategories and presets
                            const combined = [...filtered.filter(c => 
                              !['outerwear', 'celana', 'pakaian', 'pakaian-pria', 'pakaian-wanita'].includes(c.slug)
                            )];
                            presets.forEach(p => {
                              if (!combined.some(c => c.slug === p.slug)) {
                                combined.push({ id: p.slug as any, slug: p.slug, name: p.name });
                              }
                            });
                            return combined.map(c => (
                              <option key={c.id || c.slug} value={c.slug}>{c.name}</option>
                            ));

                            return isFnB ? (
                              <>
                                <option value="coffee">Biji Kopi / Roasted Beans</option>
                                <option value="pastry">Pastry & Bakery</option>
                                <option value="rtd">Minuman RTD / Beverages</option>
                                <option value="snack">Camilan / Gourmet Snacks</option>
                              </>
                            ) : isObjects ? (
                              <>
                                <option value="utilities">Utilities & Alat Tulis</option>
                                <option value="home">Peralatan Rumah / Home Goods</option>
                                <option value="kitchen">Kitchen & Dining</option>
                                <option value="collectibles">Seni / Collectibles</option>
                              </>
                            ) : (
                              <>
                                <option value="unisex">Unisex</option>
                                <option value="kaos">Kaos / T-Shirt</option>
                                <option value="hoodie">Hoodie / Pullover</option>
                                <option value="sweater">Sweater / Crewneck</option>
                                <option value="kemeja">Kemeja / Flannel</option>
                                <option value="jaket">Jaket & Outerwear</option>
                                <option value="celana-panjang">Celana Panjang / Trousers / Cargo</option>
                                <option value="celana-pendek">Celana Pendek / Shorts</option>
                                <option value="pakaian">Atasan Standar / Regular</option>
                                <option value="pakaian-pria">Pakaian Pria</option>
                                <option value="pakaian-wanita">Pakaian Wanita</option>
                                <option value="celana">Celana / Bawahan (Umum)</option>
                                <option value="outerwear">Outerwear / Jaket (Umum)</option>
                                <option value="aksesoris">Aksesoris</option>
                                <option value="archive">Arsip / Studio Edition</option>
                              </>
                            );
                          })()}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* STEP 3: LOGISTICS & DIMENSIONS */}
                  <div className="p-3.5 bg-gray-50/90 border border-gray-200/80 rounded-xl space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-ink/80 flex items-center gap-1.5 border-b border-gray-200/60 pb-2">
                      <span>📦</span> STEP 3: DIMENSI LOGISTIK & BERAT (PERHITUNGAN BITESHIP)
                    </h4>

                    <div className="grid grid-cols-4 gap-2.5">
                      <div>
                        <label className="block text-[10px] text-gray-600 font-semibold mb-1">Berat / Weight (g)</label>
                        <input
                          type="number"
                          value={productForm.weight_grams}
                          onChange={(e) => setProductForm({ ...productForm, weight_grams: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white font-semibold text-ink"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-600 font-semibold mb-1">Panjang / Length (cm)</label>
                        <input
                          type="number"
                          value={productForm.length_cm}
                          onChange={(e) => setProductForm({ ...productForm, length_cm: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-600 font-semibold mb-1">Lebar / Width (cm)</label>
                        <input
                          type="number"
                          value={productForm.width_cm}
                          onChange={(e) => setProductForm({ ...productForm, width_cm: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-600 font-semibold mb-1">Tinggi / Height (cm)</label>
                        <input
                          type="number"
                          value={productForm.height_cm}
                          onChange={(e) => setProductForm({ ...productForm, height_cm: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs bg-white"
                        />
                      </div>
                    </div>

                    {/* ONLY DISPLAY F&B SHELF LIFE WHEN IS F&B! HIDE FOR FASHION/OBJECTS */}
                    {isFnB && (
                      <div className="grid grid-cols-2 gap-3 items-center pt-2 border-t border-gray-200/60 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/50">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-amber-900 mb-1">⏳ Masa Simpan / Shelf Life (Hari)</label>
                          <input
                            type="number"
                            placeholder="e.g. 90 (Hari)"
                            value={productForm.shelf_life_days}
                            onChange={(e) => setProductForm({ ...productForm, shelf_life_days: e.target.value })}
                            className="w-full px-2 py-1.5 border border-amber-300/80 rounded-lg text-xs bg-white text-ink font-medium"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-4">
                          <input
                            type="checkbox"
                            id="is_perishable"
                            checked={productForm.is_perishable}
                            onChange={(e) => setProductForm({ ...productForm, is_perishable: e.target.checked })}
                            className="rounded border-amber-400 text-rose focus:ring-rose w-4 h-4 cursor-pointer"
                          />
                          <label htmlFor="is_perishable" className="text-[11px] font-bold text-amber-950 cursor-pointer">
                            Mudah Basi / Instan Only (GoSend/Grab)
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* STEP 4: SPECIFICATIONS & BADGES */}
                  <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-sm space-y-3">
                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wide border-b border-gray-100 pb-2">
                      STEP 4: SPESIFIKASI & DESKRIPSI PRODUK
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Price Tag (Badge di atas harga)</label>
                        <select
                          value={productForm.price_tag}
                          onChange={(e) => setProductForm({ ...productForm, price_tag: e.target.value })}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 bg-white"
                        >
                          <option value="">None (Tanpa Tag)</option>
                          <option value="Harga Special">Harga Special</option>
                          <option value="Diskon">Diskon</option>
                          <option value="Price Deal">Price Deal</option>
                          <option value="Limited Edition">Limited Edition</option>
                          <option value="Special Edition">Special Edition</option>
                          <option value="REDEEM">REDEEM</option>
                        </select>
                      </div>

                      {/* CONDITIONAL FIELD BASED ON PILLAR: Fit Type for Fashion vs Roast Level for F&B vs Material for Objects */}
                      <div>
                        {isFnB ? (
                          <>
                            <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Roast Level / Profil Rasa (F&B)</label>
                            <select
                              value={productForm.specifications?.find(s => s.label === 'Roast Level' || s.label === 'Profil Rasa')?.value || 'Medium Roast'}
                              onChange={(e) => {
                                const newSpecs = [...(productForm.specifications || [])];
                                const idx = newSpecs.findIndex(s => s.label === 'Roast Level' || s.label === 'Profil Rasa');
                                if (idx >= 0) {
                                  newSpecs[idx].value = e.target.value;
                                  newSpecs[idx].label = 'Roast Level';
                                } else {
                                  newSpecs.push({ label: 'Roast Level', value: e.target.value });
                                }
                                setProductForm({ ...productForm, specifications: newSpecs });
                              }}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 bg-white font-medium"
                            >
                              <option value="Light Roast">Light Roast / Fruity Acidic</option>
                              <option value="Medium Roast">Medium Roast / Balanced</option>
                              <option value="Medium-Dark Roast">Medium-Dark Roast / Caramel & Nutty</option>
                              <option value="Dark Roast">Dark Roast / Bold & Smoky</option>
                              <option value="Fresh Pastry">Fresh Pastry / Daily Baked</option>
                            </select>
                          </>
                        ) : isObjects ? (
                          <>
                            <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Material / Bahan Utama (Objects)</label>
                            <select
                              value={productForm.specifications?.find(s => s.label === 'Material' || s.label === 'Bahan')?.value || 'High-Grade Ceramic'}
                              onChange={(e) => {
                                const newSpecs = [...(productForm.specifications || [])];
                                const idx = newSpecs.findIndex(s => s.label === 'Material' || s.label === 'Bahan');
                                if (idx >= 0) {
                                  newSpecs[idx].value = e.target.value;
                                  newSpecs[idx].label = 'Material';
                                } else {
                                  newSpecs.push({ label: 'Material', value: e.target.value });
                                }
                                setProductForm({ ...productForm, specifications: newSpecs });
                              }}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 bg-white font-medium"
                            >
                              <option value="High-Grade Ceramic">High-Grade Ceramic</option>
                              <option value="Stainless Steel 304">Stainless Steel 304</option>
                              <option value="Solid Wood / Kayu Jati">Solid Wood / Kayu Jati</option>
                              <option value="Borosilicate Glass">Borosilicate Glass</option>
                              <option value="Premium Canvas / Utility">Premium Canvas / Utility</option>
                            </select>
                          </>
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Tipe Potongan / Fit Type (Fashion)</label>
                              <select
                                value={productForm.specifications?.find(s => s.label === 'Fit')?.value || 'Standar / Regular Fit'}
                                onChange={(e) => {
                                  const newSpecs = [...(productForm.specifications || [])];
                                  const fitIndex = newSpecs.findIndex(s => s.label === 'Fit');
                                  if (fitIndex >= 0) {
                                    newSpecs[fitIndex].value = e.target.value;
                                  } else {
                                    newSpecs.push({ label: 'Fit', value: e.target.value });
                                  }
                                  setProductForm({ ...productForm, specifications: newSpecs });
                                }}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 bg-white font-medium"
                              >
                                <option value="Standar / Regular Fit">Standar / Regular Fit</option>
                                <option value="Oversize / Relaxed Fit">Oversize / Relaxed Fit</option>
                                <option value="Boxy Fit / Drop Shoulder">Boxy Fit / Drop Shoulder</option>
                                <option value="Slim Fit / Tapered">Slim Fit / Tapered</option>
                                <option value="Cropped Fit">Cropped Fit</option>
                                <option value="Athletic / Muscle Fit">Athletic / Muscle Fit</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Jenis Pakaian / Sub-Category (Atasan & Bawahan)</label>
                              <select
                                value={(productForm as any).sub_category || productForm.category || 'kaos'}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const newSpecs = [...(productForm.specifications || [])];
                                  const jenisIndex = newSpecs.findIndex(s => s.label === 'Jenis Pakaian');
                                  if (jenisIndex >= 0) {
                                    newSpecs[jenisIndex].value = val;
                                  } else {
                                    newSpecs.push({ label: 'Jenis Pakaian', value: val });
                                  }
                                  setProductForm({
                                    ...productForm,
                                    category: val,
                                    sub_category: val,
                                    specifications: newSpecs
                                  } as any);
                                }}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 bg-white font-medium"
                              >
                                <option value="kaos">Kaos / T-Shirt (Atasan)</option>
                                <option value="hoodie">Hoodie / Pullover (Atasan)</option>
                                <option value="sweater">Sweater / Crewneck (Atasan)</option>
                                <option value="kemeja">Kemeja / Flannel (Atasan)</option>
                                <option value="jaket">Jaket & Outerwear (Atasan)</option>
                                <option value="celana-panjang">Celana Panjang / Cargo / Trousers (Bawahan)</option>
                                <option value="celana-pendek">Celana Pendek / Shorts (Bawahan)</option>
                                <option value="rok-dress">Rok & Dress (Bawahan)</option>
                                <option value="aksesoris">Aksesoris / Headwear & Bags</option>
                                <option value="unisex">Unisex / Couple Set</option>
                                <option value="archive">Arsip / Studio Edition</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Custom Badge Text (Overlay Label)</label>
                        <span className="text-[9px] text-gray-400 italic">Overrides default title badge</span>
                      </div>
                      <input
                        type="text"
                        value={productForm.badge_text || ''}
                        onChange={(e) => setProductForm({ ...productForm, badge_text: e.target.value })}
                        placeholder="Type custom text or pick preset..."
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 mb-2"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {(isFnB ? 
                          ['FRESH ROAST', 'ARTISAN BLEND', 'DAILY FRESH', 'SINGLE ORIGIN', 'BEST SELLER', 'LIMITED EDITION', 'RECOMMENDED'] : 
                         isObjects ? 
                          ['HOME EDITION', 'STUDIO CRAFT', 'HANDMADE', 'BEST SELLER', 'LIMITED EDITION', 'NEW ARRIVAL'] :
                          ['BEST SELLER', 'NEW ARRIVAL', 'LIMITED EDITION', 'EXCLUSIVE', 'PREMIUM QUALITY', 'ORIGINAL DESIGN', 'STUDIO EDITION']
                        ).map(preset => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setProductForm({ ...productForm, badge_text: preset })}
                            className={cn(
                              "px-2 py-1 text-[9px] uppercase tracking-wider font-medium rounded border transition-all",
                              productForm.badge_text === preset 
                                ? "bg-rose text-white border-rose shadow-sm" 
                                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
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

                    {/* CUSTOM VARIANT LABEL (untuk mengganti "Pilih Warna" pada halaman produk) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Label Varian Kustom (Opsional)</label>
                        <span className="text-[9px] text-gray-400 italic">Ganti teks &ldquo;Pilih Warna&rdquo; di halaman toko</span>
                      </div>
                      <input
                        type="text"
                        value={productForm.variant_label || ''}
                        onChange={(e) => setProductForm({ ...productForm, variant_label: e.target.value })}
                        placeholder="Kosongkan untuk default (Pilih Warna). Contoh: Tech Deck Series, Motif, Aksen..."
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 mb-2"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {(isFnB
                          ? ['Blend', 'Roast Profile', 'Varian Rasa', 'Origin']
                          : isObjects
                          ? ['Series', 'Motif', 'Aksen', 'Varian Model', 'Edisi']
                          : ['Warna', 'Motif', 'Series', 'Edisi', 'Aksen']
                        ).map(preset => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setProductForm({ ...productForm, variant_label: preset })}
                            className={cn(
                              "px-2 py-1 text-[9px] uppercase tracking-wider font-medium rounded border transition-all",
                              productForm.variant_label === preset
                                ? "bg-rose text-white border-rose shadow-sm"
                                : "bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100"
                            )}
                          >
                            {preset}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setProductForm({ ...productForm, variant_label: '' })}
                          className="px-2 py-1 text-[9px] uppercase tracking-wider font-medium rounded border border-gray-200 bg-white text-red-500 hover:bg-red-50 hover:border-red-200 transition-all ml-auto"
                        >
                          Reset Default
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Deskripsi Produk (Bahasa Indonesia)</label>
                      <textarea
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 min-h-[90px] leading-relaxed"
                        placeholder="Deskripsi lengkap mengenai bahan, keunggulan, atau catatan rasa..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1 font-semibold">Description (English)</label>
                      <textarea
                        value={productForm.description_en || ''}
                        onChange={(e) => setProductForm({ ...productForm, description_en: e.target.value })}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 min-h-[90px] leading-relaxed"
                        placeholder="Product description in English..."
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Spesifikasi Detail (Key-Value Table)</label>
                        <button
                          type="button"
                          onClick={() => setProductForm({ ...productForm, specifications: [...(productForm.specifications || []), { label: '', value: '' }] })}
                          className="text-[10px] uppercase tracking-wider text-rose hover:text-rose/80 font-bold flex items-center gap-1"
                        >
                          <span>+</span> Add Spec
                        </button>
                      </div>
                      <div className="space-y-2">
                        {productForm.specifications?.map((spec, idx) => {
                          if (spec.label.startsWith('ColorImage:') || spec.label.startsWith('ColorP') || spec.label === 'GlobalP5') return null;
                          return (
                          <div key={idx} className="flex gap-2 items-start">
                            <input
                              type="text"
                              placeholder={isFnB ? "e.g. Origin / Variety" : "e.g. Material"}
                              value={spec.label}
                              onChange={(e) => {
                                const newSpecs = [...productForm.specifications];
                                newSpecs[idx].label = e.target.value;
                                setProductForm({ ...productForm, specifications: newSpecs });
                              }}
                              className="w-1/3 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 font-medium"
                            />
                            <input
                              type="text"
                              placeholder={isFnB ? "e.g. Priangan West Java / Arabica" : "e.g. 100% Cotton"}
                              value={spec.value}
                              onChange={(e) => {
                                const newSpecs = [...productForm.specifications];
                                newSpecs[idx].value = e.target.value;
                                setProductForm({ ...productForm, specifications: newSpecs });
                              }}
                              className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newSpecs = productForm.specifications.filter((_, i) => i !== idx);
                                setProductForm({ ...productForm, specifications: newSpecs });
                              }}
                              className="p-1.5 text-gray-400 hover:text-rose hover:bg-rose/5 rounded transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          );
                        })}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (isFnB) {
                              setProductForm({
                                ...productForm,
                                specifications: [
                                  { label: 'Origin', value: 'Priangan West Java' },
                                  { label: 'Varietas', value: 'Arabica' },
                                  { label: 'Roast Level', value: 'Medium Roast' },
                                  { label: 'Process', value: 'Natural / Washed' },
                                  { label: 'Tasting Notes', value: 'Caramel, Dark Chocolate, Floral Hint' },
                                  { label: 'Berat Bersih', value: '200g / 500g / 1kg' },
                                  { label: 'Kemasan', value: 'Resealable Standing Pouch' },
                                  { label: 'Saran Penyajian', value: 'Suhu air 90-93°C, rasio 1:15' },
                                  { label: 'Asal Produksi', value: 'Roasted in Bandung, Indonesia' },
                                  { label: 'Garansi Kualitas', value: '100% Original NINOC Roastery' },
                                ]
                              });
                            } else if (isObjects) {
                              setProductForm({
                                ...productForm,
                                specifications: [
                                  { label: 'Material', value: 'High-Grade Ceramic / Solid Wood' },
                                  { label: 'Finishing', value: 'Matte / Glazed' },
                                  { label: 'Dimensi', value: '10cm x 8cm x 12cm' },
                                  { label: 'Berat', value: '350g' },
                                  { label: 'Perawatan', value: 'Cuci tangan disarankan, Jangan gunakan serat kasar' },
                                  { label: 'Asal Produksi', value: 'Made in Bandung, Indonesia' },
                                  { label: 'Garansi Kualitas', value: '100% Original NINOC Studio' },
                                ]
                              });
                            } else {
                              const isCelana = productForm.category === 'celana';
                              const isHoodie = productForm.category === 'hoodie' || productForm.category === 'outer' || productForm.category === 'jaket';
                              setProductForm({
                                ...productForm,
                                specifications: isCelana ? [
                                  { label: 'Bahan', value: 'Cotton Twill 320gsm' },
                                  { label: 'Fit', value: 'Relaxed Fit' },
                                  { label: 'Kancing/Resleting', value: 'YKK Zipper' },
                                  { label: 'Kantong', value: '2 Samping & 2 Belakang' },
                                  { label: 'Detail', value: 'Waistband Adjustable, Belt Loop' },
                                  { label: 'Perawatan', value: 'Cuci mesin air dingin, Jangan gunakan pemutih' },
                                  { label: 'Jenis Produk', value: 'Celana / Trousers' },
                                  { label: 'Asal Produksi', value: 'Made in Bandung, Indonesia' },
                                  { label: 'Garansi Kualitas', value: '100% Original NINOC Studio' },
                                ] : isHoodie ? [
                                  { label: 'Bahan', value: 'Cotton Fleece 360gsm' },
                                  { label: 'Kerah', value: 'Hood / Hoodie' },
                                  { label: 'Fit', value: 'Oversize Fit' },
                                  { label: 'Design', value: 'Front & Back Graphic Artwork' },
                                  { label: 'Sablon', value: 'High-Quality DTF' },
                                  { label: 'Detail', value: 'Kangaroo Pocket, Drawstring Hood' },
                                  { label: 'Perawatan', value: 'Cuci mesin air dingin, Jangan gunakan pemutih' },
                                  { label: 'Jenis Produk', value: 'Hoodie / Outer' },
                                  { label: 'Asal Produksi', value: 'Made in Bandung, Indonesia' },
                                  { label: 'Garansi Kualitas', value: '100% Original NINOC Studio' },
                                ] : [
                                  { label: 'Bahan', value: '100% Cotton Combed 24s' },
                                  { label: 'Kerah', value: 'O-Neck' },
                                  { label: 'Fit', value: 'Regular Fit' },
                                  { label: 'Design', value: 'Front & Back Graphic Artwork' },
                                  { label: 'Motif', value: 'Design Art Illustration' },
                                  { label: 'Sablon', value: 'High-Quality DTF' },
                                  { label: 'Perawatan', value: 'Cuci mesin air dingin, Setrika suhu sedang' },
                                  { label: 'Jenis Produk', value: 'Kaos / Graphic Tee' },
                                  { label: 'Asal Produksi', value: 'Made in Bandung, Indonesia' },
                                  { label: 'Garansi Kualitas', value: '100% Original NINOC Studio' },
                                ]
                              });
                            }
                          }}
                          className="text-[10px] px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors border border-gray-200 shadow-2xs"
                        >
                          ⚡ Auto-Fill Preset ({isFnB ? 'F&B Roastery' : isObjects ? 'Objects & Home' : productForm.category === 'celana' ? 'Celana' : productForm.category === 'hoodie' || productForm.category === 'outer' || productForm.category === 'jaket' ? 'Hoodie / Outer' : 'Atasan / Kaos'})
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* ===== STEP 5: MEASUREMENT / SIZE CHART & MODEL INFO (ONLY FOR FASHION PILLAR!) ===== */}
                  {isFashion && (
                    <div className="bg-white p-3.5 rounded-xl border border-gray-200/80 shadow-sm space-y-3">
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Measurement / Size Chart Garment (CM)</label>
                          <button
                            type="button"
                            onClick={() => setProductForm({ ...productForm, measurements: [...(productForm.measurements || []), { size: '', chest: '', length: '' }] })}
                            className="text-[10px] uppercase tracking-wider text-rose hover:text-rose/80 font-bold"
                          >
                            + Add Size Row
                          </button>
                        </div>
                        {(productForm.measurements?.length || 0) > 0 && (
                          <div className="space-y-2">
                            {productForm.category === 'celana' ? (
                              <div className="grid grid-cols-[1fr_1fr_1fr_1fr_40px] gap-2 text-[9px] uppercase tracking-wider text-gray-400 font-medium px-1">
                                <span>Size</span>
                                <span>Waist (cm)</span>
                                <span>Length (cm)</span>
                                <span>Leg (cm)</span>
                                <span></span>
                              </div>
                            ) : (
                              <div className="grid grid-cols-[1fr_1fr_1fr_40px] gap-2 text-[9px] uppercase tracking-wider text-gray-400 font-medium px-1">
                                <span>Size</span>
                                <span>Chest (cm)</span>
                                <span>Length (cm)</span>
                                <span></span>
                              </div>
                            )}
                            
                            {productForm.measurements?.map((m, idx) => (
                              <div key={idx} className={cn("grid gap-2 items-center", productForm.category === 'celana' ? "grid-cols-[1fr_1fr_1fr_1fr_40px]" : "grid-cols-[1fr_1fr_1fr_40px]")}>
                                <input
                                  type="text"
                                  placeholder="e.g. S / 32"
                                  value={m.size}
                                  onChange={(e) => {
                                    const newM = [...productForm.measurements];
                                    newM[idx] = { ...newM[idx], size: e.target.value };
                                    setProductForm({ ...productForm, measurements: newM });
                                  }}
                                  className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50 font-medium"
                                />
                                {productForm.category === 'celana' ? (
                                  <>
                                    <input
                                      type="text"
                                      placeholder="Waist"
                                      value={m.waist || ''}
                                      onChange={(e) => {
                                        const newM = [...productForm.measurements];
                                        newM[idx] = { ...newM[idx], waist: e.target.value };
                                        setProductForm({ ...productForm, measurements: newM });
                                      }}
                                      className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Length"
                                      value={m.length || ''}
                                      onChange={(e) => {
                                        const newM = [...productForm.measurements];
                                        newM[idx] = { ...newM[idx], length: e.target.value };
                                        setProductForm({ ...productForm, measurements: newM });
                                      }}
                                      className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Leg"
                                      value={m.leg_opening || ''}
                                      onChange={(e) => {
                                        const newM = [...productForm.measurements];
                                        newM[idx] = { ...newM[idx], leg_opening: e.target.value };
                                        setProductForm({ ...productForm, measurements: newM });
                                      }}
                                      className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50"
                                    />
                                  </>
                                ) : (
                                  <>
                                    <input
                                      type="text"
                                      placeholder="Chest"
                                      value={m.chest || ''}
                                      onChange={(e) => {
                                        const newM = [...productForm.measurements];
                                        newM[idx] = { ...newM[idx], chest: e.target.value };
                                        setProductForm({ ...productForm, measurements: newM });
                                      }}
                                      className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50"
                                    />
                                    <input
                                      type="text"
                                      placeholder="Length"
                                      value={m.length || ''}
                                      onChange={(e) => {
                                        const newM = [...productForm.measurements];
                                        newM[idx] = { ...newM[idx], length: e.target.value };
                                        setProductForm({ ...productForm, measurements: newM });
                                      }}
                                      className="px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50"
                                    />
                                  </>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newM = productForm.measurements.filter((_, i) => i !== idx);
                                    setProductForm({ ...productForm, measurements: newM });
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-rose hover:bg-rose/5 rounded transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {productForm.category === 'celana' 
                            ? [['28','76','100','38'],['30','81','100','40'],['32','86','102','42'],['34','91','102','44'],['36','96','104','46'],['38','101','104','48']].map(([sz, w, l, leg]) => {
                                const exists = productForm.measurements?.some(m => m.size === sz);
                                return (
                                  <button
                                    key={sz}
                                    type="button"
                                    disabled={!!exists}
                                    onClick={() => setProductForm({ ...productForm, measurements: [...(productForm.measurements || []), { size: sz, waist: w, length: l, leg_opening: leg }] })}
                                    className="px-2 py-1 text-[9px] uppercase tracking-wider font-medium rounded border transition-all bg-gray-50 text-gray-500 border-gray-200 hover:border-rose hover:text-rose disabled:bg-gray-100 disabled:text-gray-300 disabled:border-gray-100 disabled:cursor-not-allowed"
                                  >
                                    + {sz}
                                  </button>
                                );
                              })
                            : [['S','94','68'],['M','100','70'],['L','106','72'],['XL','112','74'],['XXL','118','76']].map(([sz, ch, ln]) => {
                                const exists = productForm.measurements?.some(m => m.size === sz);
                                return (
                                  <button
                                    key={sz}
                                    type="button"
                                    disabled={!!exists}
                                    onClick={() => setProductForm({ ...productForm, measurements: [...(productForm.measurements || []), { size: sz, chest: ch, length: ln }] })}
                                    className="px-2 py-1 text-[9px] uppercase tracking-wider font-medium rounded border transition-all bg-gray-50 text-gray-500 border-gray-200 hover:border-rose hover:text-rose disabled:bg-gray-100 disabled:text-gray-300 disabled:border-gray-100 disabled:cursor-not-allowed"
                                  >
                                    + {sz}
                                  </button>
                                );
                              })
                          }
                        </div>
                      </div>

                      {/* ===== MODEL INFO ===== */}
                      <div className="pt-2 border-t border-gray-100">
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Model Info Garment (Optional)</label>
                        <input
                          type="text"
                          value={productForm.model_info || ''}
                          onChange={(e) => setProductForm({ ...productForm, model_info: e.target.value })}
                          placeholder="e.g. Model wearing Size M (175cm / 65kg)"
                          className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50"
                        />
                      </div>
                    </div>
                  )}

                  {(isObjects || isFnB) && (
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-lg space-y-1">
                          <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs">
                            <span>🎯 {isObjects ? 'Object & Consumer Goods' : 'Pantry & Cafe (F&B)'} — Unlimited Upload Gallery</span>
                          </div>
                          <p className="text-[10px] text-emerald-700 leading-relaxed">
                            Kategori ini mendukung upload foto tambahan tak terhingga (Unlimited Upload) untuk galeri produk secara lengkap.
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">Image URL</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="url"
                            value={productForm.image_url}
                            onChange={(e) => {
                              const val = e.target.value;
                              setProductForm(prev => ({ 
                                ...prev, 
                                image_url: val,
                                image_alt: prev.image_alt ? prev.image_alt : prev.name ? `${prev.name} - Official Product View` : val ? 'NINOC Official Product View' : ''
                              }));
                            }}
                            placeholder="https://..."
                            className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50"
                          />
                          <input
                            type="text"
                            value={productForm.image_alt || ''}
                            onChange={(e) => setProductForm({ ...productForm, image_alt: e.target.value })}
                            placeholder="Alt text (SEO)"
                            title="Teks Alternatif Gambar untuk SEO (contoh: Kaos Pria Hitam)"
                            className="w-1/3 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-rose/50"
                          />
                          <label className="relative flex items-center justify-center px-2 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] uppercase tracking-wider font-medium rounded-lg cursor-pointer transition-colors whitespace-nowrap">
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
                          {productForm.image_url && (
                            <button
                              type="button"
                              onClick={() => setProductForm(prev => ({ ...prev, image_url: '', image_alt: '' }))}
                              className="flex items-center justify-center px-2 py-1.5 bg-rose/10 hover:bg-rose/20 text-rose text-[10px] uppercase tracking-wider font-medium rounded-lg transition-colors whitespace-nowrap"
                              title="Hapus URL Gambar"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Additional Images — for product gallery navigation */}
                      <div className="space-y-3">
                        <label className="block text-[10px] uppercase tracking-wider text-gray-500">Additional Images (Gallery)</label>
                        {(['perspective1','perspective2','perspective3','perspective4', 'GlobalP5'] as const).map((field, idx) => {
                          const isP5 = field === 'GlobalP5';
                          const val = isP5 ? productForm.specifications?.find(s => s.label === 'GlobalP5')?.value || '' : (productForm as any)[field] || '';
                          const descLabel = `ImageDesc_P${idx + 1}`;
                          return (
                          <div key={field} className="flex flex-col gap-1.5 w-full bg-gray-50/40 p-2 rounded-lg border border-gray-100">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-gray-400 w-6 shrink-0 text-right">P{idx + 1}</span>
                              <input
                                type="url"
                                value={val}
                                onChange={(e) => {
                                  if (isP5) {
                                    const newSpecs = [...(productForm.specifications || [])];
                                    const specIdx = newSpecs.findIndex(s => s.label === 'GlobalP5');
                                    if (specIdx >= 0) newSpecs[specIdx].value = e.target.value;
                                    else newSpecs.push({ label: 'GlobalP5', value: e.target.value });
                                    setProductForm({ ...productForm, specifications: newSpecs });
                                  } else {
                                    setProductForm({ ...productForm, [field]: e.target.value });
                                  }
                                }}
                                placeholder={`https://... (${idx + 1}/${idx + 2}/front/back)`}
                                className="flex-1 px-1.5 py-1 border border-gray-200 rounded text-[10px] focus:outline-none focus:border-rose/50"
                              />
                              <label className="relative flex items-center justify-center px-1.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-[9px] uppercase tracking-wider font-medium rounded cursor-pointer transition-colors whitespace-nowrap">
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
                                      const compressedFile = await compressImage(file);
                                      const formData = new FormData();
                                      formData.append('files', compressedFile);
                                      formData.append('bucket', 'products');
                                      const res = await fetch('/api/admin/upload-images', {
                                        method: 'POST',
                                        body: formData
                                      });
                                      const data = await res.json();
                                      if (!res.ok || data.error || !data.results?.[0]?.url) {
                                        throw new Error(data.error || 'Upload failed');
                                      }
                                      if (isP5) {
                                        const newSpecs = [...(productForm.specifications || [])];
                                        const specIdx = newSpecs.findIndex(s => s.label === 'GlobalP5');
                                        if (specIdx >= 0) newSpecs[specIdx].value = data.results[0].url;
                                        else newSpecs.push({ label: 'GlobalP5', value: data.results[0].url });
                                        setProductForm({ ...productForm, specifications: newSpecs });
                                      } else {
                                        setProductForm(prev => ({ ...prev, [field]: data.results[0].url }));
                                      }
                                    } catch (err) {
                                      alert('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
                                    } finally {
                                      setIsUploadingProductImage(false);
                                    }
                                  }}
                                  disabled={isUploadingProductImage}
                                />
                              </label>
                              {val && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isP5) {
                                      const newSpecs = [...(productForm.specifications || [])];
                                      const specIdx = newSpecs.findIndex(s => s.label === 'GlobalP5');
                                      if (specIdx >= 0) {
                                        newSpecs.splice(specIdx, 1);
                                        setProductForm({ ...productForm, specifications: newSpecs });
                                      }
                                    } else {
                                      setProductForm({ ...productForm, [field]: '' });
                                    }
                                  }}
                                  className="flex items-center justify-center px-1.5 py-1 bg-rose/10 hover:bg-rose/20 text-rose text-[9px] uppercase tracking-wider font-medium rounded transition-colors whitespace-nowrap"
                                  title="Hapus Gambar"
                                >
                                  X
                                </button>
                              )}
                            </div>
                          </div>
                          );
                        })}
                      </div>

                      {/* ===== UNLIMITED EXTRA GALLERY IMAGES (OBJECTS & F&B) ===== */}
                      {(isObjects || isFnB) && (
                        <div className="space-y-3 pt-3 border-t border-emerald-100 mt-2">
                          <div className="flex items-center justify-between">
                            <div>
                              <label className="block text-[10px] uppercase tracking-wider text-emerald-800 font-bold">
                                Foto Tambahan Tak Terhingga (Unlimited Gallery & Descriptions)
                              </label>
                              <p className="text-[9px] text-gray-500">
                                Tambahkan foto sebanyak yang diperlukan untuk detail lengkap produk.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const currentSpecs = [...(productForm.specifications || [])];
                                const existingIndices = currentSpecs
                                  .filter(s => s.label && s.label.startsWith('ExtraImage_'))
                                  .map(s => parseInt(s.label.replace('ExtraImage_', ''), 10) || 0);
                                const nextIdx = existingIndices.length > 0 ? Math.max(...existingIndices) + 1 : 1;
                                currentSpecs.push({ label: `ExtraImage_${nextIdx}`, value: '' });
                                setProductForm(prev => ({ ...prev, specifications: currentSpecs }));
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                            >
                              + Tambah Foto Tak Terhingga
                            </button>
                          </div>

                          <div className="space-y-3">
                            {(productForm.specifications || [])
                              .filter(s => s.label && s.label.startsWith('ExtraImage_'))
                              .sort((a, b) => {
                                const numA = parseInt(a.label.replace('ExtraImage_', ''), 10) || 0;
                                const numB = parseInt(b.label.replace('ExtraImage_', ''), 10) || 0;
                                return numA - numB;
                              })
                              .map((spec, index) => {
                                const idxNum = spec.label.replace('ExtraImage_', '');
                                const descSpec = productForm.specifications?.find(s => s.label === `ExtraImageDesc_${idxNum}`);
                                return (
                                  <div key={spec.label} className="flex flex-col gap-1.5 w-full bg-emerald-50/30 p-2.5 rounded-lg border border-emerald-200/50">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[9px] font-bold text-emerald-800 w-14 shrink-0">
                                        Extra #{index + 1}
                                      </span>
                                      <input
                                        type="url"
                                        value={spec.value || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          const newSpecs = [...(productForm.specifications || [])];
                                          const idx = newSpecs.findIndex(s => s.label === spec.label);
                                          if (idx >= 0) newSpecs[idx].value = val;
                                          setProductForm(prev => ({ ...prev, specifications: newSpecs }));
                                        }}
                                        placeholder="https://... URL Foto Tambahan"
                                        className="flex-1 px-2 py-1 bg-white border border-gray-200 rounded text-[10px] focus:outline-none focus:border-emerald-500"
                                      />
                                      <label className="relative flex items-center justify-center px-2 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-[9px] uppercase tracking-wider font-medium rounded cursor-pointer transition-colors whitespace-nowrap">
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
                                              const compressedFile = await compressImage(file);
                                              const formData = new FormData();
                                              formData.append('files', compressedFile);
                                              formData.append('bucket', 'products');
                                              const res = await fetch('/api/admin/upload-images', {
                                                method: 'POST',
                                                body: formData
                                              });
                                              const data = await res.json();
                                              if (!res.ok || data.error || !data.results?.[0]?.url) {
                                                throw new Error(data.error || 'Upload failed');
                                              }
                                              const newSpecs = [...(productForm.specifications || [])];
                                              const idx = newSpecs.findIndex(s => s.label === spec.label);
                                              if (idx >= 0) newSpecs[idx].value = data.results[0].url;
                                              setProductForm(prev => ({ ...prev, specifications: newSpecs }));
                                            } catch (err) {
                                              alert('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
                                            } finally {
                                              setIsUploadingProductImage(false);
                                            }
                                          }}
                                          disabled={isUploadingProductImage}
                                        />
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newSpecs = (productForm.specifications || []).filter(
                                            s => s.label !== spec.label && s.label !== `ExtraImageDesc_${idxNum}`
                                          );
                                          setProductForm(prev => ({ ...prev, specifications: newSpecs }));
                                        }}
                                        className="flex items-center justify-center px-2 py-1 bg-rose/10 hover:bg-rose/20 text-rose text-[9px] uppercase tracking-wider font-medium rounded transition-colors whitespace-nowrap"
                                        title="Hapus Foto Ini"
                                      >
                                        Hapus
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}


                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <h4 className="text-xs font-medium text-gray-900">Featured Product</h4>
                        <p className="text-xs text-gray-500">Show this product on the home page</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProductForm({ ...productForm, is_featured: !productForm.is_featured })}
                        className={cn("text-2xl transition-colors", productForm.is_featured ? "text-rose" : "text-gray-300")}
                      >
                        {productForm.is_featured ? (
                          <ToggleRight className="fill-current" />
                        ) : (
                          <ToggleLeft />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-100">
                      <div>
                        <h4 className="text-xs font-medium text-gray-900">Affiliate Eligible</h4>
                        <p className="text-xs text-gray-500">Allow affiliates to earn commission on this product</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setProductForm({ ...productForm, affiliate_eligible: !productForm.affiliate_eligible })}
                        className={cn("text-2xl transition-colors", productForm.affiliate_eligible ? "text-green-500" : "text-gray-300")}
                      >
                        {productForm.affiliate_eligible ? (
                          <ToggleRight className="fill-current" />
                        ) : (
                          <ToggleLeft />
                        )}
                      </button>
                    </div>
                  </div>

                {/* Variants Grouped by Color */}
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-medium text-gray-900 uppercase tracking-wide">Variants & Stock</h3>
                    <button
                      type="button"
                      onClick={() => {
                        if (!productForm.name) {
                          showToast('Please enter a product name first before generating SKUs.', 'error');
                          return;
                        }
                        // e.g. Category: celana -> CLN, pakaian -> PKA
                        const catCode = productForm.category === 'celana' ? 'CLN' : productForm.category === 'pakaian' ? 'KAS' : productForm.category.substring(0,3).toUpperCase();
                        // Product Name: "Cargo Pants" -> "CARG", plus 3 random digits -> "CARG842"
                        const baseName = productForm.name.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase();
                        // Generate a pseudo-random 3-digit sequence based on the product name so it's consistent for variants of the same product
                        let hash = 0;
                        for (let i = 0; i < productForm.name.length; i++) {
                          hash = productForm.name.charCodeAt(i) + ((hash << 5) - hash);
                        }
                        const uniqueNum = Math.abs(hash % 900) + 100; // 100 to 999
                        const nameCode = `${baseName}${uniqueNum}`;
                        
                        const newVariants = productForm.variants.map(v => {
                          const colorCode = (v.color || 'NON').substring(0, 3).toUpperCase();
                          const sizeCode = (v.size || 'OS').toUpperCase();
                          return { ...v, sku: `${catCode}-${nameCode}-${colorCode}-${sizeCode}` };
                        });
                        setProductForm({ ...productForm, variants: newVariants });
                        showToast(`Success: ${newVariants.length} SKUs generated automatically!`, 'success');
                      }}
                      className="px-3 py-1.5 bg-ink text-white text-[9px] uppercase tracking-wider font-medium rounded hover:bg-ink/80 transition-colors"
                    >
                      Auto-Generate SKUs
                    </button>
                  </div>

                  <div className="space-y-2">
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
                            <div key={group.originalIndices[0]} className="bg-gray-50 rounded-xl p-2 space-y-2 border border-gray-100">
                              <div className="flex items-center justify-between pb-3 border-b border-gray-200 flex-wrap gap-3">
                                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">{productForm.variant_label ? `${productForm.variant_label}:` : isFnB ? 'Varian / Blend:' : isObjects ? 'Varian Model / Series:' : 'Color / Warna:'}</span>
                                  <input
                                    type="text"
                                    value={group.color}
                                    placeholder="e.g. Black or Series Name"
                                    onChange={(e) => {
                                      const oldColor = group.color;
                                      const newColor = e.target.value;
                                      const newVariants = [...productForm.variants];
                                      group.originalIndices.forEach(idx => {
                                        newVariants[idx] = { ...newVariants[idx], color: newColor };
                                      });

                                      const newSpecs = [...(productForm.specifications || [])];
                                      if (oldColor && oldColor !== newColor) {
                                        newSpecs.forEach((s) => {
                                          if (s && typeof s.label === 'string') {
                                            const parts = s.label.split(':');
                                            if (parts.length >= 2 && parts.slice(1).join(':').trim().toLowerCase() === oldColor.trim().toLowerCase()) {
                                              s.label = `${parts[0]}:${newColor}`;
                                            }
                                          }
                                        });
                                      }

                                      setProductForm({ ...productForm, variants: newVariants, specifications: newSpecs });
                                    }}
                                    className="px-3 py-1.5 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:border-rose/50 font-medium text-ink w-48"
                                  />
                                </div>
                                <button
                                    onClick={() => {
                                      const newVariants = productForm.variants.filter((_, i) => !group.originalIndices.includes(i));
                                      setProductForm({ ...productForm, variants: newVariants });
                                    }}
                                    className="text-[10px] uppercase tracking-wider text-red-500 hover:text-red-700 font-medium"
                                  >
                                    Remove {productForm.variant_label || (isFnB ? 'Blend' : isObjects ? 'Varian' : 'Color')}
                                  </button>

                                <div className="mt-2 space-y-2">
                                  {(isFnB ? ['Image', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12', 'P13', 'P14', 'P15'] : ['Image', 'P1', 'P2', 'P3', 'P4', 'P5']).map((imgType) => {
                                    const colorSpecLabel = `Color${imgType}:${group.color}`;
                                    const colorDescLabel = `Color${imgType}Desc:${group.color}`;
                                    const colorSpec = productForm.specifications?.find(s =>
                                      s.label && s.label.trim().toLowerCase() === colorSpecLabel.trim().toLowerCase()
                                    ) || (
                                      colorGroups.length === 1
                                        ? productForm.specifications?.find(s => s.label && s.label.trim().toLowerCase().startsWith(`color${imgType.toLowerCase()}:`))
                                        : undefined
                                    );
                                    const descSpec = productForm.specifications?.find(s =>
                                      s.label && s.label.trim().toLowerCase() === colorDescLabel.trim().toLowerCase()
                                    ) || (
                                      colorGroups.length === 1
                                        ? productForm.specifications?.find(s => s.label && s.label.trim().toLowerCase().startsWith(`color${imgType.toLowerCase()}desc:`))
                                        : undefined
                                    );

                                    const fallbackImage = colorGroups.length === 1 ? (
                                      imgType === 'Image' ? productForm.image_url :
                                      imgType === 'P1' ? productForm.perspective1 :
                                      imgType === 'P2' ? productForm.perspective2 :
                                      imgType === 'P3' ? productForm.perspective3 :
                                      imgType === 'P4' ? productForm.perspective4 : undefined
                                    ) : undefined;

                                    const colorImage = colorSpec?.value || fallbackImage;
                                    const descValue = descSpec?.value || '';
                                    const labelDisplay = imgType === 'Image' ? 'Main Image' : `Gallery ${imgType}`;
                                    
                                    return (
                                      <div key={imgType} className="flex flex-col gap-1.5 w-full bg-white p-2 border border-gray-200 rounded text-xs">
                                        <div className="flex items-center gap-3 w-full">
                                          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium w-20">{labelDisplay}:</span>
                                          {colorImage && (
                                            <Image src={colorImage} alt={`${group.color} ${imgType}`} width={24} height={24} className="w-6 h-6 object-cover rounded shadow-sm border border-gray-100" unoptimized />
                                          )}
                                          <label className="relative flex items-center justify-center px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[9px] uppercase tracking-wider font-medium rounded cursor-pointer transition-colors whitespace-nowrap ml-auto">
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
                                                  const compressedFile = await compressImage(file);
                                                  const formData = new FormData();
                                                  formData.append('files', compressedFile);
                                                  formData.append('bucket', 'products');
                                                  const res = await fetch('/api/admin/upload-images', {
                                                    method: 'POST',
                                                    body: formData
                                                  });
                                                  const data = await res.json();
                                                  if (!res.ok || data.error || !data.results?.[0]?.url) {
                                                    throw new Error(data.error || 'Upload failed');
                                                  }
                                                  
                                                  const newSpecs = [...(productForm.specifications || [])];
                                                  const specIdx = newSpecs.findIndex(s => s.label === colorSpecLabel);
                                                  if (specIdx >= 0) {
                                                    newSpecs[specIdx].value = data.results[0].url;
                                                  } else {
                                                    newSpecs.push({ label: colorSpecLabel, value: data.results[0].url });
                                                  }
                                                  setProductForm(prev => ({ ...prev, specifications: newSpecs }));
                                                } catch (err) {
                                                  alert('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
                                                } finally {
                                                  setIsUploadingProductImage(false);
                                                }
                                              }}
                                              disabled={isUploadingProductImage}
                                            />
                                          </label>
                                          {colorImage && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const newSpecs = productForm.specifications?.filter(s => s.label !== colorSpecLabel) || [];
                                                setProductForm(prev => ({ ...prev, specifications: newSpecs }));
                                              }}
                                              className="p-1 text-gray-400 hover:text-rose transition-colors"
                                              title="Remove image"
                                            >
                                              <X size={14} />
                                            </button>
                                          )}
                                        </div>
                                        <input
                                          type="text"
                                          value={descValue}
                                          placeholder={`Deskripsi khusus foto ${labelDisplay} (opsional)`}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            const newSpecs = [...(productForm.specifications || [])];
                                            const specIdx = newSpecs.findIndex(s => s.label === colorDescLabel);
                                            if (val.trim() === '') {
                                              if (specIdx >= 0) newSpecs.splice(specIdx, 1);
                                            } else if (specIdx >= 0) {
                                              newSpecs[specIdx] = { label: colorDescLabel, value: val };
                                            } else {
                                              newSpecs.push({ label: colorDescLabel, value: val });
                                            }
                                            setProductForm(prev => ({ ...prev, specifications: newSpecs }));
                                          }}
                                          className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[10px] focus:outline-none focus:border-rose/50 text-ink"
                                        />
                                      </div>
                                    );
                                  })}
                                </div>

                                {/* Deskripsi Khusus Varian/Series ini */}
                                {(() => {
                                  const descSpecLabel = `ColorDesc:${group.color}`;
                                  const descSpec = productForm.specifications?.find(s => s.label === descSpecLabel);
                                  const descValue = descSpec?.value || '';
                                  return (
                                    <div className="mt-2.5 bg-white p-2.5 border border-gray-200 rounded-lg">
                                      <div className="flex items-center justify-between mb-1">
                                        <label className="block text-[9px] uppercase tracking-wider text-gray-500 font-semibold">
                                          Deskripsi / Catatan Khusus {productForm.variant_label || 'Varian/Series'} &ldquo;{group.color}&rdquo; (Opsional)
                                        </label>
                                        <span className="text-[8px] text-gray-400 italic">Muncul saat pembeli memilih varian ini di halaman toko</span>
                                      </div>
                                      <input
                                        type="text"
                                        value={descValue}
                                        placeholder="Contoh: Set 2pcs grafis Primitive api & Stereo skater biru lengkap dengan trucks & wheels..."
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          const newSpecs = [...(productForm.specifications || [])];
                                          const specIdx = newSpecs.findIndex(s => s.label === descSpecLabel);
                                          if (val.trim() === '') {
                                            if (specIdx >= 0) newSpecs.splice(specIdx, 1);
                                          } else if (specIdx >= 0) {
                                            newSpecs[specIdx] = { label: descSpecLabel, value: val };
                                          } else {
                                            newSpecs.push({ label: descSpecLabel, value: val });
                                          }
                                          setProductForm(prev => ({ ...prev, specifications: newSpecs }));
                                        }}
                                        className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs focus:outline-none focus:border-rose/50 focus:bg-white transition-all text-ink"
                                      />
                                    </div>
                                  );
                                })()}

                              <div className="pt-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  {Array.from(new Set([
                                    ...(isFnB ? ['250G', '500G', '1000G', 'SINGLE PACK', 'BOX OF 6', 'BOX OF 12', '1 LITRE', 'REGULAR'] :
                                        isObjects ? ['REGULAR', 'LARGE', 'SET OF 2', 'SET OF 4', 'SINGLE', 'BUNDLE', 'ONE SIZE'] :
                                        ['S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', 'ONE SIZE']),
                                    ...group.originalIndices.map(i => productForm.variants[i].size).filter(Boolean)
                                  ])).map(size => {
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
                                          "px-2 py-1 text-xs font-medium rounded border transition-colors uppercase",
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
                                    className="px-1.5 py-1 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:border-rose/50 w-36"
                                  />
                                </div>
                                
                                {group.originalIndices.length > 0 && (
                                  <div className="flex flex-col gap-2 border-t border-gray-200 pt-3 mt-3">
                                      <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Set Stock Quantities & SKU:</span>
                                      {group.originalIndices.slice().sort((a, b) => {
                                        const SIZE_ORDER = ['250G', '500G', '1000G', 'SINGLE PACK', 'BOX OF 6', 'BOX OF 12', '1 LITRE', 'REGULAR', 'LARGE', 'SET OF 2', 'SET OF 4', 'SINGLE', 'BUNDLE', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL', 'ONE SIZE', '28', '30', '32', '34', '36', '38', '40', '42'];
                                      const sizeA = productForm.variants[a].size || '';
                                      const sizeB = productForm.variants[b].size || '';
                                      const idxA = SIZE_ORDER.indexOf(sizeA.toUpperCase());
                                      const idxB = SIZE_ORDER.indexOf(sizeB.toUpperCase());
                                      if (idxA === -1 && idxB === -1) return sizeA.localeCompare(sizeB);
                                      if (idxA === -1) return 1;
                                      if (idxB === -1) return -1;
                                      return idxA - idxB;
                                    }).map(idx => {
                                      const variant = productForm.variants[idx];
                                      return (
                                        <div key={idx} className="flex items-center justify-between bg-white px-1.5 py-1 border border-gray-200 rounded-lg">
                                            <span className="text-xs font-medium text-gray-700 w-16">Size {variant.size}</span>
                                            <div className="flex-1 flex items-center gap-3 justify-end">
                                               <div className="flex items-center gap-1.5 flex-1 max-w-[200px]">
                                                 <span className="text-[9px] text-gray-400 font-medium uppercase tracking-widest">SKU</span>
                                                 <input
                                                   type="text"
                                                   placeholder="Auto/Manual"
                                                   value={variant.sku || ''}
                                                   onChange={(e) => {
                                                     const newVariants = [...productForm.variants];
                                                     newVariants[idx] = { ...newVariants[idx], sku: e.target.value.toUpperCase() };
                                                     setProductForm({ ...productForm, variants: newVariants });
                                                   }}
                                                   className="w-full px-2 py-1.5 text-[10px] border border-gray-200 rounded font-mono focus:border-rose/50 outline-none placeholder:text-gray-300"
                                                 />
                                               </div>
                                               <div className="w-px h-6 bg-gray-200" />
                                               <div className="flex items-center gap-1.5">
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
                                                   className="w-16 px-2 py-1.5 text-xs border border-gray-300 rounded text-center focus:border-rose/50 outline-none font-medium"
                                                 />
                                               </div>
                                            </div>
                                          </div>  );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          
                          <button
                            type="button"
                            onClick={() => {
                              const uniqueSuffix = Date.now().toString().slice(-4);
                              setProductForm({
                                ...productForm,
                                variants: [...productForm.variants, { id: '', size: isFnB ? '250G' : isObjects ? 'REGULAR' : 'New Size', color: isFnB ? `Blend ${uniqueSuffix}` : isObjects ? `Model ${uniqueSuffix}` : `Color ${uniqueSuffix}`, stock_quantity: 0 }]
                              });
                            }}
                            className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider text-gray-500 hover:border-rose/50 hover:text-rose transition-colors bg-white font-medium"
                          >
                            <Plus size={14} /> Add New {isFnB ? 'Varian / Blend' : isObjects ? 'Varian Model' : 'Color Variant'}
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex-shrink-0 bg-white px-2 py-1.5 border-t border-gray-100 flex items-center justify-end gap-3 z-10">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveProduct}
                  className="px-2 py-1 text-xs bg-rose text-white rounded hover:bg-rose/90 flex items-center gap-2"
                >
                  <Save size={16} />
                  <span className="text-[10px] uppercase tracking-wider">{isEditMode ? 'Update Product' : 'Save Product'}</span>
                </button>
              </div>
            </motion.div>

              {/* OUTSIDE SEO PANEL */}
              <AnimatePresence>
                {isSeoPanelOpen && (
                  <motion.div
                    layout
                    initial={{ width: 0, opacity: 0, x: 20 }}
                    animate={{ width: 480, opacity: 1, x: 0 }}
                    exit={{ width: 0, opacity: 0, x: 20 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.4 }}
                    style={{ maxWidth: '100%' }}
                    className="absolute lg:static inset-0 z-[60] lg:z-auto flex flex-col bg-gray-50 rounded-2xl shadow-xl ring-1 ring-ink/5 overflow-hidden flex-shrink-0 lg:ml-2 max-h-[90vh]"
                  >
                     <div className="bg-white px-5 py-4 border-b border-ink/5 flex items-center justify-between z-10 flex-shrink-0">
                       <div className="flex flex-col">
                         <h3 className="text-sm font-semibold text-ink tracking-tight flex items-center gap-2">
                           <Search size={14} className="text-rose" />
                           SEO & Discovery
                         </h3>
                         <p className="text-[10px] text-ink/50 uppercase tracking-wider mt-0.5">Optimize search ranking</p>
                       </div>
                       <button onClick={() => setIsSeoPanelOpen(false)} className="p-2 text-ink/50 hover:text-ink hover:bg-ink/5 rounded-full transition-colors">
                         <PanelRightClose size={16} />
                       </button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-2 lg:p-3 w-full lg:w-[480px]">
                        <SeoHelper
                          name={productForm.name}
                          slug={productForm.slug}
                          description={productForm.description}
                          category={productForm.category}
                          price={productForm.price}
                          imageUrl={productForm.image_url || ''}
                          seoKeywords={dbCategories.find(c => c.slug === productForm.category)?.seo_keywords}
                          seoTitleTemplate={dbCategories.find(c => c.slug === productForm.category)?.seo_title_template}
                          onApplyTitle={(title) => handleProductNameChange(title)}
                          onApplySlug={(s) => setProductForm(prev => ({ ...prev, slug: s }))}
                          onApplyDescription={(desc) => setProductForm(prev => ({ ...prev, description: desc }))}
                        />
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
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
