"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, MousePointerClick, DollarSign, ArrowUpRight, Copy, Share2, Award, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from '@/components/LocalizedLink';

// Achievement tier thresholds (cumulative sales)
const TIERS = [
  { name: 'Bronze', rate: 5, minSales: 0, color: 'amber' },
  { name: 'Silver', rate: 7, minSales: 5_000_000, color: 'slate' },
  { name: 'Gold', rate: 10, minSales: 20_000_000, color: 'yellow' },
];

interface AffiliateProfile {
  id: string;
  code: string;
  tier: string;
  commission_rate: number;
  balance: number;
  status: string;
}

interface CommissionRow {
  id: string;
  order_id: string;
  sales_amount: number;
  commission_amount: number;
  amount: number;
  status: string;
  created_at: string;
}

export default function AffiliateDashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<AffiliateProfile | null>(null);
  const [totalClicks, setTotalClicks] = useState(0);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [topLink, setTopLink] = useState<{ destination_url: string; clicks: number; code: string } | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Anda belum login. Silakan login terlebih dahulu.');
          setLoading(false);
          return;
        }

        // 2. Get affiliate profile
        const { data: affData, error: affError } = await supabase
          .from('affiliates')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (affError || !affData) {
          setError('Profil afiliasi tidak ditemukan. Pastikan Anda sudah di-approve sebagai afiliasi.');
          setLoading(false);
          return;
        }
        setProfile(affData);

        // 3. Fetch clicks, commissions, and top link in parallel
        const [clicksRes, commissionsRes, linksRes] = await Promise.all([
          supabase.from('affiliate_clicks').select('id', { count: 'exact', head: true }).eq('affiliate_id', affData.id),
          supabase.from('affiliate_commissions').select('*').eq('affiliate_id', affData.id).order('created_at', { ascending: false }),
          supabase.from('affiliate_links').select('*').eq('affiliate_id', affData.id).order('clicks', { ascending: false }).limit(1),
        ]);

        setTotalClicks(clicksRes.count || 0);
        if (commissionsRes.data) setCommissions(commissionsRes.data);
        if (linksRes.data && linksRes.data.length > 0) setTopLink(linksRes.data[0]);
      } catch (e: any) {
        setError(e.message || 'Terjadi kesalahan saat memuat data.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Derived metrics
  const validCommissions = commissions.filter(c => c.status !== 'cancelled' && c.status !== 'rejected');
  const totalOrders = validCommissions.length;
  const totalSales = validCommissions.reduce((sum, c) => sum + (c.sales_amount || 0), 0);
  const totalCommission = validCommissions.reduce((sum, c) => sum + (c.commission_amount || c.amount || 0), 0);
  const conversionRate = totalClicks > 0 ? ((totalOrders / totalClicks) * 100).toFixed(1) : '0.0';

  // Achievement progress
  const currentTierIdx = TIERS.findIndex(t => t.name.toLowerCase() === (profile?.tier || 'bronze'));
  const currentTier = TIERS[currentTierIdx >= 0 ? currentTierIdx : 0];
  const nextTier = TIERS[currentTierIdx + 1] || null;
  const progressToNext = nextTier
    ? Math.min(100, ((totalSales - currentTier.minSales) / (nextTier.minSales - currentTier.minSales)) * 100)
    : 100;
  const salesNeeded = nextTier ? Math.max(0, nextTier.minSales - totalSales) : 0;

  // Recent activity (last 5)
  const recentActivity = commissions.slice(0, 5);

  // Copied link state
  const [isCopied, setIsCopied] = useState(false);
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-ink/30" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <AlertCircle className="text-rose" size={40} />
        <p className="text-sm text-ink/60 max-w-md">{error}</p>
        <Link href="/affiliate" className="text-xs uppercase tracking-wider font-medium text-rose hover:underline">
          Daftar Afiliasi
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-medium italic uppercase tracking-tighter text-ink">
            Selamat Datang, <span className="text-rose">Kreator!</span>
          </h1>
          <p className="text-xs md:text-sm text-ink/60 mt-1">
            Kode Afiliasi Anda: <span className="font-bold text-ink">{profile?.code}</span> • {profile?.tier?.toUpperCase()} ({profile?.commission_rate}%)
          </p>
        </div>
        <Link href="/affiliate/dashboard/links" className="flex items-center gap-2 bg-ink text-white px-5 py-2.5 rounded-lg text-xs font-medium uppercase tracking-wider hover:bg-rose transition-colors w-fit">
          <Share2 size={14} />
          Buat Link Baru
        </Link>
      </div>

      {/* ACHIEVEMENT SYSTEM */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-ink via-ink/95 to-ink/90 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden"
      >
        <div className="absolute -right-6 -top-6 text-white/5">
          <Award size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/60 mb-1">Achievement System</p>
              <h3 className="text-lg font-display font-medium">
                Tier {currentTier.name}
                {nextTier && <span className="text-white/50 text-sm ml-2">→ {nextTier.name}</span>}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60 uppercase tracking-wider">Total Penjualan</p>
              <p className="text-lg font-bold">Rp {totalSales.toLocaleString('id-ID')}</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
              className="h-full bg-gradient-to-r from-rose to-amber-400 rounded-full"
            />
          </div>
          <div className="flex justify-between text-xs text-white/50">
            <span>{currentTier.name} ({currentTier.rate}%)</span>
            {nextTier ? (
              <span>
                {salesNeeded > 0
                  ? `Rp ${salesNeeded.toLocaleString('id-ID')} lagi menuju ${nextTier.name} (${nextTier.rate}%)`
                  : `${nextTier.name} tercapai!`}
              </span>
            ) : (
              <span>Tier tertinggi tercapai! 🎉</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Card 1 - Total Komisi */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl border border-ink/5 shadow-sm space-y-4"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign size={20} />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ink/40 mb-1">Total Komisi</p>
            <p className="text-2xl font-display font-medium text-ink">Rp {totalCommission.toLocaleString('id-ID')}</p>
          </div>
        </motion.div>

        {/* Card 2 - Total Klik */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl border border-ink/5 shadow-sm space-y-4"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <MousePointerClick size={20} />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ink/40 mb-1">Total Klik Link</p>
            <p className="text-2xl font-display font-medium text-ink">{totalClicks.toLocaleString('id-ID')}</p>
          </div>
        </motion.div>

        {/* Card 3 - Konversi */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl border border-ink/5 shadow-sm space-y-4"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-rose/5 text-rose rounded-xl">
              <TrendingUp size={20} />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ink/40 mb-1">Konversi Penjualan</p>
            <p className="text-2xl font-display font-medium text-ink">{conversionRate}%</p>
          </div>
        </motion.div>

        {/* Card 4 - Saldo */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-2xl border border-ink/5 shadow-sm space-y-4"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Award size={20} />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-ink/40 mb-1">Saldo Tersedia</p>
            <p className="text-2xl font-display font-medium text-ink">Rp {(profile?.balance || 0).toLocaleString('id-ID')}</p>
          </div>
        </motion.div>
      </div>

      {/* QUICK LINKS & RECENT ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-ink/5 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-ink/5">
            <h2 className="text-sm font-medium uppercase tracking-wider text-ink">Aktivitas Terkini</h2>
          </div>
          <div className="p-0">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink/5 text-ink/60 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4 font-medium">Tanggal</th>
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Komisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {recentActivity.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-xs text-ink/40 uppercase tracking-wider">
                      Belum ada transaksi afiliasi.
                    </td>
                  </tr>
                ) : recentActivity.map((c) => (
                  <tr key={c.id} className="hover:bg-ink/[0.02] transition-colors">
                    <td className="px-6 py-4 text-ink/60">{new Date(c.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-6 py-4 text-ink font-medium">{c.order_id?.slice(0, 12)}...</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs md:text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-sm ${
                        c.status === 'paid' || c.status === 'available' ? 'text-emerald-600 bg-emerald-50' :
                        c.status === 'pending' ? 'text-amber-600 bg-amber-50' :
                        'text-rose bg-rose/10'
                      }`}>
                        {c.status === 'pending' ? 'Menunggu' : c.status === 'paid' || c.status === 'available' ? 'Berhasil' : c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-ink">Rp {(c.commission_amount || c.amount || 0).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOP PERFORMING LINK */}
        <div className="bg-white rounded-2xl border border-ink/5 shadow-sm p-6 space-y-6">
          <h2 className="text-sm font-medium uppercase tracking-wider text-ink">Link Tersukses Anda</h2>

          {topLink ? (
            <>
              <div className="p-4 bg-ink/[0.03] rounded-xl border border-ink/5 relative group">
                <p className="text-xs text-ink/60 mb-2 truncate">{topLink.destination_url}</p>
                <p className="text-sm font-medium text-rose truncate pr-8">
                  ninoc.store{topLink.destination_url}?ref={profile?.code}
                </p>
                <button
                  onClick={() => handleCopy(`https://ninoc.store${topLink.destination_url}?ref=${profile?.code}`)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink transition-colors"
                >
                  {isCopied ? <span className="text-emerald-500 text-xs font-bold">✓</span> : <Copy size={16} />}
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ink/60">Klik</span>
                  <span className="font-medium text-ink">{topLink.clicks.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink/60">Total Order</span>
                  <span className="font-medium text-ink">{totalOrders}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-ink/60">Total Komisi</span>
                  <span className="font-medium text-emerald-600">Rp {totalCommission.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-ink/40 uppercase tracking-wider mb-3">Belum ada link aktif</p>
              <Link href="/affiliate/dashboard/links" className="text-xs font-medium text-rose hover:underline uppercase tracking-wider">
                Buat Link Pertama →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
