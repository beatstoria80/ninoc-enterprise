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
  Upload, Printer, ChevronDown, ChevronUp, Bell, ChevronLeft, ChevronRight, Filter
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============ TYPES ============
type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
type PaymentStatus = 'pending' | 'success' | 'failed' | 'expired';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  specifications?: { label: string; value: string }[] | null;
  price: number;
  category: string;
  image_url: string | null;
  perspective1?: string | null;
  perspective2?: string | null;
  perspective3?: string | null;
  perspective4?: string | null;
  is_featured: boolean;
  price_tag?: string | null;
  badge_text?: string | null;
  created_at: string;
  variants?: Variant[];
}

interface Variant {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  stock_quantity: number;
}

interface Order {
  id: string;
  user_id: string | null;
  total_price: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  midtrans_id: string | null;
  snap_token: string | null;
  shipping_address: ShippingAddress | null;
  courier: string | null;
  tracking_id: string | null;
  created_at: string;
  order_items?: OrderItem[];
}

interface OrderItem {
  id: string;
  product_id: string;
  product_name?: string;
  variant_id: string | null;
  size?: string;
  quantity: number;
  price_at_purchase: number;
}

interface ShippingAddress {
  name: string;
  phone: string;
  address: string;
  city: string;
  province?: string;
  postal_code: string;
}

interface FinanceSummary {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  pendingPayments: number;
  completedOrders: number;
}

interface ProductCosting {
  id: string;
  product_id: string;
  supplier_cost: number;
  shipping_cost: number;
  packaging_cost: number;
  operasional_pct: number;
  tax_rate: number;
  courier_regency_cost: number;
  courier_inter_regency_cost: number;
  courier_same_day_cost: number;
  courier_instant_cost: number;
  target_margin_pct: number;
  selling_price: number;
}

interface SupplierCostLog {
  id: string;
  product_id: string;
  product_name?: string;
  old_supplier_cost: number;
  new_supplier_cost: number;
  change_reason: string;
  changed_at: string;
}

interface PromoImpact {
  id: string;
  product_id: string;
  product_name?: string;
  promo_name: string;
  discount_pct: number;
  discount_amount: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
}

interface ChatMessage {
  id: string;
  sender: 'customer' | 'admin';
  message: string;
  timestamp: string;
  is_read: boolean;
}

interface ChatSession {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_avatar?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  status: 'open' | 'resolved';
  messages: ChatMessage[];
}

interface Customer {
  id: string;
  user_id: string;
  customer_number: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  avatar_url: string | null;
  street: string;
  house_number: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  city: string;
  province: string;
  postal_code: string;
  country: string | null;
  is_verified: boolean | null;
  total_orders: number | null;
  total_spent: number | null;
  membership_tier: string | null;
  created_at: string;
}

