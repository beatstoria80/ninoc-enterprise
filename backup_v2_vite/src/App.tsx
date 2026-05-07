/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield,
  RotateCcw,
  Home, 
  ShoppingBag, 
  User, 
  Check, 
  ShoppingCart,
  Search,
  ArrowRight,
  Trash2,
  ChevronLeft,
  Briefcase,
  Heart,
  ChevronRight,
  Settings,
  ArrowLeft,
  ShieldCheck,
  Share2,
  Maximize2,
  Lock as LockIcon,
  Minus,
  Plus,
  Download,
  Loader2,
  MoreVertical,
  Menu,
  X,
  LogOut,
  Info,
  Bell,
  UserPlus,
  Pencil,
  Truck,
  Zap,
  Package,
  Box,
  MessageSquare,
  Send,
  Megaphone,
  Star,
  Image
} from 'lucide-react';
import { Product, ViewType, CartItem } from './types';
import { LegalFooter } from './components/LegalFooter';
import { ConsentModal } from './components/ConsentModal';
import { AdminDashboard } from './components/AdminDashboard';
import { AIStylist } from './components/AIStylist';

interface AppUser {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  gender?: string;
  birthDate?: string;
  address?: any;
}

const HeroBackgroundText = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none opacity-40">
    <motion.div 
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 0.05 }}
      transition={{ duration: 2, ease: "easeOut" }}
      className="absolute top-[10%] -left-10 text-[18vw] font-display font-black text-ink italic -rotate-12 whitespace-nowrap tracking-tighter"
    >
      NINOC ATELIER
    </motion.div>
    <motion.div 
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 0.05 }}
      transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
      className="absolute bottom-[5%] -right-20 text-[14vw] font-display font-black text-rose rotate-6 whitespace-nowrap tracking-tighter"
    >
      PURE ORGANIC
    </motion.div>
    <motion.div 
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 0.02 }}
      transition={{ duration: 1.5, delay: 1 }}
      className="absolute top-[40%] right-[10%] text-[8vw] font-sans font-black text-ink tracking-[0.5em] -rotate-90"
    >
      SINCE 2024
    </motion.div>
  </div>
);

const Blobs = () => (
  <div className="blobs">
    <div className="blob b1"></div>
    <div className="blob b2"></div>
    <div className="blob b3"></div>
    <div className="blob b4"></div>
  </div>
);

const ProductSVG = ({ type, size = 60, className, style }: { type: string, size?: number, className?: string, style?: React.CSSProperties }) => {
  switch (type.toLowerCase()) {
    case 'sage shirt dress':
    case 'sage dress':
      return (
        <svg viewBox="0 0 100 120" width={size} className={className} style={style}>
          <rect x="10" y="0" width="80" height="10" rx="4" fill="#80CBC4"/>
          <polygon points="10,10 90,10 100,35 0,35" fill="#009688"/>
          <rect x="20" y="35" width="60" height="65" rx="4" fill="#26A69A"/>
          <rect x="40" y="35" width="20" height="30" fill="#00796B"/>
        </svg>
      );
    case 'lavender wrap':
    case 'lavender top':
      return (
        <svg viewBox="0 0 100 120" width={size} className={className} style={style}>
          <ellipse cx="50" cy="20" rx="30" ry="12" fill="#CE93D8"/>
          <path d="M20,20 Q10,60 15,110 L85,110 Q90,60 80,20 Z" fill="#9C27B0"/>
          <path d="M20,20 L50,55 L80,20" fill="#7B1FA2"/>
        </svg>
      );
    case 'butter slip dress':
    case 'cream slip':
      return (
        <svg viewBox="0 0 100 120" width={size} className={className} style={style}>
          <path d="M30,5 Q50,0 70,5 L80,25 L20,25 Z" fill="#FFB300"/>
          <rect x="22" y="25" width="56" height="85" rx="5" fill="#FFC107"/>
          <path d="M22,25 L50,50 L78,25" fill="#FF8F00"/>
        </svg>
      );
    case 'azure breeze top':
    case 'denim set':
      return (
        <svg viewBox="0 0 100 120" width={size} className={className} style={style}>
          <path d="M15,20 Q50,8 85,20 L95,45 L5,45 Z" fill="#29B6F6"/>
          <rect x="5" y="45" width="90" height="55" rx="5" fill="#0288D1"/>
          <rect x="5" y="45" width="38" height="55" fill="#0277BD" opacity=".4"/>
        </svg>
      );
    case 'blush puff blouse':
    case 'blush skirt':
      return (
        <svg viewBox="0 0 100 120" width={size} className={className} style={style}>
          <ellipse cx="25" cy="35" rx="18" ry="22" fill="#F06292"/>
          <ellipse cx="75" cy="35" rx="18" ry="22" fill="#F06292"/>
          <rect x="20" y="40" width="60" height="65" rx="6" fill="#E91E63"/>
          <path d="M20,40 Q50,55 80,40" fill="#AD1457"/>
        </svg>
      );
    default:
      return <ShoppingBag size={size} className={className || "text-ink/10"} style={style} />;
  }
};

const safeJson = async (response: Response) => {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }
  const text = await response.text();
  return { 
    error: `Kesalahan Server (${response.status})`, 
    detail: text.substring(0, 50) 
  };
};

const CardStack = ({ products, onSelect }: { products: Product[], onSelect: (p: Product) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const stackVariants = {
    closed: (i: number) => ({
      rotate: i === 0 ? -4 : i === 1 ? 3 : i === 2 ? -7 : i === 3 ? 5 : 0,
      x: i === 0 ? -9 : i === 1 ? 7 : i === 2 ? 0 : i === 3 ? -12 : 0,
      y: i === 2 ? 7 : 0,
      transition: { type: 'spring', stiffness: 300, damping: 25 }
    }),
    open: (i: number) => ({
      rotate: i === 0 ? -23 : i === 1 ? -11 : i === 2 ? 0 : i === 3 ? 11 : 23,
      x: i === 0 ? -220 : i === 1 ? -110 : i === 2 ? 0 : i === 3 ? 110 : 220,
      y: i === 0 || i === 4 ? -25 : i === 1 || i === 3 ? -8 : -45,
      scale: 1.1,
      transition: { type: 'spring', stiffness: 300, damping: 20 }
    })
  };

  return (
    <div className="relative w-full max-w-[700px] h-[500px] flex items-center justify-center perspective-[1400px]">
      <div 
        className="relative w-[220px] h-[310px] cursor-pointer preserve-3d scale-110 md:scale-125"
        onClick={() => setIsOpen(!isOpen)}
      >
        {products && products.slice(0, 5).map((p, i) => (
          <motion.div
            key={p.id}
            custom={i}
            variants={stackVariants}
            animate={isOpen ? 'open' : 'closed'}
            onClick={(e) => {
              if (isOpen) {
                e.stopPropagation();
                onSelect(p);
              }
            }}
            className="absolute inset-0 bg-white rounded-[2rem] p-4 border border-black/5 flex flex-col shadow-editorial preserve-3d backface-hidden"
            style={{ zIndex: 5 - i }}
            whileHover={isOpen ? { y: -60, scale: 1.2, boxShadow: '0 30px 70px rgba(232,82,122,0.25)' } : {}}
          >
            <div className="w-full aspect-square rounded-2xl flex items-center justify-center mb-3 relative overflow-hidden" style={{ background: p.bg }}>
              {p.featured && (
                <div className="absolute top-2 right-2 bg-rose text-white text-[7px] font-black px-2 py-0.5 rounded-full uppercase">NEW</div>
              )}
              {p.image ? (
                <img 
                  src={p.image} 
                  alt={p.name} 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <ProductSVG type={p.name} size={70} />
              )}
            </div>
            <div className="text-xs font-bold text-ink mb-1 truncate px-1">{p.name}</div>
            <div className="text-sm font-black text-rose px-1">Rp {p.price.toLocaleString('id-ID')}</div>
          </motion.div>
        ))}
      </div>
      {!isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-ink/5 backdrop-blur-md text-muted-text text-[10px] font-medium tracking-widest px-3 py-1 rounded-full whitespace-nowrap pointer-events-none"
        >
          KLIK UNTUK MEMBUKA KOLEKSI ✦
        </motion.div>
      )}
    </div>
  );
};

const Header = ({ 
  activeView, 
  setActiveView, 
  cartCount, 
  notificationCount = 0,
  onOpenMenu 
}: { 
  activeView: ViewType, 
  setActiveView: (v: ViewType) => void, 
  cartCount: number,
  notificationCount?: number,
  onOpenMenu: () => void
}) => (
  <motion.header 
    initial={{ y: -20, opacity: 0 }}
    animate={{ y: 0, opacity: 1 }}
    className="px-6 md:px-20 py-4 flex items-center justify-between sticky top-0 z-[500] bg-white/40 backdrop-blur-2xl border-b border-ink/[0.03]"
  >
    <div className="flex items-center gap-10">
      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenMenu} 
          className="flex items-center group cursor-pointer hover:bg-ink/5 p-1.5 rounded-full transition-all active:scale-90"
        >
          <Menu size={16} className="text-ink" />
        </button>
        <div 
          onClick={() => setActiveView('home')} 
          className="cursor-pointer hover:opacity-70 transition-all select-none"
        >
          <div className="font-display font-black text-2xl italic tracking-tighter text-rose leading-none">NINOC</div>
          <div className="text-[7px] font-black tracking-[0.5em] text-ink/20 -mt-0.5 ml-0.5">ATELIER</div>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-12 ml-6">
        {[
          { id: 'home', label: 'Home' },
          { id: 'shop', label: 'Atelier' },
          { id: 'history', label: 'Orders' }
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => setActiveView(item.id as ViewType)} 
            className={`text-[11px] font-black uppercase tracking-[0.4em] transition-all relative group ${
              activeView === item.id ? 'text-rose' : 'text-ink/30 hover:text-ink'
            }`}
          >
            {item.label}
            <span className={`absolute -bottom-3 left-0 h-[2px] bg-rose transition-all duration-700 rounded-full ${
              activeView === item.id ? 'w-full' : 'w-0 group-hover:w-full opacity-30'
            }`} />
          </button>
        ))}
      </div>
    </div>
    
    <div className="flex items-center gap-6">
      <div className="hidden xl:flex items-center bg-ink/[0.02] hover:bg-ink/[0.04] backdrop-blur-md rounded-full px-4 py-2 border border-ink/5 transition-all w-64 group">
        <Search size={12} className="text-ink/20 group-focus-within:text-rose transition-colors" />
        <input 
          type="text" 
          placeholder="SEARCH COLLECTIONS..." 
          className="bg-transparent border-none outline-none text-[10px] font-black text-ink ml-3 w-full placeholder:text-ink/10 tracking-widest"
        />
      </div>
      
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setActiveView('cart')} 
          className="flex w-9 h-9 bg-ink rounded-full items-center justify-center shadow-2xl shadow-ink/20 relative hover:scale-110 active:scale-95 transition-all group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-rose to-orange-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          <ShoppingCart size={14} className="text-white relative z-10" />
          {cartCount > 0 && (
            <motion.span 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-rose text-white text-[7px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-lg"
            >
              {cartCount}
            </motion.span>
          )}
        </button>
  
        <button 
          onClick={() => setActiveView('me')} 
          className="flex w-9 h-9 border border-ink/10 text-ink rounded-full items-center justify-center hover:bg-ink hover:text-white hover:border-transparent active:scale-95 transition-all shadow-sm"
        >
          <User size={14} />
        </button>
      </div>
    </div>
  </motion.header>
);

const Logo = () => (
   <div 
     className="cursor-pointer group flex flex-col items-start"
     onClick={() => window.location.reload()}
   >
     <div className="font-display font-black text-2xl italic tracking-tighter text-rose leading-none group-hover:scale-105 transition-transform">iNIT<span className="text-ink">//</span>PRODUCT</div>
     <div className="text-[7px] font-black tracking-[0.5em] text-ink/20 -mt-0.5 ml-0.5 uppercase">Atelier Archive</div>
   </div>
);

interface MessageItem {
  id: string;
  userId: string;
  userName?: string;
  text: string;
  createdAt: any;
}

