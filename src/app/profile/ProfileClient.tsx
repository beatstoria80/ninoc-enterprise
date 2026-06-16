"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, ChevronRight, Loader2, User, CornerDownRight, LogOut, RefreshCw } from 'lucide-react';
import Link from '@/components/LocalizedLink';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
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
  const supabase = createClient();
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
        <Link href="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors mb-6 group">
          <span className="text-sm font-medium">Kembali ke Katalog</span>
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
              <h1 className="text-2xl font-bold text-slate-800">{user?.full_name}</h1>
              {user?.customer_number && (
                <div className="flex items-center justify-center md:justify-start gap-1 mt-1 text-sm text-slate-500 font-medium">
                  <CornerDownRight size={14} className="text-slate-400" />
                  ID: {user.customer_number}
                </div>
              )}
              <p className="text-sm text-slate-500 mt-1">Ninoc Membership • Est. {memberSince}</p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-6">
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-500">Email Terdaftar</p>
                  <p className="text-sm font-medium text-slate-800">{user?.email}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-slate-500">Status Akun</p>
                  <p className="text-sm font-medium text-rose">Member Terverifikasi</p>
                </div>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-sm font-medium px-5 py-2.5 border border-slate-200 hover:bg-rose hover:text-white hover:border-rose transition-all rounded-full text-slate-600"
            >
              <LogOut size={14} />
              Keluar Akun
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
                <p className="text-sm font-semibold text-slate-800">Return Tracker</p>
                <p className="text-xs text-slate-500">Lacak status pengajuan retur & refund</p>
              </div>
            </div>
            <ChevronRight size={12} className="text-rose/50 group-hover:text-rose group-hover:translate-x-1 transition-all" />
          </Link>

          {/* Section: Activity Logs (Orders) */}
          <div className="space-y-4">
            <div className="flex items-end justify-between border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-slate-800">Riwayat Pesanan</h2>
                <p className="text-sm text-slate-500">Daftar riwayat belanja dan pesanan Anda.</p>
              </div>
              <p className="text-sm font-medium text-slate-500">{orders.length} Pesanan</p>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {orders.length === 0 ? (
                <div className="py-8 md:py-20 text-center border border-dashed border-slate-200 rounded-[10px]">
                  <p className="text-sm text-slate-500 italic">Belum ada riwayat pesanan.</p>
                </div>
              ) : (
                orders.map((order) => (
                  <Link 
                    key={order.id} 
                    href={`/profile/orders/${order.id}`}
                    className="group border border-slate-100 rounded-[4px] p-4 flex flex-col md:flex-row items-center justify-between gap-4 hover:bg-slate-50 transition-all"
                  >
                    <div className="flex flex-col gap-1 flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-800 uppercase">{order.id}</span>
                        <span className={`text-xs font-semibold uppercase px-2 py-0.5 rounded-full ${
                          order.status === 'paid' ? 'bg-green-50 text-green-600' : 
                          order.status === 'shipped' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">Dipesan pada {new Date(order.created_at).toLocaleDateString()}</p>
                    </div>

                    <div className="flex items-center gap-12 text-right">
                      <div className="space-y-0.5">
                        <p className="text-xs text-slate-500">Total Belanja</p>
                        <p className="text-sm font-semibold text-slate-800">Rp {order.total_price.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-xs text-slate-500">Kurir Pengiriman</p>
                        <p className="text-sm font-medium text-slate-700 uppercase">{order.courier || 'Unassigned'}</p>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-rose group-hover:translate-x-1 transition-all" />
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
