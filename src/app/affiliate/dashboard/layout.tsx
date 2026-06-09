"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Link as LinkIcon, Image as ImageIcon, Wallet, LogOut, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { label: 'Overview', href: '/affiliate/dashboard', icon: LayoutDashboard },
  { label: 'Tracking Links', href: '/affiliate/dashboard/links', icon: LinkIcon },
  { label: 'Media Kit', href: '/affiliate/dashboard/assets', icon: ImageIcon },
  { label: 'Payouts', href: '/affiliate/dashboard/payouts', icon: Wallet },
];

export default function AffiliateDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cr flex">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 border-r border-ink/5 bg-white shrink-0 sticky top-0 h-screen">
        <div className="p-6 border-b border-ink/5">
          <Link href="/" className="font-display font-medium text-xl italic tracking-tighter text-ink uppercase">
            NINOC <span className="text-rose text-sm">CREATORS</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-medium uppercase tracking-wider transition-all ${
                  isActive 
                    ? 'bg-ink text-white shadow-md' 
                    : 'text-ink/60 hover:bg-ink/5 hover:text-ink'
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-ink/5">
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-xs font-medium uppercase tracking-wider text-rose hover:bg-rose/5 transition-colors">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* MOBILE TOP BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white/90 backdrop-blur-md border-b border-ink/5 z-50 flex items-center justify-between px-4">
        <Link href="/" className="font-display font-medium text-lg italic tracking-tighter text-ink uppercase">
          NINOC <span className="text-rose text-[10px]">CREATORS</span>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 -mr-2 text-ink/60 hover:text-ink"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* MOBILE MENU OVERLAY */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 top-16 bg-white z-40 md:hidden flex flex-col"
          >
            <nav className="flex-1 p-4 space-y-2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-4 rounded-xl text-xs font-medium uppercase tracking-wider transition-all ${
                      isActive 
                        ? 'bg-ink text-white shadow-md' 
                        : 'text-ink/60 bg-gray-50'
                    }`}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-ink/5 pb-safe">
              <button className="flex items-center justify-center gap-3 px-4 py-4 w-full rounded-xl text-xs font-medium uppercase tracking-wider text-rose bg-rose/5 border border-rose/10">
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 min-w-0 md:h-screen md:overflow-y-auto pt-16 md:pt-0">
        <div className="p-4 md:p-8 lg:p-12 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
