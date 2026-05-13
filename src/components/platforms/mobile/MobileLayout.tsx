import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Menu, X, ArrowLeft, Search, MessageSquare, ShoppingBag, User, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  backHref = '/shop',
  cartCount = 0,
  hideHeader = false,
}: MobileLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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
    const timeout = setTimeout(() => handleSearch(value), 300);
    return () => clearTimeout(timeout);
  };

  // Back button: Navigate to shop to keep users engaged
  const handleBack = () => {
    // Always navigate to shop - standard app engagement strategy
    router.push('/shop');
  };

  return (
    <div className="min-h-screen bg-cr ios-native-layout flex flex-col overflow-x-hidden">
      {/* Safe area top spacer */}
      <div className="h-[env(safe-area-inset-top)] bg-white/95" />

      {/* Fixed Header */}
      {!hideHeader && (
        <header className="fixed top-[env(safe-area-inset-top)] left-0 right-0 z-[400] bg-white/95 backdrop-blur-xl border-b border-ink/[0.05]">
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
              {/* Search Icon - Opens Search Modal */}
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
        </header>
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
              className="fixed inset-0 bg-cr/80 backdrop-blur-sm z-[500]"
            />

            {/* Search Modal */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-[env(safe-area-inset-top)] left-0 right-0 z-[510] bg-white shadow-2xl"
            >
              <div className="p-4 border-b border-ink/5">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/30" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchInput}
                      placeholder="Search catalog..."
                      autoFocus
                      className="w-full bg-ink/5 rounded-full py-3 pl-12 pr-4 text-sm text-ink placeholder:text-ink/30 outline-none focus:ring-2 focus:ring-rose/20"
                    />
                  </div>
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="p-2 text-ink/30 hover:text-rose"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Search Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {isSearching && (
                  <div className="p-8 text-center">
                    <div className="w-6 h-6 border-2 border-rose/20 border-t-rose rounded-full animate-spin mx-auto" />
                  </div>
                )}
                {!isSearching && searchQuery && searchResults.length === 0 && (
                  <div className="p-8 text-center">
                    <p className="text-sm text-ink/30">No results found</p>
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
                    className="flex items-center gap-4 p-4 border-b border-ink/5 hover:bg-ink/5 transition-colors"
                  >
                    <div className="w-12 h-12 bg-ink/5 rounded-lg overflow-hidden">
                      {product.image_url && (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-ink uppercase">{product.name}</p>
                      <p className="text-xs text-rose italic">Rp {product.price.toLocaleString('id-ID')}</p>
                    </div>
                  </Link>
                ))}
                {!searchQuery && (
                  <div className="p-8 text-center">
                    <p className="text-xs text-ink/30 uppercase tracking-wider">Start typing to search</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Slide-over Menu Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-[500]"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-[80%] max-w-[320px] bg-white z-[510] shadow-2xl flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-ink/5">
                <span className="font-display font-medium text-sm italic tracking-widest text-rose uppercase">Archive Menu</span>
                <button 
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2 -mr-2 text-ink/30 hover:text-ink transition-colors"
                >
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-8 px-6 space-y-8">
                {/* Navigation Links */}
                <div className="space-y-4">
                  <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/20">Catalog Selection</p>
                  <div className="grid gap-2">
                    <Link href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-3 text-sm font-medium uppercase tracking-tight text-ink hover:text-rose transition-colors group">
                      <div className="w-8 h-8 rounded-none bg-ink/5 flex items-center justify-center group-hover:bg-rose group-hover:text-white transition-all"><ShoppingBag size={14} /></div>
                      Home Archive
                    </Link>
                    <Link href="/shop" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-3 text-sm font-medium uppercase tracking-tight text-ink hover:text-rose transition-colors group">
                      <div className="w-8 h-8 rounded-none bg-ink/5 flex items-center justify-center group-hover:bg-rose group-hover:text-white transition-all"><Search size={14} /></div>
                      Browse Catalog
                    </Link>
                    <Link href="/profile" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-3 text-sm font-medium uppercase tracking-tight text-ink hover:text-rose transition-colors group">
                      <div className="w-8 h-8 rounded-none bg-ink/5 flex items-center justify-center group-hover:bg-rose group-hover:text-white transition-all"><User size={14} /></div>
                      Member Profile
                    </Link>
                  </div>
                </div>

                {/* Support Section */}
                <div className="space-y-4">
                  <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/20">Archival Help</p>
                  <button 
                    onClick={() => {
                      setIsMenuOpen(false);
                      // Custom event to open SupportChat
                      window.dispatchEvent(new CustomEvent('open-support-chat'));
                    }} 
                    className="w-full flex items-center gap-4 py-3 text-sm font-medium uppercase tracking-tight text-ink hover:text-rose transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-none bg-rose/10 flex items-center justify-center text-rose group-hover:bg-rose group-hover:text-white transition-all"><MessageSquare size={14} /></div>
                    Support Archive
                  </button>
                </div>

                <div className="space-y-4">
                  <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-ink/20">Studio Exit</p>
                  <Link href="/about" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-4 py-3 text-sm font-medium uppercase tracking-tight text-ink/40 hover:text-ink transition-colors group">
                    <div className="w-8 h-8 rounded-none bg-ink/5 flex items-center justify-center group-hover:bg-ink group-hover:text-white transition-all"><Info size={14} /></div>
                    Origin Specification
                  </Link>
                </div>
              </div>

              <div className="p-8 border-t border-ink/5 text-center">
                <p className="text-[8px] font-medium uppercase tracking-[0.4em] text-ink/20">NINOC Archive © 2024</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content - with top padding for header */}
      <main className={cn(
        "flex-1 overflow-y-auto pt-14",
        "pb-[calc(80px+env(safe-area-inset-bottom))]",
        "ios-momentum-scroll"
      )}>
        {children}
      </main>

      {/* Fixed Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[400] bg-white/95 backdrop-blur-xl border-t border-ink/[0.08] ios-bottom-nav select-none">
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
      </nav>

      {/* iOS Native CSS */}
      <style jsx global>{`
        .ios-native-layout {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        .ios-momentum-scroll {
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: contain;
          overscroll-behavior: contain;
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
