import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Menu, X, Search, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  backHref?: string;
  cartCount?: number;
  hideHeader?: boolean;
  hideTabBar?: boolean;
}

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string;
  category: string;
}

export default function MobileLayout({
  children,
  showBack = false,
  cartCount = 0,
  hideHeader = false,
  hideTabBar = false,
}: MobileLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  const [isNavVisible, setIsNavVisible] = useState(true);

  const { scrollY } = useScroll();

  // Handle "Hide and Rise" logic
  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 150) {
      // Scrolling down & passed threshold -> Hide
      setIsNavVisible(false);
    } else if (latest < previous || latest < 10) {
      // Scrolling up or at top -> Show
      setIsNavVisible(true);
    }
  });

  const isActive = (path: string) => pathname === path;

  // Search functionality
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const { data } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${query}%`)
        .limit(10);
      setSearchResults(data || []);
    } catch (e) {
      console.error('Search error:', e);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Debounced search
    setTimeout(() => handleSearch(value), 300);
  };

  const handleBack = () => {
    router.push('/shop');
  };

  // Listen for support unread count
  useEffect(() => {
    const handleUnread = (e: Event) => {
      const customEvent = e as CustomEvent;
      setSupportUnreadCount(customEvent.detail || 0);
    };
    window.addEventListener('support-unread-count', handleUnread);
    return () => window.removeEventListener('support-unread-count', handleUnread);
  }, []);

  return (
    <div className="min-h-screen bg-cr ios-native-layout flex flex-col overflow-x-hidden">
      {/* Safe area top spacer */}
      <div className="h-[env(safe-area-inset-top)] bg-white/95" />

      {/* Fixed Header with Hide and Rise */}
      {!hideHeader && (
        <motion.header 
          initial={{ y: 0 }}
          animate={{ y: isNavVisible ? 0 : -100 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-[env(safe-area-inset-top)] left-0 right-0 z-[400] bg-white/95 backdrop-blur-xl border-b border-ink/[0.05]"
        >
          <div className="flex items-center justify-between h-14 px-4">
            {/* Left: Back or Logo */}
            <div className="flex items-center gap-3">
              {showBack ? (
                <button
                  onClick={handleBack}
                  className="p-2 -ml-2 text-ink/60 active:scale-90 transition-transform"
                >
                  <ArrowLeft size={20} strokeWidth={1.5} />
                </button>
              ) : (
                <Link href="/" className="font-display font-medium text-lg italic tracking-tighter text-rose uppercase">
                  NINOC
                </Link>
              )}
            </div>

            {/* Right: Search & Burger Menu */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-ink/30 hover:text-rose transition-colors active:scale-90"
              >
                <Search size={18} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 text-ink/60 hover:text-rose transition-colors active:scale-90"
              >
                <Menu size={22} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </motion.header>
      )}

      {/* Search Modal Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
              className="fixed inset-0 bg-ink/10 backdrop-blur-[2px] z-[500]"
            />

            {/* Search Modal */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-[env(safe-area-inset-top)] left-0 right-0 z-[510] bg-white border-b border-ink/5 shadow-2xl"
            >
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative flex items-center gap-3 bg-ink/[0.03] px-4 py-2 border border-ink/[0.05]">
                    <Search size={14} className="text-ink/20" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchInput}
                      placeholder="SEARCH CATALOG..."
                      autoFocus
                      className="w-full bg-transparent py-1 text-[10px] font-medium uppercase tracking-widest text-ink placeholder:text-ink/20 outline-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="p-2 text-ink/30 hover:text-rose text-[10px] font-medium uppercase tracking-widest"
                  >
                    CLOSE
                  </button>
                </div>
              </div>

              {/* Search Results */}
              <div className="max-h-[70vh] overflow-y-auto no-scrollbar">
                {isSearching && (
                  <div className="p-12 text-center">
                    <div className="w-4 h-4 border-2 border-rose/10 border-t-rose rounded-full animate-spin mx-auto" />
                  </div>
                )}
                {!isSearching && searchQuery && searchResults.length === 0 && (
                  <div className="p-12 text-center">
                    <p className="text-[10px] font-medium uppercase tracking-widest text-ink/20">No items found</p>
                  </div>
                )}
                {!isSearching && searchResults.map((product) => (
                  <Link
                    key={product.id}
                    href={`/shop/${product.slug}`}
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="flex items-center gap-4 p-4 border-t border-ink/[0.03] hover:bg-ink/[0.02] transition-colors"
                  >
                    <div className="w-10 h-14 bg-ink/[0.03] flex-shrink-0 relative border border-ink/[0.05]">
                      {product.image_url && (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          width={40}
                          height={56}
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-medium text-ink uppercase tracking-tight">{product.name}</p>
                      <p className="text-[9px] text-rose italic tracking-wider">Rp {product.price.toLocaleString('id-ID')}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Slide-over Menu - Minimal Compact Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-[500]"
            />

            {/* Drawer - Compact Minimal */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-[260px] bg-white z-[510] shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-4 flex items-center justify-between border-b border-ink/5">
                <span className="font-display font-medium text-xs italic tracking-wider text-rose uppercase">Menu</span>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1 text-ink/30 hover:text-rose"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Simple Link List */}
              <div className="flex-1 overflow-y-auto">
                <Link
                  href="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink hover:text-rose border-b border-ink/5 transition-colors"
                >
                  <span className="w-6 h-6 bg-ink/5 flex items-center justify-center text-[10px]">🏠</span>
                  Home
                </Link>
                <Link
                  href="/shop"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink hover:text-rose border-b border-ink/5 transition-colors"
                >
                  <span className="w-6 h-6 bg-ink/5 flex items-center justify-center text-[10px]">🛍</span>
                  Catalog
                </Link>
                <Link
                  href="/checkout"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink hover:text-rose border-b border-ink/5 transition-colors"
                >
                  <span className="w-6 h-6 bg-ink/5 flex items-center justify-center text-[10px]">🛒</span>
                  Cart
                  {cartCount > 0 && (
                    <span className="ml-auto bg-rose text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>
                  )}
                </Link>
                <Link
                  href="/profile"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink hover:text-rose border-b border-ink/5 transition-colors"
                >
                  <span className="w-6 h-6 bg-ink/5 flex items-center justify-center text-[10px]">👤</span>
                  Profile
                </Link>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    window.dispatchEvent(new CustomEvent('open-support-chat'));
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs font-medium uppercase tracking-wider text-rose border-b border-ink/5 transition-colors"
                >
                  <span className="w-6 h-6 bg-rose/10 text-rose flex items-center justify-center text-[10px]">💬</span>
                  Support Chat
                </button>
                <Link
                  href="/about"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-xs font-medium uppercase tracking-wider text-ink/30 hover:text-ink/50 transition-colors mt-auto"
                >
                  About
                </Link>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-ink/5 text-center">
                <p className="text-[8px] uppercase tracking-widest text-ink/20">NINOC © 2024</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content - with top padding for header */}
      <main className={cn(
        "flex-1 overflow-y-auto",
        !hideHeader && "pt-14",
        !hideTabBar && "pb-[calc(80px+env(safe-area-inset-bottom))]",
        "ios-momentum-scroll"
      )}>
        {children}
      </main>

      {/* Fixed Bottom Tab Bar with Hide and Rise */}
      {!hideTabBar && (
        <motion.nav 
          initial={{ y: 0 }}
          animate={{ y: isNavVisible ? 0 : 120 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[400] bg-white/95 backdrop-blur-xl border-t border-ink/[0.08] ios-bottom-nav select-none"
        >
          <div className="h-[calc(64px+env(safe-area-inset-bottom))] px-4 flex items-center justify-around pb-[env(safe-area-inset-bottom)]">
            {/* Home */}
            <Link
              href="/"
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 min-w-[70px] transition-all relative z-[410]",
                isActive('/') ? "text-rose scale-105" : "text-ink/30"
              )}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={isActive('/') ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive('/') ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span className={cn(
                "text-[8px] font-medium uppercase tracking-[0.1em]",
                isActive('/') ? "text-rose" : "text-ink/40"
              )}>
                Home
              </span>
            </Link>

            {/* Cart */}
            <Link
              href="/checkout"
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 min-w-[70px] transition-all relative z-[410]",
                isActive('/checkout') ? "text-rose scale-105" : "text-ink/30"
              )}
            >
              <div className="relative">
                <svg width="24" height="24" viewBox="0 0 24 24" fill={isActive('/checkout') ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive('/checkout') ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 6h15l-1.5 9h-12z"/>
                  <circle cx="9" cy="20" r="1"/>
                  <circle cx="18" cy="20" r="1"/>
                </svg>
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose text-white text-[7px] font-medium rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[8px] font-medium uppercase tracking-[0.1em]",
                isActive('/checkout') ? "text-rose" : "text-ink/40"
              )}>
                Cart
              </span>
            </Link>

            {/* Chat/Support */}
            <button
              onClick={() => {
                window.dispatchEvent(new CustomEvent('open-support-chat'));
              }}
              className="flex flex-col items-center justify-center gap-1 py-2 min-w-[70px] text-ink/30 transition-colors"
            >
              <div className="relative">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 11.5a8.38 8.38 0 01-.91 3.19"/>
                <path d="M21 6.5a8.38 8.38 0 01-.91 3.19"/>
                <path d="M21 16.5a8.38 8.38 0 01-.91 3.19"/>
                <path d="M3 11.5a8.38 8.38 0 01-.91-3.19"/>
                <path d="M3 6.5a8.38 8.38 0 01-.91-3.19"/>
                <path d="M3 16.5a8.38 8.38 0 01-.91-3.19"/>
              </svg>
              {supportUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose text-white text-[7px] font-medium rounded-full flex items-center justify-center">
                  {supportUnreadCount}
                </span>
              )}
            </div>
            <span className="text-[8px] font-medium uppercase tracking-wider text-ink/40">Chat</span>
            </button>

            {/* Profile */}
            <Link
              href="/profile"
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 min-w-[70px] transition-all relative z-[410]",
                isActive('/profile') ? "text-rose scale-105" : "text-ink/30"
              )}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill={isActive('/profile') ? "currentColor" : "none"} stroke="currentColor" strokeWidth={isActive('/profile') ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span className={cn(
                "text-[8px] font-medium uppercase tracking-[0.1em]",
                isActive('/profile') ? "text-rose" : "text-ink/40"
              )}>
                Profile
              </span>
            </Link>
          </div>
        </motion.nav>
      )}

      {/* iOS Native CSS */}
      <style jsx global>{`
        .ios-native-layout {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        .ios-momentum-scroll {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: auto;
          overscroll-behavior: auto;
        }

        .ios-bottom-nav {
          padding-bottom: env(safe-area-inset-bottom);
        }

        /* Disable tap highlight on all interactive elements */
        .ios-native-layout button,
        .ios-native-layout a,
        .ios-native-layout [role="button"] {
          -webkit-tap-highlight-color: transparent;
        }

        /* Active state feedback */
        .ios-native-layout button:active,
        .ios-native-layout a:active {
          opacity: 0.6;
        }

        /* Remove list styles */
        .ios-native-layout ul,
        .ios-native-layout ol {
          list-style: none;
        }

        /* Hide scrollbar but keep functionality */
        .ios-native-layout ::-webkit-scrollbar {
          display: none;
        }
        .ios-native-layout {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
