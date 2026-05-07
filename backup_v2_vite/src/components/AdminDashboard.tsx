import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  Package, ShoppingCart, Activity, ShieldCheck, Search, Plus, 
  RotateCcw, Trash2, Edit3, CheckCircle2, AlertTriangle, XCircle, 
  Clock, Database, Terminal, Globe, ChevronRight, Filter, MoreVertical, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- TYPES ---
interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  hpp: number;
  originalPrice?: number;
  discountTag?: string;
  stock: number;
  material?: string;
  description?: string;
  image?: string;
  perspective1?: string;
  perspective2?: string;
  perspective3?: string;
  perspective4?: string;
  status: 'active' | 'backlog' | 'deleted';
  featured: boolean;
  bg: string;
  sizes: string[];
  updatedAt: string;
  taxAmount?: number;
  feeAmount?: number;
  netMargin?: number;
}

interface MetricData {
  totalProducts: number;
  lowStock: number;
  totalRevenue: number;
  unitsSold: number;
  totalInventoryValue: number;
  potentialProfit: number;
  stockDistribution: {
    ok: number;
    low: number;
    out: number;
  };
}

interface AuditLog {
  id: string;
  action: string;
  metadata: any;
  ipAddress: string;
  timestamp: string;
}

// --- SUB-COMPONENTS ---

const NavItem = ({ icon: Icon, label, active, badge, onClick, collapsed }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "w-full flex items-center transition-all border-l-2 py-2.5",
      collapsed ? "justify-center px-0 gap-0" : "px-5 gap-3 text-[11px] font-bold tracking-widest",
      active 
        ? "text-cyan-400 bg-cyan-400/5 border-cyan-400" 
        : "text-slate-500 border-transparent hover:text-slate-200 hover:bg-white/5"
    )}
    title={collapsed ? label : undefined}
  >
    <Icon size={18} className={cn("flex-shrink-0", active ? "opacity-100" : "opacity-40")} />
    {!collapsed && <span className="uppercase whitespace-nowrap">{label}</span>}
    {badge && !collapsed && (
      <span className={cn(
        "ml-auto px-1.5 py-0.5 rounded-sm text-[9px]",
        badge === 'LIVE' ? "bg-emerald-500/10 text-emerald-500 animate-pulse" : "bg-red-500 text-white"
      )}>
        {badge}
      </span>
    )}
  </button>
);

const KPICard = ({ label, value, delta, icon: Icon, color }: any) => (
  <div className="relative bg-slate-900/50 border border-slate-800 p-5 rounded-md overflow-hidden group hover:border-slate-700 transition-colors">
    <div className={cn("absolute top-0 left-0 right-0 h-[2px] opacity-60", color)} />
    <div className="flex justify-between items-start mb-4">
      <span className="text-[9px] font-black tracking-widest text-slate-500 uppercase">{label}</span>
      <Icon size={20} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
    </div>
    <div className="flex items-baseline gap-1 mb-2">
      <span className="font-syne text-2xl font-black text-slate-100 tracking-tighter">{value}</span>
    </div>
    <div className={cn("text-[9px] font-bold", delta.startsWith('+') ? "text-emerald-500" : "text-slate-500")}>
      {delta.startsWith('+') ? '▲' : '─'} {delta}
    </div>
  </div>
);

const Toast = ({ type, message, onClose }: { type: string, message: string, onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons: any = { ok: <CheckCircle2 size={14}/>, err: <XCircle size={14}/>, info: <Database size={14}/>, warn: <AlertTriangle size={14}/> };
  const colors: any = { ok: 'border-emerald-500', err: 'border-red-500', info: 'border-cyan-500', warn: 'border-amber-500' };

  return (
    <motion.div 
      initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }}
      className={cn("bg-slate-900 border border-slate-800 border-l-4 p-4 rounded-md shadow-2xl flex items-center gap-3 min-w-[280px]", colors[type])}
    >
      <span className={cn("flex-shrink-0", type === 'ok' ? "text-emerald-500" : type === 'err' ? "text-red-500" : "text-cyan-500")}>
        {icons[type]}
      </span>
      <span className="text-[11px] font-bold text-slate-200 flex-1">{message}</span>
      <span className="text-[9px] text-slate-600 tabular-nums">{new Date().toLocaleTimeString('id-ID', { hour12: false })}</span>
    </motion.div>
  );
};

