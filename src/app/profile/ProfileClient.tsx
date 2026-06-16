"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, ChevronRight, Loader2, User, CornerDownRight, LogOut, RefreshCw } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { useDevice } from '@/app/checkout/_components/useDevice';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ImageCropper from './_components/ImageCropper';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
  customer_number?: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  total_price: number;
  status: string;
  courier: string | null;
  created_at: string;
}

export default function ProfileClient({ initialUser, initialOrders }: { initialUser: UserProfile, initialOrders: Order[] }) {
  const { isMobile, isIPhone } = useDevice();
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [orders] = useState<Order[]>(initialOrders);
  
  const [isUploading, setIsUploading] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setCropImageSrc(objectUrl);
    event.target.value = ''; // Reset input
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      setCropImageSrc(null);
      setIsUploading(true);
      if (!user) return;

      const fileExt = 'jpeg';
      const fileName = `${user.id}-${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('customer_profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

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
    window.location.href = '/';
  };

  const memberSince = user.created_at 
    ? new Date(user.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <main className={cn("min-h-screen bg-white selection:bg-ink selection:text-white pb-32 font-medium", isIPhone && "ios-mobile-layout")}>
      {cropImageSrc && (
        <ImageCropper
          imageSrc={cropImageSrc}
          onClose={() => setCropImageSrc(null)}
          onCropComplete={handleCropComplete}
        />
      )}

      <section className={cn("relative px-6 md:px-12 max-w-[1200px] mx-auto", isMobile ? "pt-14" : "pt-6 md:pt-8")}>

        {!isMobile && (
        <Link href="/" className="inline-flex items-center gap-2 text-ink/30 hover:text-ink transition-colors mb-6 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs md:text-[10px] uppercase tracking-[0.2em]">Return to Studio Catalog</span>
        </Link>
        )}

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          {/* Profile Header */}
          <div className="border border-ink/5 rounded-[10px] p-4 md:p-6 flex flex-col md:flex-row items-center gap-6 bg-ink/[0.01]">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-ink/5 overflow-hidden flex-shrink-0 border border-ink/10 relative">
                {isUploading && (
                  <div className="absolute inset-0 bg-ink/40 z-10 flex items-center justify-center text-white">
                    <Loader2 size={24} className="animate-spin" />
                  </div>
                )}
                {user?.avatar_url ? (
                  <Image src={user.avatar_url} alt={user.full_name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ink/20">
                    <User size={32} />
                  </div>
                )}
              </div>
              
              <label className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-ink cursor-pointer hover:bg-rose hover:text-white transition-all border border-ink/5">
                <Camera size={14} />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={isUploading} />
              </label>
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-display italic text-ink uppercase tracking-tight">{user?.full_name}</h1>
              {user?.customer_number && (
                <div className="flex items-center justify-center md:justify-start gap-1 mt-1 text-xs md:text-[10px] text-blue-600 font-mono tracking-widest">
                  <CornerDownRight size={12} className="text-blue-500" />
                  ID: {user.customer_number}
                </div>
              )}
              <p className="text-[11px] md:text-[8px] tracking-[0.3em] text-ink/40 uppercase mt-1">Ninoc Membership • Est. {memberSince}</p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-6">
                <div className="space-y-1">
                  <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/30">Email Reference</p>
                  <p className="text-xs md:text-[10px] text-ink/70">{user?.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/30">Member Status</p>
                  <p className="text-xs md:text-[10px] text-rose">Verified Individual</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-xs md:text-[9px] uppercase tracking-[0.2em] px-5 py-2.5 border border-ink/10 hover:bg-rose hover:text-white hover:border-rose transition-all rounded-full text-ink/60"
            >
              <LogOut size={12} />
              Studio Exit
            </button>
          </div>

          {/* Returns CTA */}
          <Link
            href="/profile/returns"
            className="group flex items-center justify-between p-4 border border-rose/10 bg-rose/[0.02] rounded-[4px] hover:border-rose/20 hover:bg-rose/[0.04] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-rose/10 rounded-sm flex items-center justify-center">
                <RefreshCw size={13} className="text-rose" />
              </div>
              <div>
                <p className="text-xs md:text-[10px] font-semibold uppercase tracking-wider text-ink">Return Tracker</p>
                <p className="text-[11px] md:text-[8px] text-ink/40">Lacak status pengajuan retur & refund</p>
              </div>
            </div>
            <ChevronRight size={12} className="text-rose/50 group-hover:text-rose group-hover:translate-x-1 transition-all" />
          </Link>

          {/* Section: Activity Logs (Orders) */}
          <div className="space-y-4">
            <div className="flex items-end justify-between border-b border-ink/5 pb-4">
              <div className="space-y-1">
                <h2 className="text-xs uppercase tracking-[0.4em] text-ink">Investment Logs</h2>
                <p className="text-xs md:text-[9px] text-ink/40 tracking-wider">Historical record of all origin specifications acquired.</p>
              </div>
              <p className="text-xs md:text-[9px] font-medium text-ink/30">{orders.length} Entries Found</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {orders.length === 0 ? (
                <div className="py-8 md:py-20 text-center border border-dashed border-ink/10 rounded-[10px]">
                  <p className="text-xs md:text-[10px] uppercase tracking-widest text-ink/30 italic">No historical records available.</p>
                </div>
              ) : (
                orders.map((order) => (
                  <Link 
                    key={order.id} 
                    href={`/profile/orders/${order.id}`}
                    className="group border border-ink/5 rounded-[4px] p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-ink/[0.01] transition-all"
                  >
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs md:text-[10px] text-ink uppercase tracking-wider">{order.id}</span>
                        <span className={`text-[11px] md:text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-full ${
                          order.status === 'paid' ? 'bg-green-50 text-green-600' : 
                          order.status === 'shipped' ? 'bg-blue-50 text-blue-600' : 'bg-ink/5 text-ink/40'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs md:text-[9px] text-ink/40">Registered on {new Date(order.created_at).toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center gap-12 text-right">
                      <div className="space-y-1">
                        <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/30">Total Investment</p>
                        <p className="text-xs text-ink">IDR {order.total_price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[11px] md:text-[8px] uppercase tracking-widest text-ink/30">Logistics</p>
                        <p className="text-xs md:text-[10px] text-ink/60 uppercase">{order.courier || 'Unassigned'}</p>
                      </div>
                      <ChevronRight size={14} className="text-ink/20 group-hover:text-rose group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
