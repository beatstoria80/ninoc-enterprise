"use client";

import React, { useState } from 'react';
import Link from '@/components/LocalizedLink';
import { ArrowLeft, Bell, BellOff, CheckCheck, Package, CreditCard, Truck, AlertTriangle, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  action_link: string | null;
  created_at: string;
}

function getNotifIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes('pembayaran') || t.includes('payment') || t.includes('bayar')) return <CreditCard size={16} />;
  if (t.includes('pengiriman') || t.includes('kirim') || t.includes('transit') || t.includes('resi')) return <Truck size={16} />;
  if (t.includes('pesanan') || t.includes('order') || t.includes('diterima')) return <Package size={16} />;
  if (t.includes('batal') || t.includes('cancel') || t.includes('expired') || t.includes('kadaluarsa')) return <AlertTriangle size={16} />;
  return <Info size={16} />;
}

function getNotifColor(title: string) {
  const t = title.toLowerCase();
  if (t.includes('berhasil') || t.includes('sukses') || t.includes('diterima')) return 'bg-emerald-100 text-emerald-600';
  if (t.includes('batal') || t.includes('cancel') || t.includes('gagal') || t.includes('expired')) return 'bg-red-100 text-red-500';
  if (t.includes('pengiriman') || t.includes('transit') || t.includes('resi')) return 'bg-cyan-100 text-cyan-600';
  if (t.includes('pembayaran') || t.includes('pending') || t.includes('menunggu')) return 'bg-amber-100 text-amber-600';
  return 'bg-violet-100 text-violet-600';
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function groupByDate(items: Notification[]): Record<string, Notification[]> {
  const groups: Record<string, Notification[]> = {};
  for (const n of items) {
    const d = new Date(n.created_at);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let label: string;
    if (d.toDateString() === today.toDateString()) {
      label = 'Hari Ini';
    } else if (d.toDateString() === yesterday.toDateString()) {
      label = 'Kemarin';
    } else {
      label = d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }
  return groups;
}

export default function NotificationsClient({ notifications: initialNotifications }: { notifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [markingAll, setMarkingAll] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    await supabase.from('user_notifications').update({ is_read: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    
    for (const id of unreadIds) {
      await supabase.from('user_notifications').update({ is_read: true }).eq('id', id);
    }
    setMarkingAll(false);
  };

  const grouped = groupByDate(notifications);

  return (
    <main className="min-h-screen bg-white text-ink font-medium selection:bg-ink selection:text-white">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 lg:py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-ink/5">
          <div className="flex items-center gap-3">
            <Link href="/profile" className="w-8 h-8 flex items-center justify-center rounded-full bg-ink/5 hover:bg-ink/10 transition-colors">
              <ArrowLeft size={14} />
            </Link>
            <div>
              <h1 className="text-lg font-display font-medium italic uppercase tracking-tighter">Notifikasi</h1>
              {unreadCount > 0 && (
                <p className="text-[10px] uppercase tracking-widest text-ink/50 font-semibold mt-0.5">
                  {unreadCount} belum dibaca
                </p>
              )}
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-semibold text-rose hover:text-rose/80 transition-colors disabled:opacity-50"
            >
              <CheckCheck size={12} />
              Tandai Semua Dibaca
            </button>
          )}
        </div>

        {/* Content */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center mb-4">
              <BellOff size={24} className="text-ink/20" />
            </div>
            <p className="text-sm font-semibold text-ink/40 uppercase tracking-widest">Tidak Ada Notifikasi</p>
            <p className="text-xs text-ink/30 mt-2">Pemberitahuan terkait pesanan Anda akan muncul di sini.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([dateLabel, items]) => (
              <div key={dateLabel}>
                <p className="text-[10px] uppercase tracking-widest text-ink/40 font-bold mb-3 pl-1">{dateLabel}</p>
                <div className="space-y-2">
                  {items.map((notif) => {
                    const iconColor = getNotifColor(notif.title);
                    const Wrapper = notif.action_link ? Link : 'div';
                    const wrapperProps = notif.action_link ? { href: notif.action_link } : {};

                    return (
                      <Wrapper
                        key={notif.id}
                        {...(wrapperProps as any)}
                        onClick={() => !notif.is_read && markAsRead(notif.id)}
                        className={`block p-3.5 rounded-lg border transition-all duration-200 cursor-pointer group ${
                          notif.is_read
                            ? 'bg-white border-ink/5 hover:border-ink/10'
                            : 'bg-rose/[0.02] border-rose/10 hover:border-rose/20 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                            {getNotifIcon(notif.title)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className={`text-[11px] font-bold uppercase tracking-wider leading-tight ${notif.is_read ? 'text-ink/60' : 'text-ink'}`}>
                                {notif.title}
                              </p>
                              {!notif.is_read && (
                                <span className="w-2 h-2 rounded-full bg-rose flex-shrink-0 animate-pulse" />
                              )}
                            </div>
                            <p className={`text-[11px] mt-1 leading-relaxed ${notif.is_read ? 'text-ink/40' : 'text-ink/60'}`}>
                              {notif.message}
                            </p>
                            <p className="text-[9px] uppercase tracking-widest text-ink/30 font-semibold mt-2">
                              {formatTimeAgo(notif.created_at)}
                            </p>
                          </div>
                        </div>
                      </Wrapper>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
