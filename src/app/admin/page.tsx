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
  Upload
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
  price: number;
  category: string;
  image_url: string | null;
  is_featured: boolean;
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
  postal_code: string;
}

interface FinanceSummary {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  pendingPayments: number;
  completedOrders: number;
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
  badge
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: number;
}) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center justify-between px-6 py-3.5 transition-all duration-200 border-b border-ink/5",
      active ? "bg-rose text-white" : "text-ink/50 hover:bg-ink/5 hover:text-ink"
    )}
  >
    <div className="flex items-center gap-3">
      <Icon size={16} className={cn(active ? "text-white" : "text-current")} />
      <span className="text-[10px] font-medium uppercase tracking-[0.3em]">{label}</span>
    </div>
    {badge !== undefined && badge > 0 && (
      <span className={cn(
        "text-[8px] px-2 py-0.5 rounded-full",
        active ? "bg-white/20 text-white" : "bg-rose/10 text-rose"
      )}>
        {badge}
      </span>
    )}
  </button>
);

// ============ MAIN ADMIN DASHBOARD ============
export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form states
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    category: 'pakaian',
    image_url: '',
    is_featured: false,
    variants: [{ size: 'S', color: 'Black', stock_quantity: 0 }]
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
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ name: string; url: string; error?: string }[] | null>(null);
  const [bulkProductLink, setBulkProductLink] = useState(''); // product name to link images to

  // Chat states
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatSession, setActiveChatSession] = useState<ChatSession | null>(null);
  const [newMessage, setNewMessage] = useState('');

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

        const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total_price, 0);
        const todayRevenue = completedOrders
          .filter(o => new Date(o.created_at) >= today)
          .reduce((sum, o) => sum + o.total_price, 0);
        const monthRevenue = completedOrders
          .filter(o => new Date(o.created_at) >= monthStart)
          .reduce((sum, o) => sum + o.total_price, 0);

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
    });
  }, [fetchData]);

  // Product CRUD
  const openProductModal = (product?: Product) => {
    if (product) {
      setIsEditMode(true);
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        slug: product.slug,
        description: product.description || '',
        price: product.price.toString(),
        category: product.category,
        image_url: product.image_url || '',
        is_featured: product.is_featured,
        variants: product.variants?.length ? product.variants.map(v => ({
          size: v.size || '',
          color: v.color || '',
          stock_quantity: v.stock_quantity
        })) : [{ size: 'S', color: 'Black', stock_quantity: 0 }]
      });
    } else {
      setIsEditMode(false);
      setEditingProduct(null);
      setProductForm({
        name: '',
        slug: '',
        description: '',
        price: '',
        category: 'pakaian',
        image_url: '',
        is_featured: false,
        variants: [{ size: 'S', color: 'Black', stock_quantity: 0 }]
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
      variants: [...productForm.variants, { size: '', color: '', stock_quantity: 0 }]
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

  const saveProduct = async () => {
    try {
      const productData = {
        name: productForm.name,
        slug: productForm.slug,
        description: productForm.description,
        price: parseInt(productForm.price),
        category: productForm.category,
        image_url: productForm.image_url || null,
        is_featured: productForm.is_featured,
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

      // Save variants
      await supabase.from('variants').delete().eq('product_id', productId);

      const variantsToInsert = productForm.variants.map(v => ({
        product_id: productId,
        size: v.size || null,
        color: v.color || null,
        stock_quantity: parseInt(v.stock_quantity.toString()) || 0,
        created_at: new Date().toISOString()
      }));

      await supabase.from('variants').insert(variantsToInsert);

      setIsProductModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product');
    }
  };

  const handleProductImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploadingProductImage(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `product-${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Try uploading to 'products' first
      let uploadResult = await supabase.storage
        .from('products')
        .upload(filePath, file);

      let bucketName = 'products';

      // Fallback to 'avatars' if 'products' bucket is not found
      if (uploadResult.error && uploadResult.error.message.includes('Bucket not found')) {
        console.warn("Bucket 'products' not found. Falling back to 'avatars'.");
        uploadResult = await supabase.storage
          .from('avatars')
          .upload(filePath, file);
        bucketName = 'avatars';
        
        if (uploadResult.error) {
          throw uploadResult.error;
        } else {
          alert("Note: Bucket 'products' was not found in your Supabase storage, so the image was successfully uploaded to 'avatars' instead. We recommend creating a public bucket named 'products' in your Supabase Dashboard.");
        }
      } else if (uploadResult.error) {
        throw uploadResult.error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      setProductForm({ ...productForm, image_url: publicUrl });
    } catch (err) {
      const error = err as Error;
      alert('Error uploading image: ' + error.message);
    } finally {
      setIsUploadingProductImage(false);
    }
  };

  // ===== BULK UPLOAD HANDLER =====
  const handleBulkImageUpload = async () => {
    if (bulkFiles.length === 0) return;
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

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setBulkResults(data.results);

      // Update product with first successful image
      const firstSuccess = data.results.find((r: { url: string; error?: string }) => r.url);
      if (firstSuccess) {
        setProductForm(prev => ({ ...prev, image_url: firstSuccess.url }));
        // Pre-fill product name from linked name if provided
        if (bulkProductLink.trim()) {
          setProductForm(prev => ({
            ...prev,
            name: bulkProductLink.trim(),
            slug: bulkProductLink.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
          }));
        }
        setActiveTab('products');
        setBulkUploadOpen(false);
      }
    } catch (err) {
      alert('Bulk upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setBulkUploading(false);
    }
  };

  const openBulkUpload = () => {
    setBulkFiles([]);
    setBulkResults(null);
    setBulkProductLink('');
    setBulkUploadOpen(true);
    setActiveTab('overview');
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
      // Save to database
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
    <main className="min-h-screen bg-gray-50/50 flex overflow-hidden">
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
      <aside className="hidden md:flex w-72 bg-white border-r border-gray-100 flex-col z-50">
        <div className="p-8 border-b border-gray-100">
          <div className="font-display font-medium text-2xl italic tracking-tighter text-rose uppercase leading-none">NINOC</div>
          <p className="text-[8px] uppercase tracking-[0.4em] text-gray-300 mt-2">Admin Control Center</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-6">
          <div className="px-8 mb-4">
            <p className="text-[8px] uppercase tracking-[0.3em] text-gray-300">Dashboard</p>
          </div>
          <SidebarItem icon={LayoutDashboard} label="Overview" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />

          <div className="px-8 mt-8 mb-4">
            <p className="text-[8px] uppercase tracking-[0.3em] text-gray-300">Catalog</p>
          </div>
          <SidebarItem
            icon={Package}
            label="Products"
            active={activeTab === 'products'}
            onClick={() => setActiveTab('products')}
            badge={products.length}
          />
          <SidebarItem
            icon={Upload}
            label="Upload Images"
            active={activeTab === 'upload'}
            onClick={() => openBulkUpload()}
          />
          <SidebarItem
            icon={Box}
            label="Inventory"
            active={activeTab === 'inventory'}
            onClick={() => setActiveTab('inventory')}
            badge={totalStock}
          />
          <SidebarItem
            icon={Users}
            label="Customers"
            active={activeTab === 'customers'}
            onClick={() => setActiveTab('customers')}
            badge={customers.length}
          />

          <div className="px-8 mt-8 mb-4">
            <p className="text-[8px] uppercase tracking-[0.3em] text-gray-300">Operations</p>
          </div>
          <SidebarItem
            icon={ShoppingCart}
            label="Orders"
            active={activeTab === 'orders'}
            onClick={() => setActiveTab('orders')}
            badge={pendingOrders}
          />
          <SidebarItem
            icon={Truck}
            label="Logistics"
            active={activeTab === 'logistics'}
            onClick={() => setActiveTab('logistics')}
          />

          <div className="px-8 mt-8 mb-4">
            <p className="text-[8px] uppercase tracking-[0.3em] text-gray-300">Finance</p>
          </div>
          <SidebarItem
            icon={DollarSign}
            label="Finance"
            active={activeTab === 'finance'}
            onClick={() => setActiveTab('finance')}
          />

          <div className="px-8 mt-8 mb-4">
            <p className="text-[8px] uppercase tracking-[0.3em] text-gray-300">Support</p>
          </div>
          <SidebarItem
            icon={MessageSquare}
            label="Messages"
            active={activeTab === 'messages'}
            onClick={() => setActiveTab('messages')}
            badge={totalUnreadChats}
          />
        </nav>

        <div className="p-6 border-t border-gray-100">
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          >
            <LogOut size={16} />
            <span className="text-[10px] uppercase tracking-wider">Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden pt-14 md:pt-0">
        {/* Desktop Header */}
        <header className="hidden md:flex h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[10px] uppercase tracking-wider text-gray-300">NINOC /</span>
            <h1 className="text-lg font-medium text-gray-900 uppercase tracking-wide">
              {activeTab}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] uppercase tracking-widest text-emerald-600">System Active</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <section className="flex-1 overflow-y-auto p-4 md:p-8">
          <AnimatePresence mode="wait">
            {/* ===== OVERVIEW ===== */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                  {[
                    { label: 'Total Revenue', value: `Rp ${finance.totalRevenue.toLocaleString('id-ID')}`, icon: TrendingUp, color: 'bg-rose/10 text-rose' },
                    { label: 'Today Revenue', value: `Rp ${finance.todayRevenue.toLocaleString('id-ID')}`, icon: DollarSign, color: 'bg-emerald-500/10 text-emerald-600' },
                    { label: 'Total Products', value: products.length.toString(), icon: Package, color: 'bg-blue-500/10 text-blue-600' },
                    { label: 'Pending Orders', value: pendingOrders.toString(), icon: Clock, color: 'bg-amber-500/10 text-amber-600' }
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-xl p-6 border border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", stat.color)}>
                          <stat.icon size={18} />
                        </div>
                      </div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
                      <p className="text-xl font-semibold text-gray-900">{stat.value}</p>
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
                            <p className="text-sm font-medium">Rp {order.total_price.toLocaleString('id-ID')}</p>
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
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Products</h2>
                    <p className="text-sm text-gray-500">{products.length} items in catalog</p>
                  </div>
                  <button
                    onClick={() => openProductModal()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-rose text-white rounded-lg hover:bg-rose/90 transition-colors"
                  >
                    <Plus size={16} />
                    <span className="text-[10px] uppercase tracking-wider">Add Product</span>
                  </button>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                  />
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] uppercase tracking-wider text-gray-400">{product.category}</span>
                          <span className="text-[10px] uppercase tracking-wider text-rose">{product.variants?.length || 0} variants</span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-1">{product.name}</h3>
                        <p className="text-lg font-semibold text-gray-900">Rp {product.price.toLocaleString('id-ID')}</p>
                        <p className="text-[10px] text-gray-400 mt-2 line-clamp-2">{product.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ===== BULK UPLOAD ===== */}
            {bulkUploadOpen && (
              <motion.div
                key="bulk-upload"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Upload Images</h2>
                    <p className="text-sm text-gray-500">
                      {bulkFiles.length > 0
                        ? `${bulkFiles.length} file${bulkFiles.length > 1 ? 's' : ''} selected`
                        : 'Batch upload up to 1000 images per batch'}
                    </p>
                  </div>
                  <button
                    onClick={() => setBulkUploadOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
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
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {bulkResults.map((r, i) => (
                        <div key={i} className={cn(
                          "flex items-center justify-between px-3 py-2 rounded-lg text-[10px]",
                          r.error ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
                        )}>
                          <span className="truncate flex-1 mr-4">{r.name}</span>
                          <span className="font-medium">{r.error ? 'FAILED' : 'OK'}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => setBulkResults(null)}
                      className="mt-3 text-[10px] uppercase tracking-wider text-gray-400 hover:text-gray-600"
                    >
                      Clear Results
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
            {activeTab === 'inventory' && (
              <motion.div
                key="inventory"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Inventory</h2>
                    <p className="text-sm text-gray-500">Stock management for all products</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="px-4 py-2 bg-white rounded-lg border border-gray-200">
                      <span className="text-[10px] uppercase tracking-wider text-gray-400">Total Stock: </span>
                      <span className="font-semibold text-gray-900">{totalStock}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500">Product</th>
                        <th className="px-6 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500">Size</th>
                        <th className="px-6 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500">Color</th>
                        <th className="px-6 py-3 text-center text-[10px] uppercase tracking-wider text-gray-500">Stock</th>
                        <th className="px-6 py-3 text-center text-[10px] uppercase tracking-wider text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {products.flatMap(p =>
                        (p.variants || []).map((v, idx) => (
                          <tr key={`${p.id}-${v.id || idx}`} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                  {p.image_url && <Image src={p.image_url} alt="" width={40} height={40} className="object-cover" />}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                                  <p className="text-[10px] text-gray-400">{p.category}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">{v.size || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{v.color || '-'}</td>
                            <td className="px-6 py-4 text-center">
                              <span className={cn(
                                "inline-flex items-center justify-center w-10 h-10 rounded-full font-semibold",
                                v.stock_quantity > 10 ? "bg-emerald-100 text-emerald-700" :
                                v.stock_quantity > 0 ? "bg-amber-100 text-amber-700" :
                                "bg-red-100 text-red-700"
                              )}>
                                {v.stock_quantity}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {v.stock_quantity === 0 ? (
                                <span className="text-[9px] uppercase tracking-wider px-2 py-1 bg-red-100 text-red-600 rounded">Out of Stock</span>
                              ) : v.stock_quantity < 5 ? (
                                <span className="text-[9px] uppercase tracking-wider px-2 py-1 bg-amber-100 text-amber-600 rounded">Low Stock</span>
                              ) : (
                                <span className="text-[9px] uppercase tracking-wider px-2 py-1 bg-emerald-100 text-emerald-600 rounded">In Stock</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ===== ORDERS ===== */}
            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Orders</h2>
                    <p className="text-sm text-gray-500">{orders.length} total orders</p>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search orders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500">Order ID</th>
                        <th className="px-6 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500">Customer</th>
                        <th className="px-6 py-3 text-left text-[10px] uppercase tracking-wider text-gray-500">Date</th>
                        <th className="px-6 py-3 text-center text-[10px] uppercase tracking-wider text-gray-500">Amount</th>
                        <th className="px-6 py-3 text-center text-[10px] uppercase tracking-wider text-gray-500">Status</th>
                        <th className="px-6 py-3 text-center text-[10px] uppercase tracking-wider text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <span className="font-mono text-sm text-gray-900">{order.id.slice(0, 12)}...</span>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-medium text-gray-900">{order.shipping_address?.name || 'Guest'}</p>
                            <p className="text-[10px] text-gray-400">{order.shipping_address?.city || '-'}</p>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(order.created_at).toLocaleDateString('id-ID')}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="font-semibold text-gray-900">Rp {order.total_price.toLocaleString('id-ID')}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => openOrderDetail(order)}
                              className="px-3 py-1.5 text-[10px] uppercase tracking-wider bg-gray-100 text-gray-600 rounded hover:bg-rose hover:text-white transition-colors"
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {/* ===== LOGISTICS ===== */}
            {activeTab === 'logistics' && (
              <motion.div
                key="logistics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Logistics</h2>
                  <p className="text-sm text-gray-500">Track and manage shipments</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Pending Shipments */}
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h3 className="font-medium text-gray-900 uppercase tracking-wide">Pending Shipments</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {orders.filter(o => o.status === 'paid').map((order) => (
                        <div key={order.id} className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="font-mono text-sm text-gray-900">{order.id.slice(0, 12)}...</p>
                              <p className="text-sm text-gray-600">{order.shipping_address?.name}</p>
                            </div>
                            <span className="text-[9px] uppercase tracking-wider px-2 py-1 bg-amber-100 text-amber-600 rounded">
                              Awaiting Shipment
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">{order.shipping_address?.city}</p>
                            <button
                              onClick={() => openOrderDetail(order)}
                              className="text-[10px] uppercase tracking-wider text-rose"
                            >
                              Process Shipment
                            </button>
                          </div>
                        </div>
                      ))}
                      {orders.filter(o => o.status === 'paid').length === 0 && (
                        <div className="p-12 text-center text-gray-400">
                          <Truck size={32} className="mx-auto mb-3 opacity-30" />
                          <p className="text-sm">No pending shipments</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* In Transit */}
                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                      <h3 className="font-medium text-gray-900 uppercase tracking-wide">In Transit</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {orders.filter(o => o.status === 'shipped').map((order) => (
                        <div key={order.id} className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <p className="font-mono text-sm text-gray-900">{order.id.slice(0, 12)}...</p>
                              <p className="text-sm text-gray-600">{order.shipping_address?.name}</p>
                            </div>
                            <span className="text-[9px] uppercase tracking-wider px-2 py-1 bg-blue-100 text-blue-600 rounded">
                              Shipped
                            </span>
                          </div>
                          {order.tracking_id && (
                            <p className="text-sm text-gray-500 mb-3">Tracking: {order.tracking_id}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">{order.courier || 'Standard'}</p>
                            <button
                              onClick={() => openOrderDetail(order)}
                              className="text-[10px] uppercase tracking-wider text-rose"
                            >
                              Update Status
                            </button>
                          </div>
                        </div>
                      ))}
                      {orders.filter(o => o.status === 'shipped').length === 0 && (
                        <div className="p-12 text-center text-gray-400">
                          <Truck size={32} className="mx-auto mb-3 opacity-30" />
                          <p className="text-sm">No shipments in transit</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ===== FINANCE ===== */}
            {activeTab === 'finance' && (
              <motion.div
                key="finance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Finance</h2>
                  <p className="text-sm text-gray-500">Financial overview and reports</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-rose to-rose/80 rounded-xl p-6 text-white">
                    <p className="text-[10px] uppercase tracking-widest opacity-70">Total Revenue</p>
                    <p className="text-3xl font-bold mt-2">Rp {finance.totalRevenue.toLocaleString('id-ID')}</p>
                    <p className="text-[10px] opacity-70 mt-4">{finance.completedOrders} completed orders</p>
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400">This Month</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">Rp {finance.monthRevenue.toLocaleString('id-ID')}</p>
                    <p className="text-[10px] text-gray-500 mt-4">
                      {orders.filter(o => new Date(o.created_at) >= new Date(new Date().getFullYear(), new Date().getMonth(), 1)).length} orders this month
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-6 border border-gray-100">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400">Pending Payments</p>
                    <p className="text-2xl font-bold text-amber-600 mt-2">{finance.pendingPayments}</p>
                    <p className="text-[10px] text-gray-500 mt-4">Awaiting confirmation</p>
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
                          <td className="px-6 py-4 text-center font-semibold text-gray-900">Rp {order.total_price.toLocaleString('id-ID')}</td>
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
                className="h-[calc(100vh-160px)] flex gap-6"
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
                            <span className="bg-rose text-white text-[6px] font-bold px-1.5 py-0.5 rounded-[2px] ml-2 shrink-0">{session.unread_count}</span>
                          )}
                        </div>
                        <div className="mt-2 flex gap-1.5">
                          <span className="text-[5px] uppercase tracking-widest text-ink/20 font-bold">SPEC: {session.customer_email}</span>
                          <span className="text-[5px] uppercase tracking-widest text-ink/20 font-bold">•</span>
                          <span className="text-[5px] uppercase tracking-widest text-ink/20 font-bold">ID: {session.id.split('-')[0]}</span>
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
                            <p className="text-[7px] text-ink/30 uppercase tracking-widest mt-1">Origin Spec: {activeChatSession.customer_email}</p>
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
                                  <span className={cn("text-[6px] font-bold uppercase tracking-widest", msg.is_read ? "text-rose" : "text-ink/10")}>
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
                          <p className="text-[5.5px] font-medium uppercase tracking-[0.4em] text-ink/15 italic">Studio Response Channel</p>
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
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Customer Records</h2>
                    <p className="text-sm text-gray-500">{customers.length} registered members</p>
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
                        postal_code: ''
                      });
                      setIsCustomerModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 bg-rose text-white rounded-lg hover:bg-rose/90 transition-colors"
                  >
                    <Plus size={16} />
                    <span className="text-[10px] uppercase tracking-wider">Add Customer</span>
                  </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-4 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rose/10 rounded-lg flex items-center justify-center">
                        <Users size={18} className="text-rose" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400">Total Members</p>
                        <p className="text-lg font-semibold text-gray-900">{customers.length}</p>
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
                        <p className="text-lg font-semibold text-gray-900">{customers.filter(c => c.is_verified).length}</p>
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
                        <p className="text-lg font-semibold text-gray-900">Rp {(customers.reduce((sum, c) => sum + (c.total_spent || 0), 0)).toLocaleString('id-ID')}</p>
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
                        <p className="text-lg font-semibold text-gray-900">{customers.reduce((sum, c) => sum + (c.total_orders || 0), 0)}</p>
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
                              <span className="font-mono text-sm font-semibold text-rose">CST-{String(customer.customer_number).padStart(3, '0')}</span>
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
                              <span className="font-semibold text-gray-900">{customer.total_orders || 0}</span>
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
            onClick={() => setIsProductModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {isEditMode ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button onClick={() => setIsProductModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Basic Information</h3>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">Product Name</label>
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => handleProductNameChange(e.target.value)}
                      placeholder="Enter product name"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">Slug</label>
                    <input
                      type="text"
                      value={productForm.slug}
                      onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                      placeholder="product-slug"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">Price (IDR)</label>
                      <input
                        type="number"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        placeholder="0"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">Category</label>
                      <select
                        value={productForm.category}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                      >
                        <option value="pakaian">Pakaian</option>
                        <option value="utilities">Utilities</option>
                        <option value="aksesoris">Aksesoris</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-gray-500 mb-2">Description</label>
                    <textarea
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Product description..."
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50 resize-none"
                    />
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

                {/* Variants */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Variants & Stock</h3>
                    <button
                      onClick={addVariant}
                      className="flex items-center gap-1 px-3 py-1.5 text-[10px] uppercase tracking-wider bg-gray-100 text-gray-600 rounded hover:bg-rose hover:text-white"
                    >
                      <Plus size={12} /> Add Variant
                    </button>
                  </div>

                  <div className="space-y-3">
                    {productForm.variants.map((variant, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                        <input
                          type="text"
                          value={variant.size}
                          onChange={(e) => updateVariant(idx, 'size', e.target.value)}
                          placeholder="Size"
                          className="w-24 px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-rose/50"
                        />
                        <input
                          type="text"
                          value={variant.color || ''}
                          onChange={(e) => updateVariant(idx, 'color', e.target.value)}
                          placeholder="Color"
                          className="w-32 px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-rose/50"
                        />
                        <input
                          type="number"
                          value={variant.stock_quantity}
                          onChange={(e) => updateVariant(idx, 'stock_quantity', e.target.value)}
                          placeholder="Stock"
                          className="w-24 px-3 py-2 border border-gray-200 rounded text-sm focus:outline-none focus:border-rose/50"
                        />
                        <button
                          onClick={() => removeVariant(idx)}
                          className="p-2 text-gray-400 hover:text-red-500"
                        >
                          <Minus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white px-8 py-6 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-6 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProduct}
                  className="flex items-center gap-2 px-6 py-2.5 bg-rose text-white rounded-lg hover:bg-rose/90"
                >
                  <Save size={16} />
                  <span className="text-[10px] uppercase tracking-wider">{isEditMode ? 'Update Product' : 'Save Product'}</span>
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
            className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-end"
            onClick={() => setIsOrderModalOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-xl h-full bg-white overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white px-8 py-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">Order Detail</p>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedOrder.id.slice(0, 12)}...</h2>
                </div>
                <button onClick={() => setIsOrderModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Status */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Order Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {['pending', 'paid', 'shipped', 'delivered', 'cancelled'].map((status) => (
                      <button
                        key={status}
                        onClick={() => updateOrderStatus(selectedOrder.id, status as OrderStatus)}
                        className={cn(
                          "px-4 py-2 text-[10px] uppercase tracking-wider rounded-lg border transition-colors",
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
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Tracking Number</h3>
                  <input
                    type="text"
                    defaultValue={selectedOrder.tracking_id || ''}
                    onBlur={(e) => updateTrackingId(selectedOrder.id, e.target.value)}
                    placeholder="Enter tracking number"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                  />
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.order_items?.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{item.product_name || 'Product'}</p>
                          <p className="text-sm text-gray-500">Size: {item.size || '-'} | Qty: {item.quantity}</p>
                        </div>
                        <p className="font-semibold">Rp {item.price_at_purchase.toLocaleString('id-ID')}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Shipping */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Shipping Address</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{selectedOrder.shipping_address?.name}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.shipping_address?.phone}</p>
                    <p className="text-sm text-gray-600 mt-2">{selectedOrder.shipping_address?.address}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.postal_code}</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total</span>
                    <span className="text-xl font-bold text-gray-900">Rp {selectedOrder.total_price.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>
            </motion.div>
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
          onClick={onClose}
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
                <h2 className="text-xl font-semibold text-gray-900">
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
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Basic Information</h3>

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
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Address Information</h3>

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