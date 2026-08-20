'use client';

import { LogOut } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SupplierLogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={handleLogout}
      disabled={isLoading}
      className="flex items-center gap-3 px-4 py-3 w-full text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 rounded-md transition-all duration-200"
    >
      <LogOut size={18} className={isLoading ? "animate-pulse" : ""} />
      <span>{isLoading ? 'Signing out...' : 'Sign Out'}</span>
    </button>
  );
}
