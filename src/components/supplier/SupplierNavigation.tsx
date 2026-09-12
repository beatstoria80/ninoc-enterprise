'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, LineChart, LayoutDashboard, Settings, Truck, Coffee, UtensilsCrossed, AlertTriangle, Menu, X, Bell, User } from 'lucide-react';
import { SupplierLogoutButton } from './SupplierLogoutButton';

interface SupplierNavigationProps {
  supplierName: string;
  isFNB: boolean;
  partnerCode: string;
  children?: React.ReactNode;
}

export function SupplierNavigation({ supplierName, isFNB, partnerCode, children }: SupplierNavigationProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', href: '/supplier', icon: LayoutDashboard },
    { name: isFNB ? 'Menu & Stock' : 'Allocations', href: '/supplier/inventory', icon: isFNB ? Coffee : Package },
    { name: isFNB ? 'Instan Deliveries' : 'Logistics & Packing', href: '/supplier/logistics', icon: Truck },
    { name: 'Sales & Payouts', href: '/supplier/ledger', icon: LineChart },
    { name: 'Returns & Cancels', href: '/supplier/returns', icon: AlertTriangle },
    { name: 'Settings', href: '/supplier/settings', icon: Settings },
  ];

  const currentLink = navLinks.find(link => {
    if (link.href === '/supplier') return pathname === '/supplier';
    return pathname?.startsWith(link.href);
  });
  
  const pageTitle = currentLink ? currentLink.name : 'Partner Hub';

  const navContent = (
    <div className="flex flex-col h-full w-full">
      <div className="p-6 border-b border-white/10 shrink-0">
        <h1 className="text-xl font-display italic text-white mb-1">NINOC B2B</h1>
        <p className="text-xs md:text-[10px] font-medium uppercase tracking-[0.2em] text-white/70">{supplierName || 'Merek Belum Diatur'}</p>
        <p className="text-xs font-mono text-white/50 mt-1">{partnerCode}</p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded text-[10px] font-medium uppercase tracking-wider text-white">
          {isFNB ? <UtensilsCrossed size={12} /> : <Package size={12} />}
          {isFNB ? 'F&B Partner' : 'Retail Partner'}
        </div>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = link.href === '/supplier' ? pathname === '/supplier' : pathname?.startsWith(link.href);
          
          return (
            <Link 
              key={link.href}
              href={link.href} 
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 text-sm rounded-md transition-colors ${
                isActive 
                  ? 'bg-white/10 text-white font-medium' 
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={18} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 shrink-0">
        <SupplierLogoutButton />
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-ink transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col shrink-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile Close Button */}
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-4 right-4 text-white/60 hover:text-white md:hidden p-2"
        >
          <X size={20} />
        </button>

        {navContent}
      </aside>

      {/* Main Content Area containing Header and Children */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Dynamic Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 shrink-0 w-full z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-md md:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 hidden md:inline-block">Partner Hub</span>
              <span className="text-gray-400 hidden md:inline-block">/</span>
              <h2 className="text-sm font-bold text-gray-900">{pageTitle}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-rose rounded-full border border-white"></span>
            </button>
            <div className="h-8 w-8 bg-gray-100 rounded-full border border-gray-200 flex items-center justify-center text-gray-600">
              <User size={16} />
            </div>
          </div>
        </header>

        {children}
      </div>
    </>
  );
}