// ============ SIDEBAR COMPONENT ============
const SidebarItem = ({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
  subItems
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
  subItems?: { label: string; id: string; active?: boolean; onClick?: () => void }[];
}) => {
  const [isOpen, setIsOpen] = useState(active || false);
  const hasSub = subItems && subItems.length > 0;

  return (
    <div className="w-full">
      <button
        onClick={() => {
          if (hasSub) setIsOpen(!isOpen);
          else if (onClick) onClick();
        }}
        className={cn(
          "w-full flex items-center justify-between px-6 py-3 transition-all duration-200 border-b border-ink/5",
          active ? "bg-rose text-white" : "text-ink/50 hover:bg-ink/5 hover:text-ink"
        )}
      >
        <div className="flex items-center gap-3">
          <Icon size={16} className={cn(active ? "text-white" : "text-current")} />
          <span className="text-[10px] font-medium uppercase tracking-[0.3em]">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {badge !== undefined && badge > 0 && (
            <span className={cn(
              "text-[8px] px-2 py-0.5 rounded-full",
              active ? "bg-white/20 text-white" : "bg-rose/10 text-rose"
            )}>
              {badge}
            </span>
          )}
          {hasSub && (
            isOpen ? <ChevronUp size={14} className={cn(active ? "text-white" : "text-ink/50")} /> : <ChevronDown size={14} className={cn(active ? "text-white" : "text-ink/50")} />
          )}
        </div>
      </button>
      {hasSub && (
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-ink/[0.02]"
            >
              {subItems.map((sub, i) => (
                <button
                  key={i}
                  onClick={sub.onClick}
                  className={cn(
                    "w-full text-left pl-[44px] pr-6 py-2.5 text-[9px] font-medium uppercase tracking-[0.2em] transition-colors duration-200",
                    sub.active ? "text-rose" : "text-ink/50 hover:text-ink hover:bg-ink/[0.04]"
                  )}
                >
                  {sub.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

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
    postal_code: ''
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
      await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);
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
    const matchesSearch = searchQuery === '' ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping_address?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
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
              is_read: m.is_read ?? true
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

  return (
    <>
    <main className="min-h-screen bg-gray-50/50 flex overflow-hidden print:hidden">
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
            <nav className="flex-1 overflow-y-auto py-4">
              <div className="px-6 mb-2">
                <p className="text-[8px] uppercase tracking-[0.3em] text-gray-300">Dashboard</p>
              </div>
              <SidebarItem icon={LayoutDashboard} label="Overview" active={activeTab === 'overview'} onClick={() => { setActiveTab('overview'); setIsMobileMenuOpen(false); }} />
              <div className="px-6 mt-6 mb-2">
                <p className="text-[8px] uppercase tracking-[0.3em] text-gray-300">Catalog</p>
              </div>
              <SidebarItem icon={Package} label="Products" active={activeTab === 'products'} onClick={() => { setActiveTab('products'); setIsMobileMenuOpen(false); }} badge={products.length} />
              <SidebarItem icon={Box} label="Inventory" active={activeTab === 'inventory'} onClick={() => { setActiveTab('inventory'); setIsMobileMenuOpen(false); }} badge={totalStock} />
              <SidebarItem icon={Users} label="Customers" active={activeTab === 'customers'} onClick={() => { setActiveTab('customers'); setIsMobileMenuOpen(false); }} badge={customers.length} />
              <div className="px-6 mt-6 mb-2">
                <p className="text-[8px] uppercase tracking-[0.3em] text-gray-300">Operations</p>
              </div>
              <SidebarItem icon={ShoppingCart} label="Orders" active={activeTab === 'orders'} onClick={() => { setActiveTab('orders'); setIsMobileMenuOpen(false); }} badge={orders.length} />
              <SidebarItem icon={MessageSquare} label="Support Chat" active={activeTab === 'messages'} onClick={() => { setActiveTab('messages'); setIsMobileMenuOpen(false); }} badge={totalUnreadChats} />
              <div className="px-6 mt-6 mb-2">
                <p className="text-[8px] uppercase tracking-[0.3em] text-gray-300">Finance</p>
              </div>
              <SidebarItem icon={TrendingUp} label="Revenue" active={activeTab === 'revenue'} onClick={() => { setActiveTab('revenue'); setIsMobileMenuOpen(false); }} />
              <SidebarItem icon={CreditCard} label="Payments" active={activeTab === 'payments'} onClick={() => { setActiveTab('payments'); setIsMobileMenuOpen(false); }} />
              <div className="px-6 mt-6 mb-2">
                <p className="text-[8px] uppercase tracking-[0.3em] text-gray-300">Support</p>
              </div>
              <SidebarItem icon={Mail} label="Inbox" active={activeTab === 'inbox'} onClick={() => { setActiveTab('inbox'); setIsMobileMenuOpen(false); }} />
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
      <aside className="hidden md:flex w-64 bg-white border-r border-ink/5 flex-col z-50 shrink-0">
        <div className="p-6 border-b border-ink/5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-ink flex items-center justify-center rounded-sm">
              <span className="text-white font-display italic font-medium text-xs">N</span>
            </div>
            <div className="font-display font-medium text-lg italic tracking-tighter text-ink uppercase leading-none">NINOC</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto minimal-scroll py-4">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
          />
          
          <SidebarItem
            icon={Package}
            label="Product"
            active={['products', 'upload'].includes(activeTab)}
            subItems={[
              { label: 'Product List', id: 'products', active: activeTab === 'products', onClick: () => setActiveTab('products') },
              { label: 'Upload Images', id: 'upload', active: activeTab === 'upload', onClick: () => setActiveTab('upload') }
            ]}
          />
          
          <SidebarItem
            icon={ShoppingCart}
            label="Transaction"
            active={['orders', 'logistics'].includes(activeTab)}
            badge={pendingOrders}
            subItems={[
              { label: 'Online Order', id: 'orders', active: activeTab === 'orders', onClick: () => setActiveTab('orders') },
              { label: 'Logistics', id: 'logistics', active: activeTab === 'logistics', onClick: () => setActiveTab('logistics') }
            ]}
          />
          
          <SidebarItem
            icon={Users}
            label="Membership"
            active={activeTab === 'customers'}
            onClick={() => setActiveTab('customers')}
            badge={customers.length}
          />
          
          <SidebarItem
            icon={Box}
            label="Info Stock"
            active={activeTab === 'inventory'}
            subItems={[
              { label: 'Stock History', id: 'inventory', active: activeTab === 'inventory', onClick: () => setActiveTab('inventory') }
            ]}
          />
          
          <SidebarItem
            icon={DollarSign}
            label="Report"
            active={activeTab === 'finance'}
            subItems={[
              { label: 'Finance', id: 'finance', active: activeTab === 'finance', onClick: () => setActiveTab('finance') }
            ]}
          />
          
          <SidebarItem
            icon={MessageSquare}
            label="Support Chat"
            active={activeTab === 'messages'}
            onClick={() => setActiveTab('messages')}
            badge={totalUnreadChats}
          />
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
               activeTab === 'messages' ? 'Support Chat' : activeTab}
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
        <section className="flex-1 overflow-y-auto p-4 pb-0 md:px-6 md:pt-4 md:pb-0">
          <AnimatePresence mode="wait">
            {/* ===== OVERVIEW ===== */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                  {[
                    { label: 'Total Revenue', value: `IDR ${finance.totalRevenue.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'bg-rose/10 text-rose' },
                    { label: 'Today Revenue', value: `IDR ${finance.todayRevenue.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: DollarSign, color: 'bg-emerald-500/10 text-emerald-600' },
                    { label: 'Total Products', value: products.length.toString(), icon: Package, color: 'bg-blue-500/10 text-blue-600' },
                    { label: 'Pending Orders', value: pendingOrders.toString(), icon: Clock, color: 'bg-amber-500/10 text-amber-600' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-8 h-8 rounded-md flex items-center justify-center shrink-0", stat.color)}>
                          <stat.icon size={14} />
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-widest text-gray-400">{stat.label}</p>
                          <p className="text-sm font-medium text-gray-900">{stat.value}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 uppercase tracking-wide">Recent Orders</h3>
                    <button onClick={() => setActiveTab('orders')} className="text-[10px] uppercase tracking-wider text-rose">
                      View All
                    </button>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                        onClick={() => openOrderDetail(order)}
                      >
                        <div className="flex items-center gap-6">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-400">Order ID</p>
                            <p className="text-sm font-medium text-gray-900">{order.id.slice(0, 8)}...</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-gray-400">Customer</p>
                            <p className="text-sm text-gray-700">{order.shipping_address?.name || 'Guest'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-wider text-gray-400">Amount</p>
                            <p className="text-sm font-medium">IDR {order.total_price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                          </div>
                          <StatusBadge status={order.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ===== PRODUCTS ===== */}
            {activeTab === 'products' && (
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Products</h2>
                    <span className="text-[9px] text-gray-400">— {products.length} items</span>
                  </div>
                  <button
                    onClick={() => openProductModal()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose text-white rounded hover:bg-rose/90 transition-colors"
                  >
                    <Plus size={12} />
                    <span className="text-[9px] uppercase tracking-wider">Add</span>
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded text-sm focus:outline-none focus:border-rose/50"
                  />
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {filteredProducts.map((product) => (
                    <div key={product.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden group">
                      <div className="aspect-square bg-gray-50 relative">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package size={40} className="text-gray-200" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => toggleFeatured(product)}
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              product.is_featured ? "bg-rose text-white" : "bg-white/90 text-gray-600"
                            )}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openProductModal(product)}
                            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-600 hover:bg-rose hover:text-white"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-gray-600 hover:bg-red-500 hover:text-white"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        {product.is_featured && (
                          <div className="absolute top-3 left-3 px-2 py-1 bg-rose text-white text-[8px] uppercase tracking-wider rounded">
                            Featured
                          </div>
                        )}
                      </div>
                      <div className="p-3 space-y-2">
                        {/* Product Name — Destil & Bold */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display font-medium italic text-xs text-ink leading-tight truncate">{product.name}</h3>
                          {product.is_featured && (
                            <span className="shrink-0 px-1.5 py-0.5 bg-rose text-white text-[8px] uppercase tracking-wider rounded">Featured</span>
                          )}
                        </div>

                        {/* Category + Variants */}
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] uppercase tracking-widest text-gray-400">{product.category}</span>
                          <span className="text-[9px] text-rose">{product.variants?.length || 0} variants</span>
                        </div>

                        {/* Price — Prominent */}
                        <div className="space-y-0.5">
                          {product.price_tag && (
                            <div className="text-[8px] uppercase tracking-[0.25em] text-rose font-medium">{product.price_tag}</div>
                          )}
                          <p className="text-sm font-medium text-ink leading-none">
                            {Number(product.price).toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            <span className="text-[9px] font-normal text-gray-400 ml-1">IDR</span>
                          </p>
                          <div className="pt-2 mt-2 border-t border-ink/5">
                            <p className="text-[8px] text-gray-400 uppercase flex justify-between">
                              <span>VAT (11%)</span>
                              <span>+ {Math.round(Number(product.price) * 0.11).toLocaleString('id-ID')} IDR</span>
                            </p>
                            <p className="text-[10px] font-medium text-ink flex justify-between mt-1">
                              <span>TOTAL</span>
                              <span className="text-rose italic font-display">{Math.round(Number(product.price) * 1.11).toLocaleString('id-ID')} IDR</span>
                            </p>
                          </div>
                        </div>

                        {/* Color/Sizes breakdown dari variants */}
                        {product.variants && product.variants.length > 0 && (() => {
                          const colors = [...new Set(product.variants.map(v => v.color).filter(Boolean))] as string[];
                          const sizes = [...new Set(product.variants.map(v => v.size).filter(Boolean))] as string[];
                          const totalStock = product.variants.reduce((sum: number, v: { stock_quantity: number }) => sum + (v.stock_quantity || 0), 0);
                          return (
                            <div className="pt-1 border-t border-ink/5 space-y-1">
                              {colors.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[8px] text-gray-400 uppercase">Colors:</span>
                                  {colors.map(c => (
                                    <span key={c} className="px-1.5 py-0.5 bg-ink/5 text-[8px] text-ink rounded">{c}</span>
                                  ))}
                                </div>
                              )}
                              {sizes.length > 0 && (
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[8px] text-gray-400 uppercase">Sizes:</span>
                                  {sizes.map(s => (
                                    <span key={s} className="px-1.5 py-0.5 bg-gray-100 text-[8px] text-gray-600 rounded">{s}</span>
                                  ))}
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <span className="text-[8px] text-gray-400 uppercase">Total Stock</span>
                                <span className={cn(
                                  "text-[10px] font-medium",
                                  totalStock === 0 ? "text-red-500" : totalStock < 5 ? "text-amber-500" : "text-emerald-600"
                                )}>{totalStock} units</span>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Image indicators */}
                        {(product.perspective1 || product.perspective2 || product.perspective3 || product.perspective4) && (
                          <div className="flex items-center gap-1">
                            {[product.perspective1, product.perspective2, product.perspective3, product.perspective4].filter(Boolean).map((_, idx) => (
                              <div key={idx} className="w-4 h-4 rounded-sm bg-rose/20 border border-rose/20 flex items-center justify-center">
                                <span className="text-[6px] text-rose">{idx + 1}</span>
                              </div>
                            ))}
                          </div>
                        )}

                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ===== BULK UPLOAD ===== */}
            {activeTab === 'upload' && (
              <motion.div
                key="bulk-upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Upload Images</h2>
                    <span className="text-[9px] text-gray-400">— {bulkFiles.length > 0 ? `${bulkFiles.length} file${bulkFiles.length > 1 ? 's' : ''} selected` : 'batch upload'}</span>
                  </div>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className="p-1.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Product name link */}
                <div className="bg-white rounded-xl border border-gray-100 p-4">
                  <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">
                    Product Name (optional — auto-fills product form)
                  </label>
                  <input
                    type="text"
                    value={bulkProductLink}
                    onChange={(e) => setBulkProductLink(e.target.value)}
                    placeholder="e.g. Essential Oversized Tee — images will link to this product"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                  />
                </div>

                {/* Drop zone */}
                <div
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 text-center transition-colors",
                    bulkFiles.length > 0 ? "border-rose/30 bg-rose/5" : "border-gray-200 hover:border-rose/30"
                  )}
                >
                  {bulkFiles.length > 0 ? (
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2 justify-center max-h-40 overflow-y-auto">
                        {bulkFiles.slice(0, 50).map((f, i) => (
                          <div key={i} className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-200 text-[10px] text-gray-600">
                            <span className="font-medium">{i + 1}.</span>
                            <span className="truncate max-w-[120px]">{f.name}</span>
                          </div>
                        ))}
                        {bulkFiles.length > 50 && (
                          <span className="text-sm text-gray-400">...and {bulkFiles.length - 50} more</span>
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-4">
                        <label className="px-4 py-2 bg-rose text-white text-[10px] uppercase tracking-wider font-medium rounded-lg cursor-pointer hover:bg-rose/90 transition-colors">
                          {bulkUploading ? 'Uploading...' : 'Add More Files'}
                          <input type="file" accept="image/*" multiple className="hidden" onChange={handleBulkFileSelect} disabled={bulkUploading} />
                        </label>
                        <button
                          onClick={() => setBulkFiles([])}
                          className="px-4 py-2 text-gray-500 text-[10px] uppercase tracking-wider font-medium hover:text-red-500 transition-colors"
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Upload size={32} className="mx-auto text-gray-300" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Drop images here or click to browse</p>
                        <p className="text-[10px] text-gray-400 mt-1">JPG, PNG, WEBP • Max 10MB per file • Up to 1000 files</p>
                      </div>
                      <label className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white text-[10px] uppercase tracking-wider font-medium rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                        Select Files
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleBulkFileSelect} />
                      </label>
                    </div>
                  )}
                </div>

                {/* Upload results */}
                {bulkResults && (
                  <div className="bg-white rounded-xl border border-gray-100 p-4">
                    <h3 className="text-sm font-medium mb-3">
                      Upload Results ({bulkResults.filter(r => !r.error).length} / {bulkResults.length} succeeded)
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {/* Show ALL upload history + current results */}
                      {allUploadHistory.map((r, i) => (
                        <div key={`history-${r.timestamp}-${i}`} className="space-y-1">
                          <div className={cn(
                            "flex items-center justify-between px-3 py-2 rounded-lg text-[10px]",
                            r.error ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
                          )}>
                            <span className="truncate flex-1 mr-4">{r.name}</span>
                            <span className="font-medium">{r.error ? 'FAILED' : 'OK'}</span>
                          </div>
                          {/* Show URL if successful */}
                          {r.url && (
                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                              <input
                                type="text"
                                readOnly
                                value={r.url}
                                className="flex-1 text-[9px] text-gray-500 bg-transparent border-none outline-none truncate"
                              />
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(r.url);
                                  alert('URL copied!');
                                }}
                                className="text-[9px] px-2 py-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 whitespace-nowrap"
                              >
                                Copy
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => { setBulkResults(null); setAllUploadHistory([]); setBulkFiles([]); }}
                      className="mt-3 text-[10px] uppercase tracking-wider text-gray-400 hover:text-gray-600"
                    >
                      Clear All History
                    </button>
                  </div>
                )}

                {/* Submit */}
                <div className="flex gap-4">
                  <button
                    onClick={handleBulkImageUpload}
                    disabled={bulkFiles.length === 0 || bulkUploading}
                    className={cn(
                      "flex items-center gap-2 px-6 py-3 bg-rose text-white rounded-lg font-medium text-sm transition-colors",
                      (bulkFiles.length === 0 || bulkUploading) && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {bulkUploading ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload size={16} /> Upload {bulkFiles.length} Image{bulkFiles.length > 1 ? 's' : ''}</>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ===== INVENTORY ===== */}
            {activeTab === 'inventory' && (() => {
              const totalProducts = products.length;
              let totalSkus = 0;
              let lowStockCount = 0;
              let outOfStockCount = 0;
              
              products.forEach(p => {
                if (p.variants) {
                  totalSkus += p.variants.length;
                  p.variants.forEach(v => {
                    if (v.stock_quantity === 0) outOfStockCount++;
                    else if (v.stock_quantity < 5) lowStockCount++;
                  });
                }
              });

              return (
                <motion.div
                  key="inventory"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-5 pb-10"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-medium text-ink uppercase tracking-wide">Archival Catalog</h2>
                      <span className="text-[9px] text-ink/40">— stock & origin specification</span>
                    </div>
                  </div>

                  {/* METRICS CELL-BLOCK */}
                  <div className="grid grid-cols-4 border border-ink/10 bg-white">
                    {[
                      { label: 'Total Articles', value: totalProducts, highlight: false },
                      { label: 'Total SKUs', value: totalSkus, highlight: false },
                      { label: 'Low Stock Alert', value: lowStockCount, highlight: lowStockCount > 0 },
                      { label: 'Out of Stock', value: outOfStockCount, highlight: outOfStockCount > 0, critical: true }
                    ].map((m, i) => (
                      <div key={i} className={cn("px-4 py-3", i < 3 && "border-r border-ink/10")}>
                        <p className="text-[8px] uppercase tracking-[0.2em] text-ink/40 mb-1">{m.label}</p>
                        <p className={cn("text-sm font-medium font-mono", m.critical ? "text-rose" : m.highlight ? "text-amber-600" : "text-ink")}>{m.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* PRODUCTS LIST */}
                  <div className="space-y-4">
                    {products.map(p => {
                      const pTotalStock = p.variants?.reduce((sum, v) => sum + (v.stock_quantity || 0), 0) || 0;
                      return (
                        <div key={p.id} className="border border-ink/10 bg-white flex flex-col">
                          {/* Parent Product Info */}
                          <div className="flex items-center justify-between p-3 bg-ink/[0.02] border-b border-ink/10">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 bg-ink/5 border border-ink/10 flex items-center justify-center shrink-0">
                                {p.image_url ? <Image src={p.image_url} alt="" width={40} height={40} className="object-cover" /> : <Box size={16} className="text-ink/20" />}
                              </div>
                              <div>
                                <p className="text-[11px] font-medium text-ink uppercase tracking-wider">{p.name}</p>
                                <p className="text-[9px] text-ink/40 uppercase tracking-widest mt-0.5">{p.category} • {p.variants?.length || 0} SKUs</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[8px] uppercase tracking-[0.2em] text-ink/40 mb-0.5">Total Quantity</p>
                              <p className="text-[11px] font-mono font-medium text-ink">{pTotalStock}</p>
                            </div>
                          </div>

                          {/* Variants Grid */}
                          {p.variants && p.variants.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
                              {p.variants.map((v, vIdx) => {
                                const isOOS = v.stock_quantity === 0;
                                const isLow = v.stock_quantity > 0 && v.stock_quantity < 5;
                                return (
                                  <div key={v.id || vIdx} className={cn(
                                    "flex items-center justify-between p-3 border-b border-r border-ink/5",
                                    isOOS ? "bg-rose/5" : "bg-white hover:bg-ink/[0.01] transition-colors"
                                  )}>
                                    <div>
                                      <p className="text-[10px] font-medium text-ink uppercase">Size: {v.size || 'OS'} / Color: {v.color || '-'}</p>
                                      <p className="text-[8px] font-mono text-ink/40 mt-1">ID: {v.id?.slice(0, 8) || 'N/A'}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className={cn(
                                        "text-[12px] font-mono font-medium",
                                        isOOS ? "text-rose" : isLow ? "text-amber-600" : "text-ink"
                                      )}>
                                        {v.stock_quantity}
                                      </p>
                                      <p className={cn(
                                        "text-[7px] uppercase tracking-widest mt-0.5 font-medium",
                                        isOOS ? "text-rose" : isLow ? "text-amber-600" : "text-ink/40"
                                      )}>
                                        {isOOS ? 'OOS' : isLow ? 'LOW' : 'STOCK'}
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-3 text-center text-[9px] text-ink/30 uppercase tracking-widest">
                              No Origin Specifications (Variants)
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              );
            })()}

            {/* ===== ORDERS ===== */}
            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-between border-b border-ink/5 pb-4">
                  <div>
                    <h2 className="text-xl font-medium text-ink tracking-tight">Online Order</h2>
                    <p className="text-[10px] uppercase tracking-wider text-ink/40 mt-1">Transaction History & Management</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-rose text-white text-[10px] uppercase font-medium tracking-wider rounded hover:bg-rose/90 transition-colors">
                    Export Data
                  </button>
                </div>

                {/* Status Tabs */}
                <div className="flex items-center gap-1 border-b border-ink/5 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'all', label: 'All Order', count: orders.length },
                    { id: 'pending', label: 'New Order', count: orders.filter(o => o.status === 'pending').length },
                    { id: 'paid', label: 'Paid', count: orders.filter(o => o.status === 'paid').length },
                    { id: 'shipped', label: 'Sent', count: orders.filter(o => o.status === 'shipped').length },
                    { id: 'delivered', label: 'Completed', count: orders.filter(o => o.status === 'delivered').length },
                    { id: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setStatusFilter(tab.id)}
                      className={cn(
                        "relative px-4 py-3 text-[10px] uppercase font-medium tracking-wider whitespace-nowrap transition-colors",
                        statusFilter === tab.id ? "text-rose" : "text-ink/40 hover:text-ink/70"
                      )}
                    >
                      {tab.label}
                      <span className={cn(
                        "ml-2 px-1.5 py-0.5 text-[8px] rounded",
                        statusFilter === tab.id ? "bg-rose/10 text-rose" : "bg-ink/5 text-ink/40"
                      )}>
                        {tab.count}
                      </span>
                      {statusFilter === tab.id && (
                        <motion.div layoutId="orderTabIndicator" className="absolute bottom-0 left-0 right-0 h-[2px] bg-rose" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Filter Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 py-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button className="flex items-center gap-2 px-3 py-1.5 border border-ink/10 rounded-sm text-[10px] font-medium uppercase tracking-wider text-ink/60 hover:border-rose/50 hover:text-rose transition-colors">
                      <Filter size={12} /> Filter
                    </button>
                    <div className="h-4 w-px bg-ink/10 mx-1" />
                    {['Payment Method', 'Courier', 'Date Range', 'Sort By'].map((filter, i) => (
                      <button key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-ink/5 rounded-sm text-[10px] font-medium uppercase tracking-wider text-ink/60 hover:bg-ink/10 transition-colors">
                        {filter} <ChevronDown size={10} />
                      </button>
                    ))}
                  </div>
                  <div className="relative w-full max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-1.5 bg-white border border-ink/10 rounded-sm text-[10px] font-medium focus:outline-none focus:border-rose/50 transition-colors placeholder:text-ink/20"
                    />
                  </div>
                </div>

                {/* Order Cards List */}
                <div className="space-y-4">
                  {filteredOrders.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center border border-dashed border-ink/10 rounded-md">
                      <Box size={32} className="text-ink/20 mb-3" />
                      <p className="text-[10px] uppercase tracking-wider font-medium text-ink/40">No orders found</p>
                    </div>
                  ) : (
                    filteredOrders.map((order) => (
                      <div key={order.id} className="bg-white border border-ink/10 rounded-sm overflow-hidden hover:border-ink/20 transition-colors">
                        {/* Card Header */}
                        <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-ink/5 border-b border-ink/10">
                          <div className="flex items-center gap-4">
                            <span className="text-[11px] font-medium uppercase tracking-wider text-ink">#{order.id.slice(0, 12).toUpperCase()}</span>
                            <span className="text-[10px] font-medium text-ink/40">{new Date(order.created_at).toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={cn(
                              "text-[9px] uppercase tracking-wider px-2 py-1 border rounded-sm font-medium",
                              order.status === 'pending' ? "border-amber-200 bg-amber-50 text-amber-600" :
                              order.status === 'paid' ? "border-emerald-200 bg-emerald-50 text-emerald-600" :
                              order.status === 'shipped' ? "border-blue-200 bg-blue-50 text-blue-600" :
                              order.status === 'delivered' ? "border-teal-200 bg-teal-50 text-teal-600" :
                              "border-red-200 bg-red-50 text-red-600"
                            )}>
                              {order.status === 'pending' ? 'Waiting Payment' : order.status}
                            </span>
                            <button onClick={() => openOrderDetail(order)} className="text-[10px] font-medium uppercase tracking-wider text-rose hover:text-rose/80 transition-colors">
                              View Detail
                            </button>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-4">
                          {/* Product Info */}
                          <div className="col-span-1 md:col-span-1 space-y-3">
                            <p className="text-[9px] uppercase tracking-widest text-ink/40 mb-2">Product Info</p>
                            {order.order_items?.slice(0, 2).map((item, idx) => (
                              <div key={item.id || idx} className="flex gap-3">
                                <div className="w-12 h-12 bg-ink/5 rounded-sm shrink-0 border border-ink/5">
                                  {/* Thumbnail placeholder or image */}
                                </div>
                                <div>
                                  <p className="text-[11px] font-medium text-ink line-clamp-2 leading-tight">{item.product_name}</p>
                                  <p className="text-[9px] text-ink/40 mt-1 uppercase">Size: {item.size || '-'} | Qty: {item.quantity}</p>
                                </div>
                              </div>
                            ))}
                            {order.order_items && order.order_items.length > 2 && (
                              <button className="text-[9px] text-rose uppercase tracking-wider font-medium">+{order.order_items.length - 2} more items</button>
                            )}
                          </div>

                          {/* Shipping Address */}
                          <div className="col-span-1 md:col-span-1">
                            <p className="text-[9px] uppercase tracking-widest text-ink/40 mb-2">Shipping To</p>
                            <p className="text-[11px] font-medium text-ink">{order.shipping_address?.name || 'Guest User'}</p>
                            <p className="text-[10px] font-medium text-ink/60 font-mono mt-1">{order.shipping_address?.phone || '-'}</p>
                            <p className="text-[10px] font-medium text-ink/40 mt-1 line-clamp-2 leading-relaxed">{order.shipping_address?.address}</p>
                            <p className="text-[10px] font-medium text-ink/40 mt-1 uppercase">{order.shipping_address?.city}</p>
                          </div>

                          {/* Payment */}
                          <div className="col-span-1 md:col-span-1">
                            <p className="text-[9px] uppercase tracking-widest text-ink/40 mb-2">Payment</p>
                            <div className="flex items-center gap-2 mb-1">
                              <CreditCard size={14} className="text-ink/40" />
                              <span className="text-[11px] font-medium text-ink uppercase tracking-wider">Midtrans</span>
                            </div>
                            <span className={cn(
                              "text-[9px] uppercase tracking-wider font-medium",
                              order.payment_status === 'success' ? "text-emerald-600" :
                              order.payment_status === 'pending' ? "text-amber-600" : "text-red-600"
                            )}>
                              {order.payment_status}
                            </span>
                          </div>

                          {/* Courier */}
                          <div className="col-span-1 md:col-span-1">
                            <p className="text-[9px] uppercase tracking-widest text-ink/40 mb-2">Courier</p>
                            <div className="flex items-center gap-2 mb-1">
                              <Truck size={14} className="text-ink/40" />
                              <span className="text-[11px] font-medium text-ink uppercase tracking-wider">{order.courier || 'Standard'}</span>
                            </div>
                            <p className="text-[10px] font-medium text-ink/40 font-mono mt-1">{order.tracking_id || 'No tracking ID'}</p>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="flex items-center justify-end px-4 py-3 bg-ink/5 border-t border-ink/10">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-ink/40 mr-4">Total Amount</p>
                          <p className="text-sm font-medium text-ink">IDR {order.total_price.toLocaleString('id-ID')}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Pagination */}
                {filteredOrders.length > 0 && (
                  <div className="flex items-center justify-between py-4 border-t border-ink/5 mt-4">
                    <div className="flex items-center gap-2 text-[10px] uppercase font-medium tracking-wider text-ink/40">
                      Show
                      <select className="bg-transparent border border-ink/10 rounded-sm px-2 py-1 outline-none text-ink">
                        <option>10</option>
                        <option>20</option>
                        <option>50</option>
                      </select>
                      per page
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="w-6 h-6 flex items-center justify-center border border-ink/10 rounded-sm text-ink/40 hover:text-ink hover:border-ink/20 transition-colors">
                        <ChevronLeft size={12} />
                      </button>
                      <button className="w-6 h-6 flex items-center justify-center border border-rose bg-rose text-white rounded-sm text-[10px] font-medium transition-colors">
                        1
                      </button>
                      <button className="w-6 h-6 flex items-center justify-center border border-ink/10 rounded-sm text-ink/40 hover:text-ink hover:border-ink/20 transition-colors text-[10px] font-medium">
                        2
                      </button>
                      <button className="w-6 h-6 flex items-center justify-center border border-ink/10 rounded-sm text-ink/40 hover:text-ink hover:border-ink/20 transition-colors">
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ===== LOGISTICS ===== */}
            {activeTab === 'logistics' && (() => {
              const logisticsOrders = logisticsFilter === 'all'
                ? orders.filter(o => ['paid', 'shipped', 'delivered'].includes(o.status))
                : orders.filter(o => o.status === logisticsFilter);

              const pendingCount = orders.filter(o => o.status === 'paid').length;
              const inTransitCount = orders.filter(o => o.status === 'shipped').length;
              const deliveredCount = orders.filter(o => o.status === 'delivered').length;
              const cancelledCount = orders.filter(o => o.status === 'cancelled').length;

              const getTimeAgo = (dateStr: string) => {
                const diff = Date.now() - new Date(dateStr).getTime();
                const mins = Math.floor(diff / 60000);
                if (mins < 60) return `${mins}m`;
                const hrs = Math.floor(mins / 60);
                if (hrs < 24) return `${hrs}h`;
                return `${Math.floor(hrs / 24)}d`;
              };

              // Animated route waypoints for the map
              const getRouteWaypoints = (order: Order) => {
                const city = order.shipping_address?.city?.toLowerCase() || '';
                const province = order.shipping_address?.province?.toLowerCase() || '';
                // Origin is always Bandung
                const waypoints = [
                  { label: 'NINOC STUDIO', sub: 'Bandung, Jawa Barat', x: 15, y: 70, isOrigin: true },
                ];
                // Intermediate hub
                if (city.includes('jakarta') || province.includes('dki')) {
                  waypoints.push({ label: 'Jakarta Hub', sub: 'Sorting Center', x: 35, y: 40, isOrigin: false });
                  waypoints.push({ label: order.shipping_address?.city || 'Destination', sub: order.shipping_address?.name || '', x: 80, y: 25, isOrigin: false });
                } else if (city.includes('surabaya') || province.includes('jawa timur')) {
                  waypoints.push({ label: 'Semarang Hub', sub: 'Transit Point', x: 45, y: 50, isOrigin: false });
                  waypoints.push({ label: order.shipping_address?.city || 'Destination', sub: order.shipping_address?.name || '', x: 85, y: 30, isOrigin: false });
                } else {
                  waypoints.push({ label: 'Regional Hub', sub: 'Sorting Facility', x: 50, y: 45, isOrigin: false });
                  waypoints.push({ label: order.shipping_address?.city || 'Destination', sub: order.shipping_address?.name || '', x: 82, y: 28, isOrigin: false });
                }
                return waypoints;
              };

              return (
              <motion.div
                key="logistics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-0"
              >
                {/* HEADER BAR */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Logistics Command</h2>
                    <span className="text-[9px] text-gray-400">— shipment operations center</span>
                  </div>
                  <div className="text-[9px] text-gray-400 font-mono">
                    {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
                    {' • '}
                    <span className="text-rose">{pendingCount + inTransitCount}</span> active
                  </div>
                </div>

                {/* STAT CELLS — 4 compact cells, no gap, cell-block */}
                <div className="grid grid-cols-4 border border-gray-200 bg-white">
                  {[
                    { label: 'Awaiting Dispatch', count: pendingCount, color: 'text-amber-600', bg: 'bg-amber-50', filterKey: 'paid' },
                    { label: 'In Transit', count: inTransitCount, color: 'text-blue-600', bg: 'bg-blue-50', filterKey: 'shipped' },
                    { label: 'Delivered', count: deliveredCount, color: 'text-emerald-600', bg: 'bg-emerald-50', filterKey: 'delivered' },
                    { label: 'Cancelled', count: cancelledCount, color: 'text-red-500', bg: 'bg-red-50', filterKey: 'cancelled' },
                  ].map((stat, i) => (
                    <button
                      key={stat.filterKey}
                      onClick={() => setLogisticsFilter(logisticsFilter === stat.filterKey ? 'all' : stat.filterKey)}
                      className={cn(
                        "px-3 py-2.5 text-left transition-colors relative",
                        i < 3 && "border-r border-gray-200",
                        logisticsFilter === stat.filterKey ? stat.bg : "hover:bg-gray-50"
                      )}
                    >
                      {logisticsFilter === stat.filterKey && (
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-rose" />
                      )}
                      <p className="text-[8px] uppercase tracking-[0.2em] text-gray-400 mb-1">{stat.label}</p>
                      <p className={cn("text-lg font-medium font-mono", stat.color)}>{stat.count}</p>
                    </button>
                  ))}
                </div>

                {/* MAIN CONTENT: TABLE + DETAIL PANEL */}
                <div className="flex border border-t-0 border-gray-200 bg-white" style={{ height: 'calc(100vh - 11rem)' }}>
                  {/* LEFT: MASTER TABLE */}
                  <div className={cn(
                    "flex flex-col transition-all duration-300",
                    logisticsSelectedOrder ? "w-[55%]" : "w-full"
                  )}>
                    {/* Table sub-header with filter & search */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50/80 shrink-0">
                      <div className="flex items-center gap-1">
                        {['all', 'paid', 'shipped', 'delivered'].map((f) => (
                          <button
                            key={f}
                            onClick={() => setLogisticsFilter(f)}
                            className={cn(
                              "px-2 py-1 text-[8px] uppercase tracking-[0.15em] transition-colors",
                              logisticsFilter === f
                                ? "bg-ink text-white"
                                : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                            )}
                          >
                            {f === 'all' ? 'All Active' : f === 'paid' ? 'Pending' : f === 'shipped' ? 'Transit' : 'Done'}
                          </button>
                        ))}
                      </div>
                      <span className="text-[9px] font-mono text-gray-400">{logisticsOrders.length} results</span>
                    </div>

                    {/* Dense table */}
                    <div className="flex-1 overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_0_#e5e7eb]">
                          <tr>
                            <th className="px-3 py-1.5 text-[8px] font-medium uppercase tracking-[0.15em] text-gray-400 w-[90px]">Order</th>
                            <th className="px-3 py-1.5 text-[8px] font-medium uppercase tracking-[0.15em] text-gray-400">Status</th>
                            <th className="px-3 py-1.5 text-[8px] font-medium uppercase tracking-[0.15em] text-gray-400">Destination</th>
                            <th className="px-3 py-1.5 text-[8px] font-medium uppercase tracking-[0.15em] text-gray-400">Courier</th>
                            <th className="px-3 py-1.5 text-[8px] font-medium uppercase tracking-[0.15em] text-gray-400 w-[60px]">Resi</th>
                            <th className="px-3 py-1.5 text-[8px] font-medium uppercase tracking-[0.15em] text-gray-400 text-right w-[80px]">Value</th>
                            <th className="px-3 py-1.5 text-[8px] font-medium uppercase tracking-[0.15em] text-gray-400 text-right w-[40px]">Age</th>
                          </tr>
                        </thead>
                        <tbody>
                          {logisticsOrders.map((order, idx) => (
                            <tr
                              key={order.id}
                              onClick={() => setLogisticsSelectedOrder(logisticsSelectedOrder?.id === order.id ? null : order)}
                              className={cn(
                                "cursor-pointer transition-colors border-b border-gray-100",
                                logisticsSelectedOrder?.id === order.id
                                  ? "bg-rose/5 border-l-2 border-l-rose"
                                  : idx % 2 === 0 ? "bg-white hover:bg-gray-50" : "bg-gray-50/30 hover:bg-gray-50"
                              )}
                            >
                              <td className="px-3 py-1.5">
                                <span className="font-mono text-[10px] text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</span>
                              </td>
                              <td className="px-3 py-1.5">
                                <span className={cn(
                                  "text-[8px] uppercase tracking-[0.1em] px-1.5 py-0.5 inline-block",
                                  order.status === 'paid' && "bg-amber-100 text-amber-700",
                                  order.status === 'shipped' && "bg-blue-100 text-blue-700",
                                  order.status === 'delivered' && "bg-emerald-100 text-emerald-700",
                                  order.status === 'cancelled' && "bg-red-100 text-red-600",
                                )}>
                                  {order.status === 'paid' ? 'PENDING' : order.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-3 py-1.5">
                                <div className="text-[10px] text-gray-900 truncate max-w-[120px]">{order.shipping_address?.name}</div>
                                <div className="text-[8px] text-gray-400 truncate max-w-[120px]">{order.shipping_address?.city}</div>
                              </td>
                              <td className="px-3 py-1.5">
                                <span className="text-[9px] text-gray-600 uppercase">{order.courier || '—'}</span>
                              </td>
                              <td className="px-3 py-1.5">
                                {order.tracking_id ? (
                                  <span className="font-mono text-[9px] bg-gray-100 text-gray-800 px-1 py-0.5">{order.tracking_id.slice(-8)}</span>
                                ) : (
                                  <span className="text-[8px] text-gray-300">—</span>
                                )}
                              </td>
                              <td className="px-3 py-1.5 text-right">
                                <span className="font-mono text-[9px] text-gray-700">{(order.total_price / 1000).toFixed(0)}K</span>
                              </td>
                              <td className="px-3 py-1.5 text-right">
                                <span className="text-[9px] text-gray-400 font-mono">{getTimeAgo(order.created_at)}</span>
                              </td>
                            </tr>
                          ))}
                          {logisticsOrders.length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-3 py-12 text-center text-[10px] text-gray-300 uppercase tracking-[0.3em]">
                                No orders in this category
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* RIGHT: DETAIL + MAP PANEL */}
                  <AnimatePresence>
                    {logisticsSelectedOrder && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: '50%', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                        className="border-l border-gray-200 flex flex-col overflow-hidden bg-white shadow-xl z-20 relative"
                      >
                        <div className="w-full h-full flex flex-col overflow-y-auto p-4 gap-3 custom-scrollbar">
                          {/* 1. Header / Client Info */}
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-200">
                                {logisticsSelectedOrder.shipping_address?.name ? (
                                  <span className="text-[14px] font-medium text-gray-600">
                                    {logisticsSelectedOrder.shipping_address.name.charAt(0).toUpperCase()}
                                  </span>
                                ) : (
                                  <User size={16} className="text-gray-400" />
                                )}
                              </div>
                              <div>
                                <p className="text-[11px] font-medium text-gray-900 leading-tight">{logisticsSelectedOrder.shipping_address?.name}</p>
                                <p className="text-[9px] text-gray-500 mt-0.5 font-mono">Client ID: {logisticsSelectedOrder.user_id?.slice(0, 8) || 'GUEST'}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => openOrderDetail(logisticsSelectedOrder)}
                                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-ink transition-colors"
                                title="View Full Order"
                              >
                                <Eye size={12} />
                              </button>
                              <button 
                                onClick={() => setLogisticsSelectedOrder(null)}
                                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-rose transition-colors"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>

                          {/* 2. Order Details Grid */}
                          <div className="grid grid-cols-4 gap-3 pt-3 border-t border-gray-100">
                            <div>
                              <p className="text-[8px] uppercase tracking-wider text-gray-400 mb-1">Order ID</p>
                              <p className="text-[10px] font-medium text-gray-900">{logisticsSelectedOrder.id.slice(0,8).toUpperCase()}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-[8px] uppercase tracking-wider text-gray-400 mb-1">Shipping Address</p>
                              <p className="text-[10px] text-gray-900 leading-tight">
                                {logisticsSelectedOrder.shipping_address?.address}, {logisticsSelectedOrder.shipping_address?.city}, {logisticsSelectedOrder.shipping_address?.postal_code}
                              </p>
                            </div>
                            <div>
                              <p className="text-[8px] uppercase tracking-wider text-gray-400 mb-1">Shipped</p>
                              <p className="text-[10px] text-gray-900 leading-tight">
                                {new Date(logisticsSelectedOrder.created_at).toLocaleDateString('id-ID')}<br/>
                                <span className="text-gray-500">{new Date(logisticsSelectedOrder.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                              </p>
                            </div>
                          </div>

                          {/* 3. Ordered Products */}
                          <div className="pt-1">
                            <p className="text-[9px] font-medium text-gray-900 mb-2">Ordered Products (IDR {logisticsSelectedOrder.total_price.toLocaleString('id-ID')})</p>
                            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                              {logisticsSelectedOrder.order_items?.map((item, idx) => (
                                <div key={idx} className="flex gap-3 p-2.5 border border-gray-200 rounded-xl min-w-[220px] shrink-0 items-center bg-white shadow-sm hover:shadow-md transition-shadow">
                                  <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 border border-gray-100">
                                    <Package size={16} className="text-gray-300" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[10px] text-gray-900 truncate font-medium">{item.product_name || 'Garment Item'}</p>
                                    <p className="text-[8px] text-gray-500 mt-0.5">1 item • SZ:{item.size || 'OS'}</p>
                                    <p className="text-[10px] font-mono font-medium text-gray-900 mt-1">IDR {item.price_at_purchase.toLocaleString('id-ID')}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 4. Map Visualization */}
                          <div className="relative w-full h-[180px] bg-[#f8f9fa] rounded-2xl border border-gray-200 overflow-hidden shrink-0 mt-1">
                            <svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" viewBox="0 0 600 300">
                              {/* Map background pattern to simulate streets */}
                              <g stroke="#ffffff" strokeWidth="8" strokeLinecap="round">
                                <path d="M-50,50 L650,250 M-50,150 L650,350 M-50,-50 L650,150" opacity="0.8" />
                                <path d="M100,-50 L-50,350 M300,-50 L150,350 M500,-50 L350,350" opacity="0.8" />
                                <path d="M200,0 L200,300 M450,0 L450,300" strokeWidth="12" opacity="0.6" />
                              </g>
                              
                              {/* Compass UI (Timur / Barat orientation) */}
                              <g transform="translate(40, 40)">
                                <circle cx="0" cy="0" r="20" fill="white" stroke="#e2e8f0" strokeWidth="2" opacity="0.9" />
                                <path d="M0,-14 L5,-3 L0,-5 L-5,-3 Z" fill="#E8527A" />
                                <path d="M0,14 L5,3 L0,5 L-5,3 Z" fill="#94a3b8" />
                                <text x="0" y="-17" fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle">N</text>
                                <text x="0" y="24" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">S</text>
                                <text x="-18" y="3" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">W</text>
                                <text x="18" y="3" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle">E</text>
                              </g>

                              {/* City Labels */}
                              <text x="450" y="80" fill="#cbd5e1" fontSize="16" fontWeight="bold" letterSpacing="2" opacity="0.7">ORIGIN SENDER</text>
                              <text x="80" y="220" fill="#cbd5e1" fontSize="14" fontWeight="bold" letterSpacing="1" opacity="0.7">DESTINATION</text>

                              {/* Route Path */}
                              {(() => {
                                const isDelivered = logisticsSelectedOrder.status === 'delivered';
                                const isShipped = logisticsSelectedOrder.status === 'shipped';
                                const pathStr = "M420,100 Q300,180 120,200";
                                
                                return (
                                  <>
                                    <path d={pathStr} fill="none" stroke="#E8527A" strokeWidth="4" />
                                    
                                    {/* Origin Dot */}
                                    <circle cx="420" cy="100" r="6" fill="#141414" stroke="#ffffff" strokeWidth="3" />
                                    
                                    {/* Animated Truck/Pulse Icon */}
                                    {(isShipped || isDelivered) && (
                                      <motion.g
                                        initial={{ offsetDistance: isDelivered ? '100%' : '0%' }}
                                        animate={{ offsetDistance: isDelivered ? '100%' : '75%' }}
                                        transition={{ duration: 5, ease: 'easeInOut' }}
                                        style={{ offsetPath: `path('${pathStr}')`, offsetRotate: '0deg' }}
                                      >
                                        <circle r="18" fill="rgba(232, 82, 122, 0.2)" />
                                        <circle r="12" fill="#E8527A" />
                                        {/* Truck flipped horizontally so it faces Left without being upside down */}
                                        <g transform="scale(-1, 1) translate(0, 0)">
                                          <svg x="-6" y="-6" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="1" y="3" width="15" height="13" />
                                            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                                            <circle cx="5.5" cy="18.5" r="2.5" />
                                            <circle cx="18.5" cy="18.5" r="2.5" />
                                          </svg>
                                        </g>
                                      </motion.g>
                                    )}

                                    {/* Destination Dot */}
                                    <circle cx="120" cy="200" r="6" fill="#E8527A" stroke="#ffffff" strokeWidth="3" />
                                  </>
                                );
                              })()}
                            </svg>
                          </div>

                          {/* 5. Timeline */}
                          <div className="mt-0 pt-2 flex-1">
                            <div className="flex justify-between items-center mb-3">
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] font-medium text-gray-900 uppercase tracking-wider">Timeline</span>
                                <span className="text-[8px] text-gray-400">Updated 5 mins ago</span>
                              </div>
                              <button className="px-3 py-1.5 bg-gray-50 text-[8px] font-medium text-gray-600 rounded border border-gray-200 hover:bg-gray-100 transition-colors">
                                Refresh
                              </button>
                            </div>

                            <div className="relative pl-3.5 border-l border-gray-200 space-y-4 ml-2">
                              {/* Step 1: Current Status */}
                              <div className="relative">
                                <div className="absolute -left-[18px] top-1 w-3.5 h-3.5 bg-white border-2 border-rose rounded-full flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 bg-rose rounded-full" />
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
                                  <div className="w-20 shrink-0 pt-0.5">
                                    <div className="flex items-center gap-1.5 text-[9px] text-gray-900 font-medium">
                                      <Truck size={10} className="text-gray-500" /> Now
                                    </div>
                                    <div className="text-[8px] text-gray-500 mt-1 pl-4">6:39 PM</div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-medium text-gray-900">
                                      {logisticsSelectedOrder.status === 'delivered' ? 'Delivered' : 
                                       logisticsSelectedOrder.status === 'shipped' ? 'In transit' : 'Processing'}
                                    </p>
                                    <p className="text-[9px] text-gray-500 mt-1 leading-relaxed max-w-[200px]">
                                      {logisticsSelectedOrder.shipping_address?.address}, {logisticsSelectedOrder.shipping_address?.postal_code}, {logisticsSelectedOrder.shipping_address?.city}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Step 2: Sorting Center */}
                              <div className="relative">
                                <div className="absolute -left-[18px] top-1 w-3.5 h-3.5 bg-white border-2 border-gray-200 rounded-full" />
                                <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
                                  <div className="w-20 shrink-0 pt-0.5">
                                    <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                                      <Box size={10} /> 11:54 AM
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-medium text-gray-900">In the sorting facility</p>
                                    <p className="text-[9px] text-gray-500 mt-1 uppercase">{logisticsSelectedOrder.courier || 'Expedition'} Hub, Regional Branch</p>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Step 3: Dispatched */}
                              <div className="relative">
                                <div className="absolute -left-[18px] top-1 w-3.5 h-3.5 bg-white border-2 border-gray-200 rounded-full" />
                                <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
                                  <div className="w-20 shrink-0 pt-0.5">
                                    <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                                      <Package size={10} /> 09:12 AM
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-medium text-gray-900">Package dispatched</p>
                                    <p className="text-[9px] text-gray-500 mt-1 uppercase">Sender Origin Facility</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
              );
            })()}

            {/* ===== FINANCE ===== */}
            {activeTab === 'finance' && (
              <motion.div
                key="finance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Finance</h2>
                  <span className="text-[9px] text-gray-400">— overview & reports</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-rose to-rose/80 rounded-xl p-6 text-white">
                    <p className="text-[10px] uppercase tracking-widest opacity-70">Total Revenue</p>
                    <p className="text-3xl font-medium mt-2">IDR {finance.totalRevenue.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    <p className="text-[10px] opacity-70 mt-4">{finance.completedOrders} completed orders</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400">This Month</p>
                    <p className="text-2xl font-medium text-gray-900 mt-2">IDR {finance.monthRevenue.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    <p className="text-[10px] text-gray-500 mt-4">
                      {orders.filter(o => new Date(o.created_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).length} orders this month
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400">Pending Payments</p>
                    <p className="text-2xl font-medium text-amber-600 mt-2">{finance.pendingPayments}</p>
                    <p className="text-[10px] text-gray-500 mt-4">Awaiting confirmation</p>
                  </div>
                </div>

                {/* Product Costing Section */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 uppercase tracking-wide">Product Costing</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">{products.length} products registered</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        onChange={e => {
                          const prod = products.find(p => p.id === e.target.value);
                          if (prod) {
                            setSelectedProductForCosting(prod);
                            const existing = productCostings[prod.id];
                            if (existing) {
                              setCostingForm({
                                supplier_cost: existing.supplier_cost,
                                shipping_cost: existing.shipping_cost,
                                packaging_cost: existing.packaging_cost,
                                operasional_pct: existing.operasional_pct,
                                tax_rate: existing.tax_rate,
                                courier_regency_cost: existing.courier_regency_cost,
                                courier_inter_regency_cost: existing.courier_inter_regency_cost,
                                courier_same_day_cost: existing.courier_same_day_cost,
                                courier_instant_cost: existing.courier_instant_cost,
                                target_margin_pct: existing.target_margin_pct,
                                selling_price: existing.selling_price
                              });
                            } else {
                              setCostingForm({
                                supplier_cost: 0, shipping_cost: 0, packaging_cost: 0,
                                operasional_pct: 0, tax_rate: 11,
                                courier_regency_cost: 0, courier_inter_regency_cost: 0,
                                courier_same_day_cost: 0, courier_instant_cost: 0,
                                target_margin_pct: 0, selling_price: Number(prod.price) || 0
                              });
                            }
                            setIsCostingModalOpen(true);
                          }
                        }}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-[10px] focus:outline-none focus:border-rose/50"
                      >
                        <option value="">+ Set Costing</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-5 py-3 text-left text-[9px] uppercase tracking-wider text-gray-500">Product</th>
                          <th className="px-5 py-3 text-right text-[9px] uppercase tracking-wider text-gray-500">Supplier</th>
                          <th className="px-5 py-3 text-right text-[9px] uppercase tracking-wider text-gray-500">Shipping</th>
                          <th className="px-5 py-3 text-right text-[9px] uppercase tracking-wider text-gray-500">Packaging</th>
                          <th className="px-5 py-3 text-right text-[9px] uppercase tracking-wider text-gray-500">Opr %</th>
                          <th className="px-5 py-3 text-right text-[9px] uppercase tracking-wider text-gray-500">Tax %</th>
                          <th className="px-5 py-3 text-right text-[9px] uppercase tracking-wider text-gray-500">Margin %</th>
                          <th className="px-5 py-3 text-right text-[9px] uppercase tracking-wider text-gray-500">Sell Price</th>
                          <th className="px-5 py-3 text-center text-[9px] uppercase tracking-wider text-gray-500">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {products.slice(0, 20).map(product => {
                          const costing = productCostings[product.id];
                          return (
                            <tr key={product.id} className="hover:bg-gray-50">
                              <td className="px-5 py-3 text-[10px] font-medium text-gray-900">{product.name}</td>
                              <td className="px-5 py-3 text-right text-[10px] text-gray-600">{costing ? `IDR ${costing.supplier_cost.toLocaleString('id-ID')}` : '-'}</td>
                              <td className="px-5 py-3 text-right text-[10px] text-gray-600">{costing ? `IDR ${costing.shipping_cost.toLocaleString('id-ID')}` : '-'}</td>
                              <td className="px-5 py-3 text-right text-[10px] text-gray-600">{costing ? `IDR ${costing.packaging_cost.toLocaleString('id-ID')}` : '-'}</td>
                              <td className="px-5 py-3 text-right text-[10px] text-gray-600">{costing ? `${costing.operasional_pct}%` : '-'}</td>
                              <td className="px-5 py-3 text-right text-[10px] text-gray-600">{costing ? `${costing.tax_rate}%` : '-'}</td>
                              <td className="px-5 py-3 text-right text-[10px] text-gray-600">{costing ? `${costing.target_margin_pct}%` : '-'}</td>
                              <td className="px-5 py-3 text-right text-[10px] font-medium text-gray-900">{costing ? `IDR ${costing.selling_price.toLocaleString('id-ID')}` : '-'}</td>
                              <td className="px-5 py-3 text-center">
                                <button
                                  onClick={() => {
                                    setSelectedProductForCosting(product);
                                    if (costing) {
                                      setCostingForm({
                                        supplier_cost: costing.supplier_cost,
                                        shipping_cost: costing.shipping_cost,
                                        packaging_cost: costing.packaging_cost,
                                        operasional_pct: costing.operasional_pct,
                                        tax_rate: costing.tax_rate,
                                        courier_regency_cost: costing.courier_regency_cost,
                                        courier_inter_regency_cost: costing.courier_inter_regency_cost,
                                        courier_same_day_cost: costing.courier_same_day_cost,
                                        courier_instant_cost: costing.courier_instant_cost,
                                        target_margin_pct: costing.target_margin_pct,
                                        selling_price: costing.selling_price
                                      });
                                    } else {
                                      setCostingForm({
                                        supplier_cost: 0, shipping_cost: 0, packaging_cost: 0,
                                        operasional_pct: 0, tax_rate: 11,
                                        courier_regency_cost: 0, courier_inter_regency_cost: 0,
                                        courier_same_day_cost: 0, courier_instant_cost: 0,
                                        target_margin_pct: 0, selling_price: Number(product.price) || 0
                                      });
                                    }
                                    setIsCostingModalOpen(true);
                                  }}
                                  className="px-2 py-1 text-[9px] uppercase tracking-wider bg-gray-100 text-gray-600 rounded hover:bg-rose hover:text-white transition-colors"
                                >
                                  {costing ? 'Edit' : 'Set'}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Supplier Cost Logs */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-medium text-gray-900 uppercase tracking-wide">Supplier Cost Logs</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">Recent cost changes</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-5 py-3 text-left text-[9px] uppercase tracking-wider text-gray-500">Product</th>
                          <th className="px-5 py-3 text-right text-[9px] uppercase tracking-wider text-gray-500">Before</th>
                          <th className="px-5 py-3 text-right text-[9px] uppercase tracking-wider text-gray-500">After</th>
                          <th className="px-5 py-3 text-left text-[9px] uppercase tracking-wider text-gray-500">Reason</th>
                          <th className="px-5 py-3 text-left text-[9px] uppercase tracking-wider text-gray-500">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {supplierLogs.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-5 py-8 text-center text-[10px] text-gray-400">No supplier cost changes recorded</td>
                          </tr>
                        )}
                        {supplierLogs.map(log => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-5 py-3 text-[10px] font-medium text-gray-900">{log.product_name || '—'}</td>
                            <td className="px-5 py-3 text-right text-[10px] text-gray-500">IDR {log.old_supplier_cost.toLocaleString('id-ID')}</td>
                            <td className="px-5 py-3 text-right text-[10px] font-medium text-emerald-600">IDR {log.new_supplier_cost.toLocaleString('id-ID')}</td>
                            <td className="px-5 py-3 text-[10px] text-gray-600">{log.change_reason || '-'}</td>
                            <td className="px-5 py-3 text-[10px] text-gray-500">{new Date(log.changed_at).toLocaleDateString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Promo Impact */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 uppercase tracking-wide">Promo Impact</h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">{activePromos.length} active promos</p>
                    </div>
                    <button
                      onClick={async () => {
                        const name = prompt('Promo name:');
                        if (name) {
                          const pct = Number(prompt('Discount %:') || '0');
                          const productId = prompt('Product ID (or leave empty for all):');
                          await supabase.from('promo_impact').insert({
                            product_id: productId || null,
                            promo_name: name,
                            discount_pct: pct,
                            discount_amount: 0,
                            start_date: new Date().toISOString(),
                            is_active: true
                          });
                          await fetchFinancialData();
                        }
                      }}
                      className="px-3 py-1.5 text-[9px] uppercase tracking-wider bg-rose text-white rounded-lg hover:bg-rose/90 transition-colors"
                    >
                      + Add Promo
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                          <th className="px-5 py-3 text-left text-[9px] uppercase tracking-wider text-gray-500">Promo Name</th>
                          <th className="px-5 py-3 text-left text-[9px] uppercase tracking-wider text-gray-500">Product</th>
                          <th className="px-5 py-3 text-center text-[9px] uppercase tracking-wider text-gray-500">Discount</th>
                          <th className="px-5 py-3 text-left text-[9px] uppercase tracking-wider text-gray-500">Start</th>
                          <th className="px-5 py-3 text-left text-[9px] uppercase tracking-wider text-gray-500">End</th>
                          <th className="px-5 py-3 text-center text-[9px] uppercase tracking-wider text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {activePromos.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-5 py-8 text-center text-[10px] text-gray-400">No active promos</td>
                          </tr>
                        )}
                        {activePromos.map(promo => (
                          <tr key={promo.id} className="hover:bg-gray-50">
                            <td className="px-5 py-3 text-[10px] font-medium text-gray-900">{promo.promo_name}</td>
                            <td className="px-5 py-3 text-[10px] text-gray-600">{promo.product_name || 'All Products'}</td>
                            <td className="px-5 py-3 text-center text-[10px] font-medium text-rose">{promo.discount_pct}%</td>
                            <td className="px-5 py-3 text-[10px] text-gray-500">{new Date(promo.start_date).toLocaleDateString('id-ID')}</td>
                            <td className="px-5 py-3 text-[10px] text-gray-500">{promo.end_date ? new Date(promo.end_date).toLocaleDateString('id-ID') : '—'}</td>
                            <td className="px-5 py-3 text-center">
                              <span className="text-[9px] uppercase tracking-wider px-2 py-1 bg-emerald-100 text-emerald-600 rounded-full">Active</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Transaction History */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-medium text-gray-900 uppercase tracking-wide">Recent Transactions</h3>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500">Order ID</th>
                        <th className="px-6 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500">Customer</th>
                        <th className="px-6 py-3 text-center text-[10px] uppercase tracking-wider text-gray-500">Amount</th>
                        <th className="px-6 py-3 text-center text-[10px] uppercase tracking-wider text-gray-500">Status</th>
                        <th className="px-6 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {orders.slice(0, 10).map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-mono text-sm text-gray-900">{order.id.slice(0, 12)}...</td>
                          <td className="px-6 py-4 text-sm text-gray-700">{order.shipping_address?.name || 'Guest'}</td>
                          <td className="px-6 py-4 text-center font-medium text-gray-900">IDR {order.total_price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
                          <td className="px-6 py-4 text-center">
                            <StatusBadge status={order.payment_status || order.status} />
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString('id-ID')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ===== ARCHIVAL INQUIRIES ===== */}
            {activeTab === 'messages' && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-[calc(100vh-80px)] flex gap-6"
              >
                {/* Chat List */}
                <div className="w-80 bg-white rounded-[5px] border border-ink/5 flex flex-col overflow-hidden shadow-sm">
                  <div className="p-5 border-b border-ink/5 flex items-center justify-between bg-ink/[0.01]">
                    <div>
                      <h3 className="text-[10px] font-medium text-ink uppercase tracking-[0.2em]">Customer Inquiries</h3>
                      <p className="text-[7px] text-ink/30 uppercase tracking-widest mt-1.5">{chatSessions.length} sessions active</p>
                    </div>
                    <div className="w-1.5 h-1.5 bg-rose rounded-full animate-pulse" />
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar">
                    {chatSessions.map((session) => (
                      <button
                        key={session.id}
                        onClick={() => {
                          setActiveChatSession(session);
                        }}
                        className={cn(
                          "w-full p-5 text-left border-b border-ink/[0.03] transition-all duration-300 group relative",
                          activeChatSession?.id === session.id ? "bg-ink/[0.02]" : "hover:bg-ink/[0.01]"
                        )}
                      >
                        {activeChatSession?.id === session.id && (
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-rose" />
                        )}
                        <div className="flex justify-between items-start mb-1.5">
                          <span className="text-[9px] font-medium text-ink uppercase truncate pr-4">{session.customer_name}</span>
                          <span className="text-[6px] text-ink/20 uppercase font-medium">{new Date(session.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex justify-between items-end">
                          <p className="text-[8px] text-ink/40 truncate flex-1 leading-snug lowercase tracking-tight">{session.last_message}</p>
                          {session.unread_count > 0 && (
                            <span className="bg-rose text-white text-[6px] font-medium px-1.5 py-0.5 rounded-[2px] ml-2 shrink-0">{session.unread_count}</span>
                          )}
                        </div>
                        <div className="mt-2 flex gap-1.5">
                          <span className="text-[5px] uppercase tracking-widest text-ink/20 font-medium">SPEC: {session.customer_email}</span>
                          <span className="text-[5px] uppercase tracking-widest text-ink/20 font-medium">•</span>
                          <span className="text-[5px] uppercase tracking-widest text-ink/20 font-medium">ID: {session.id.split('-')[0]}</span>
                        </div>
                      </button>
                    ))}
                    {chatSessions.length === 0 && (
                      <div className="p-12 text-center flex flex-col items-center justify-center space-y-4 opacity-20">
                        <MessageSquare size={24} strokeWidth={1} />
                        <p className="text-[8px] font-medium uppercase tracking-[0.3em] italic">No active inquiries</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 bg-white rounded-[5px] border border-ink/5 flex flex-col overflow-hidden shadow-sm">
                  {activeChatSession ? (
                    <>
                      {/* Chat Header */}
                      <div className="p-5 border-b border-ink/5 flex items-center justify-between bg-ink/[0.01]">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-ink rounded-[5px] flex items-center justify-center text-white text-[10px] font-medium">
                            {activeChatSession.customer_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-[10px] font-medium text-ink uppercase tracking-[0.2em]">{activeChatSession.customer_name}</h3>
                            <p className="text-[7px] text-ink/30 uppercase tracking-widest mt-1">Email: {activeChatSession.customer_email}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            className="px-4 py-1.5 border border-ink/10 rounded-[5px] text-[7px] font-medium uppercase tracking-widest text-ink/40 hover:text-rose hover:border-rose transition-all duration-300"
                            onClick={async () => {
                              await supabase.from('support_tickets').update({ status: 'resolved' }).eq('id', activeChatSession.id);
                              fetchChatSessions();
                              setActiveChatSession(null);
                            }}
                          >
                            Mark Resolved
                          </button>
                        </div>
                      </div>

                      {/* Messages History */}
                      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-6 bg-white">
                        {activeChatSession.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex",
                              msg.sender === 'admin' ? "justify-end" : "justify-start"
                            )}
                          >
                            <div className={cn(
                              "max-w-[70%] group",
                              msg.sender === 'admin' ? "items-end" : "items-start"
                            )}>
                              <div className={cn(
                                "p-4 rounded-[5px] text-[10px] leading-relaxed",
                                msg.sender === 'admin' 
                                  ? "bg-ink text-white shadow-lg shadow-ink/5" 
                                  : "bg-ink/[0.03] text-ink border border-ink/5"
                              )}>
                                {msg.message}
                              </div>
                              <div className={cn(
                                "mt-2 flex items-center gap-2",
                                msg.sender === 'admin' ? "flex-row-reverse" : "flex-row"
                              )}>
                                <span className="text-[6px] font-medium text-ink/20 uppercase tracking-widest">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {msg.sender === 'admin' && (
                                  <span className={cn("text-[6px] font-medium uppercase tracking-widest", msg.is_read ? "text-rose" : "text-ink/10")}>
                                    {msg.is_read ? 'PROCESSED' : 'SENT'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Input Area */}
                      <div className="p-3 border-t border-ink/5 bg-white">
                        <div className="flex items-end gap-1.5">
                          <textarea
                            rows={1}
                            value={newMessage}
                            onChange={(e) => {
                              if (e.target.value.length <= 500) {
                                setNewMessage(e.target.value);
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                sendMessage();
                              }
                            }}
                            placeholder="Type archival response..."
                            className="flex-1 bg-ink/[0.02] text-ink py-2.5 px-3.5 rounded-[5px] text-[11px] font-medium outline-none border border-ink/[0.08] placeholder:text-ink/20 transition-all focus:bg-white focus:border-rose/30 resize-none no-scrollbar min-h-[40px]"
                          />
                          <motion.button
                            whileHover={{ scale: 1.1, color: '#E8527A' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => sendMessage()}
                            className="w-7 h-10 flex items-center justify-center text-ink/10 hover:text-rose transition-all duration-300 flex-shrink-0 mb-0.5"
                          >
                            <Send size={12} strokeWidth={2.5} />
                          </motion.button>
                        </div>
                        <div className="flex justify-between items-center mt-2 px-0.5">
                          <p className="text-[5.5px] font-medium uppercase tracking-[0.4em] text-ink/15 italic">Customer Support Chat</p>
                          <p className={cn("text-[5.5px] font-medium tracking-widest uppercase", newMessage.length > 450 ? "text-rose" : "text-ink/15")}>
                            {newMessage.length}/500
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center space-y-4 opacity-20">
                      <MessageSquare size={48} strokeWidth={0.5} />
                      <p className="text-[10px] font-medium uppercase tracking-[0.5em] italic">Select inquiry to respond</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ===== CUSTOMERS ===== */}
            {activeTab === 'customers' && (
              <motion.div
                key="customers"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <div className="relative">
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
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
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
              </motion.div>
            )}
          </AnimatePresence>
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
              className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-medium text-gray-900">
                  {isEditMode ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Basic Info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Basic Information</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Product Name</label>
                      <input
                        type="text"
                        value={productForm.name}
                        onChange={(e) => handleProductNameChange(e.target.value)}
                        placeholder="Enter product name"
                        className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-rose/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-1">Slug</label>
                      <input
                        type="text"
                        value={productForm.slug}
                        onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                        placeholder="product-slug"
                        className="w-full px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-rose/50"
                      />
                    </div>
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
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">Custom Badge Text (Override Price Tag)</label>
                    <input
                      type="text"
                      value={productForm.badge_text}
                      onChange={(e) => setProductForm({ ...productForm, badge_text: e.target.value })}
                      placeholder="e.g. NEW ARRIVAL, BEST SELLER"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                    />
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
                    <span className="text-[10px] font-bold text-rose">
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
                    <span className="text-[10px] uppercase font-bold tracking-widest hidden sm:block">Print Resi</span>
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
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Order Status</p>
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
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Airway Bill / Resi</p>
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
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Destination Manifest</p>
                  <div className="text-xs leading-relaxed text-gray-800">
                    <span className="font-bold uppercase mr-2">{selectedOrder.shipping_address?.name}</span>
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
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Garment Items</p>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {selectedOrder.order_items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 text-xs">
                        <div>
                          <span className="font-bold text-gray-900">{item.product_name || 'PRODUCT'}</span>
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
                    <span className="font-bold text-rose">GRAND TOTAL</span>
                    <span className="text-sm font-bold font-mono text-rose">IDR {selectedOrder.total_price.toLocaleString('id-ID')}</span>
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
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-900">Label Preview</p>
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
                          setIsPrinting(true);
                          setTimeout(() => {
                            window.print();
                            setIsPrinting(false);
                          }, 200);
                        }}
                        className="w-full py-3 bg-black text-white font-bold text-xs uppercase tracking-widest rounded flex justify-center items-center gap-2 hover:bg-rose transition-colors"
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

      {/* DYNAMIC NATIVE PRINT STYLES */}
      {isPrinting && (
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body * { visibility: hidden !important; }
            #printable-label, #printable-label * { visibility: visible !important; }
            #printable-label { position: absolute; left: 0; top: 0; margin: 0; padding: 0; }
            @page { size: 10cm 8cm !important; margin: 0 !important; }
          }
        ` }} />
      )}

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

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    paid: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
    success: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700',
    expired: 'bg-gray-100 text-gray-700'
  };

  return (
    <span className={cn(
      "inline-flex px-2.5 py-1 text-[9px] uppercase tracking-wider rounded-full",
      styles[status] || 'bg-gray-100 text-gray-600'
    )}>
      {status}
    </span>
  );
}

// ===== CUSTOMER MODAL =====
function CustomerModal({
  isOpen,
  onClose,
  customer,
  form,
  setForm,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  form: {
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone: string;
    street: string;
    house_number: string;
    rt: string;
    rw: string;
    city: string;
    province: string;
    postal_code: string;
  };
  setForm: React.Dispatch<React.SetStateAction<{
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    phone: string;
    street: string;
    house_number: string;
    rt: string;
    rw: string;
    city: string;
    province: string;
    postal_code: string;
  }>>;
  onSave: () => void;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
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
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white px-8 py-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400">Customer Detail</p>
                <h2 className="text-xl font-medium text-gray-900">
                  {customer ? `CST-${String(customer.customer_number).padStart(3, '0')}` : 'Add New Customer'}
                </h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Basic Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="email@example.com"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+62 xxx xxxx xxxx"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">First Name</label>
                    <input
                      type="text"
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value, full_name: `${e.target.value} ${form.last_name}`.trim() })}
                      placeholder="First name"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">Last Name</label>
                    <input
                      type="text"
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value, full_name: `${form.first_name} ${e.target.value}`.trim() })}
                      placeholder="Last name"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    placeholder="Full name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                  />
                </div>
              </div>

              {/* Address Info */}
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-900 uppercase tracking-wide">Address Information</h3>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">Street Address</label>
                  <input
                    type="text"
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    placeholder="Street name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">House Number</label>
                    <input
                      type="text"
                      value={form.house_number}
                      onChange={(e) => setForm({ ...form, house_number: e.target.value })}
                      placeholder="No."
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">RT</label>
                    <input
                      type="text"
                      value={form.rt}
                      onChange={(e) => setForm({ ...form, rt: e.target.value })}
                      placeholder="001"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">RW</label>
                    <input
                      type="text"
                      value={form.rw}
                      onChange={(e) => setForm({ ...form, rw: e.target.value })}
                      placeholder="001"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">City</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="City"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">Province</label>
                    <input
                      type="text"
                      value={form.province}
                      onChange={(e) => setForm({ ...form, province: e.target.value })}
                      placeholder="Province"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">Postal Code</label>
                  <input
                    type="text"
                    value={form.postal_code}
                    onChange={(e) => setForm({ ...form, postal_code: e.target.value })}
                    placeholder="12345"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white px-8 py-6 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={onSave}
                className="flex items-center gap-2 px-6 py-2.5 bg-rose text-white rounded-lg hover:bg-rose/90"
              >
                <Save size={16} />
                <span className="text-[10px] uppercase tracking-wider">{customer ? 'Update Customer' : 'Save Customer'}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============ BARCODE CODE128 RENDERER ============
function encodeCode128(text: string): number[] {
  const CODE128_B: Record<string, number> = {};
  for (let i = 0; i < 95; i++) CODE128_B[String.fromCharCode(32 + i)] = i;
  
  const patterns: number[][] = [
    [2,1,2,2,2,2],[2,2,2,1,2,2],[2,2,2,2,2,1],[1,2,1,2,2,3],[1,2,1,3,2,2],
    [1,3,1,2,2,2],[1,2,2,2,1,3],[1,2,2,3,1,2],[1,3,2,2,1,2],[2,2,1,2,1,3],
    [2,2,1,3,1,2],[2,3,1,2,1,2],[1,1,2,2,3,2],[1,2,2,1,3,2],[1,2,2,2,3,1],
    [1,1,3,2,2,2],[1,2,3,1,2,2],[1,2,3,2,2,1],[2,2,3,2,1,1],[2,2,1,1,3,2],
    [2,2,1,2,3,1],[2,1,3,2,1,2],[2,2,3,1,1,2],[3,1,2,1,3,1],[3,1,1,2,2,2],
    [3,2,1,1,2,2],[3,2,1,2,2,1],[3,1,2,2,1,2],[3,2,2,1,1,2],[3,2,2,2,1,1],
    [2,1,2,1,2,3],[2,1,2,3,2,1],[2,3,2,1,2,1],[1,1,1,3,2,3],[1,3,1,1,2,3],
    [1,3,1,3,2,1],[1,1,2,3,1,3],[1,3,2,1,1,3],[1,3,2,3,1,1],[2,1,1,3,1,3],
    [2,3,1,1,1,3],[2,3,1,3,1,1],[1,1,2,1,3,3],[1,1,2,3,3,1],[1,3,2,1,3,1],
    [1,1,3,1,2,3],[1,1,3,3,2,1],[1,3,3,1,2,1],[3,1,3,1,2,1],[2,1,1,3,3,1],
    [2,3,1,1,3,1],[2,1,3,1,1,3],[2,1,3,3,1,1],[2,1,3,1,3,1],[3,1,1,1,2,3],
    [3,1,1,3,2,1],[3,3,1,1,2,1],[3,1,2,1,1,3],[3,1,2,3,1,1],[3,3,2,1,1,1],
    [3,1,4,1,1,1],[2,2,1,4,1,1],[4,3,1,1,1,1],[1,1,1,2,2,4],[1,1,1,4,2,2],
    [1,2,1,1,2,4],[1,2,1,4,2,1],[1,4,1,1,2,2],[1,4,1,2,2,1],[1,1,2,2,1,4],
    [1,1,2,4,1,2],[1,2,2,1,1,4],[1,2,2,4,1,1],[1,4,2,1,1,2],[1,4,2,2,1,1],
    [2,4,1,2,1,1],[2,2,1,1,1,4],[4,1,3,1,1,1],[2,4,1,1,1,2],[1,3,4,1,1,1],
    [1,1,1,2,4,2],[1,2,1,1,4,2],[1,2,1,2,4,1],[1,1,4,2,1,2],[1,2,4,1,1,2],
    [1,2,4,2,1,1],[4,1,1,2,1,2],[4,2,1,1,1,2],[4,2,1,2,1,1],[2,1,2,1,4,1],
    [2,1,4,1,2,1],[4,1,2,1,2,1],[1,1,1,1,4,3],[1,1,1,3,4,1],[1,3,1,1,4,1],
    [1,1,4,1,1,3],[1,1,4,3,1,1],[4,1,1,1,1,3],[4,1,1,3,1,1],[1,1,3,1,4,1],
    [1,1,4,1,3,1],[3,1,1,1,4,1],[4,1,1,1,3,1],[2,1,1,4,1,2],[2,1,1,2,1,4],
    [2,1,1,2,3,2],[2,3,3,1,1,1,2]
  ];
  
  const startCode = 104; // Start B
  const bars: number[] = [...patterns[startCode]];
  let checksum = startCode;
  
  for (let i = 0; i < text.length; i++) {
    const charVal = CODE128_B[text[i]] ?? 0;
    bars.push(...patterns[charVal]);
    checksum += charVal * (i + 1);
  }
  
  bars.push(...patterns[checksum % 103]);
  bars.push(...patterns[106]); // Stop
  
  return bars;
}

function BarcodeCode128({ value, width = 280, height = 50 }: { value: string; width?: number; height?: number }) {
  if (!value) return null;
  const bars = encodeCode128(value);
  const totalUnits = bars.reduce((s, b) => s + b, 0);
  const unitW = width / totalUnits;
  
  let x = 0;
  const rects: React.ReactElement[] = [];
  bars.forEach((w, i) => {
    if (i % 2 === 0) {
      rects.push(<rect key={i} x={x} y={0} width={w * unitW} height={height} fill="black" />);
    }
    x += w * unitW;
  });
  
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      {rects}
    </svg>
  );
}

// ============ COURIER LOGO MAPPING ============
const COURIER_LOGOS: Record<string, string> = {
  'jne': 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Logo_JNE.png',
  'jne reg': 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Logo_JNE.png',
  'jne yes': 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Logo_JNE.png',
  'jne oke': 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Logo_JNE.png',
  'sicepat': 'https://upload.wikimedia.org/wikipedia/commons/5/54/Logo-SiCepat.png',
  'sicepat best': 'https://upload.wikimedia.org/wikipedia/commons/5/54/Logo-SiCepat.png',
  'sicepat reg': 'https://upload.wikimedia.org/wikipedia/commons/5/54/Logo-SiCepat.png',
  'j&t': 'https://upload.wikimedia.org/wikipedia/commons/3/35/Logo_J%26T_Express.png',
  'j&t express': 'https://upload.wikimedia.org/wikipedia/commons/3/35/Logo_J%26T_Express.png',
  'anteraja': 'https://upload.wikimedia.org/wikipedia/commons/b/b9/Anteraja.png',
  'pos': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Pos_Indonesia_logo.png',
  'pos indonesia': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Pos_Indonesia_logo.png',
  'ninja': 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Ninja_Van_Logo.png',
  'ninja express': 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Ninja_Van_Logo.png',
};

function getCourierLogo(courier: string | null): string | null {
  if (!courier) return null;
  const key = courier.toLowerCase().trim();
  for (const [k, v] of Object.entries(COURIER_LOGOS)) {
    if (key.includes(k)) return v;
  }
  return null;
}

function getCourierService(courier: string | null): { name: string; service: string } {
  if (!courier) return { name: 'STANDARD', service: 'REG' };
  const parts = courier.split(' ');
  return {
    name: parts[0]?.toUpperCase() || 'STANDARD',
    service: parts.slice(1).join(' ').toUpperCase() || 'REG'
  };
}

// ===== SHIPPING LABEL COMPONENT =====
function ShippingLabel({ order }: { order: Order }) {
  const courierInfo = getCourierService(order.courier);
  const courierLogo = getCourierLogo(order.courier);
  const trackingId = order.tracking_id || '';
  const totalItems = order.order_items?.reduce((s, i) => s + i.quantity, 0) || 0;
  const totalWeight = totalItems * 300; // est. 300g per item

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '10cm',
      height: '8cm',
      fontFamily: "'Courier New', 'Consolas', monospace",
      fontSize: '9px',
      backgroundColor: 'white',
      color: 'black',
      padding: '0',
      boxSizing: 'border-box',
      border: '2px solid black',
      overflow: 'hidden',
      lineHeight: 1.3
    }}>
      {/* ROW 1 — Header: NINOC brand + Courier logo/name + Service */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 8px',
        borderBottom: '2px solid black',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 'bold', fontStyle: 'italic', letterSpacing: '1px' }}>NINOC</span>
          <span style={{ fontSize: '8px', color: '#666' }}>ARCHIVE</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {courierLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={courierLogo} alt={courierInfo.name} style={{ height: '20px', objectFit: 'contain' }} />
          )}
          {!courierLogo && (
            <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{courierInfo.name}</span>
          )}
          <span style={{
            fontSize: '9px',
            fontWeight: 'bold',
            backgroundColor: 'black',
            color: 'white',
            padding: '2px 6px',
            letterSpacing: '1px'
          }}>{courierInfo.service}</span>
        </div>
      </div>

      {/* ROW 2 — Barcode + Tracking Number */}
      <div style={{
        padding: '8px 6px',
        borderBottom: '2px solid black',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1
      }}>
        {trackingId ? (
          <>
            <BarcodeCode128 value={trackingId} width={340} height={45} />
            <div style={{
              fontWeight: 'bold',
              fontSize: '13px',
              letterSpacing: '3px',
              marginTop: '4px'
            }}>{trackingId}</div>
          </>
        ) : (
          <div style={{
            fontWeight: 'bold',
            fontSize: '11px',
            padding: '12px 0',
            color: '#999',
            letterSpacing: '1px',
            border: '2px dashed #ccc',
            width: '80%'
          }}>AWAITING TRACKING NUMBER</div>
        )}
      </div>

      {/* ROW 3 — Penerima + Pengirim (side by side) */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid black',
        flex: 1.2
      }}>
        {/* Penerima (larger, left) */}
        <div style={{
          flex: 3,
          padding: '6px 8px',
          borderRight: '2px solid black',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{
            fontSize: '8px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            marginBottom: '4px',
            backgroundColor: '#e0e0e0',
            padding: '2px 4px',
            display: 'inline-block',
            alignSelf: 'flex-start'
          }}>PENERIMA / TO</div>
          <div style={{ fontWeight: 'bold', fontSize: '12px', marginTop: '2px' }}>
            {order.shipping_address?.name?.toUpperCase()}
          </div>
          <div style={{ fontSize: '10px', marginTop: '2px' }}>
            {order.shipping_address?.phone ? (
              order.shipping_address.phone.length > 6
                ? order.shipping_address.phone.slice(0, 4) + '****' + order.shipping_address.phone.slice(-3)
                : order.shipping_address.phone
            ) : ''}
          </div>
          <div style={{ fontSize: '9px', marginTop: '4px', wordBreak: 'break-word', overflow: 'hidden' }}>
            {order.shipping_address?.address}
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '10px', marginTop: '2px' }}>
            {order.shipping_address?.city}, {order.shipping_address?.province || ''} {order.shipping_address?.postal_code}
          </div>
        </div>
        {/* Pengirim (smaller, right) */}
        <div style={{
          flex: 2,
          padding: '6px 8px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{
            fontSize: '8px',
            fontWeight: 'bold',
            letterSpacing: '1px',
            marginBottom: '4px',
            backgroundColor: '#e0e0e0',
            padding: '2px 4px',
            display: 'inline-block',
            alignSelf: 'flex-start'
          }}>PENGIRIM / FROM</div>
          <div style={{ fontWeight: 'bold', fontSize: '10px', marginTop: '2px' }}>NINOC STUDIO</div>
          <div style={{ fontSize: '9px', marginTop: '2px' }}>0812-XXXX-XXXX</div>
          <div style={{ fontSize: '9px', marginTop: '4px' }}>Bandung, Jawa Barat</div>
          <div style={{ fontWeight: 'bold', fontSize: '9px' }}>40115</div>
        </div>
      </div>

      {/* ROW 4 — Package Info + Order ID */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid black',
        flex: 0.8
      }}>
        {/* Isi Paket */}
        <div style={{
          flex: 3,
          padding: '6px 8px',
          borderRight: '2px solid black',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: '8px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '2px' }}>ISI PAKET / CONTENTS</div>
          {order.order_items?.slice(0, 3).map((item, idx) => (
            <div key={idx} style={{ fontSize: '9px' }}>
              {item.product_name} {item.size ? `(${item.size})` : ''} ×{item.quantity}
            </div>
          ))}
          {(order.order_items?.length || 0) > 3 && (
            <div style={{ fontSize: '8px', color: '#666', marginTop: '2px' }}>+{(order.order_items?.length || 0) - 3} item lainnya</div>
          )}
        </div>
        {/* Order ID + Weight */}
        <div style={{
          flex: 2,
          padding: '6px 8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: '8px', fontWeight: 'bold', letterSpacing: '1px' }}>ORDER ID</div>
          <div style={{ fontWeight: 'bold', fontSize: '12px', letterSpacing: '1px', marginTop: '2px' }}>
            #{order.id.slice(0, 8).toUpperCase()}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '6px', fontSize: '8px', fontWeight: 'bold' }}>
            <span>Qty: {totalItems}</span>
            <span>~{totalWeight}g</span>
          </div>
        </div>
      </div>

      {/* ROW 5 — Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 8px',
        fontSize: '8px',
        color: '#444'
      }}>
        <span>{new Date(order.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        <span style={{ letterSpacing: '0.5px' }}>NINOC ARCHIVE • BANDUNG, INDONESIA</span>
        <span style={{
          fontWeight: 'bold',
          backgroundColor: 'black',
          color: 'white',
          padding: '1px 4px',
          fontSize: '8px'
        }}>FRAGILE</span>
      </div>
    </div>
  );
}