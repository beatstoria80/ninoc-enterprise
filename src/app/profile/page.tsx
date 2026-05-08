"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, LogOut, User, Mail, Calendar, ShoppingBag, Heart, MapPin, ChevronRight, Camera, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) {
        router.push('/login');
        return;
      }

      // Fetch structured profile from DB
      const { data: profile } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (profile) {
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          full_name: profile.full_name || authUser.user_metadata?.full_name || 'NINOC Member',
          avatar_url: profile.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || '',
          created_at: profile.created_at || authUser.created_at,
        });
      } else {
        // Fallback to auth metadata if profile not found yet
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || 'NINOC Member',
          avatar_url: authUser.user_metadata?.avatar_url || '',
          created_at: authUser.created_at,
        });
      }
      
      setIsLoading(false);
    };

    getUser();
  }, [router]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsUploading(true);
      const file = event.target.files?.[0];
      if (!file || !user) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update database
      const { error: updateError } = await supabase
        .from('customer_profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // 4. Update UI
      setUser({ ...user, avatar_url: publicUrl });
      alert('Profile photo updated successfully!');

    } catch (err) {
      const error = err as Error;
      alert('Error uploading avatar: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ink/10 border-t-rose rounded-full animate-spin" />
      </main>
    );
  }

  const memberSince = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const menuItems = [
    { icon: <ShoppingBag size={20} />, label: 'Order History', desc: 'Track your archive orders', href: '#' },
    { icon: <Heart size={20} />, label: 'Wishlist', desc: 'Your saved collections', href: '#' },
    { icon: <MapPin size={20} />, label: 'Shipping Address', desc: 'Manage delivery addresses', href: '#' },
  ];

  return (
    <main className="min-h-screen bg-white selection:bg-ink selection:text-white pb-32">
      {/* Hero Banner */}
      <section className="relative pt-40 md:pt-48 px-6 md:px-12 max-w-[1200px] mx-auto">
        
        <Link href="/" className="inline-flex items-center gap-2 text-ink/30 hover:text-ink transition-colors mb-12 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Back to Shop</span>
        </Link>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-12"
        >
          {/* Profile Card */}
          <div className="bg-ink/[0.02] border border-ink/5 rounded-[10px] p-10 md:p-14 flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-ink/5 overflow-hidden flex-shrink-0 border-4 border-white shadow-xl relative">
                {isUploading && (
                  <div className="absolute inset-0 bg-ink/40 z-10 flex items-center justify-center text-white">
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                )}
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink/20">
                    <User size={48} />
                  </div>
                )}
              </div>
              
              <label className="absolute bottom-1 right-1 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-ink cursor-pointer hover:bg-rose hover:text-white transition-all border border-ink/5">
                <Camera size={18} />
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleAvatarUpload} 
                  className="hidden" 
                  disabled={isUploading}
                />
              </label>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-display font-medium tracking-tight text-ink uppercase">
                  {user?.full_name}
                </h1>
                <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-ink/50 mt-2">Archive Member</p>
              </div>
 
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 text-ink/60">
                <div className="flex items-center gap-2">
                  <Mail size={14} />
                  <span className="text-xs font-medium">{user?.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span className="text-xs font-medium">Member since {memberSince}</span>
                </div>
              </div>
            </div>
 
            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-6 py-3 bg-ink/5 hover:bg-rose hover:text-white rounded-[10px] transition-all text-ink/60 text-[10px] font-medium uppercase tracking-[0.2em]"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
 
          {/* Menu Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {menuItems.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              >
                <Link 
                  href={item.href}
                  className="group block p-8 md:p-10 bg-white border border-ink/5 rounded-[10px] hover:border-rose/20 hover:shadow-xl hover:shadow-rose/5 transition-all"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 bg-ink/5 rounded-[10px] flex items-center justify-center text-ink/50 group-hover:bg-rose/10 group-hover:text-rose transition-all">
                      {item.icon}
                    </div>
                    <ChevronRight size={16} className="text-ink/20 group-hover:text-rose group-hover:translate-x-1 transition-all" />
                  </div>
                  <h3 className="text-sm font-medium uppercase tracking-[0.2em] text-ink">{item.label}</h3>
                  <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-ink/50 mt-2">{item.desc}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </main>
  );
}
