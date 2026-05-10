"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Package, ShoppingCart, Plus, Search,
  TrendingUp, Box, LogOut, X, Save, Paperclip,
  Truck, Trash2, Edit2, Eye, ToggleLeft, ToggleRight,
  Clock, DollarSign, Minus, RefreshCw,
  MessageSquare, Send, User
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

interface SidebarSection {
  title: string;
  items: { icon: React.ElementType; label: string; badge?: number }[];
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
  const [isLoading, setIsLoading] = useState(true);

  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

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

  // Order detail
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Chat states
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatSession, setActiveChatSession] = useState<ChatSession | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

        const completedOrders = orderData.filter(o => o.status === 'delivered' || o.status === 'shipped');
        const pendingOrders = orderData.filter(o => o.payment_status === 'pending');

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

  // Chat - fetch from support_tickets
  const fetchChatSessions = useCallback(async () => {
    try {
      const { data: tickets } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (tickets) {
        const sessions: ChatSession[] = tickets.slice(0, 5).map((t, idx) => ({
          id: t.id,
          customer_name: `Customer ${idx + 1}`,
          customer_email: `customer${idx + 1}@email.com`,
          last_message: t.subject || 'New inquiry',
          last_message_time: t.created_at,
          unread_count: t.status === 'open' ? Math.floor(Math.random() * 3) + 1 : 0,
          status: t.status === 'resolved' ? 'resolved' : 'open',
          messages: [
            {
              id: '1',
              sender: 'customer',
              message: t.message || 'Hello, I have a question about my order.',
              timestamp: t.created_at,
              is_read: true
            },
            {
              id: '2',
              sender: 'admin',
              message: 'Thank you for reaching out! How can we help you today?',
              timestamp: new Date(new Date(t.created_at).getTime() + 300000).toISOString(),
              is_read: true
            }
          ]
        }));
        setChatSessions(sessions);
      }
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchChatSessions();
    });
  }, [fetchChatSessions]);

  const totalUnreadChats = chatSessions.reduce((sum, s) => sum + s.unread_count, 0);

  const sendMessage = () => {
    if (!newMessage.trim() || !activeChatSession) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: 'admin',
      message: newMessage,
      timestamp: new Date().toISOString(),
      is_read: true
    };

    setChatSessions(prev => prev.map(s =>
      s.id === activeChatSession.id
        ? { ...s, messages: [...s.messages, message], last_message: newMessage }
        : s
    ));
    setActiveChatSession(prev => prev ? { ...prev, messages: [...prev.messages, message] } : null);
    setNewMessage('');
  };

  return (
    <main className="min-h-screen bg-gray-50/50 flex overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col z-50">
        <div className="p-8 border-b border-gray-100">
          <div className="font-display font-medium text-2xl italic tracking-tighter text-rose uppercase leading-none">NINOC</div>
          <p className="text-[8px] uppercase tracking-[0.4em] text-gray-300 mt-2">Admin Control Center</p>
        </div>

        <nav className="flex-1 overflow-y-auto py-6">
          <div className="px-8 mb-4">
            <p className="text-[8px] uppercase tracking-[0.3em] text-gray-300">Dashboard</p>
          </div>
          <SidebarItem
            icon={LayoutDashboard}
            label="Overview"
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
          />

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
            icon={Box}
            label="Inventory"
            active={activeTab === 'inventory'}
            onClick={() => setActiveTab('inventory')}
            badge={totalStock}
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
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between">
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
        <section className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {/* ===== OVERVIEW ===== */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

            {/* ===== MESSAGES / CHAT ===== */}
            {activeTab === 'messages' && (
              <motion.div
                key="messages"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="h-[calc(100vh-160px)] flex gap-6"
              >
                {/* Chat List */}
                <div className="w-80 bg-white rounded-xl border border-gray-100 flex flex-col">
                  <div className="p-4 border-b border-gray-100">
                    <h3 className="font-medium text-gray-900">Messages</h3>
                    <p className="text-[10px] text-gray-400 mt-1">{chatSessions.length} conversations</p>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {chatSessions.map((session) => (
                      <div
                        key={session.id}
                        onClick={() => setActiveChatSession(session)}
                        className={cn(
                          "p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors",
                          activeChatSession?.id === session.id && "bg-rose/5 border-l-2 border-l-rose"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <User size={18} className="text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm text-gray-900 truncate">{session.customer_name}</p>
                              <span className="text-[8px] text-gray-400">
                                {new Date(session.last_message_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 truncate mt-0.5">{session.last_message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className={cn(
                                "text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full",
                                session.status === 'open' ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"
                              )}>
                                {session.status}
                              </span>
                              {session.unread_count > 0 && (
                                <span className="w-5 h-5 bg-rose text-white text-[8px] rounded-full flex items-center justify-center">
                                  {session.unread_count}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {chatSessions.length === 0 && (
                      <div className="p-8 text-center text-gray-400">
                        <MessageSquare size={32} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No messages yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat Window */}
                <div className="flex-1 bg-white rounded-xl border border-gray-100 flex flex-col">
                  {activeChatSession ? (
                    <>
                      {/* Chat Header */}
                      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <User size={18} className="text-gray-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{activeChatSession.customer_name}</p>
                            <p className="text-[10px] text-gray-400">{activeChatSession.customer_email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[9px] uppercase tracking-wider px-3 py-1 rounded-full",
                            activeChatSession.status === 'open' ? "bg-emerald-100 text-emerald-600" : "bg-gray-100 text-gray-500"
                          )}>
                            {activeChatSession.status}
                          </span>
                          <button
                            onClick={() => {
                              setChatSessions(prev => prev.map(s =>
                                s.id === activeChatSession.id ? { ...s, status: 'resolved' } : s
                              ));
                              setActiveChatSession(prev => prev ? { ...prev, status: 'resolved' } : null);
                            }}
                            className="px-3 py-1 text-[9px] uppercase tracking-wider bg-gray-100 text-gray-600 rounded-full hover:bg-emerald-500 hover:text-white transition-colors"
                          >
                            Resolve
                          </button>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {activeChatSession.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={cn(
                              "flex",
                              msg.sender === 'admin' ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[70%] px-4 py-3 rounded-2xl",
                                msg.sender === 'admin'
                                  ? "bg-rose text-white rounded-br-md"
                                  : "bg-gray-100 text-gray-900 rounded-bl-md"
                              )}
                            >
                              <p className="text-sm">{msg.message}</p>
                              <p className={cn(
                                "text-[8px] mt-1",
                                msg.sender === 'admin' ? "text-white/60" : "text-gray-400"
                              )}>
                                {new Date(msg.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Message Input */}
                      <div className="p-4 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                          <button className="p-2 text-gray-400 hover:text-rose transition-colors">
                            <Paperclip size={18} />
                          </button>
                          <input
                            type="text"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                            placeholder="Type a message..."
                            className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-rose/50"
                          />
                          <button
                            onClick={sendMessage}
                            className="w-10 h-10 bg-rose text-white rounded-full flex items-center justify-center hover:bg-rose/90 transition-colors"
                          >
                            <Send size={16} />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <MessageSquare size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="text-sm">Select a conversation to start messaging</p>
                      </div>
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
                    <input
                      type="url"
                      value={productForm.image_url}
                      onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-rose/50"
                    />
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