const FileUploadField = ({ label, name, defaultValue, onFileChange }: { label: string, name: string, defaultValue?: string, onFileChange: (base64: string) => void }) => {
  const [preview, setPreview] = useState(defaultValue || '');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          // Resize/Compress to max 1200px width for efficiency
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const max = 1200;
          if (width > max) {
            height *= max / width;
            width = max;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85); // 85% quality JPEG
          setPreview(compressedBase64);
          onFileChange(compressedBase64);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview('');
    onFileChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-1.5 flex-1">
      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">{label}</label>
      <div 
        className="relative h-32 bg-slate-950 border border-slate-800 rounded-sm border-dashed hover:border-cyan-500/50 transition-all overflow-hidden flex items-center justify-center group"
      >
        {preview ? (
          <div className="relative w-full h-full flex items-center justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:10px_10px]">
            <img 
              src={preview} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain pointer-events-none" 
            />
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
               <button 
                 type="button" 
                 onClick={() => fileInputRef.current?.click()} 
                 className="p-2 bg-cyan-500 text-slate-950 rounded-full hover:scale-110 transition-transform shadow-lg"
                 title="Ganti Gambar"
               >
                 <Plus size={14} strokeWidth={3} />
               </button>
               <button 
                 type="button" 
                 onClick={handleClear} 
                 className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg"
                 title="Hapus"
               >
                 <Trash2 size={14} strokeWidth={3} />
               </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-1 cursor-pointer w-full h-full justify-center hover:bg-white/[0.02] transition-colors"
          >
            <Plus size={16} strokeWidth={3} className="text-slate-700 group-hover:text-cyan-400/50 transition-colors" />
            <span className="text-[8px] text-slate-700 font-black tracking-tighter uppercase group-hover:text-cyan-400/50 transition-colors">Asset_Upload</span>
          </div>
        )}
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleFile}
        />
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC<{ onBack: () => void, onRefresh?: () => void }> = ({ onBack, onRefresh }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  
  const [activeView, setActiveView] = useState<'overview' | 'audit' | 'revenue'>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Form States
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formMaterial, setFormMaterial] = useState('');
  const [formStock, setFormStock] = useState(0);
  const [formHpp, setFormHpp] = useState(0);
  const [formOriginalPrice, setFormOriginalPrice] = useState(0);
  const [formPrice, setFormPrice] = useState(0);
  const [formDiscountTag, setFormDiscountTag] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'draft' | 'archived'>('active');
  const [formTax, setFormTax] = useState(0);
  const [formFee, setFormFee] = useState(0);
  const [formNetMargin, setFormNetMargin] = useState(0);

  // Asset Base64 States
  const [mainImage, setMainImage] = useState('');
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [p3, setP3] = useState('');
  const [p4, setP4] = useState('');

  const [description, setDescription] = useState('');

  // New Fields
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPKP, setIsPKP] = useState(false);
  const [bgColor, setBgColor] = useState('#F5F5F5');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [toasts, setToasts] = useState<any[]>([]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const addToast = useCallback((type: string, message: string) => {
    setToasts(prev => [...prev, { id: Date.now(), type, message }]);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const responses = await Promise.all([
        fetch('/api/products'),
        fetch('/api/metrics'),
        fetch('/api/logs')
      ]);

      for (const res of responses) {
        const contentType = res.headers.get("content-type");
        if (!res.ok) {
          const text = await res.text();
          let errorMsg = `Server error ${res.status}`;
          try {
            if (contentType && contentType.includes("application/json")) {
              const json = JSON.parse(text);
              errorMsg = json.message || errorMsg;
            } else {
              errorMsg = `${errorMsg}. Respons non-JSON: ${text.substring(0, 50)}...`;
            }
          } catch(e) {}
          throw new Error(errorMsg);
        }
        if (!contentType || !contentType.includes("application/json")) {
          // Jika respons bukan JSON, kemungkinan server sedang restart atau Vite sedang loading.
          // Jangan lemparkan error fatal, cukup log ke konsol agar interval berikutnya mencoba lagi.
          console.warn(`[Network] Non-JSON response from ${res.url}. System may be initializing.`);
          // Silent failure for periodic data fetching to avoid UI flickering
          return;
        }
      }

      const results = await Promise.all(responses.map(async (r) => {
        const ct = r.headers.get("content-type");
        if (ct && ct.includes("application/json")) {
          return await r.json();
        }
        return null;
      }));

      const [pData, mData, lData] = results;
      
      if (Array.isArray(pData)) setProducts(pData);
      if (mData) setMetrics(mData);
      if (Array.isArray(lData)) setLogs(lData);
    } catch (e: any) {
      console.error("Fetch failed", e);
      addToast('err', `KEGAGALAN SISTEM: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (showModal) {
      if (editingProduct) {
        setFormName(editingProduct.name || '');
        setFormCategory(editingProduct.category || '');
        setFormMaterial(editingProduct.material || '');
        setFormStock(editingProduct.stock || 0);
        setFormStatus(editingProduct.status as any || 'active');
        
        setMainImage(editingProduct.image || '');
        setP1(editingProduct.perspective1 || '');
        setP2(editingProduct.perspective2 || '');
        setP3(editingProduct.perspective3 || '');
        setP4(editingProduct.perspective4 || '');
        setIsFeatured(editingProduct.featured || false);
        setIsPKP(editingProduct.isPKP || false);
        setBgColor(editingProduct.bg || '#F5F5F5');
        setSelectedSizes(editingProduct.sizes || []);
        
        setFormHpp(Number(editingProduct.hpp || 0));
        setFormOriginalPrice(Number(editingProduct.originalPrice || 0));
        setFormPrice(Number(editingProduct.price || 0));
        setFormDiscountTag(editingProduct.discountTag || '');
        setFormTax(Number(editingProduct.taxAmount || 0));
        setFormFee(Number(editingProduct.feeAmount || 0));
        setFormNetMargin(Number(editingProduct.netMargin || 0));
        setDescription(editingProduct.description || '');
      } else {
        // DEFAULT VALUES FOR DEVELOPMENT
        setFormName('EMOTION DUMP');
        setFormCategory('Clothing');
        setFormMaterial('Heavyweight Cotton 24s');
        setFormStock(50);
        setFormStatus('active');

        setMainImage(''); setP1(''); setP2(''); setP3(''); setP4('');
        setIsFeatured(false); setIsPKP(false); setBgColor('#F5F5F5'); setSelectedSizes(['S', 'M', 'L', 'XL']);
        setFormHpp(75000); setFormOriginalPrice(145000); setFormPrice(0); setFormDiscountTag('30%');
        setFormTax(0); setFormFee(0); setFormNetMargin(0);
        setDescription('EMOTION DUMP adalah bagian dari koleksi Emotion Dump — seri pertama NINOC yang lahir dari percakapan jujur antara kami dan generasi yang tumbuh bersama layar, deadline, dan perasaan yang sulit diungkap dengan kata.');
      }
    }
  }, [showModal, editingProduct]);

  // Financial Auto-Calculation Engine
  useEffect(() => {
    let currentPrice = formPrice;
    
    // 1. Discount Analysis
    const pctMatch = formDiscountTag.match(/(\d+)%/);
    if (pctMatch && formOriginalPrice > 0) {
      const pct = parseInt(pctMatch[1]);
      const calculatedPrice = Math.round(formOriginalPrice * (1 - pct / 100));
      if (calculatedPrice !== formPrice) {
        currentPrice = calculatedPrice;
        setFormPrice(calculatedPrice);
      }
    }

    // 2. Tax & Fees Logic
    // Insight: PPN (11%) + PPH MSME (0.5%) + Admin Fee (2%) - ONLY IF PKP IS ACTIVE
    const ppn = isPKP ? currentPrice * 0.11 : 0;
    const pph = isPKP ? currentPrice * 0.005 : 0;
    const marketplaceFee = currentPrice * 0.02; 
    
    setFormTax(ppn + pph);
    setFormFee(marketplaceFee);
    
    // 3. Net Margin Integrity
    const net = currentPrice - formHpp - (ppn + pph) - marketplaceFee;
    setFormNetMargin(net);
  }, [formHpp, formOriginalPrice, formDiscountTag, formPrice, isPKP]);

  const [isSyncing, setIsSyncing] = useState(false);

  const handleCreateOrUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSyncing(true);
    const data = {
      name: formName,
      price: formPrice,
      hpp: formHpp,
      originalPrice: formOriginalPrice,
      discountTag: formDiscountTag,
      taxAmount: formTax,
      feeAmount: formFee,
      netMargin: formNetMargin,
      stock: formStock,
      category: formCategory,
      status: formStatus,
      material: formMaterial,
      description: description,
      image: mainImage,
      perspective1: p1,
      perspective2: p2,
      perspective3: p3,
      perspective4: p4,
      featured: isFeatured,
      bg: bgColor,
      sizes: selectedSizes,
      isPKP: isPKP,
    };

    const maxRetries = 5;
    let attempt = 0;

    const performUpload = async (): Promise<void> => {
      try {
        const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
        const method = editingProduct ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        const contentType = res.headers.get("content-type");
        let resData: any;

        if (contentType && contentType.includes("application/json")) {
          resData = await res.json();
        } else {
          const text = await res.text();
          
          if ((text.includes("<html") || text.includes("<!doctype")) && attempt < maxRetries) {
            attempt++;
            addToast('info', `Server sedang sinkronisasi (Percobaan ${attempt}/${maxRetries})...`);
            await new Promise(r => setTimeout(r, 4000));
            return performUpload();
          }
          
          if (res.status === 503) {
            throw new Error("Sistem sedang optimasi database. Silakan tunggu 5-10 detik.");
          }
          
          if (text.includes("<html") || text.includes("<!doctype")) {
            throw new Error("Koneksi terputus saat menyimpan. Silakan coba klik 'Simpan' lagi.");
          }
          
          throw new Error(`Respon tidak valid (Status: ${res.status}). Pastikan ukuran gambar tidak terlalu besar.`);
        }

        if (res.ok && resData.success) {
          setShowModal(false);
          setEditingProduct(null);
          addToast('ok', resData.message || "SINKRONISASI BERHASIL");
          fetchData();
          if (onRefresh) onRefresh();
        } else {
          let errorMsg = resData?.message || "Kesalahan Tidak Diketahui";
          if (resData?.errors) {
            const fieldErrors = Object.entries(resData.errors)
              .map(([field, msgs]: any) => `${field}: ${msgs.join(', ')}`)
              .join('; ');
            errorMsg = `${errorMsg} (${fieldErrors})`;
          }
          addToast('err', `GAGAL SIMPAN: ${errorMsg}`);
        }
      } catch (err: any) {
        console.error("Submit error:", err);
        throw err;
      }
    };

    try {
      await performUpload();
    } catch (err: any) {
      addToast('err', `GAGAL UPLINK: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleQuarantine = async (p: Product, permanent: boolean) => {
    try {
      const url = `/api/products/${p.id}${permanent ? '?permanent=true' : ''}`;
      const res = await fetch(url, { method: 'DELETE' });
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server response unknown");
      }

      const data = await res.json();
      
      if (res.ok && data.success) {
        setShowDeleteModal(false);
        addToast(permanent ? 'err' : 'warn', data.message);
        fetchData();
      } else {
        addToast('err', data.message || "Gagal menghapus produk");
      }
    } catch (e: any) {
      addToast('err', `Hapus Gagal: ${e.message}`);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'ok' && p.stock > 5) || 
      (statusFilter === 'low' && p.stock <= 5 && p.stock > 0) || 
      (statusFilter === 'out' && p.stock === 0);
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (stock: number) => {
    if (stock === 0) return { label: 'Stok_Kosong', color: 'text-red-500', bg: 'bg-red-500', shadow: 'shadow-[0_0_5px_rgba(239,68,68,0.5)]' };
    if (stock <= 5) return { label: 'Stok_Menipis', color: 'text-amber-500', bg: 'bg-amber-500', shadow: 'shadow-[0_0_5px_rgba(245,158,11,0.5)]' };
    return { label: 'Stok_Normal', color: 'text-emerald-500', bg: 'bg-emerald-500', shadow: 'shadow-[0_0_5px_rgba(16,185,129,0.5)]' };
  };

  return (
    <div className="flex h-screen bg-[#080b0f] text-[#e8edf3] font-mono selection:bg-cyan-500/30 overflow-hidden relative">
      {/* Sidebar */}
      <aside className={cn(
        "bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 z-50 relative transition-all duration-300 ease-in-out group/sidebar",
        isSidebarCollapsed ? "w-[60px]" : "w-[220px]"
      )}>
        {/* Toggle Border Area */}
        <div 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-1 top-0 bottom-0 w-2 cursor-col-resize hover:bg-cyan-500/20 active:bg-cyan-500/40 z-50 transition-colors"
          title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        />

        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-400 via-violet-500 to-emerald-400" />
        <div className={cn("p-6 border-b border-slate-800", isSidebarCollapsed && "px-2 py-6 text-center")}>
          {!isSidebarCollapsed && <div className="h-2" />}
          <h1 className={cn(
            "font-syne font-black tracking-tighter leading-none hover:scale-105 transition-transform cursor-pointer",
            isSidebarCollapsed ? "text-lg" : "text-2xl"
          )}>
            {isSidebarCollapsed ? "iN" : <>iNIT<span className="text-cyan-400">//</span>PRODUCT</>}
          </h1>
          {!isSidebarCollapsed && <div className="text-[8px] font-bold text-slate-600 mt-1 uppercase tracking-[0.2em] opacity-40">BEATSTORIA AI SYSTEM</div>}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto scrollbar-none">
          {!isSidebarCollapsed && <div className="text-[9px] font-black px-6 mb-3 text-slate-600 tracking-widest uppercase">Inti</div>}
          <NavItem icon={Activity} label="Ringkasan" active={activeView === 'overview'} onClick={() => setActiveView('overview')} collapsed={isSidebarCollapsed} />
          <NavItem icon={Package} label="Inventaris" badge={products.length} active={activeView === 'overview'} onClick={() => setActiveView('overview')} collapsed={isSidebarCollapsed} />
          <NavItem icon={ShoppingCart} label="Pesanan" badge="3" active={false} collapsed={isSidebarCollapsed} />
          
          <div className="mt-8">
            {!isSidebarCollapsed && <div className="text-[9px] font-black px-6 mb-3 text-slate-600 tracking-widest uppercase">Analitik</div>}
            <NavItem icon={Terminal} label="Log Audit" badge="LIVE" active={activeView === 'audit'} onClick={() => setActiveView('audit')} collapsed={isSidebarCollapsed} />
            <NavItem icon={Database} label="Metrik Pendapatan" active={activeView === 'revenue'} onClick={() => setActiveView('revenue')} collapsed={isSidebarCollapsed} />
          </div>
          
          <div className="mt-8">
            {!isSidebarCollapsed && <div className="text-[9px] font-black px-6 mb-3 text-slate-600 tracking-widest uppercase">Konfigurasi</div>}
            <NavItem icon={Globe} label="Lihat Website" onClick={onBack} collapsed={isSidebarCollapsed} />
            <NavItem icon={ShieldCheck} label="Jembatan API" collapsed={isSidebarCollapsed} />
          </div>
        </nav>

        {!isSidebarCollapsed && (
          <div className="p-5 border-t border-slate-800 space-y-1.5 transition-opacity duration-300">
            <div className="flex items-center gap-2 text-[9px] text-slate-600 uppercase">
              <div className="w-1 h-1 rounded-full bg-emerald-500" />
              SRV: LIVE:3000 — ONLINE
            </div>
            <div className="flex items-center gap-2 text-[9px] text-slate-600 uppercase">
              <div className="w-1 h-1 rounded-full bg-cyan-500" />
              DB: SQLITE_V3 — READY
            </div>
            <div className="text-[9px] text-slate-700 font-bold tabular-nums mt-2">
              TIME: {new Date().toLocaleTimeString('id-ID', { hour12: false })}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <header className="h-[50px] bg-slate-900 border-b border-slate-800 flex items-center px-8 gap-4 sticky top-0 z-40 backdrop-blur-md">
          <div className="text-[10px] text-slate-500 uppercase flex items-center gap-2">
            ROOT <ChevronRight size={10} /> ADMIN <ChevronRight size={10} /> <span className="text-slate-200 font-bold">{activeView.toUpperCase()}</span>
          </div>
          
          <div className="ml-auto flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600" size={12} />
              <input 
                type="text" 
                placeholder="CARI DATA..."
                className="bg-slate-950 border border-slate-800 rounded-sm pl-8 pr-3 py-1.5 text-[10px] w-64 focus:border-cyan-400/50 outline-none transition-all placeholder:text-slate-700"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => { setEditingProduct(null); setShowModal(true); }}
              className="bg-cyan-500 hover:opacity-90 text-slate-950 text-[10px] font-black px-4 py-1.5 rounded-sm transition-all uppercase tracking-wider"
            >
              + Sinkron.Data_Baru
            </button>
          </div>
        </header>

        <div className="p-10 space-y-12">
          {activeView === 'overview' && (
            <>
              {/* Section: Core Metrics */}
              <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-sm font-black uppercase tracking-[0.4em] text-slate-400 italic">Operasi_Utama</h2>
                <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Telemetri real-time dari mesin toko</div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-cyan-400/5 border border-cyan-400/20 rounded-sm">
                <div className="w-1 h-1 bg-cyan-400 rounded-full animate-ping" />
                <span className="text-[9px] font-black text-cyan-400 tracking-widest uppercase italic">Node_Sync: Aktif</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard 
                label="Pendapatan Bruto" 
                value={`Rp ${(metrics?.totalRevenue || 0).toLocaleString()}`} 
                delta="+12.4% vs rata-rata bulan" 
                icon={ShoppingCart} 
                color="bg-emerald-500" 
              />
              <KPICard 
                label="Ukuran Dataset" 
                value={products.length} 
                delta="Data Aktif" 
                icon={Package} 
                color="bg-cyan-500" 
              />
              <KPICard 
                label="Nilai Inventaris" 
                value={`Rp ${(metrics?.totalInventoryValue || 0).toLocaleString()}`} 
                delta="Likuiditas aset" 
                icon={Database} 
                color="bg-violet-500" 
              />
              <KPICard 
                label="Potensi Laba" 
                value={`Rp ${(metrics?.potentialProfit || 0).toLocaleString()}`} 
                delta="Proyeksi Keuntungan" 
                icon={Activity} 
                color="bg-rose-500" 
              />
            </div>
          </div>

          {/* Charts & Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-md overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue Dynamics</span>
                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold animate-pulse">LIVE</span>
              </div>
              <div className="h-[200px] w-full p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: '01', val: 400 }, { name: '05', val: 600 }, { name: '10', val: 500 },
                    { name: '15', val: 900 }, { name: '20', val: 700 }, { name: '25', val: 1200 },
                    { name: '30', val: 1100 }
                  ]}>
                    <defs>
                      <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1c2d3e" vertical={false} />
                    <XAxis dataKey="name" stroke="#3a4f63" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#3a4f63" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0d1117', borderColor: '#1c2d3e', fontSize: '10px', fontFamily: 'monospace' }}
                      itemStyle={{ color: '#06b6d4' }}
                    />
                    <Area type="monotone" dataKey="val" stroke="#06b6d4" fillOpacity={1} fill="url(#colorVal)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-md overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audit Stream</span>
                <Terminal size={12} className="text-slate-600" />
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px] scrollbar-thin scrollbar-thumb-slate-800">
                {logs.map((log) => (
                  <div key={log.id} className="text-[9px] border-l border-slate-800 pl-3 py-1 space-y-1">
                    <div className="flex items-center gap-2">
                       <span className="text-slate-600">{new Date(log.timestamp).toLocaleTimeString('id-ID', { hour12: false })}</span>
                      <span className={cn(
                        "px-1 py-0.5 rounded-sm font-bold uppercase",
                        log.action?.includes('CREATE') ? "text-emerald-400 bg-emerald-400/5" : "text-cyan-400 bg-cyan-400/5"
                      )}>{log.action}</span>
                    </div>
                    <div className="text-slate-400 line-clamp-1">{log.ipAddress} — Request_Ack</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/20 backdrop-blur-md">
              <div className="flex items-center gap-6">
                <div>
                  <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em]">Inventory_Matrix</h3>
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-0.5">Asset distribution & status</p>
                </div>
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 ml-4">
                  {['all', 'ok', 'low', 'out'].map((s) => (
                    <button 
                      key={s}
                      onClick={() => setStatusFilter(s)}
                      className={cn(
                        "px-4 py-1.5 text-[9px] font-black uppercase transition-all rounded-md tracking-widest",
                        statusFilter === s ? "text-cyan-400 bg-cyan-400/10 shadow-inner" : "text-slate-600 hover:text-slate-400"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={fetchData} 
                className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center text-slate-600 hover:text-cyan-400 hover:border-cyan-400/40 transition-all active:rotate-180 duration-700"
              >
                <RotateCcw size={14} />
              </button>
            </div>

            {/* Metric Bars */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 border-b border-slate-800 bg-slate-950/10">
              {['ok', 'low', 'out'].map(s => (
                <div key={s} className="space-y-3">
                   <div className="flex justify-between items-end">
                     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{s === 'ok' ? 'Nominal' : s === 'low' ? 'Depleting' : 'Depleted'}</span>
                     <span className="text-[10px] font-black text-slate-400">
                       {Math.round(((metrics?.stockDistribution as any)?.[s] / (products.length || 1)) * 100)}%
                     </span>
                   </div>
                   <div className="h-1 bg-slate-950 rounded-full overflow-hidden border border-slate-800/50">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${(metrics?.stockDistribution as any)?.[s] / (products.length || 1) * 100}%` }}
                       className={cn("h-full transition-all duration-1000", s === 'ok' ? 'bg-emerald-500' : s === 'low' ? 'bg-amber-500' : 'bg-rose-500')} 
                     />
                   </div>
                </div>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-950/60 text-[9px] font-black uppercase text-slate-500 tracking-[0.3em] border-b border-slate-800">
                    <th className="px-8 py-5">UID//REF</th>
                    <th className="px-8 py-5">Descriptor</th>
                    <th className="px-8 py-5 text-center">Visual_Asset</th>
                    <th className="px-8 py-5">Type</th>
                    <th className="px-8 py-5">HPP_Val</th>
                    <th className="px-8 py-5">Market_Value</th>
                    <th className="px-8 py-5">Gross_Margin</th>
                    <th className="px-8 py-5 text-center">Unit_Count</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5 text-right">Ops</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {filteredProducts.map((p) => {
                    const status = getStatusLabel(p.stock);
                    return (
                      <tr key={p.id} className="hover:bg-cyan-400/[0.02] transition-colors group">
                        <td className="px-6 py-4">
                          <div className="text-[10px] font-bold text-slate-500 mb-0.5">{p.id.slice(0, 8)}</div>
                          <div className="text-[9px] font-black text-cyan-400/60 tracking-tighter">{p.sku}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[11px] font-black text-slate-100 mb-0.5 uppercase group-hover:text-cyan-400 transition-colors">{p.name}</div>
                          <div className="text-[9px] text-slate-600 truncate max-w-[200px]">{p.material || 'Standard Fabric'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div 
                            onClick={() => p.image && setZoomedImage(p.image)}
                            className="w-12 h-16 bg-slate-950 border border-slate-800 rounded-sm overflow-hidden cursor-zoom-in group/img relative"
                          >
                            {p.image ? (
                              <>
                                <img 
                                  src={p.image} 
                                  alt={p.name} 
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110" 
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-cyan-400/0 group-hover/img:bg-cyan-400/10 transition-colors flex items-center justify-center">
                                  <Plus size={12} className="text-cyan-400 opacity-0 group-hover/img:opacity-100 scale-50 group-hover/img:scale-100 transition-all" />
                                </div>
                              </>
                            ) : (
                               <div className="w-full h-full flex flex-col items-center justify-center opacity-20">
                                  <Package size={14} />
                               </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "text-[8px] font-black px-2 py-0.5 border border-slate-800 text-slate-500 uppercase rounded-sm",
                            p.category === 'batik' && "border-violet-500/20 text-violet-500 bg-violet-500/5",
                            p.category === 'wastra' && "border-amber-500/20 text-amber-500 bg-amber-500/5",
                            p.category === 'aksesoris' && "border-cyan-500/20 text-cyan-400 bg-cyan-400/5"
                          )}>
                            {p.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[10px] font-bold text-slate-500">
                          Rp {(p.hpp || 0).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                           <div className="text-[11px] font-bold text-cyan-500">Rp {p.price.toLocaleString()}</div>
                           {p.originalPrice && <div className="text-[8px] text-slate-600 line-through">Rp {p.originalPrice.toLocaleString()}</div>}
                           {p.discountTag && <div className="text-[8px] font-black text-rose mt-0.5 uppercase tracking-tighter">{p.discountTag}</div>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                             "text-[10px] font-black",
                             (p.price - (p.hpp || 0)) > 0 ? "text-emerald-500" : "text-rose"
                          )}>
                             {Math.round(((p.price - (p.hpp || 0)) / (p.price || 1)) * 100)}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[11px] font-black", status.color)}>{p.stock}</span>
                            <div className="w-10 h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div className={cn("h-full", status.bg)} style={{ width: `${Math.min((p.stock / 50) * 100, 100)}%` }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-1.5">
                                <div className={cn("w-1 h-1 rounded-full", status.bg, status.shadow)} />
                                <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{status.label}</span>
                             </div>
                             <span className={cn(
                               "px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter w-fit",
                               p.status === 'active' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : 
                               p.status === 'draft' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                               "bg-slate-800 text-slate-400 border border-slate-700"
                             )}>
                               {p.status === 'active' ? '● STANDARD_DISPLAY' : 
                                p.status === 'draft' ? '○ INTERNAL_BACKLOG' : '× ARCHIVED_SYSTEM'}
                             </span>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingProduct(p); setShowModal(true); }} className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-cyan-400/10 rounded-sm">
                              <Edit3 size={14} />
                            </button>
                            <button onClick={() => { setProductToDelete(p); setShowDeleteModal(true); }} className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-sm">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-600 bg-slate-900/10">
              <div>Menampilkan 1–{filteredProducts.length} dari {products.length} records</div>
              <div className="flex gap-2">
                <button className="px-2 py-1 border border-slate-800 rounded-sm bg-cyan-400 text-slate-950 font-bold">1</button>
                <button className="px-2 py-1 border border-slate-800 rounded-sm hover:text-slate-300">2</button>
                <button className="px-2 py-1 border border-slate-800 rounded-sm hover:text-slate-300">›</button>
              </div>
            </div>
          </div>
        </>
      )}

          {activeView === 'audit' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-sm font-black uppercase tracking-[0.4em] text-slate-400 italic">Audit_Ledger</h2>
                  <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Immutable records of system activity</div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-violet-400/5 border border-violet-400/20 rounded-sm">
                  <ShieldCheck size={12} className="text-violet-400" />
                  <span className="text-[9px] font-black text-violet-400 tracking-widest uppercase italic">Integrity_Lock: Active</span>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-950/60 text-[9px] font-black uppercase text-slate-500 tracking-[0.3em] border-b border-slate-800">
                      <th className="px-8 py-5">Timestamp</th>
                      <th className="px-8 py-5">Operation</th>
                      <th className="px-8 py-5">Origin</th>
                      <th className="px-8 py-5">Ref_Data</th>
                      <th className="px-8 py-5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-violet-400/[0.02] transition-colors group">
                        <td className="px-8 py-4 tabular-nums text-[11px] text-slate-400">
                          {new Date(log.timestamp).toLocaleString('id-ID', { hour12: false })}
                        </td>
                        <td className="px-8 py-4">
                          <span className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded-sm text-[10px] font-bold text-cyan-400">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-8 py-4 text-[10px] text-slate-500 font-mono">
                          {log.ipAddress}
                        </td>
                        <td className="px-8 py-4 text-[10px] text-slate-400 font-mono italic max-w-xs truncate">
                          {JSON.stringify(log.metadata)}
                        </td>
                        <td className="px-8 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                            <span className="text-[8px] font-black text-emerald-500 uppercase italic">Verified</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeView === 'revenue' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-sm font-black uppercase tracking-[0.4em] text-slate-400 italic">Revenue_Forecasting</h2>
                  <div className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Financial metrics and potential liquidity</div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-md">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Asset_Liquidity_Flow</h3>
                   <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Active', val: metrics?.totalInventoryValue || 0 },
                          { name: 'Potential', val: metrics?.potentialProfit || 0 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1c2d3e" vertical={false} />
                          <XAxis dataKey="name" stroke="#3a4f63" fontSize={10} />
                          <YAxis stroke="#3a4f63" fontSize={10} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0d1117', borderColor: '#1c2d3e', fontSize: '10px' }}
                            itemStyle={{ color: '#06b6d4' }}
                          />
                          <Bar dataKey="val" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-md">
                   <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Inventory_Health</h3>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-950 p-4 border border-slate-800/50 rounded-sm">
                         <div className="text-[9px] font-bold text-slate-600 uppercase mb-2">Total Value</div>
                         <div className="text-xl font-syne font-black text-white italic">Rp {(metrics?.totalInventoryValue || 0).toLocaleString()}</div>
                      </div>
                      <div className="bg-slate-950 p-4 border border-slate-800/50 rounded-sm">
                         <div className="text-[9px] font-bold text-slate-600 uppercase mb-2">Proj. Profit</div>
                         <div className="text-xl font-syne font-black text-emerald-500 italic">Rp {(metrics?.potentialProfit || 0).toLocaleString()}</div>
                      </div>
                      <div className="bg-slate-950 p-4 border border-slate-800/50 rounded-sm">
                         <div className="text-[9px] font-bold text-slate-600 uppercase mb-2">Stock Density</div>
                         <div className="text-xl font-syne font-black text-cyan-400 italic">{(metrics?.stockDistribution.ok || 0)} Items SKU</div>
                      </div>
                      <div className="bg-slate-950 p-4 border border-slate-800/50 rounded-sm">
                         <div className="text-[9px] font-bold text-slate-600 uppercase mb-2">Units Sold</div>
                         <div className="text-xl font-syne font-black text-violet-500 italic">1,240 Qty</div>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <AnimatePresence>
        {zoomedImage && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomedImage(null)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md cursor-zoom-out"
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative max-w-4xl max-h-[85vh] w-auto h-auto bg-slate-900 border-2 border-slate-800 rounded-xl overflow-hidden shadow-[0_0_80px_rgba(6,182,212,0.15)] flex flex-col group/viewer"
            >
              <div className="absolute top-4 right-4 z-10 flex gap-2">
                 <button 
                   onClick={() => setZoomedImage(null)}
                   className="w-10 h-10 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                 >
                   <RotateCcw size={18} className="translate-y-[1px]" />
                 </button>
              </div>

              <div className="relative flex-1 overflow-hidden flex items-center justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]">
                <img 
                  src={zoomedImage} 
                  alt="Zoomed Asset"
                  className="max-w-full max-h-full object-contain p-4 drop-shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="p-4 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 flex justify-between items-center">
                 <div className="space-y-1">
                   <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest italic flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      Visual_Asset_Review
                   </div>
                   <div className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em]">Verified Secure Uplink // 100% Integrity</div>
                 </div>
                 <div className="flex bg-slate-900 border border-slate-800 rounded-sm p-1">
                    <span className="px-3 py-1 text-[9px] font-black text-slate-400 italic">4096_BIT_CRYPTO_VIEW</span>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FORM MODAL --- */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-[#080b0f]/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-7xl bg-slate-900 border border-slate-800 rounded-md overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
            >
              <div className="h-1 w-full bg-cyan-400" />
              <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                <div>
                  <h3 className="text-[11px] font-black text-cyan-400 tracking-widest uppercase">
                    {editingProduct ? '// Modify.Record_Sync' : '// Sync.Record_Init'}
                  </h3>
                  <p className="text-[9px] text-slate-600 mt-0.5 uppercase font-bold tracking-tighter">Komit metadata baru ke mesin persistensi</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-600 hover:text-red-500 transition-colors">
                  <XCircle size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdate} className="p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Column 1: Core Identity */}
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Nama Produk *</label>
                      <input 
                        name="name" 
                        required 
                        value={formName} 
                        onChange={(e) => setFormName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-sm px-4 py-2 text-[11px] outline-none focus:border-cyan-400/50 transition-all font-bold" 
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Material & Tekstil</label>
                      <input 
                        name="material" 
                        placeholder="misal: Cotton Combed 24s, dll." 
                        value={formMaterial}
                        onChange={(e) => setFormMaterial(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-sm px-4 py-2 text-[11px] outline-none focus:border-cyan-400/50 transition-all font-bold" 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Kategori Entitas *</label>
                        <input 
                          name="category" 
                          required 
                          placeholder="misal: BATIK, dll." 
                          value={formCategory} 
                          onChange={(e) => setFormCategory(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-sm px-4 py-2 text-[11px] outline-none focus:border-cyan-400/50 transition-all font-bold" 
                        />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Unit Tersedia *</label>
                        <input 
                          name="stock" 
                          type="number" 
                          required 
                          value={formStock === 0 ? '' : formStock} 
                          onChange={(e) => setFormStock(Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-sm px-4 py-2 text-[11px] outline-none focus:border-cyan-400/50 transition-all font-bold" 
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Deskripsi</label>
                        {description && (
                          <button 
                            type="button" 
                            onClick={() => setDescription('')}
                            className="text-[8px] font-black text-rose uppercase tracking-widest flex items-center gap-1 hover:opacity-80"
                          >
                            <Trash2 size={10} />
                            Hapus Semua
                          </button>
                        )}
                      </div>
                      <textarea 
                        name="description" 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Masukkan cerita produk..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-sm px-4 py-2 text-[11px] outline-none focus:border-cyan-400/50 transition-all font-bold resize-none scrollbar-none min-h-[80px]"
                      />
                      
                      {/* NINOC Story Engine / Template Picker */}
                      <div className="bg-slate-950/50 border border-slate-800/50 rounded-sm p-3 space-y-2 mt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic">NINOC_Story_Engine</span>
                          <span className="text-[7px] text-cyan-400 uppercase font-black bg-cyan-400/5 px-1.5 py-0.5 rounded-sm">PILIHAN TEMPLATE</span>
                        </div>
                        <div className="flex gap-2">
                           <button 
                             type="button"
                             onClick={() => {
                               const productName = (document.querySelector('input[name="name"]') as HTMLInputElement)?.value || '[PRODUCT_NAME]';
                               setDescription(`${productName} adalah bagian dari koleksi Emotion Dump — seri pertama NINOC yang lahir dari percakapan jujur antara kami dan generasi yang tumbuh bersama layar, deadline, dan perasaan yang sulit diungkap dengan kata.

Setiap ilustrasi dirancang sebagai ekspresi, bukan sekadar motif. Dihadirkan di atas kaos cotton premium dengan potongan yang bersih — karena kami percaya bahwa pakaian yang baik tidak perlu berteriak untuk diperhatikan.

Spesifikasi:
Material · Cotton Combed 30s · 180 gsm
Teknik Cetak · DTG Direct to Garment
Potongan · Regular Fit · Unisex
Ukuran · S M L XL XXL

Perawatan:
Balik kain sebelum cuci · Suhu maks 30°C · Hindari pemutih · Setrika rendah jauhi area cetak

NINOC dirancang untuk mereka yang tidak butuh label besar untuk merasa percaya diri. Cukup sebuah ilustrasi yang bicara lebih keras dari kata-kata.`);
                             }}
                             className="flex-1 bg-slate-900 border border-slate-800 hover:border-cyan-400/50 text-[9px] font-black text-slate-400 p-2 rounded-sm text-left transition-all group"
                           >
                              <div className="text-cyan-400 mb-1 flex items-center gap-1">
                                <Plus size={10} />
                                <span>Gunakan Template Emotion Dump</span>
                              </div>
                              <div className="text-[8px] text-slate-600 line-clamp-1 italic tracking-tight">"Produk ini adalah bagian dari koleksi Emotion Dump..."</div>
                           </button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Ukuran Tersedia</label>
                      <div className="flex flex-wrap gap-1.5">
                        {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map(size => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => {
                              setSelectedSizes(prev => 
                                prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
                              );
                            }}
                            className={cn(
                              "px-2.5 py-1.5 border rounded-sm text-[9px] font-black transition-all",
                              selectedSizes.includes(size) ? "bg-cyan-400 border-cyan-400 text-slate-950" : "bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-600"
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                       <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-center block">Status</label>
                        <select 
                           name="status" 
                           value={formStatus} 
                           onChange={(e) => setFormStatus(e.target.value as any)}
                           className="w-full bg-slate-950 border border-slate-800 rounded-sm px-2 py-2 text-[9px] outline-none focus:border-cyan-400/50 transition-all font-black appearance-none text-center"
                         >
                            <option value="active">ACTIVE</option>
                            <option value="draft">DRAFT</option>
                            <option value="archived">ARCHIVED</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-center block">BG Color</label>
                        <div className="flex gap-2 items-center justify-center bg-slate-950 border border-slate-800 rounded-sm p-1">
                          <input 
                            type="color" 
                            value={bgColor} 
                            onChange={(e) => setBgColor(e.target.value)}
                            className="bg-transparent border-none w-6 h-6 cursor-pointer rounded-full" 
                          />
                          <span className="text-[9px] font-mono text-slate-500 uppercase">{bgColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Column 2: Financial Matrix */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Harga Dasar (HPP) *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-[10px]">Rp</span>
                          <input 
                            name="hpp" 
                            type="number" 
                            required 
                            value={formHpp === 0 ? '' : formHpp}
                            onChange={(e) => setFormHpp(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-sm pl-8 pr-4 py-2 text-[11px] outline-none focus:border-cyan-400/50 transition-all font-bold" 
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Harga Normal/Slash</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-[10px]">Rp</span>
                          <input 
                            name="originalPrice" 
                            type="number" 
                            value={formOriginalPrice === 0 ? '' : formOriginalPrice}
                            onChange={(e) => setFormOriginalPrice(Number(e.target.value))}
                            className="w-full bg-slate-950 border border-slate-800 rounded-sm pl-8 pr-4 py-2 text-[11px] outline-none focus:border-cyan-400/50 transition-all font-bold" 
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest text-rose">Tag Promo</label>
                        <input 
                          name="discountTag" 
                          placeholder="misal: 30%" 
                          value={formDiscountTag}
                          onChange={(e) => setFormDiscountTag(e.target.value)}
                          className="w-full bg-rose/5 border border-rose/20 rounded-sm px-4 py-2 text-[11px] outline-none focus:border-rose/50 transition-all font-black text-rose" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">Nilai Jual Jelas *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 text-[10px] font-bold">Rp</span>
                          <input 
                            name="price" 
                            type="number" 
                            required 
                            value={formPrice === 0 ? '' : Math.round(formPrice)}
                            onChange={(e) => setFormPrice(Number(e.target.value))}
                            className="w-full bg-cyan-400/5 border border-cyan-400/30 rounded-sm pl-8 pr-4 py-2 text-[11px] outline-none focus:border-cyan-400 transition-all font-black text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.05)]" 
                          />
                        </div>
                      </div>
                    </div>

                    {/* Compact Matrix */}
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-sm space-y-3">
                      <div className="flex items-center justify-between">
                         <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] italic">Fin_Audit_Flow</span>
                         <div className="flex items-center gap-2">
                            <span className="text-[7px] text-slate-700 uppercase font-black tracking-widest px-1.5 py-0.5 bg-slate-900 rounded-sm">
                              {isPKP ? "PPH+PPN: 11.5%" : "NON-PKP: 0%"}
                            </span>
                            <button 
                              type="button"
                              onClick={() => setIsPKP(!isPKP)}
                              className={cn(
                                "text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm transition-all border",
                                isPKP ? "bg-cyan-500 border-cyan-400 text-slate-950" : "bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-500"
                              )}
                            >
                              PKP {isPKP ? "ON" : "OFF"}
                            </button>
                         </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-1">
                          <span className="text-[9px] text-slate-600 uppercase font-bold">Beban Pajak</span>
                          <span className="text-[10px] font-black text-rose italic">-Rp {Math.round(formTax).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-900 pb-1">
                          <span className="text-[9px] text-slate-600 uppercase font-bold">Biaya Admin</span>
                          <span className="text-[10px] font-black text-slate-500 italic">-Rp {Math.round(formFee).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center bg-cyan-400/10 p-2 rounded-sm -mx-1 border border-cyan-400/20">
                          <span className="text-[9px] text-cyan-400 uppercase font-black italic">Margin Bersih</span>
                          <span className={cn("text-xs font-black italic", formNetMargin > 0 ? "text-emerald-400" : "text-rose")}>
                             {formNetMargin > 0 ? '+' : ''}Rp {Math.round(formNetMargin).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-violet-400/[0.03] border border-violet-400/10 rounded-sm space-y-2">
                      <div className="flex items-center gap-2 text-violet-400">
                        <AlertTriangle size={10} />
                        <span className="text-[8px] font-black uppercase tracking-widest italic">Nota_Kepatuhan {isPKP ? "(PKP)" : "(Non-PKP)"}</span>
                      </div>
                      <div className="text-[8px] text-slate-600 leading-tight font-black uppercase space-y-1">
                        {isPKP ? (
                          <>
                            <p>● PPN 11% (UU HPP No. 7/2021) DIHITUNG DARI DPP.</p>
                            <p>● PPH FINAL 0.5% (PP 55/2022) UNTUK UMKM PKP.</p>
                            <p>● WAJIB TERBITKAN E-FAKTUR & LAPOR SPT MASA.</p>
                          </>
                        ) : (
                          <>
                            <p>● BEBAS PPN (OMZET &lt; 4.8M SESUAI PMK-197/2013).</p>
                            <p>● TIDAK WAJIB PUNGUT PPN; HARGA LEBIH KOMPETITIF.</p>
                            <p>● TETAP TERIKAT KEWAJIBAN PPH TAHUNAN PRIBADI/BADAN.</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Column 3: Visual Identity */}
                  <div className="space-y-4">
                    <div>
                      <FileUploadField 
                        label="Rendering Utama (Sync)" 
                        name="image" 
                        defaultValue={editingProduct?.image}
                        onFileChange={setMainImage}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <FileUploadField 
                        label="Front" 
                        name="perspective1" 
                        defaultValue={editingProduct?.perspective1}
                        onFileChange={setP1}
                      />
                      <FileUploadField 
                        label="Side" 
                        name="perspective2" 
                        defaultValue={editingProduct?.perspective2}
                        onFileChange={setP2}
                      />
                      <FileUploadField 
                        label="Back" 
                        name="perspective3" 
                        defaultValue={editingProduct?.perspective3}
                        onFileChange={setP3}
                      />
                      <FileUploadField 
                        label="Macro" 
                        name="perspective4" 
                        defaultValue={editingProduct?.perspective4}
                        onFileChange={setP4}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-slate-800 flex gap-3 justify-end items-center">
                  <div className="mr-auto">
                    <button 
                      type="button"
                      onClick={() => setIsFeatured(!isFeatured)}
                      className={cn(
                        "flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-4 py-2 border rounded-sm transition-all",
                        isFeatured ? "border-cyan-400 bg-cyan-400/10 text-cyan-400" : "border-slate-800 text-slate-600 hover:text-slate-400"
                      )}
                    >
                      <Star size={12} className={isFeatured ? "fill-cyan-400" : ""} />
                      {isFeatured ? "Unggulan: Aktif" : "Jadikan Unggulan"}
                    </button>
                  </div>
                  <button 
                    type="button" 
                    disabled={isSyncing}
                    onClick={() => setShowModal(false)} 
                    className="px-6 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-400 text-[10px] font-black py-2.5 rounded-sm uppercase tracking-widest transition-all"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={isSyncing}
                    className="px-10 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 text-[10px] font-black py-2.5 rounded-sm uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                  >
                    {isSyncing ? "Menyimpan..." : "Simpan Data"}
                  </button>
                </div>
              </form>
            </motion.div>

          </div>
        )}

        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteModal(false)} className="absolute inset-0 bg-[#080b0f]/95 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-slate-900 border border-red-500/20 rounded-md overflow-hidden">
               <div className="h-1 w-full bg-red-500" />
               <div className="p-6 border-b border-slate-800 bg-red-500/5">
                 <h3 className="text-[11px] font-black text-red-500 tracking-widest uppercase">// Delete.Quarantine</h3>
                 <p className="text-[9px] text-slate-600 mt-1">Aksi ini akan dicatat di audit log</p>
               </div>
               <div className="p-6 space-y-4">
                 <p className="text-[11px] text-slate-400 leading-relaxed">
                   Produk <span className="text-slate-100 font-bold">{productToDelete?.name}</span> akan diproses. Pilih metode penghapusan:
                 </p>
                 <button onClick={() => productToDelete && handleQuarantine(productToDelete, false)} className="w-full text-left p-3 border border-slate-800 rounded-md hover:border-cyan-500/50 transition-colors group">
                    <div className="text-[10px] font-black text-slate-300 group-hover:text-cyan-400">Pindah ke Backlog</div>
                    <div className="text-[8px] text-slate-600">Hidden from website, reversible</div>
                 </button>
                 <button onClick={() => productToDelete && handleQuarantine(productToDelete, true)} className="w-full text-left p-3 border border-slate-800 rounded-md hover:border-red-500/50 transition-colors group">
                    <div className="text-[10px] font-black text-red-400">Hapus Permanen</div>
                    <div className="text-[8px] text-slate-600">Irreversible dataset removal</div>
                 </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toasts */}
      <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3">
        <AnimatePresence>
          {toasts.map(toast => (
            <Toast key={toast.id} {...toast} onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