const ChatView = ({ 
  user,
  onBack
}: { 
  user: AppUser | null,
  onBack: () => void 
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/chat/messages');
        const data = await safeJson(response);
        setMessages(data.error ? [] : data);
        setIsLoading(false);
      } catch (error) {
        console.error("Chat error:", error);
        setIsLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // Polling every 5s

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ text: newMessage.trim() })
      });
      
      if (response.ok) {
        const msg = await safeJson(response);
        if (!msg.error) {
          setMessages(prev => [...prev, msg]);
          setNewMessage('');
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full bg-cr"
    >
      <div className="flex items-center gap-4 p-6 border-b border-ink/5 bg-white/50 backdrop-blur-md sticky top-0 z-10">
        <button onClick={onBack} className="w-8 h-8 rounded-full bg-white flex items-center justify-center border border-ink/5 shadow-sm">
          <ChevronLeft size={18} />
        </button>
        <div>
          <h2 className="font-display italic text-2xl tracking-tighter">Ninoc Chat</h2>
          <p className="text-[10px] font-bold text-ink/30 uppercase tracking-widest">Community Space</p>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth pb-32"
      >
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-rose/30" size={24} />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-20 opacity-20">
            <MessageSquare size={48} className="mx-auto mb-4" />
            <p className="text-sm italic">Belum ada obrolan. Mulai sapa teman-teman!</p>
          </div>
        ) : (
          messages?.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex flex-col ${msg.userId === user?.id ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[9px] font-black uppercase tracking-widest text-ink/30">{msg.userName}</span>
              </div>
              <div className={`
                max-w-[80%] px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-sm
                ${msg.userId === user?.id 
                  ? 'bg-rose text-white rounded-tr-none shadow-rose/10' 
                  : 'bg-white text-ink rounded-tl-none border border-ink/5 shadow-ink/5'}
              `}>
                {msg.text}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-6 border-t border-ink/5 bg-white/80 backdrop-blur-xl absolute bottom-[80px] md:bottom-0 left-0 right-0 z-20">
        {!user ? (
          <div className="text-center p-2 text-[10px] font-bold text-rose uppercase tracking-widest opacity-60">
            Silakan login untuk mengirim pesan
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
            <input 
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ketik pesan..."
              className="flex-1 h-12 bg-white/50 border border-ink/5 rounded-2xl px-5 text-sm outline-none focus:border-rose/30 transition-colors"
            />
            <button 
              type="submit"
              disabled={!newMessage.trim()}
              className="w-12 h-12 bg-ink text-white rounded-2xl flex items-center justify-center hover:bg-rose transition-all disabled:opacity-30 active:scale-90"
            >
              <Send size={18} />
            </button>
          </form>
        )}
      </div>
    </motion.div>
  );
};

export default function App() {
  const [activeView, setActiveView] = useState<ViewType>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addedItems, setAddedItems] = useState<Set<string>>(new Set());
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const carouselRef = useRef<HTMLDivElement>(null);
  const [dragConstraints, setDragConstraints] = useState({ left: 0, right: 0 });
  
  const [lastOrder, setLastOrder] = useState<{orderId: string, items: CartItem[], total: number, date: string, name?: string, address?: string, phone?: string} | null>(null);
  const [orderHistory, setOrderHistory] = useState<{orderId: string, items: CartItem[], total: number, date: string, name?: string, address?: string, phone?: string}[]>([]);
  const [historyOrderToView, setHistoryOrderToView] = useState<{orderId: string, items: CartItem[], total: number, date: string, name?: string, address?: string, phone?: string} | null>(null);
  
  // Shipping Information States
  const [shippingName, setShippingName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [selectedCarrier, setSelectedCarrier] = useState<{id: string, name: string, price: number} | null>(null);
  
  // Product Detail States
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('rose');
  const [showSizeChart, setShowSizeChart] = useState(false);
  const [showPayPanel, setShowPayPanel] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [pdQty, setPdQty] = useState(1);

  useEffect(() => {
    if (carouselRef.current) {
      const scrollWidth = carouselRef.current.scrollWidth;
      const offsetWidth = carouselRef.current.offsetWidth;
      // Provide extra room for elastic ends
      setDragConstraints({ left: -(scrollWidth - offsetWidth + 20), right: 0 });
    }
  }, [activeView]);

  const openProductDetail = (product: Product) => {
    setSelectedProduct(product);
    setSelectedSize('');
    setPdQty(1);
    setActiveImageIndex(0);
    setActiveView('product');
  };

  const toggleWishlist = (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWishlist(prev => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  };

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Profile Information States
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState<'pria' | 'wanita' | ''>('');
  const [birthDate, setBirthDate] = useState('');
  
  // Administrative States
  const [provinces, setProvinces] = useState<{id: string, name: string}[]>([]);
  const [cities, setCities] = useState<{id: string, name: string}[]>([]);
  const [districts, setDistricts] = useState<{id: string, name: string}[]>([]);
  const [villages, setVillages] = useState<{id: string, name: string}[]>([]);

  const [selectedProvince, setSelectedProvince] = useState({ id: '', name: '' });
  const [selectedCity, setSelectedCity] = useState({ id: '', name: '' });
  const [selectedDistrict, setSelectedDistrict] = useState({ id: '', name: '' });
  const [selectedVillage, setSelectedVillage] = useState({ id: '', name: '' });
  const [streetAddress, setStreetAddress] = useState('');

  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [lastNotificationId, setLastNotificationId] = useState<string | null>(null);

  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (lastNotificationId && latest.id !== lastNotificationId) {
        // Trigger toast/alert
        alert(`NINOC BROADCAST ✦\n${latest.title}\n\n${latest.body}`);
      }
      setLastNotificationId(latest.id);
    }
  }, [notifications, lastNotificationId]);

  const fetchProducts = async (retryCount = 0) => {
    try {
      setIsProductsLoading(true);
      const response = await fetch('/api/products');
      
      // If server is not ready (Vite loading or DB holding), retry after a delay
      if (response.status === 503 && retryCount < 3) {
        console.warn(`Database not ready, retrying in 2s... (Attempt ${retryCount + 1})`);
        setTimeout(() => fetchProducts(retryCount + 1), 2000);
        return;
      }

      const data = await safeJson(response);
      
      if (response.ok) {
        if (!data.error) {
          // ENSURE UNIQUE PRODUCTS BY ID
          const seen = new Set();
          const uniqueData = data.filter((p: any) => {
            if (seen.has(p.id)) return false;
            seen.add(p.id);
            return true;
          });
          setProducts(uniqueData);
        } else if (retryCount < 3) {
          // If we got back HTML or error but status was 200 (Warming up)
          console.warn("Retrying fetchProducts due to non-JSON/error response:", data.error);
          setTimeout(() => fetchProducts(retryCount + 1), 3000);
        }
      } else {
        console.error("Server error when fetching products:", data);
      }
    } catch (error) {
      console.error("Network error fetching products:", error);
      // Attempt retry on network failure once
      if (retryCount < 1) {
        setTimeout(() => fetchProducts(retryCount + 1), 3000);
      }
    } finally {
      if (retryCount >= 1 || !isProductsLoading) {
         setIsProductsLoading(false);
      }
    }
  };

  // Fetch Notifications
  const fetchNotifications = async (retryCount = 0) => {
    try {
      const response = await fetch('/api/notifications');
      if (response.status === 503 && retryCount < 2) {
        setTimeout(() => fetchNotifications(retryCount + 1), 2000);
        return;
      }
      if (response.ok) {
        const data = await safeJson(response);
        if (!data.error) setNotifications(data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    if (activeView === 'product') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [activeView]);

  useEffect(() => {
    if (activeView === 'home' || activeView === 'shop') {
      fetchProducts();
    }
  }, [activeView]);

  useEffect(() => {
    fetchProducts();
    fetchNotifications();

    // 📡 REAL-TIME INTEGRATION via SSE
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/events');

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📡 Real-time update received:', data.type);

          switch(data.type) {
            case 'PRODUCT_CREATED':
              setProducts(prev => {
                if (prev.some(p => p.id === data.payload.id)) return prev;
                return [data.payload, ...prev];
              });
              break;
            case 'PRODUCT_UPDATED':
              setProducts(prev => prev.map(p => p.id === data.payload.id ? data.payload : p));
              break;
            case 'PRODUCT_DELETED':
            case 'PRODUCT_QUARANTINED':
              setProducts(prev => prev.filter(p => p.id !== data.payload.id));
              break;
            case 'NOTIFICATION_SENT':
              fetchNotifications();
              break;
          }
        } catch (parseErr) {
          console.error("Failed to parse SSE message", parseErr);
        }
      };

      es.onerror = () => {
        console.warn('Real-time connection (SSE) interrupted. Reconnecting...');
        if (es) es.close();
      };
    } catch (err) {
      console.error("Failed to initialize SSE:", err);
    }

    return () => {
      if (es) es.close();
    };
  }, []);

  // Automatically populate shipping info from profile when user is logged in
  useEffect(() => {
    if (isLoggedIn) {
      if (fullName) setShippingName(fullName);
      if (phoneNumber) setShippingPhone(phoneNumber);
      
      // Construct full address string
      const fullAddr = [
        streetAddress,
        selectedVillage.name,
        selectedDistrict.name,
        selectedCity.name,
        selectedProvince.name
      ].filter(Boolean).join(', ');
      
      if (fullAddr) setShippingAddress(fullAddr);
    }
  }, [isLoggedIn, fullName, phoneNumber, streetAddress, selectedVillage, selectedDistrict, selectedCity, selectedProvince]);

  // Fetch Provinces on Setup Load
  useEffect(() => {
    if (activeView === 'profile_setup') {
      fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
        .then(res => res.json())
        .then(data => setProvinces(data))
        .catch(err => console.error("Error fetching provinces:", err));
    }
  }, [activeView]);

  // Fetch Cities when Province changes
  useEffect(() => {
    if (selectedProvince.id) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvince.id}.json`)
        .then(res => res.json())
        .then(data => setCities(data))
        .catch(err => console.error("Error fetching cities:", err));
        
      setSelectedCity({ id: '', name: '' });
      setSelectedDistrict({ id: '', name: '' });
      setSelectedVillage({ id: '', name: '' });
    }
  }, [selectedProvince]);

  // Fetch Districts when City changes
  useEffect(() => {
    if (selectedCity.id) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedCity.id}.json`)
        .then(res => res.json())
        .then(data => setDistricts(data))
        .catch(err => console.error("Error fetching districts:", err));
        
      setSelectedDistrict({ id: '', name: '' });
      setSelectedVillage({ id: '', name: '' });
    }
  }, [selectedCity]);

  // Fetch Villages when District changes
  useEffect(() => {
    if (selectedDistrict.id) {
      fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedDistrict.id}.json`)
        .then(res => res.json())
        .then(data => setVillages(data))
        .catch(err => console.error("Error fetching villages:", err));
        
      setSelectedVillage({ id: '', name: '' });
    }
  }, [selectedDistrict]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setAuthLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await safeJson(response);
          if (!data.error) {
            setIsLoggedIn(true);
            setCurrentUser(data.user);
            setEmail(data.user.email || '');
            
            const profile = data.user;
            if (profile) {
              setFullName(profile.displayName || '');
              setPhoneNumber(profile.phoneNumber || '');
              setGender(profile.gender || '');
              setBirthDate(profile.birthDate || '');
              
              if (profile.address) {
                setSelectedProvince(profile.address.province || { id: '', name: '' });
                setSelectedCity(profile.address.city || { id: '', name: '' });
                setSelectedDistrict(profile.address.district || { id: '', name: '' });
                setSelectedVillage(profile.address.village || { id: '', name: '' });
                setStreetAddress(profile.address.street || '');
              }
            }
          }
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [activeView]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Harap isi semua bidang', 'error');
      return;
    }
    
    setAuthLoading(true);
    try {
      const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, username: email })
      });
      
      const data = await safeJson(response);
      
      if (response.ok && !data.error) {
        localStorage.setItem('token', data.token);
        setIsLoggedIn(true);
        setCurrentUser(data.user);
        showToast(isLoginMode ? 'Selamat datang kembali!' : 'Akun berhasil dibuat!', 'success');
        if (!isLoginMode) setActiveView('profile_setup');
      } else {
        showToast(data.error || 'Gagal melakukan autentikasi', 'error');
      }
    } catch (error: any) {
      console.error('Auth Error:', error);
      showToast('Gangguan koneksi server', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    showToast('Login Google dinonaktifkan dalam mode Enterprise Backend', 'info');
  };

  const handleSignOut = async () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setCurrentUser(null);
    showToast('Berhasil keluar', 'info');
  };

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!fullName || !phoneNumber || !gender || !birthDate || !selectedProvince.id || !selectedCity.id || !selectedDistrict.id || !selectedVillage.id || !streetAddress) {
      showToast('Harap lengkapi semua data profile', 'error');
      return;
    }

    setIsProfileSaving(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          fullName,
          phone: phoneNumber,
          gender,
          birthDate,
          address: {
            province: selectedProvince,
            city: selectedCity,
            district: selectedDistrict,
            village: selectedVillage,
            street: streetAddress
          }
        })
      });

      const data = await safeJson(response);
      if (response.ok && !data.error) {
        setCurrentUser(data.user);
        showToast('Profile berhasil diperbarui!', 'success');
        setActiveView('home');
      } else {
        showToast(data.error || 'Gagal menyimpan profile', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Gagal menyimpan profile', 'error');
    } finally {
      setIsProfileSaving(false);
    }
  };

  const [toast, setToast] = useState<{message: string, type: string} | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [showConsent, setShowConsent] = useState(false);

  const handleCheckout = async (directItem?: any) => {
    if (!hasConsent) {
      setShowConsent(true);
      showToast('Harap setujui syarat & kebijakan privasi', 'error');
      return;
    }
    
    setIsCheckingOut(true);
    try {
      const itemsToCheckout = directItem ? [directItem] : cartItems;
      const totalToPay = directItem ? (directItem.price * directItem.quantity) : totalPrice;

      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          amount: totalToPay, 
          customer: {
            first_name: currentUser?.displayName?.split(' ')[0] || "Customer",
            email: currentUser?.email || "customer@example.com",
            phone: shippingPhone || "08123456789"
          }
        })
      });
      
      const data = await safeJson(response);
      
      if (!response.ok || data.error) {
        throw new Error(data.error || 'Failed to create payment transaction');
      }
      
      // Record sale in backend
      const checkoutResponse = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          items: itemsToCheckout,
          total: totalToPay,
          shippingInfo: {
            name: shippingName || currentUser?.displayName || 'Guest User',
            address: shippingAddress || 'Alamat tidak ditentukan',
            phone: shippingPhone || '08xxxxxxxxxx',
            email: currentUser?.email
          }
        })
      });

      const checkoutData = await checkoutResponse.json();

      if (checkoutResponse.ok) {
        const orderSummary = {
          id: checkoutData.id || Math.random().toString(36).substr(2, 9),
          orderId: checkoutData.orderId,
          date: new Date().toLocaleDateString('id-ID'),
          total: totalToPay,
          status: 'paid',
          items: itemsToCheckout,
          name: shippingName || currentUser?.displayName || 'Guest User',
          phone: shippingPhone || '08xxxxxxx',
          address: shippingAddress || 'Alamat tidak ditentukan'
        };

        setLastOrder(orderSummary);
        setOrderHistory(prev => [orderSummary, ...prev]);
        
        if (!directItem) {
          setCartItems([]);
          setAddedItems(new Set());
        }
        
        setShowPayPanel(false);
        setActiveView('success');
        fetchProducts(); // Refresh products to show updated stock
      } else {
        throw new Error(checkoutData.error || 'Gagal menyimpan pesanan');
      }
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Gangguan sistem pembayaran', 'error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  useEffect(() => {
    // Load Midtrans Snap Script dynamically
    const script = document.createElement('script');
    script.src = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true' 
      ? 'https://app.midtrans.com/snap/snap.js' 
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    
    script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '');
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const showToast = (message: string, type: string = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addToCart = (product: Product, size?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (product.sizes && product.sizes.length > 0 && !size && activeView === 'product') {
      showToast('Pilih ukuran terlebih dahulu', 'error');
      return;
    }

    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id && (!item.sizes || item.sizes.includes(size || '')));
      // Simplification: if same product, increment qty regardless of size for now, or track size.
      // For this app, let's keep it simple.
      const alreadyIn = prev.find(item => item.id === product.id);
      if (alreadyIn) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });

    setAddedItems(prev => {
      const next = new Set(prev);
      next.add(product.id);
      return next;
    });
    
    showToast(`✓ ${product.name} ditambahkan ke tas`);

    setTimeout(() => {
      setAddedItems(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1500);
  };

  const removeFromCart = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
    setAddedItems(prev => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === productId);
      if (!existing) return prev;

      const newQuantity = existing.quantity + delta;
      
      // Jika hasil pengurangan < 1, hapus item dari keranjang dan reset status 'added'
      if (newQuantity < 1) {
        setAddedItems(prevAdded => {
          const next = new Set(prevAdded);
          next.delete(productId);
          return next;
        });
        return prev.filter(item => item.id !== productId);
      }

      return prev.map(item => 
        item.id === productId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const clearCart = () => setCartItems([]);

  const subTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // Dynamic Shipping Calculation based on Province ID and Carrier
  const calculateShippingPrice = (carrierId: string) => {
    const basePrices: Record<string, number> = {
      jne: 15000,
      jnt: 12000,
      sicepat: 10000,
      tiki: 14000
    };

    const base = basePrices[carrierId] || 10000;
    
    // Simulate distance/zone multiplier based on Province ID
    // Jakarta (31) is cheapest, Papua/far provinces (91+) are most expensive
    const provinceId = parseInt(selectedProvince.id) || 31;
    let multiplier = 1;

    if (provinceId === 31) multiplier = 0.8; // Jakarta
    else if (provinceId >= 32 && provinceId <= 36) multiplier = 1; // Java
    else if (provinceId >= 51 && provinceId <= 74) multiplier = 1.5; // Sumatra/Kalimantan/Sulawesi
    else multiplier = 2.5; // Eastern Indonesia

    return Math.round((base * multiplier) / 1000) * 1000;
  };

  const shippingCost = selectedCarrier ? calculateShippingPrice(selectedCarrier.id) : 0;
  const totalPrice = subTotal + shippingCost;

  return (
    <div className="app-wrapper">
      <Blobs />
      <div className="view-container relative flex-1">
        <AnimatePresence mode="wait">
          {activeView === 'admin' && (
            <AdminDashboard 
              onBack={() => setActiveView('home')} 
              onRefresh={fetchProducts}
            />
          )}

          {activeView === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="view"
            >
              <HeroBackgroundText />
              <Header 
                activeView={activeView}
                setActiveView={setActiveView}
                cartCount={cartItems.length}
                notificationCount={notifications.filter(n => !n.read).length}
                onOpenMenu={() => setIsMenuOpen(true)}
              />
              <div className="content scroll-area px-4 sm:px-8 pt-2 overflow-x-hidden relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[calc(100vh-140px)] items-center gap-8 max-w-[1400px] mx-auto px-4 sm:px-12">
                  <motion.div 
                    initial={{ x: -40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-10 py-20 relative z-10"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <span className="w-12 h-[1px] bg-ink/20"></span>
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-ink/40">Spring Summer 2025</span>
                      </div>
                      <h1 className="text-7xl sm:text-8xl lg:text-[112px] font-display font-black leading-[0.85] text-ink tracking-tighter">
                        Ekspresikan<br />
                        <span className="text-rose italic">Sisi Unik</span><br />
                        Ninoc
                      </h1>
                    </div>
                    
                    <p className="max-w-md text-lg text-muted-text font-medium leading-relaxed">
                      Temukan gaya personalmu melalui kurasi editorial kami. Koleksi SS2025 yang merayakan keberanian bereskpresi dengan material organik premium.
                    </p>

                    <div className="flex flex-wrap gap-4 pt-4">
                      <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setActiveView('shop')}
                        className="bg-ink text-white px-10 py-5 rounded-full font-black text-xs uppercase tracking-widest shadow-editorial hover:bg-rose transition-all flex items-center gap-3"
                      >
                        Jelajahi Koleksi <ArrowRight size={16} />
                      </motion.button>
                      <div className="flex items-center gap-4 pt-4">
                        <div className="w-10 h-10 rounded-full border-2 border-white bg-mnt flex items-center justify-center shadow-sm">
                          <Package size={16} className="text-white" />
                        </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-ink uppercase tracking-[0.3em]">{products.length} Units</span>
                        <span className="text-[8px] font-bold text-ink/20 uppercase tracking-[0.4em]">Curated DataSet</span>
                      </div>
                      </div>
                    </div>
                  </motion.div>

                  <div className="relative h-full flex items-center justify-center lg:justify-end">
                    <CardStack 
                      products={products.filter(p => p.featured)} 
                      onSelect={openProductDetail} 
                    />
                  </div>
                </div>

                <div className="max-w-[1400px] mx-auto px-4 sm:px-12 py-10 relative z-30">
                   <AIStylist />
                </div>

                {/* Marquee - Brutalist Accent */}
                <div className="w-full overflow-hidden bg-ink py-6 border-y border-ink rotate-[-1deg] translate-y-10 scale-105 z-20">
                  <motion.div 
                    animate={{ x: [0, -1000] }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="flex whitespace-nowrap gap-20 items-center font-mono"
                  >
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex gap-20 items-center">
                         <span className="text-white text-4xl font-display italic font-black uppercase tracking-tighter">New Arrivals ✦</span>
                         <span className="text-rose text-4xl font-display italic font-black uppercase tracking-tighter">Limited Edition ✦</span>
                         <span className="text-mnt text-4xl font-display italic font-black uppercase tracking-tighter">Premium Silk ✦</span>
                      </div>
                    ))}
                  </motion.div>
                </div>
                
                {/* Shop Section Preview */}
                <div className="max-w-[1400px] mx-auto px-4 sm:px-12 py-32 space-y-16">
                  <div className="flex justify-between items-end">
                     <h2 className="text-5xl font-display italic font-black text-ink tracking-tight">Kurasi Minggu Ini</h2>
                     <button onClick={() => setActiveView('shop')} className="hidden sm:flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-ink/40 hover:text-rose transition-all">
                       Lihat Semua Item <ChevronRight size={14} />
                     </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {products.slice(0, 3).map((p, i) => (
                      <motion.div 
                        key={p.id}
                        initial={{ y: 20, opacity: 0 }}
                        whileInView={{ y: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => openProductDetail(p)}
                        className="group cursor-pointer space-y-6"
                      >
                        <div className="aspect-[4/5] border border-ink/5 overflow-hidden flex items-center justify-center relative bg-ink-faint group-hover:border-rose transition-all duration-500">
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] transition-all duration-500" />
                          <div className="scale-[1.1] group-hover:scale-[1.2] transition-all duration-700">
                             <ProductSVG type={p.name} size={160} />
                          </div>
                          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                             <div className="bg-ink text-white px-8 py-3 text-[9px] font-black uppercase tracking-[0.3em] shadow-2xl">Record.Detail</div>
                          </div>
                        </div>
                        <div className="flex justify-between items-start px-2">
                          <div className="space-y-1.5 text-left">
                             <p className="text-[8px] font-black uppercase tracking-[0.3em] text-ink/20 leading-none">{p.category}</p>
                             <h3 className="text-[11px] font-sans font-semibold text-ink leading-tight uppercase tracking-wide">{p.name}</h3>
                          </div>
                          <div className="text-[11px] font-sans font-bold text-rose/80 tracking-tight">IDR {p.price.toLocaleString('id-ID')}</div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-40 border-t border-ink/5 pt-8 pb-16 opacity-40">
                  <LegalFooter />
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'shop' && (
            <motion.div
              key="shop"
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="view"
            >
              <Header 
                activeView={activeView}
                setActiveView={setActiveView}
                cartCount={cartItems.length}
                notificationCount={notifications.length}
                onOpenMenu={() => setIsMenuOpen(true)}
              />
              <div className="scroll-area pb-[140px] px-6 sm:px-10 pt-4">
                <div className="max-w-7xl mx-auto">
                  <div className="flex justify-between items-end mb-6">
                    <div>
                      <h2 className="font-display italic text-[clamp(1.4rem,3vw,2rem)] leading-none mb-1 text-ink tracking-tight">Katalog Produk</h2>
                      <p className="text-[10px] font-bold tracking-[0.3em] text-ink/30 uppercase">Signature Atelier Pieces</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
                    {products.map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onAdd={(e) => addToCart(product, e)}
                        onClick={() => openProductDetail(product)}
                        isAdded={addedItems.has(product.id)}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-20 pb-16 opacity-30">
                  <LegalFooter />
                </div>
              </div>
            </motion.div>
          )}
          {activeView === 'product' && selectedProduct && (
            <motion.div
              key="product"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] bg-white overflow-hidden flex flex-col font-sans"
            >
              {/* Reference Header Nav */}
              <div className="h-20 w-full bg-[#F5F5F3]/50 backdrop-blur-md border-b border-ink/5 flex items-center justify-between px-6 md:px-14 shrink-0">
                <div className="flex items-center gap-6">
                  <div className="text-[11px] font-bold tracking-[0.4em] text-ink/40 uppercase cursor-pointer hover:text-ink transition-colors">NINOC</div>
                  <div className="w-[1px] h-3 bg-ink/10" />
                  <div className="text-[11px] font-bold tracking-[0.4em] text-rose uppercase cursor-pointer">CLOTHING</div>
                  <div className="w-[1px] h-3 bg-ink/10" />
                  <div className="text-[11px] font-bold tracking-[0.4em] text-ink/60 uppercase">{selectedProduct.name}</div>
                </div>
                <div className="flex items-center gap-6">
                   <div className="text-[12px] font-bold text-ink/30 tracking-widest italic font-serif">0{activeImageIndex + 1} / 05</div>
                   <button 
                     onClick={() => setActiveView('shop')} 
                     className="w-11 h-11 bg-white border border-ink/5 rounded-full flex items-center justify-center hover:bg-ink hover:text-white transition-all active:scale-90 shadow-sm"
                   >
                     <X size={18} />
                   </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-[#F5F5F3]/30">
                {/* Visuals & Selection - Left Sidebar */}
                <div className="w-full md:w-[35%] lg:w-[30%] h-full flex flex-col bg-[#F5F5F3]/40 md:border-r border-ink/5 p-8 lg:p-14 overflow-y-auto scrollbar-none gap-8">
                  <div className="text-[11px] font-bold text-ink/30 tracking-widest italic font-serif">01 / 05</div>
                  
                  {/* Main Visual Container */}
                  <div className="relative aspect-square bg-white rounded-[40px] flex items-center justify-center overflow-hidden shadow-[0_4px_40px_rgba(0,0,0,0.03)] group border border-white">
                    {/* Featured Tag */}
                    <div className="absolute top-8 left-8 z-[10]">
                      <div className="px-4 py-2 bg-rose/5 border border-rose/10 rounded-xl text-[9px] font-black text-rose uppercase tracking-[0.3em] backdrop-blur-sm">FEATURED</div>
                    </div>

                    {/* Navigation Arrows */}
                    <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between z-[420] pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500">
                      <button onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => prev > 0 ? prev - 1 : 4); }} className="w-11 h-11 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center text-ink/30 hover:text-rose pointer-events-auto transition-all active:scale-90 border border-ink/5 shadow-xl"><ChevronLeft size={20} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setActiveImageIndex(prev => prev < 4 ? prev + 1 : 0); }} className="w-11 h-11 bg-white/95 backdrop-blur-md rounded-full flex items-center justify-center text-ink/30 hover:text-rose pointer-events-auto transition-all active:scale-90 border border-ink/5 shadow-xl"><ChevronRight size={20} /></button>
                    </div>
                    
                    <motion.img 
                      key={activeImageIndex}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      src={[selectedProduct.image, selectedProduct.perspective1, selectedProduct.perspective2, selectedProduct.perspective3, selectedProduct.perspective4][activeImageIndex] || selectedProduct.image} 
                      alt={selectedProduct.name}
                      className="w-full h-full object-contain p-12 filter drop-shadow-[0_20px_80px_rgba(0,0,0,0.08)]"
                      referrerPolicy="no-referrer"
                    />

                    {/* Stock Tag */}
                    <div className="absolute bottom-8 right-8 z-[10] text-[10px] font-bold text-ink/20 uppercase tracking-widest">
                      {selectedProduct.stock} unit
                    </div>
                  </div>

                  {/* Thumbnails */}
                  <div className="flex gap-3">
                    {[selectedProduct.image, selectedProduct.perspective1, selectedProduct.perspective2, selectedProduct.perspective3, selectedProduct.perspective4].map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => img && setActiveImageIndex(idx)}
                        className={`w-full aspect-square rounded-2xl border flex items-center justify-center p-3 transition-all duration-300 ${activeImageIndex === idx ? 'border-rose ring-4 ring-rose/5 bg-white scale-105' : 'border-white bg-white/40 opacity-70 hover:opacity-100'}`}
                      >
                         {img ? <img src={img} className="w-full h-full object-contain" referrerPolicy="no-referrer" /> : <div className="w-full h-full bg-stone-100/50 rounded-lg flex items-center justify-center"><Image size={16} className="opacity-10" /></div>}
                      </button>
                    ))}
                  </div>

                  {/* Price & Selection */}
                  <div className="space-y-10 mt-4">
                     <div className="flex items-baseline gap-5">
                        <span className="text-[36px] font-black text-rose tracking-wider italic font-serif">IDR {selectedProduct.price.toLocaleString('id-ID')}</span>
                        {selectedProduct.originalPrice && (
                          <div className="flex items-center gap-3">
                            <span className="text-[18px] text-ink/15 line-through font-bold">{selectedProduct.originalPrice.toLocaleString('id-ID')}</span>
                            <span className="text-[11px] bg-rose text-white px-2 py-0.5 font-bold uppercase rounded-sm italic tracking-widest">{selectedProduct.discountTag}</span>
                          </div>
                        )}
                     </div>

                     <div className="space-y-4">
                        <div className="text-[11px] font-black tracking-[0.4em] text-ink/15 uppercase">WARNA</div>
                        <div className="flex gap-4">
                           {[{ name: 'rose', hex: '#E11D48' }, { name: 'sage', hex: '#10B981' }, { name: 'ink', hex: '#0F172A' }, { name: 'sand', hex: '#E7E2C8' }].map((c) => (
                              <button
                                key={c.name}
                                onClick={() => setSelectedColor(c.name)}
                                className={`w-10 h-10 rounded-full border-2 p-1 transition-all ${selectedColor === c.name ? 'border-rose scale-110 shadow-xl shadow-rose/20' : 'border-white bg-white/50'}`}
                              >
                                <div className="w-full h-full rounded-full" style={{ backgroundColor: c.hex }} />
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="text-[11px] font-black tracking-[0.4em] text-ink/15 uppercase">UKURAN</div>
                        <div className="flex flex-wrap gap-3">
                           {["S", "M", "L", "XL"].map(s => (
                              <button
                                key={s}
                                onClick={() => setSelectedSize(s)}
                                className={`w-16 h-14 rounded-2xl border-2 text-[13px] font-black tracking-widest transition-all flex items-center justify-center ${selectedSize === s ? 'bg-white border-rose text-rose shadow-xl shadow-rose/10 scale-105' : 'border-white bg-white/40 text-ink/30 hover:border-ink/10'}`}
                              >
                                {s}
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>
                </div>

                {/* Information Area - Right Column */}
                <div className="flex-1 h-full bg-white flex flex-col p-10 md:p-20 lg:p-24 overflow-y-auto scrollbar-none relative">
                   <div className="max-w-4xl mx-auto w-full">
                      <div className="text-[13px] font-bold text-ink/20 tracking-[0.5em] uppercase font-sans mb-12">PREMIUM RECORD · {selectedProduct.category}</div>

                      <div className="flex flex-col gap-2 mb-24">
                         <h2 className="text-[100px] md:text-[140px] lg:text-[160px] font-black text-ink tracking-tight leading-[0.8] font-sans uppercase">
                            {selectedProduct.name.split(' ')[0]}
                         </h2>
                         <h2 className="text-[100px] md:text-[140px] lg:text-[160px] font-black text-rose tracking-tight leading-[0.8] font-sans italic uppercase translate-x-12 opacity-90">
                            {selectedProduct.name.split(' ').slice(1).join(' ') || 'PIECE'}
                         </h2>
                      </div>

                      <div className="w-1/4 h-[1px] bg-ink/10 mb-20" />

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-start mb-24">
                         <p className="text-[21px] md:text-[23px] text-ink/80 leading-relaxed font-medium font-sans">
                            {selectedProduct.description || "EMOTION DUMP adalah bagian dari koleksi Emotion Dump — seri pertama NINOC yang lahir dari percakapan jujur antara kami dan generasi yang tumbuh bersama layar, deadline, dan perasaan yang sulit diungkap dengan kata."}
                         </p>
                         <p className="text-[21px] md:text-[23px] text-ink/80 leading-relaxed font-medium font-sans">
                            Setiap ilustrasi dirancang sebagai ekspresi, bukan sekadar motif. Dihadirkan di atas kaos cotton premium dengan potongan yang bersih — karena kami percaya bahwa pakaian yang baik tidak perlu berteriak untuk diperhatikan.
                         </p>
                      </div>

                      <div className="w-full h-[1px] bg-ink/5 mb-20" />

                      <div className="flex flex-col md:flex-row items-center justify-between gap-16 pb-40">
                         <p className="max-w-sm text-[16px] text-ink/30 italic leading-relaxed font-medium font-sans border-l-2 border-rose/10 pl-8">
                            NINOC — untuk mereka yang tidak butuh label besar untuk merasa percaya diri.
                         </p>
                         
                         <div className="flex gap-6 items-center">
                            <button 
                              onClick={(e) => addToCart(selectedProduct, e)}
                              className="px-16 h-24 bg-[#0F172A] rounded-full flex items-center gap-10 group hover:scale-[1.03] active:scale-[0.98] transition-all relative overflow-hidden shadow-2xl shadow-ink/20"
                            >
                               <span className="text-[19px] font-black text-white tracking-[0.5em] uppercase z-10">
                                 {addedItems.has(selectedProduct.id) ? "DIPEROLEH" : "AMBIL PIECE INI"}
                               </span>
                               <Star className={`w-7 h-7 z-10 ${addedItems.has(selectedProduct.id) ? 'fill-rose text-rose animate-spin' : 'text-white/20 group-hover:text-rose group-hover:rotate-180 transition-all duration-700'}`} />
                               <div className="absolute inset-0 bg-gradient-to-tr from-rose/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            <button 
                              onClick={(e) => toggleWishlist(selectedProduct.id, e)}
                              className={`w-24 h-24 rounded-full border-2 flex items-center justify-center transition-all ${wishlist.has(selectedProduct.id) ? 'bg-rose border-rose text-white shadow-2xl shadow-rose/20' : 'border-ink/5 bg-stone-50 text-ink/10 hover:border-ink hover:text-ink hover:bg-white'}`}
                            >
                               <Heart className={`w-8 h-8 ${wishlist.has(selectedProduct.id) ? 'fill-current' : ''}`} />
                            </button>
                         </div>
                      </div>
                   </div>
                </div>
              </div>

               {/* PAY PANEL (Overlay inside the view) */}
              <AnimatePresence>
                    {showPayPanel && (
                      <motion.div 
                        id="payPanel"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute inset-0 bg-white z-[700] flex flex-col p-0 shadow-[-20px_0_100px_rgba(0,0,0,0.1)] overflow-hidden"
                      >
                        <div className="py-head p-4 md:p-6 flex items-center gap-4 border-b border-ink/5 bg-ink text-white">
                          <button onClick={() => setShowPayPanel(false)} className="py-back w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">←</button>
                          <div className="py-title font-sans text-xl font-bold uppercase tracking-widest">Metode Pembayaran</div>
                        </div>
                        
                        <div className="p-4 md:p-6 flex-1 overflow-y-auto space-y-4 scrollbar-none">
                           <div className="py-sum flex items-center gap-4 p-4 rounded-2xl border border-ink/5 bg-ink/[0.02]">
                             <div className="py-art w-16 h-20 bg-white rounded-xl flex items-center justify-center shadow-md border border-ink/5 p-2">
                                <ProductSVG type={selectedProduct.name} size={40} />
                             </div>
                             <div className="flex-1">
                               <div className="py-n text-[9px] font-black text-ink/20 uppercase tracking-widest mb-0.5">{selectedProduct.category}</div>
                               <div className="py-n text-lg font-sans font-bold text-ink leading-tight uppercase tracking-wider">{selectedProduct.name}</div>
                               <div className="py-s text-[10px] font-bold text-ink/40 tracking-widest uppercase mt-0.5">Size {selectedSize || 'STD'} / {selectedColor}</div>
                             </div>
                             <div className="py-p text-lg font-sans font-bold text-rose">IDR {selectedProduct.price.toLocaleString('id-ID')}</div>
                           </div>
                           
                           <div className="mqty-delivery flex gap-4 items-center flex-wrap">
                              <div className="mqty-block flex flex-col gap-1.5">
                                <div className="mopt-label text-[9px] font-black tracking-[0.3em] text-ink/30 uppercase px-1">Jumlah</div>
                                <div className="qty-row flex items-center h-10 bg-ink/[0.03] border border-ink/5 rounded-xl px-3 justify-between shadow-sm min-w-[100px]">
                                  <button onClick={() => setPdQty(prev => Math.max(1, prev - 1))} className="qbtn text-lg font-bold text-ink/20 hover:text-rose transition-all">-</button>
                                  <span className="qv text-sm font-black text-ink">{pdQty}</span>
                                  <button onClick={() => setPdQty(prev => prev + 1)} className="qbtn text-lg font-bold text-ink/20 hover:text-rose transition-all">+</button>
                                </div>
                              </div>
                              <div className="mdelivery flex-1 min-w-[200px] flex items-center gap-3 bg-emerald-50/40 border border-emerald-100 rounded-xl p-3 shadow-sm">
                                <span className="mdelivery-ico text-xl">🚚</span>
                                <div className="text-left">
                                  <div className="mdelivery-label text-[8px] font-black text-emerald-800/30 uppercase tracking-[0.2em] mb-0.5">Estimasi Tiba</div>
                                  <div className="mdelivery-val text-[11px] font-black text-emerald-800 leading-none uppercase">3–5 Hari Kerja</div>
                                </div>
                                <div className="ml-auto text-[8px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 uppercase">Free</div>
                              </div>
                           </div>

                           <div className="space-y-3">
                             <div className="py-sec text-[9px] font-black text-ink/30 uppercase tracking-[0.3em]">Opsi Pembayaran</div>
                             <div className="py-grid grid grid-cols-2 gap-3">
                               {[
                                 { name: 'Transfer Bank', icon: '🏦' },
                                 { name: 'Virtual Account', icon: '💳' },
                                 { name: 'E-Wallet', icon: '📱' },
                                 { name: 'QRIS Scan', icon: '🔲' }
                               ].map(method => (
                                 <button key={method.name} className="h-14 rounded-xl border border-ink/5 bg-white shadow-sm flex flex-col items-center justify-center gap-1 group hover:border-rose hover:bg-rose/5 transition-all">
                                   <span className="text-xs grayscale group-hover:grayscale-0">{method.icon}</span>
                                   <span className="font-black text-[9px] uppercase tracking-widest text-ink/40 group-hover:text-rose">{method.name}</span>
                                 </button>
                               ))}
                             </div>
                           </div>

                           <div className="flex items-center justify-between p-3 bg-cr rounded-xl border border-ink/5 gap-3 mt-4">
                             <div className="flex items-center gap-2">
                               <ShieldCheck size={14} className="text-emerald-500" />
                               <span className="text-[9px] font-bold text-ink/40 uppercase tracking-widest">Aman (SSL)</span>
                             </div>
                             <div className="flex items-center gap-2">
                               <RotateCcw size={14} className="text-rose/50" />
                               <span className="text-[9px] font-bold text-ink/40 uppercase tracking-widest">Retur 14 Hari</span>
                             </div>
                           </div>
                        </div>

                        <div className="p-4 md:p-6 border-t border-ink/5 bg-white">
                          <div className="py-tot flex justify-between items-center mb-4">
                            <span className="py-tl text-[9px] font-black text-ink/30 uppercase tracking-widest">Total Tagihan</span>
                            <span className="py-tv text-xl font-sans font-bold text-ink">IDR {(selectedProduct.price * pdQty).toLocaleString('id-ID')}</span>
                          </div>
                          <button 
                            onClick={() => {
                               handleCheckout({ 
                                 ...selectedProduct, 
                                 size: selectedSize || 'M', 
                                 quantity: pdQty, 
                                 color: selectedColor 
                               });
                            }}
                            disabled={isCheckingOut}
                            className={`w-full h-14 rounded-full text-white font-display italic text-lg font-bold shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2
                              ${isCheckingOut ? 'bg-gray-400' : 'bg-rose shadow-rose/20'}
                            `}
                          >
                             {isCheckingOut ? 'MEMPROSES...' : '✦ Konfirmasi & Bayar Sekarang →'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
            </motion.div>
          )}

          {activeView === 'cart' && (
            <motion.div
              key="cart"
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="view"
            >
              <Header 
                activeView={activeView}
                setActiveView={setActiveView}
                cartCount={cartItems.length}
                notificationCount={notifications.length}
                onOpenMenu={() => setIsMenuOpen(true)}
              />
                <div className="content scroll-area px-8 pt-4 pb-24">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                    <ShoppingBag size={80} strokeWidth={1} className="mb-4" />
                    <p className="font-display text-xl">Keranjang Kosong</p>
                    <button onClick={() => setActiveView('shop')} className="mt-4 text-rose text-xs font-bold underline">Cari Produk</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <CartItemComponent 
                        key={item.id} 
                        item={item} 
                        onRemove={() => removeFromCart(item.id)} 
                        onUpdateQty={(delta) => updateQuantity(item.id, delta)}
                      />
                    ))}
                    
                    <div className="pt-4 border-t border-ink/5 space-y-3 mb-2">
                      <div className="flex justify-between text-sm opacity-60">
                        <span>Subtotal</span>
                        <span>Rp {subTotal.toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-sm opacity-60">
                        <span>Pengiriman</span>
                        <span>{shippingCost > 0 ? `Rp ${shippingCost.toLocaleString('id-ID')}` : 'Pilih Kurir'}</span>
                      </div>
                      <div className="flex justify-between font-display text-2xl pt-2">
                        <span>Total</span>
                        <span className="text-rose italic">Rp {totalPrice.toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    {/* Shipping Carrier Selection */}
                    <div className="space-y-3 pt-2">
                      <div className="text-left">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/30 ml-2">Pilih Jasa Pengiriman</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { id: 'jne', name: 'JNE', price: 15, icon: Truck },
                          { id: 'jnt', name: 'J&T', price: 12, icon: Zap },
                          { id: 'sicepat', name: 'SiCepat', price: 10, icon: Package },
                          { id: 'tiki', name: 'TIKI', price: 14, icon: Box }
                        ].map((carrier) => (
                          <motion.button
                            key={carrier.id}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedCarrier(carrier)}
                            className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                              selectedCarrier?.id === carrier.id 
                                ? 'bg-rose border-rose text-white shadow-lg shadow-rose/20' 
                                : 'bg-white border-ink/5 text-ink/40 hover:border-rose/30'
                            }`}
                          >
                            <carrier.icon size={18} className={selectedCarrier?.id === carrier.id ? 'text-white' : 'text-rose/60'} />
                            <span className="text-[9px] font-black mt-2 tracking-tighter">{carrier.name}</span>
                            <span className="text-[7px] opacity-60 font-bold mt-1">Rp {calculateShippingPrice(carrier.id) / 1000}K</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Info Form */}
                    <div className="space-y-3 pt-4 border-t border-ink/5">
                      <div className="text-left">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-ink/30 ml-2">Shipping Information</span>
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1 text-left">
                          <label className="text-[9px] font-black uppercase tracking-widest text-ink/30 ml-2">Full Name</label>
                          <input 
                            type="text" 
                            value={shippingName}
                            onChange={(e) => setShippingName(e.target.value)}
                            placeholder="Your Name"
                            className="w-full h-11 px-5 bg-white/40 border border-white/60 rounded-xl text-xs font-bold focus:outline-none transition-all placeholder:text-ink/10"
                          />
                        </div>
                        <div className="space-y-1 text-left">
                          <label className="text-[9px] font-black uppercase tracking-widest text-ink/30 ml-2">Phone Number</label>
                          <input 
                            type="tel" 
                            value={shippingPhone}
                            onChange={(e) => setShippingPhone(e.target.value)}
                            placeholder="0812XXXXXXXX"
                            className="w-full h-11 px-5 bg-white/40 border border-white/60 rounded-xl text-xs font-bold focus:outline-none transition-all placeholder:text-ink/10"
                          />
                        </div>
                        <div className="space-y-1 text-left">
                          <label className="text-[9px] font-black uppercase tracking-widest text-ink/30 ml-2">Delivery Address</label>
                          <textarea 
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            placeholder="Your shipping address..."
                            rows={3}
                            className="w-full px-5 py-3 bg-white/40 border border-white/60 rounded-xl text-xs font-bold focus:outline-none transition-all placeholder:text-ink/10 resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    {/* PDP Compliance Section */}
                    <div className="p-5 bg-cr rounded-2xl border border-ink/5">
                       <label className="flex gap-4 cursor-pointer group">
                          <div className="relative mt-1">
                             <input 
                              type="checkbox" 
                              checked={hasConsent}
                              onChange={(e) => setHasConsent(e.target.checked)}
                              className="sr-only peer" 
                             />
                             <div className="w-5 h-5 border-2 border-ink/20 rounded-md peer-checked:bg-rose peer-checked:border-rose transition-all flex items-center justify-center">
                                {hasConsent && <Check size={12} className="text-white" />}
                             </div>
                          </div>
                          <p className="text-[10px] leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity font-medium">
                             Saya menyetujui pemrosesan data pribadi untuk keperluan transaksi sesuai dengan <span className="underline font-bold">UU PDP No. 27/2022</span> dan Kebijakan Privasi Ninoc.
                          </p>
                       </label>
                    </div>

                    {/* UU PDP & Security Badges moved to scroll area */}
                    <div className="mt-6 pt-6 border-t border-ink/5 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose/10 flex items-center justify-center text-rose flex-shrink-0">
                          <ShieldCheck size={16} />
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-ink">E2E Encryption Active</div>
                          <div className="text-[9px] text-ink/70 leading-relaxed uppercase tracking-wider font-bold">
                            Data pribadi Anda dienkripsi mutlak (AES-256-GCM) sesuai Standar Perlindungan Data Pribadi Indonesia.
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between opacity-30 px-2 grayscale">
                         <div className="flex items-center gap-3">
                            <span className="text-[8px] font-black italic tracking-tighter uppercase">Midtrans Secured</span>
                            <span className="text-[8px] font-black italic tracking-tighter uppercase">PCI DSS Compliant</span>
                         </div>
                         <div className="text-[8px] font-black border border-ink px-1 rounded">SSL</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {cartItems.length > 0 && (
                <div className="bg-cr border-t border-ink/10 px-8 pt-6 mt-auto text-center z-[600] shadow-[0_-20px_40px_rgba(0,0,0,0.03)]" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
                  <button 
                    onClick={handleCheckout}
                    disabled={isCheckingOut}
                    className={`w-full py-4 px-6 text-white rounded-full font-bold text-[10px] sm:text-xs tracking-widest shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex items-center justify-between active:scale-95 transition-all
                      ${isCheckingOut ? 'bg-gray-400' : 'bg-ink'}
                    `}
                  >
                    {isCheckingOut ? (
                      <span className="w-full text-center tracking-[0.2em]">MEMPROSES...</span>
                    ) : (
                      <>
                        <LockIcon size={16} className="text-rose shrink-0" />
                        <span className="truncate whitespace-nowrap px-2 tracking-[0.1em] sm:tracking-[0.2em]">SUBMIT SECURE PAYMENT</span>
                        <ArrowRight size={16} className="shrink-0 opacity-80" />
                      </>
                    )} 
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {activeView === 'receipt' && historyOrderToView && (
            <motion.div
              key="receipt"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="view bg-cr"
            >
              <div className="scroll-area flex flex-col p-6 pt-4 items-center text-center pb-32">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mb-8 w-full relative pt-6"
                >
                  <button 
                    onClick={() => setActiveView('history')}
                    className="absolute left-0 top-1.5 w-7 h-7 flex items-center justify-center text-ink/40 hover:text-ink transition-all bg-white/50 backdrop-blur-sm rounded-full active:scale-95 shadow-sm border border-white z-20"
                    title="Back to History"
                  >
                    <ArrowLeft size={14} strokeWidth={3} />
                  </button>
                  <div className="text-center px-8">
                    <h2 className="font-display text-3xl leading-tight italic tracking-tighter mb-0.5 text-ink">Original Receipt</h2>
                    <p className="text-[9px] font-bold tracking-[0.25em] text-ink/30 uppercase">Historical Transaction</p>
                  </div>
                </motion.div>

                {/* Boutique Digital Receipt */}
                <motion.div
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.05}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, type: "spring", damping: 20 }}
                  className="receipt-to-print w-full max-w-[340px] bg-white shadow-[0_40px_80px_-20px_rgba(26,26,46,0.15)] border border-ink/5 mb-12 flex flex-col overflow-visible relative cursor-grab active:cursor-grabbing"
                  style={{ borderRadius: '2px 2px 32px 32px' }}
                >
                  {/* Tape Decor with Success Indicator */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                    <div className="w-20 h-6 bg-ink/5 backdrop-blur-sm rounded-sm shadow-sm relative overflow-hidden">
                       <div className="absolute inset-0 bg-white/10 skew-x-12" />
                    </div>
                    <motion.div
                      initial={{ scale: 0, y: -10 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.8 }}
                      className="w-10 h-6 bg-green-500 text-white rounded-[4px] flex items-center justify-center shadow-lg shadow-green-500/30 -mt-3 relative z-20"
                    >
                      <Check size={14} strokeWidth={4} />
                    </motion.div>
                  </div>

                  <div className="p-8 pb-6 border-b border-ink/5 relative">
                    <div className="text-[8px] font-black tracking-[0.4em] text-rose uppercase mb-4 opacity-70">OFFICIAL</div>
                    <div className="flex justify-between items-end">
                       <div className="text-left">
                          <div className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-1">Order Ref</div>
                          <div className="text-xs font-bold font-mono tracking-tighter">{historyOrderToView.orderId}</div>
                       </div>
                       <div className="text-right">
                          <div className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-1">Date</div>
                          <div className="text-xs font-bold font-mono tracking-tighter">
                            {historyOrderToView.date}
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Shipping Information Block */}
                  <div className="px-8 py-6 border-b border-dashed border-ink/5 bg-gray-50/30">
                    <div className="text-[8px] font-black tracking-[0.3em] text-rose uppercase mb-3">Shipping Details</div>
                    <div className="space-y-3 text-left">
                       <div className="flex justify-between items-start gap-4">
                          <div>
                             <div className="text-[9px] font-bold opacity-30 uppercase tracking-[0.1em] mb-0.5">Recipient</div>
                             <div className="text-[11px] font-bold text-ink uppercase">{historyOrderToView.name}</div>
                          </div>
                          <div className="text-right">
                             <div className="text-[9px] font-bold opacity-30 uppercase tracking-[0.1em] mb-0.5">Contact</div>
                             <div className="text-[11px] font-bold text-ink">{historyOrderToView.phone}</div>
                          </div>
                       </div>
                       <div>
                          <div className="text-[9px] font-bold opacity-30 uppercase tracking-[0.1em] mb-0.5">Destination</div>
                          <div className="text-[10px] font-medium leading-relaxed text-ink/70 break-words">{historyOrderToView.address}</div>
                       </div>
                    </div>
                  </div>

                  {/* Professional Perforated Line */}
                  <div className="relative h-px w-full flex items-center justify-between px-0 overflow-visible z-20">
                    <div className="w-5 h-5 rounded-full bg-cr -ml-2.5 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.05)] border-r border-ink/5" />
                    <div className="flex-grow border-t-2 border-dotted border-ink/10 mx-1" />
                    <div className="w-5 h-5 rounded-full bg-cr -mr-2.5 shadow-[inset_2px_0_4px_rgba(0,0,0,0.05)] border-l border-ink/5" />
                  </div>

                  {/* Receipt Bottom with Big Price - MOVED UP */}
                  <div className="px-8 pb-8 pt-8 border-t border-dashed border-ink/10 bg-cr/10 relative">
                     <div className="flex justify-between items-end">
                        <div className="text-left">
                           <div className="text-[8px] font-black tracking-[0.3em] text-rose uppercase mb-2">Total Settled</div>
                           <div className="font-display text-4xl italic tracking-tighter leading-none">Rp {historyOrderToView.total.toLocaleString('id-ID')}</div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                           <motion.button
                             whileHover={{ scale: 1.1, rotate: 5 }}
                             whileTap={{ scale: 0.9 }}
                             onClick={() => window.print()}
                             className="w-10 h-10 rounded-full bg-white border border-ink/5 shadow-sm flex items-center justify-center text-ink/40 hover:text-ink transition-colors"
                             title="Print Receipt"
                           >
                             <Download size={16} />
                           </motion.button>
                           <div className="w-10 h-10 rounded-full border-2 border-green-500/20 flex flex-col items-center justify-center -rotate-12">
                              <div className="text-[7px] font-black text-green-500 tracking-tighter">PAID</div>
                              <Check size={10} className="text-green-500" />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="px-8 py-8 space-y-6 pt-6 border-t border-ink/5">
                    <div className="text-left mb-2">
                       <span className="text-[8px] font-bold text-ink/30 uppercase tracking-[0.2em]">Acquired Items</span>
                    </div>
                    {historyOrderToView?.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-4">
                        <div className="text-left">
                          <div className="text-[11px] font-bold uppercase tracking-wide text-ink mb-0.5">{item.name}</div>
                          <div className="flex items-center gap-2">
                             <div className="text-[8px] text-ink/40 font-mono">#{item.id.slice(0,6).toUpperCase()}</div>
                             <div className="w-1 h-1 rounded-full bg-ink/10" />
                             <div className="text-[8px] text-ink/40 font-medium uppercase tracking-wider">M / {item.quantity} Unit</div>
                          </div>
                        </div>
                        <div className="text-[11px] font-bold font-display italic">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</div>
                      </div>
                    ))}

                    <div className="pt-6 border-t border-ink/5 space-y-3">
                       <div className="flex justify-between text-[9px] font-bold text-ink/30 uppercase tracking-widest">
                          <span>Courier / Priority Express</span>
                          <span className="text-green-600">Complimentary</span>
                       </div>
                       <div className="flex justify-between text-[9px] font-bold text-ink/30 uppercase tracking-widest">
                          <span>Transaction Fee (SNAP)</span>
                          <span>Rp 1.000</span>
                       </div>
                       <div className="flex justify-between text-[9px] font-bold text-ink/30 uppercase tracking-widest">
                          <span>Payment Method</span>
                          <span>E-WALLET / QRIS</span>
                       </div>
                    </div>
                  </div>
                </motion.div>

                {/* Navigation Back */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="space-y-3 w-full px-4"
                >
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveView('history')}
                    className="w-full py-4 bg-ink text-white rounded-full font-bold text-[11px] tracking-[0.25em] shadow-2xl transition-all uppercase flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={14} className="opacity-40" />
                    <span>Back to History</span>
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeView === 'success' && lastOrder && (
            <motion.div
              key="success"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="view bg-cr"
            >
              <div className="scroll-area flex flex-col p-6 pt-4 items-center text-center pb-32">
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mb-4 w-full relative pt-4"
                >
                  <button 
                    onClick={() => setActiveView('shop')}
                    className="absolute left-0 top-1 w-6 h-6 flex items-center justify-center text-ink/20 hover:text-ink transition-all bg-white/40 backdrop-blur-sm rounded-full active:scale-95 shadow-sm border border-ink/5 z-10"
                    title="Back to Shop"
                  >
                    <ArrowLeft size={12} strokeWidth={3} />
                  </button>
                  <div className="text-center">
                    <h2 className="font-display text-2xl leading-tight italic tracking-tighter mb-0.5 text-ink">Success</h2>
                    <p className="text-[8px] font-black tracking-[0.25em] text-ink/20 uppercase">Digital Artifact Secured</p>
                  </div>
                </motion.div>

                {/* Boutique Digital Receipt */}
                <motion.div
                  drag="y"
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={0.05}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, type: "spring", damping: 20 }}
                  className="receipt-to-print w-full max-w-[340px] bg-white shadow-[0_40px_80px_-20px_rgba(26,26,46,0.15)] border border-ink/5 mb-12 flex flex-col overflow-visible relative cursor-grab active:cursor-grabbing"
                  style={{ borderRadius: '2px 2px 32px 32px' }}
                >
                  {/* Tape Decor with Success Indicator */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center">
                    <div className="w-20 h-6 bg-ink/5 backdrop-blur-sm rounded-sm shadow-sm relative overflow-hidden">
                       <div className="absolute inset-0 bg-white/10 skew-x-12" />
                    </div>
                    <motion.div
                      initial={{ scale: 0, y: -10 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.8 }}
                      className="w-10 h-6 bg-green-500 text-white rounded-[4px] flex items-center justify-center shadow-lg shadow-green-500/30 -mt-3 relative z-20"
                    >
                      <Check size={14} strokeWidth={4} />
                    </motion.div>
                  </div>

                  <div className="p-8 pb-6 border-b border-ink/5 relative">
                    <div className="text-[8px] font-black tracking-[0.4em] text-rose uppercase mb-4 opacity-70">OFFICIAL</div>
                    <div className="flex justify-between items-end">
                       <div className="text-left">
                          <div className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-1">Order Ref</div>
                          <div className="text-xs font-bold font-mono tracking-tighter">{lastOrder.orderId}</div>
                       </div>
                       <div className="text-right">
                          <div className="text-[10px] font-bold opacity-30 uppercase tracking-widest mb-1">Date</div>
                          <div className="text-xs font-bold font-mono tracking-tighter">
                            {new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                          </div>
                       </div>
                    </div>
                  </div>

                  {/* Shipping Information Block */}
                  <div className="px-8 py-6 border-b border-dashed border-ink/5 bg-gray-50/30">
                    <div className="text-[8px] font-black tracking-[0.3em] text-rose uppercase mb-3">Shipping Details</div>
                    <div className="space-y-3 text-left">
                       <div className="flex justify-between items-start gap-4">
                          <div>
                             <div className="text-[9px] font-bold opacity-30 uppercase tracking-[0.1em] mb-0.5">Recipient</div>
                             <div className="text-[11px] font-bold text-ink uppercase">{lastOrder.name}</div>
                          </div>
                          <div className="text-right">
                             <div className="text-[9px] font-bold opacity-30 uppercase tracking-[0.1em] mb-0.5">Contact</div>
                             <div className="text-[11px] font-bold text-ink">{lastOrder.phone}</div>
                          </div>
                       </div>
                       <div>
                          <div className="text-[9px] font-bold opacity-30 uppercase tracking-[0.1em] mb-0.5">Destination</div>
                          <div className="text-[10px] font-medium leading-relaxed text-ink/70 break-words">{lastOrder.address}</div>
                       </div>
                    </div>
                  </div>

                  {/* Professional Perforated Line */}
                  <div className="relative h-px w-full flex items-center justify-between px-0 overflow-visible z-20">
                    <div className="w-5 h-5 rounded-full bg-cr -ml-2.5 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.05)] border-r border-ink/5" />
                    <div className="flex-grow border-t-2 border-dotted border-ink/10 mx-1" />
                    <div className="w-5 h-5 rounded-full bg-cr -mr-2.5 shadow-[inset_2px_0_4px_rgba(0,0,0,0.05)] border-l border-ink/5" />
                  </div>

                  {/* Receipt Bottom with Big Price - MOVED UP */}
                  <div className="px-8 pb-8 pt-8 border-t border-dashed border-ink/10 bg-cr/10 relative">
                     <div className="flex justify-between items-end">
                        <div className="text-left">
                           <div className="text-[8px] font-black tracking-[0.3em] text-rose uppercase mb-2">Total Settled</div>
                           <div className="font-display text-4xl italic tracking-tighter leading-none">Rp {lastOrder.total.toLocaleString('id-ID')}</div>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                           <motion.button
                             whileHover={{ scale: 1.1, rotate: 5 }}
                             whileTap={{ scale: 0.9 }}
                             onClick={() => window.print()}
                             className="w-10 h-10 rounded-full bg-white border border-ink/5 shadow-sm flex items-center justify-center text-ink/40 hover:text-ink transition-colors"
                             title="Print Receipt"
                           >
                             <Download size={16} />
                           </motion.button>
                           <div className="w-10 h-10 rounded-full border-2 border-green-500/20 flex flex-col items-center justify-center -rotate-12">
                              <div className="text-[7px] font-black text-green-500 tracking-tighter">PAID</div>
                              <Check size={10} className="text-green-500" />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="px-8 py-8 space-y-6 pt-6 border-t border-ink/5">
                    <div className="text-left mb-2">
                       <span className="text-[8px] font-bold text-ink/30 uppercase tracking-[0.2em]">Acquired Items</span>
                    </div>
                    {lastOrder?.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start gap-4">
                        <div className="text-left">
                          <div className="text-[11px] font-bold uppercase tracking-wide text-ink mb-0.5">{item.name}</div>
                          <div className="flex items-center gap-2">
                             <div className="text-[8px] text-ink/40 font-mono">#{item.id.slice(0,6).toUpperCase()}</div>
                             <div className="w-1 h-1 rounded-full bg-ink/10" />
                             <div className="text-[8px] text-ink/40 font-medium uppercase tracking-wider">M / {item.quantity} Unit</div>
                          </div>
                        </div>
                        <div className="text-[11px] font-bold font-display italic">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</div>
                      </div>
                    ))}

                    <div className="pt-6 border-t border-ink/5 space-y-3">
                       <div className="flex justify-between text-[9px] font-bold text-ink/30 uppercase tracking-widest">
                          <span>Courier / Priority Express</span>
                          <span className="text-green-600">Complimentary</span>
                       </div>
                       <div className="flex justify-between text-[9px] font-bold text-ink/30 uppercase tracking-widest">
                          <span>Transaction Fee (SNAP)</span>
                          <span>Rp 1.000</span>
                       </div>
                       <div className="flex justify-between text-[9px] font-bold text-ink/30 uppercase tracking-widest">
                          <span>Payment Method</span>
                          <span>E-WALLET / QRIS</span>
                       </div>
                    </div>
                  </div>
                </motion.div>

                {/* Navigation Back */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="space-y-3 w-full px-4"
                >
                  <motion.button 
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveView('shop')}
                    className="w-full py-4 bg-ink text-white rounded-full font-bold text-[11px] tracking-[0.25em] shadow-2xl transition-all uppercase flex items-center justify-center gap-2 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
                    <ShoppingBag size={14} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                    <span>Back to Shop</span>
                  </motion.button>
                  
                  <button 
                    onClick={() => setActiveView('home')}
                    className="w-full py-2 text-[9px] font-bold uppercase tracking-[0.2em] text-ink/30 hover:text-ink transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Back to Gallery</span>
                    <ArrowRight size={10} />
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {activeView === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="view"
            >
              <Header 
                activeView={activeView}
                setActiveView={setActiveView}
                cartCount={cartItems.length}
                notificationCount={notifications.length}
                onOpenMenu={() => setIsMenuOpen(true)}
              />

              <div className="content scroll-area px-6 pt-8 pb-[140px]">
                {orderHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20">
                    <Briefcase size={64} strokeWidth={1} className="mb-4" />
                    <p className="text-sm font-bold uppercase tracking-[0.2em]">Belum Ada Pesanan</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orderHistory?.map((order, idx) => (
                      <motion.div
                        key={order.orderId}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        onClick={() => {
                          setHistoryOrderToView(order);
                          setActiveView('receipt');
                        }}
                        className="bg-white/40 backdrop-blur-sm p-5 rounded-3xl border border-white/40 shadow-sm flex justify-between items-center group active:scale-[0.98] transition-transform cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-ink text-white rounded-2xl flex items-center justify-center shadow-lg shadow-ink/20">
                            <ShoppingBag size={20} />
                          </div>
                          <div className="text-left">
                            <div className="text-[10px] font-bold text-rose uppercase tracking-[0.2em] mb-1">{order.date}</div>
                            <div className="text-xs font-bold text-ink uppercase tracking-tight">{order.orderId}</div>
                            <div className="text-[9px] opacity-40 font-medium">
                              {order.items.length} Item • Rp {order.total.toLocaleString('id-ID')}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="px-2 py-1 bg-green-500/10 text-green-600 rounded-full text-[8px] font-black uppercase tracking-widest">
                            DIKIRIM
                          </div>
                          <ChevronRight size={16} className="opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                <div className="pb-16 opacity-30">
                  <LegalFooter />
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'profile_setup' && (
            <motion.div
              key="profile_setup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="view bg-cr"
            >
              <header className="px-8 pt-4 pb-2 flex items-center justify-between sticky top-0 z-[500] bg-cr/80 backdrop-blur-md border-b border-ink/5">
                <button 
                  onClick={() => setActiveView('home')}
                  className="w-10 h-10 flex items-center justify-center text-ink/40 hover:text-rose transition-colors"
                >
                  <ArrowLeft size={16} strokeWidth={2.5} />
                </button>
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-ink/20">Profile Setup</h2>
                <div className="w-10" />
              </header>

              <div className="content scroll-area px-6 pt-1 flex flex-col pb-10">
                <div className="max-w-sm mx-auto w-full space-y-2">
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-center space-y-1"
                  >
                    <div className="relative w-12 h-12 mx-auto group cursor-pointer group">
                      <div className="w-full h-full bg-rose/10 rounded-full flex items-center justify-center text-rose border-2 border-rose/5 group-hover:border-rose/20 transition-all overflow-hidden">
                         <User size={24} strokeWidth={1.5} />
                      </div>
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-rose text-white rounded-full flex items-center justify-center shadow-md border-2 border-white">
                        <Pencil size={7} strokeWidth={3} />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-display italic text-lg tracking-tighter leading-none mb-0.5">Lengkapi Profile</h3>
                      <p className="text-[9px] font-medium leading-tight text-ink/30 px-4">
                        Berikan detail Anda untuk pengalaman personal di Ninoc Atelier.
                      </p>
                    </div>
                  </motion.div>

                  <form onSubmit={handleProfileSetup} className="space-y-2">
                    <div className="space-y-1.5">
                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black uppercase tracking-widest text-ink/20 ml-4">Nama Lengkap</label>
                        <input 
                          type="text" 
                          required
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="Ex: Adrian Ninoc"
                          className="w-full h-10 px-5 bg-white border border-ink/5 rounded-2xl text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-rose/20 transition-all"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <label className="text-[8px] font-black uppercase tracking-widest text-ink/20 ml-4">Jenis Kelamin</label>
                          <select 
                            value={gender}
                            onChange={(e) => setGender(e.target.value as any)}
                            className="w-full h-10 px-5 bg-white border border-ink/5 rounded-2xl text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-rose/20 transition-all appearance-none"
                          >
                            <option value="">Pilih...</option>
                            <option value="pria">Pria</option>
                            <option value="wanita">Wanita</option>
                          </select>
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[8px] font-black uppercase tracking-widest text-ink/20 ml-4">Tgl Lahir</label>
                          <input 
                            type="date" 
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="w-full h-10 px-4 bg-white border border-ink/5 rounded-2xl text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-rose/20 transition-all max-w-full overflow-hidden"
                          />
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black uppercase tracking-widest text-ink/20 ml-4">Nomor WhatsApp</label>
                        <input 
                          type="tel" 
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="08xxxxxxxxxx"
                          className="w-full h-10 px-5 bg-white border border-ink/5 rounded-2xl text-[11px] font-medium focus:outline-none focus:ring-1 focus:ring-rose/20 transition-all"
                        />
                      </div>

                      {/* Administrative Dropdowns */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <label className="text-[8px] font-black uppercase tracking-widest text-ink/20 ml-4">Provinsi</label>
                          <select 
                            value={selectedProvince.id}
                            onChange={(e) => {
                              const item = provinces.find(p => p.id === e.target.value);
                              setSelectedProvince({ id: e.target.value, name: item?.name || '' });
                            }}
                            className="w-full h-10 px-5 bg-white border border-ink/5 rounded-2xl text-[10px] font-medium focus:outline-none appearance-none truncate"
                          >
                            <option value="">Provinsi</option>
                            {provinces?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[8px] font-black uppercase tracking-widest text-ink/20 ml-4">Kota/Kab</label>
                          <select 
                            value={selectedCity.id}
                            disabled={!selectedProvince.id}
                            onChange={(e) => {
                              const item = cities.find(p => p.id === e.target.value);
                              setSelectedCity({ id: e.target.value, name: item?.name || '' });
                            }}
                            className="w-full h-10 px-5 bg-white border border-ink/5 rounded-2xl text-[10px] font-medium focus:outline-none appearance-none truncate disabled:opacity-50"
                          >
                            <option value="">Kota</option>
                            {cities?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-0.5">
                          <label className="text-[8px] font-black uppercase tracking-widest text-ink/20 ml-4">Kecamatan</label>
                          <select 
                            value={selectedDistrict.id}
                            disabled={!selectedCity.id}
                            onChange={(e) => {
                              const item = districts.find(p => p.id === e.target.value);
                              setSelectedDistrict({ id: e.target.value, name: item?.name || '' });
                            }}
                            className="w-full h-10 px-5 bg-white border border-ink/5 rounded-2xl text-[10px] font-medium focus:outline-none appearance-none truncate disabled:opacity-50"
                          >
                            <option value="">Kecamatan</option>
                            {districts?.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[8px] font-black uppercase tracking-widest text-ink/20 ml-4">Kelurahan</label>
                          <select 
                            value={selectedVillage.id}
                            disabled={!selectedDistrict.id}
                            onChange={(e) => {
                              const item = villages.find(p => p.id === e.target.value);
                              setSelectedVillage({ id: e.target.value, name: item?.name || '' });
                            }}
                            className="w-full h-10 px-5 bg-white border border-ink/5 rounded-2xl text-[10px] font-medium focus:outline-none appearance-none truncate disabled:opacity-50"
                          >
                            <option value="">Kelurahan</option>
                            {villages?.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="space-y-0.5">
                        <label className="text-[8px] font-black uppercase tracking-widest text-ink/20 ml-4">Alamat Lengkap</label>
                        <textarea 
                          value={streetAddress}
                          onChange={(e) => setStreetAddress(e.target.value)}
                          placeholder="Ex: Jl. Melati No. 12"
                          className="w-full h-14 py-2.5 px-5 bg-white border border-ink/5 rounded-2xl text-[10px] font-medium focus:outline-none focus:ring-1 focus:ring-rose/20 transition-all resize-none"
                        />
                      </div>
                    </div>

                    <motion.button 
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={isProfileSaving}
                      className="w-full h-10 bg-ink text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-lg shadow-ink/5 flex items-center justify-center gap-2"
                    >
                      {isProfileSaving ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Simpan & Lanjutkan</span>
                      )}
                    </motion.button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="view"
            >
              <header className="px-8 pt-12 pb-6 flex items-center justify-between sticky top-0 z-[500] bg-cr/80 backdrop-blur-md border-b border-ink/5 text-left">
                <button onClick={() => setActiveView('home')} className="p-2 -ml-2 text-ink/40 hover:text-ink transition-colors">
                   <ChevronLeft size={24} />
                </button>
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-ink/20">Notifikasi</h2>
                <button 
                  onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                  className="text-[10px] font-black uppercase tracking-widest text-rose/60 hover:text-rose transition-colors"
                >
                  Clear
                </button>
              </header>

              <div className="content scroll-area px-8 pt-12 pb-[140px] space-y-6 text-left">
                {notifications && notifications.length > 0 ? (
                  notifications.map((n) => (
                    <motion.div 
                      key={n.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`group relative py-2 ${n.read ? 'opacity-40' : 'opacity-100'}`}
                    >
                      <div className="flex justify-between items-baseline mb-2">
                        <h4 className="font-display italic text-2xl tracking-tighter text-ink">{n.title}</h4>
                        <span className="text-[9px] font-black uppercase tracking-widest text-ink/20">{n.time}</span>
                      </div>
                      <p className="text-[13px] font-medium leading-relaxed text-ink/50 mb-4">{n.message}</p>
                      {!n.read && (
                        <button 
                          onClick={() => setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item))}
                          className="text-[9px] font-black uppercase tracking-[0.3em] text-rose/60 hover:text-rose transition-colors"
                        >
                          Mark as read
                        </button>
                      )}
                      <div className="h-px bg-ink/5 w-full mt-6" />
                    </motion.div>
                  ))
                ) : (
                  <div className="h-[50vh] flex flex-col items-center justify-center text-center space-y-6 opacity-10">
                    <Bell size={48} strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Empty</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeView === 'about' && (
            <motion.div
              key="about"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="view"
            >
              <header className="px-8 pt-12 pb-6 flex items-center justify-between sticky top-0 z-[500] bg-cr/80 backdrop-blur-md border-b border-ink/5">
                <button onClick={() => setActiveView('home')} className="p-2 -ml-2 text-ink/40 hover:text-ink transition-colors">
                   <ChevronLeft size={24} />
                </button>
                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-ink/20">Tentang Ninoc</h2>
                <div className="w-10" />
              </header>

              <div className="content scroll-area px-8 pt-16 pb-[140px] space-y-20 text-left">
                <motion.section 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="space-y-6"
                >
                  <h3 className="font-display italic text-6xl tracking-tighter leading-[0.8] mb-8">Elegansi<br/><span className="text-ink/10 lowercase">dalam</span><br/>Kesederhanaan.</h3>
                  <p className="text-[14px] font-medium leading-relaxed text-ink/50 max-w-[280px]">
                    Ninoc lahir dari keyakinan bahwa kemewahan sejati terletak pada detail. Kami mengkurasi koleksi fashion eksklusif yang memadukan estetika kontemporer dengan craftsmanship yang tak lekang oleh waktu.
                  </p>
                </motion.section>

                <motion.section 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-6 pt-16 border-t border-ink/5"
                >
                  <span className="text-[9px] font-black tracking-[0.4em] text-rose uppercase opacity-60">Kualitas</span>
                  <h3 className="font-display italic text-4xl tracking-tighter leading-none">Tanpa Kompromi.</h3>
                  <p className="text-[14px] font-medium leading-relaxed text-ink/50">
                    Setiap helai kain dan setiap jahitan adalah cerminan dari dedikasi kami. Kami bekerja sama dengan artisan terbaik untuk menghadirkan produk yang bukan hanya indah dipandang, namun juga nyaman dikenakan.
                  </p>
                </motion.section>

                <motion.section 
                   initial={{ y: 20, opacity: 0 }}
                   animate={{ y: 0, opacity: 1 }}
                   transition={{ delay: 0.2 }}
                   className="space-y-8 pt-16 border-t border-ink/5 pb-20"
                >
                  <span className="text-[9px] font-black tracking-[0.4em] text-rose uppercase opacity-60">Hubungi Kami</span>
                  <div className="space-y-8">
                    <div className="flex flex-col gap-1">
                       <p className="text-[9px] font-black uppercase tracking-widest text-ink/20">Customer Service</p>
                       <p className="text-xl font-display italic tracking-tight">hello@ninoc.club</p>
                    </div>
                    <div className="flex flex-col gap-1">
                       <p className="text-[9px] font-black uppercase tracking-widest text-ink/20">Instagram</p>
                       <p className="text-xl font-display italic tracking-tight">@ninoc.club</p>
                    </div>
                  </div>
                </motion.section>
              </div>
            </motion.div>
          )}

          {activeView === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="view"
            >
              <ChatView user={currentUser} onBack={() => setActiveView('home')} />
            </motion.div>
          )}

          {activeView === 'me' && (
            <motion.div
              key="me"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="view"
            >
              {!isLoggedIn ? (
                <div className="flex flex-col h-full bg-cr overflow-hidden">
                  <Header 
                    activeView={activeView}
                    setActiveView={setActiveView}
                    cartCount={cartItems.length}
                    notificationCount={notifications.length}
                    onOpenMenu={() => setIsMenuOpen(true)}
                  />

                  <div className="content scroll-area px-8 flex flex-col pb-12">
                    <div className="flex flex-col items-center">
                      {authLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 opacity-40">
                          <Loader2 size={32} className="animate-spin mb-6 text-rose" />
                        </div>
                      ) : (
                        <div className="w-full max-w-sm mx-auto space-y-12">
                          <motion.div 
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-center space-y-4"
                          >
                            <h2 className="font-display italic text-6xl tracking-tighter leading-[0.85] text-ink">
                              {isLoginMode ? 'Access' : 'Enroll'}
                            </h2>
                            <p className="text-[10px] font-bold text-ink/20 uppercase tracking-[0.4em]">
                              {isLoginMode ? 'Private Membership' : 'Create Account'}
                            </p>
                          </motion.div>

                          <div className="space-y-10">
                            <form onSubmit={handleAuth} className="space-y-6">
                              <div className="space-y-4">
                                <input 
                                  type="email" 
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  placeholder="Email Address"
                                  className="w-full h-14 px-6 bg-white border border-ink/5 rounded-3xl text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-rose/20 transition-all placeholder:text-ink/10"
                                />
                                <input 
                                  type="password" 
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  placeholder="Password"
                                  className="w-full h-14 px-6 bg-white border border-ink/5 rounded-3xl text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-rose/20 transition-all placeholder:text-ink/10"
                                />
                              </div>

                              <motion.button 
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                type="submit"
                                disabled={authLoading}
                                className="w-full h-14 bg-ink text-white rounded-3xl text-[11px] font-black uppercase tracking-[0.4em] shadow-lg shadow-ink/5 flex items-center justify-center"
                              >
                                {isLoginMode ? 'Authenticate' : 'Register'}
                              </motion.button>
                            </form>

                            <div className="flex flex-col items-center gap-8">
                              <div className="flex items-center gap-4 w-full">
                                <div className="h-px bg-ink/5 flex-grow" />
                                <span className="text-[9px] font-black text-ink/15 uppercase tracking-[0.3em]">Or</span>
                                <div className="h-px bg-ink/5 flex-grow" />
                              </div>

                              <button 
                                onClick={handleGoogleLogin}
                                className="text-[11px] font-black uppercase tracking-[0.2em] text-ink/40 hover:text-ink transition-colors flex items-center gap-2"
                              >
                                Continue with Google
                              </button>

                              <button 
                                onClick={() => setIsLoginMode(!isLoginMode)}
                                className="text-[10px] font-black uppercase tracking-[0.2em] text-rose/60 hover:text-rose transition-colors"
                              >
                                {isLoginMode ? 'No account? Sign Up' : 'Have account? Login'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-12 opacity-30 w-full max-w-sm">
                        <LegalFooter />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Header 
                    activeView={activeView}
                    setActiveView={setActiveView}
                    cartCount={cartItems.length}
                    notificationCount={notifications.length}
                    onOpenMenu={() => setIsMenuOpen(true)}
                  />

                  <div className="content scroll-area px-8 pt-12 flex flex-col items-center text-center pb-[140px]">
                    <motion.div 
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-20 h-20 rounded-full bg-white border border-ink/5 text-ink mb-6 flex items-center justify-center shadow-sm relative overflow-hidden"
                    >
                      <User size={32} strokeWidth={1.5} />
                    </motion.div>
                    
                    <div className="mb-10">
                       <h3 className="font-display italic text-3xl mb-1 tracking-tighter">{fullName || email.split('@')[0]}</h3>
                       <p className="text-[10px] font-bold text-ink/20 uppercase tracking-[0.4em]">{email}</p>
                       {selectedCity.name && (
                         <p className="text-[9px] font-black uppercase tracking-widest text-rose mt-2 opacity-60">Citizen of {selectedCity.name}</p>
                       )}
                    </div>

                    <div className="w-full space-y-8">
                       {/* Notifications List */}
                       {notifications.length > 0 && (
                         <div className="bg-white/40 p-6 rounded-[30px] border border-ink/5 space-y-4 text-left">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-ink/30 px-2 flex justify-between">
                              Latest Broadcasts
                              <span className="text-rose">✦</span>
                            </h4>
                            <div className="space-y-4">
                              {notifications.slice(0, 3).map(notif => (
                                <div key={notif.id} className="flex gap-4 p-3 rounded-2xl hover:bg-white transition-colors cursor-pointer group">
                                   <div className="w-10 h-10 rounded-xl bg-ink/5 flex items-center justify-center text-ink/20 group-hover:text-rose transition-colors">
                                      <Megaphone size={18} />
                                   </div>
                                   <div>
                                      <div className="text-[11px] font-black uppercase text-ink group-hover:text-rose">{notif.title}</div>
                                      <div className="text-[10px] font-medium text-ink/40 line-clamp-1">{notif.body}</div>
                                   </div>
                                </div>
                              ))}
                            </div>
                         </div>
                       )}

                       <div className="flex flex-col gap-6">
                          <button 
                            onClick={() => setActiveView('chat')}
                            className="flex items-center justify-between text-left group"
                          >
                             <div>
                                <h4 className="text-[11px] font-black uppercase tracking-widest mb-1">Ninoc Chat</h4>
                                <p className="text-[10px] italic text-ink/30">Obrolan santai komunitas</p>
                             </div>
                             <MessageSquare size={14} className="text-ink/10 group-hover:text-rose transition-colors" />
                          </button>
                          <button 
                            onClick={() => setShowConsent(true)}
                            className="flex items-center justify-between text-left group"
                          >
                             <div>
                                <h4 className="text-[11px] font-black uppercase tracking-widest mb-1">Keamanan & Privasi</h4>
                                <p className="text-[10px] italic text-ink/30">Cek status persetujuan data</p>
                             </div>
                             <ChevronRight size={14} className="text-ink/10 group-hover:text-rose transition-colors" />
                          </button>
                          <button 
                            onClick={() => setActiveView('history')}
                            className="flex items-center justify-between text-left group"
                          >
                             <div>
                                <h4 className="text-[11px] font-black uppercase tracking-widest mb-1">Daftar Pesanan</h4>
                                <p className="text-[10px] italic text-ink/30">Lihat status pengiriman</p>
                             </div>
                             <ChevronRight size={14} className="text-ink/10 group-hover:text-rose transition-colors" />
                          </button>
                       </div>

                       <div className="h-px bg-ink/5" />

                       <button 
                         onClick={() => setActiveView('profile_setup')}
                         className="w-full h-12 border border-ink/5 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] text-ink/30 hover:bg-ink hover:text-white transition-all flex items-center justify-center gap-2"
                       >
                         <User size={12} />
                         Masuk Ke Profile Setup (Test)
                       </button>

                       <button 
                         onClick={handleSignOut}
                         className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-rose/40 hover:text-rose transition-colors"
                       >
                         <LogOut size={12} />
                         Sign Out
                       </button>
                    </div>

                    <div className="mt-20 opacity-10">
                       <Logo />
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <SideMenu 
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          onNavigate={setActiveView}
          isLoggedIn={isLoggedIn}
          currentUser={currentUser}
          onLogout={handleSignOut}
          notifications={notifications}
          onSetLoginMode={setIsLoginMode}
        />

        {/* Global Bottom & Top Fade Overlays - REMOVED AS REQUESTED */}
      </div>

      <ConsentModal 
        isOpen={showConsent} 
        onAccept={() => {
          setHasConsent(true);
          setShowConsent(false);
          showToast('Terima kasih atas persetujuan Anda!', 'success');
        }} 
        onClose={() => setShowConsent(false)} 
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: -100, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -100, opacity: 0, scale: 0.8 }}
            className="absolute top-12 left-1/2 -translate-x-1/2 w-auto min-w-[140px] z-[600] px-1 pointer-events-none"
          >
            <div className={`
              px-4 py-2 rounded-full shadow-xl backdrop-blur-2xl border border-white/30
              flex items-center justify-center gap-2
              ${toast.type === 'error' ? 'bg-rose/80 text-white' : 'bg-ink/60 text-white'}
            `}>
              {toast.type !== 'error' && <Check size={12} className="text-white" />}
              <span className="text-[9px] font-bold tracking-[0.15em] uppercase whitespace-nowrap">
                {toast.message}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeView !== 'chat' && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveView('chat')}
            className="hidden md:flex fixed bottom-8 right-8 w-12 h-12 bg-ink text-white rounded-full items-center justify-center shadow-lg shadow-ink/20 z-[600] group"
          >
            <MessageSquare size={18} className="group-hover:text-rose transition-colors relative z-10" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(['home', 'shop', 'history'].includes(activeView) || (activeView === 'me' && isLoggedIn)) && (
          <motion.div 
            initial={{ y: 100, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: 100, opacity: 0, x: '-50%' }}
            className="md:hidden absolute bottom-8 left-1/2 w-[90%] max-w-[360px] h-16 bg-ink/90 backdrop-blur-3xl rounded-full flex items-center px-1.5 justify-between text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[500] border border-white/10 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveView('home')}
              className={`flex items-center gap-2 h-12 px-5 rounded-full transition-all duration-300 ${activeView === 'home' ? 'bg-rose text-white shadow-lg shadow-rose/20' : 'text-white/40 hover:text-white'}`}
            >
              <Home size={20} />
              {activeView === 'home' && <span className="text-[10px] font-bold tracking-widest uppercase">Home</span>}
            </motion.button>
            
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveView('shop')}
              className={`flex items-center gap-2 h-12 px-5 rounded-full transition-all duration-300 ${activeView === 'shop' ? 'bg-rose text-white shadow-lg shadow-rose/20' : 'text-white/40 hover:text-white'}`}
            >
              <ShoppingBag size={20} />
              {activeView === 'shop' && <span className="text-[10px] font-bold tracking-widest uppercase">Shop</span>}
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveView('cart')}
              className={`flex items-center gap-2 h-12 px-5 rounded-full transition-all duration-300 ${activeView === 'cart' ? 'bg-rose text-white shadow-lg shadow-rose/20 relative' : 'text-white/40 hover:text-white relative'}`}
            >
              <ShoppingCart size={20} />
              {activeView === 'cart' && <span className="text-[10px] font-bold tracking-widest uppercase">Cart</span>}
              {cartItems.length > 0 && activeView !== 'cart' && (
                <span className="absolute top-2 right-3 w-4 h-4 bg-white text-rose rounded-full text-[8px] flex items-center justify-center font-bold">
                  {cartItems.length}
                </span>
              )}
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveView('chat')}
              className={`flex items-center gap-2 h-12 px-5 rounded-full transition-all duration-300 ${activeView === 'chat' ? 'bg-rose text-white shadow-lg shadow-rose/20' : 'text-white/40 hover:text-white'}`}
            >
              <MessageSquare size={20} />
              {activeView === 'chat' && <span className="text-[10px] font-bold tracking-widest uppercase">Chat</span>}
            </motion.button>

            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setActiveView('me')}
              className={`flex items-center gap-2 h-12 px-5 rounded-full transition-all duration-300 ${activeView === 'me' ? 'bg-rose text-white shadow-lg shadow-rose/20' : 'text-white/40 hover:text-white'}`}
            >
              <User size={20} />
              {activeView === 'me' && <span className="text-[10px] font-bold tracking-widest uppercase">Me</span>}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface CartItemComponentProps {
  item: CartItem;
  onRemove: () => void;
  onUpdateQty: (delta: number) => void;
}

const CartItemComponent: React.FC<CartItemComponentProps> = ({ item, onRemove, onUpdateQty }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex gap-4 items-center"
    >
      <div className="w-20 h-24 rounded-2xl overflow-hidden relative" style={{ backgroundColor: item.bg }}>
        {item.image ? (
          <img 
            src={item.image} 
            alt={item.name} 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-ink/5" />
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-display italic text-lg leading-none mb-1">{item.name}</h4>
        <div className="text-rose font-black text-xs mb-3">Rp {item.price.toLocaleString('id-ID')}</div>
        <div className="flex items-center gap-4">
          <button onClick={() => onUpdateQty(-1)} className="w-8 h-8 rounded-full border border-ink/10 flex items-center justify-center text-sm opacity-60 active:bg-ink/5 active:scale-95 transition-all">-</button>
          <span className="text-sm font-bold">{item.quantity}</span>
          <button onClick={() => onUpdateQty(1)} className="w-8 h-8 rounded-full border border-ink/10 flex items-center justify-center text-sm opacity-60 active:bg-ink/5 active:scale-95 transition-all">+</button>
        </div>
      </div>
      <button onClick={onRemove} className="p-2 text-rose opacity-40 hover:opacity-100">
        <Trash2 size={18} />
      </button>
    </motion.div>
  );
};

interface ProductCardProps {
  product: Product;
  onAdd: (e: React.MouseEvent) => void;
  onClick: () => void;
  isAdded: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd, onClick, isAdded }) => {
  return (
    <div 
      onClick={onClick}
      className="group cursor-pointer space-y-4"
    >
      <div className={`aspect-square rounded-[2.5rem] overflow-hidden flex items-center justify-center relative shadow-sm group-hover:shadow-2xl group-hover:shadow-black/5 transition-all duration-700`} style={{ backgroundColor: product.bg }}>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-700" />
        <div className="absolute inset-0 border border-black/5 rounded-[2.5rem] pointer-events-none" />
        
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="scale-[1.1] group-hover:scale-[1.2] transition-all duration-700 opacity-60">
             <ProductSVG type={product.name} size={130} />
          </div>
        )}
        
        <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-100">
           <button 
             onClick={(e) => {
               e.stopPropagation();
               onAdd(e);
             }}
             className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xl transition-all ${
               isAdded ? 'bg-emerald-500 text-white' : 'bg-white text-ink hover:bg-rose hover:text-white'
             }`}
           >
             {isAdded ? <Check size={16} /> : <ShoppingBag size={16} />}
           </button>
        </div>
      </div>
      
        <div className="flex justify-between items-start px-1 gap-2">
        <div className="space-y-1 text-left min-w-0 flex-1">
           <div className="flex items-center gap-1.5 flex-wrap">
             <p className="text-[7px] font-black uppercase tracking-[0.4em] text-ink/30 leading-none truncate">{product.category}</p>
             {product.discountTag && (
               <span className="text-[6px] font-black bg-rose text-white px-1 py-0.5 rounded-sm uppercase tracking-tighter">{product.discountTag}</span>
             )}
           </div>
           <h3 className="text-[11px] font-sans font-bold text-ink leading-tight uppercase tracking-wide truncate">{product.name}</h3>
        </div>
        <div className="flex flex-col items-end pt-0.5">
          <div className="text-[10px] font-sans font-black text-rose tracking-tighter whitespace-nowrap">IDR {product.price.toLocaleString('id-ID')}</div>
          {product.originalPrice && (
            <div className="text-[8px] text-ink/20 line-through font-bold leading-none mt-0.5 tracking-tighter italic">IDR {product.originalPrice.toLocaleString('id-ID')}</div>
          )}
        </div>
      </div>
    </div>
  );
};

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: ViewType) => void;
  isLoggedIn: boolean;
  currentUser: AppUser | null;
  onLogout: () => void;
  notifications: any[];
  onSetLoginMode: (mode: boolean) => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, onNavigate, isLoggedIn, currentUser, onLogout, notifications, onSetLoginMode }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] overflow-hidden text-left">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/5"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="absolute top-0 left-0 bottom-0 w-[75%] max-w-[280px] bg-cr border-r border-ink/5 flex flex-col"
          >
            <div className="px-8 pt-12 pb-12 flex justify-between items-center">
              <Logo />
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center text-ink/30 hover:text-ink transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 px-8 pt-4">
              <nav className="flex flex-col gap-1">
                {[
                  { icon: <Home size={16} />, label: 'Home', view: 'home' as ViewType },
                  { icon: <Bell size={16} />, label: 'Notifications', view: 'notifications' as ViewType, badge: notifications.filter(n => !n.read).length },
                  { icon: <Shield size={16} />, label: 'Admin', view: 'admin' as ViewType },
                  { icon: <ShoppingBag size={16} />, label: 'Shop', view: 'shop' as ViewType },
                  { icon: <Info size={16} />, label: 'About', view: 'about' as ViewType },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      onNavigate(item.view);
                      onClose();
                    }}
                    className="flex items-center gap-4 py-4 text-ink/60 hover:text-rose transition-all group relative"
                  >
                    <span className="text-ink/20 group-hover:text-rose transition-colors">{item.icon}</span>
                    <span className="text-lg font-display tracking-tight">{item.label}</span>
                    {item.badge ? (
                      <span className="absolute right-0 w-5 h-5 rounded-full bg-rose text-white text-[10px] font-black flex items-center justify-center ring-4 ring-cr">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                ))}

                {!isLoggedIn ? (
                  <div className="mt-4 pt-6 flex flex-col gap-1 border-t border-ink/5">
                    <button
                      onClick={() => {
                        onSetLoginMode(true);
                        onNavigate('me');
                        onClose();
                      }}
                      className="flex items-center gap-4 py-4 text-ink/60 hover:text-rose transition-all group"
                    >
                      <span className="text-ink/20 group-hover:text-rose transition-colors"><User size={16} /></span>
                      <span className="text-lg font-display tracking-tight">Login</span>
                    </button>
                    <button
                      onClick={() => {
                        onSetLoginMode(false);
                        onNavigate('me');
                        onClose();
                      }}
                      className="flex items-center gap-4 py-4 text-ink/60 hover:text-rose transition-all group"
                    >
                      <span className="text-ink/20 group-hover:text-rose transition-colors"><UserPlus size={16} /></span>
                      <span className="text-lg font-display tracking-tight">Sign Up</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onNavigate('me');
                      onClose();
                    }}
                    className="flex items-center gap-4 py-4 text-ink/60 hover:text-rose transition-all group"
                  >
                    <span className="text-ink/20 group-hover:text-rose transition-colors"><User size={16} /></span>
                    <span className="text-lg font-display tracking-tight">Profile</span>
                  </button>
                )}
              </nav>

              {isLoggedIn && (
                <div className="mt-8 pt-8 border-t border-ink/5">
                  <button
                    onClick={() => {
                      onLogout();
                      onClose();
                    }}
                    className="flex items-center gap-4 py-4 text-ink/40 hover:text-rose transition-all group"
                  >
                    <LogOut size={16} className="group-hover:text-rose transition-colors" />
                    <span className="text-sm font-black uppercase tracking-[0.2em]">Logout</span>
                  </button>
                </div>
              )}
            </div>

            <div className="p-8 pb-12 opacity-20 scale-75 origin-left">
              <LegalFooter />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
