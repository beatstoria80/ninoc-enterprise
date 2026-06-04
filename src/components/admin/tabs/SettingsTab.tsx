"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSettings } from '@/store/useSettings';
import { supabase } from '@/lib/supabase';
import {
  Store, CreditCard, Clock, Palette, Truck, HelpCircle,
  MessageSquare, Lock, Search, Plus, X, Save, Upload,
  ChevronRight, Eye, EyeOff, Globe, Bell, Package,
  FileText, Shield, Database, Star, MapPin, Phone, Mail, Link
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

// ── Sub-nav items ──────────────────────────────────────────────────────
const SETTINGS_ITEMS = [
  { id: 'my-store', label: 'My Store', icon: Store },
  { id: 'bank-account', label: 'Bank Account', icon: CreditCard },
  { id: 'schedule', label: 'Operational Schedule', icon: Clock },
  { id: 'decoration', label: 'Store Decoration', icon: Palette },
  { id: 'delivery', label: 'Delivery Setting', icon: Truck },
  { id: 'help-center', label: 'Help Center', icon: HelpCircle },
  { id: 'reply-template', label: 'Reply Template', icon: MessageSquare },
  { id: 'change-password', label: 'Change Password', icon: Lock },
  { id: 'seo', label: 'SEO Optimization', icon: Search },
];

// ── Section wrapper ──────────────────────────────────────────────────────
function SettingsSection({ title, subtitle, children }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-sm border border-ink/10 p-5">
      <div className="mb-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink">{title}</h2>
        {subtitle && <p className="text-[9px] text-ink/40 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ── Form field ──────────────────────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] uppercase tracking-widest text-ink/50 font-medium">{label}</label>
      {children}
      {hint && <p className="text-[8px] text-ink/30">{hint}</p>}
    </div>
  );
}

function Input({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full px-3 py-2 text-[11px] border border-ink/10 rounded-sm bg-white",
        "focus:outline-none focus:border-rose/40 transition-colors placeholder:text-ink/20",
        className
      )}
      {...props}
    />
  );
}

function Textarea({ className = '', ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full px-3 py-2 text-[11px] border border-ink/10 rounded-sm bg-white resize-none",
        "focus:outline-none focus:border-rose/40 transition-colors placeholder:text-ink/20",
        className
      )}
      {...props}
    />
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-8 h-4 rounded-full transition-colors",
          checked ? "bg-rose" : "bg-ink/20"
        )}
      >
        <span className={cn(
          "absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform shadow-sm",
          checked ? "translate-x-4" : ""
        )} />
      </button>
      {label && <span className="text-[9px] text-ink/50 font-medium">{label}</span>}
    </div>
  );
}

function SaveButton({ onClick, loading }: { onClick?: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex items-center gap-1.5 px-4 py-2 bg-rose text-white text-[9px] uppercase tracking-widest font-semibold rounded-sm hover:bg-rose/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="inline-block w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
      ) : (
        <Save size={11} />
      )}
      {loading ? 'Saving…' : 'Save Changes'}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION: My Store
// ─────────────────────────────────────────────────────────────────────
function MyStoreSection() {
  const [storeName, setStoreName] = useState('NINOC STORE');
  const [tagline, setTagline] = useState('Premium Archival Garment Studio');
  const [description, setDescription] = useState('NINOC adalah brand garment archival studio yang menghadirkan koleksi apparel premium dengan desain industrial minimalist. Brand ini berdiri dengan filosofi “Archive Manifesto” yang menekankan pada estetika kolektor dan value investasi.');
  const [contactWA, setContactWA] = useState('081234567890');
  const [contactEmail, setContactEmail] = useState('hello@ninoc.id');
  const [address, setAddress] = useState('Jl. Gudang Selatan No. 22, Bandung, Jawa Barat 40113');
  const [logoUrl, setLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');

  return (
    <SettingsSection
      title="My Store"
      subtitle="Informasi dasar toko untuk identitas brand dan pencarian"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-4">
          <Field label="Nama Toko">
            <Input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Nama toko" />
          </Field>
          <Field label="Tagline">
            <Input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="Tagline brand" />
          </Field>
          <Field label="Deskripsi Toko" hint="Akan muncul di halaman About dan meta description">
            <Textarea rows={4} value={description} onChange={e => setDescription(e.target.value)} />
          </Field>
        </div>
        <div className="space-y-4">
          <Field label="Nomor WhatsApp">
            <Input value={contactWA} onChange={e => setContactWA(e.target.value)} placeholder="08xxxxxxxxxx" />
          </Field>
          <Field label="Email Kontak">
            <Input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="email@domain.com" type="email" />
          </Field>
          <Field label="Alamat Toko">
            <Textarea rows={3} value={address} onChange={e => setAddress(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Logo (Upload)">
              <div className="border border-ink/10 rounded-sm p-4 text-center bg-ink/[0.02]">
                <Upload size={20} className="text-ink/20 mx-auto mb-2" />
                <p className="text-[8px] text-ink/30">Klik untuk upload</p>
                <p className="text-[7px] text-ink/20 mt-1">PNG/JPG, max 2MB</p>
              </div>
            </Field>
            <Field label="Favicon">
              <div className="border border-ink/10 rounded-sm p-4 text-center bg-ink/[0.02]">
                <Globe size={20} className="text-ink/20 mx-auto mb-2" />
                <p className="text-[8px] text-ink/30">Klik untuk upload</p>
                <p className="text-[7px] text-ink/20 mt-1">ICO/PNG, 32x32px</p>
              </div>
            </Field>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-ink/5 flex justify-end">
        <SaveButton />
      </div>
    </SettingsSection>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION: Bank Account
// ─────────────────────────────────────────────────────────────────────
function BankAccountSection() {
  const [accounts, setAccounts] = useState([
    { id: '1', bank: 'BCA', account_name: 'PT NINOC INDONESIA', account_number: '1234567890', is_default: true, logo: '' },
    { id: '2', bank: 'Mandiri', account_name: 'PT NINOC INDONESIA', account_number: '1300098765432', is_default: false, logo: '' },
  ]);
  const [showAdd, setShowAdd] = useState(false);
  const [newBank, setNewBank] = useState('');
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');

  const toggleDefault = (id: string) => {
    setAccounts(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
  };

  const addAccount = () => {
    if (!newBank || !newName || !newNumber) return;
    setAccounts(prev => [...prev, {
      id: Date.now().toString(),
      bank: newBank,
      account_name: newName,
      account_number: newNumber,
      is_default: prev.length === 0,
      logo: '',
    }]);
    setNewBank(''); setNewName(''); setNewNumber('');
    setShowAdd(false);
  };

  return (
    <SettingsSection
      title="Bank Account"
      subtitle="Rekening untuk konfirmasi pembayaran manual dan settlement"
    >
      <div className="space-y-3">
        {accounts.map(acc => (
          <div key={acc.id} className={cn(
            "flex items-center gap-3 p-3.5 rounded-sm border transition-colors",
            acc.is_default ? "border-rose/30 bg-rose/5" : "border-ink/10 bg-white"
          )}>
            <div className="w-8 h-8 rounded-sm bg-ink/5 flex items-center justify-center shrink-0">
              <CreditCard size={14} className="text-ink/40" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-ink">{acc.bank}</span>
                {acc.is_default && (
                  <span className="text-[7px] uppercase tracking-widest bg-rose/10 text-rose px-1.5 py-0.5 rounded-sm font-bold">DEFAULT</span>
                )}
              </div>
              <p className="text-[10px] font-medium text-ink/70 mt-0.5">{acc.account_name}</p>
              <p className="text-[10px] font-mono text-ink/50 mt-0.5">{acc.account_number}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {!acc.is_default && (
                <button onClick={() => toggleDefault(acc.id)} className="text-[8px] uppercase tracking-widest text-ink/30 hover:text-rose transition-colors">
                  Set Default
                </button>
              )}
              <button className="text-[8px] uppercase tracking-widest text-ink/30 hover:text-red-500 transition-colors">Hapus</button>
            </div>
          </div>
        ))}

        {showAdd ? (
          <div className="border border-rose/30 rounded-sm p-4 bg-rose/5 space-y-3">
            <p className="text-[9px] font-bold text-rose uppercase tracking-widest">Tambah Rekening Baru</p>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Nama Bank">
                <Input value={newBank} onChange={e => setNewBank(e.target.value)} placeholder="BCA" />
              </Field>
              <Field label="Nama Pemilik">
                <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="PT NINOC" />
              </Field>
              <Field label="Nomor Rekening">
                <Input value={newNumber} onChange={e => setNewNumber(e.target.value)} placeholder="1234567890" />
              </Field>
            </div>
            <div className="flex gap-2">
              <button onClick={addAccount} className="px-4 py-1.5 bg-rose text-white text-[9px] uppercase tracking-widest font-semibold rounded-sm">Simpan</button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-1.5 border border-ink/10 text-ink/50 text-[9px] uppercase tracking-widest rounded-sm">Batal</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 border border-dashed border-ink/20 text-ink/40 text-[9px] uppercase tracking-widest rounded-sm hover:border-rose/40 hover:text-rose transition-colors w-full justify-center">
            <Plus size={12} /> Tambah Rekening
          </button>
        )}
      </div>
      <div className="mt-4 pt-4 border-t border-ink/5 flex justify-end">
        <SaveButton />
      </div>
    </SettingsSection>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION: Operational Schedule
// ─────────────────────────────────────────────────────────────────────
function ScheduleSection() {
  const [schedule, setSchedule] = useState([
    { day: 'Senin', open: '09:00', close: '18:00', active: true },
    { day: 'Selasa', open: '09:00', close: '18:00', active: true },
    { day: 'Rabu', open: '09:00', close: '18:00', active: true },
    { day: 'Kamis', open: '09:00', close: '18:00', active: true },
    { day: 'Jumat', open: '09:00', close: '18:00', active: true },
    { day: 'Sabtu', open: '10:00', close: '16:00', active: true },
    { day: 'Minggu', open: '00:00', close: '00:00', active: false },
  ]);
  const [autoReplyOff, setAutoReplyOff] = useState(false);
  const [offMessage, setOffMessage] = useState('Mohon maaf, saat ini kami sedang tidak beroperasi. Pesanan Anda akan kami proses besok pukul 09:00 WIB. Terima kasih atas pengertiannya.');

  const toggleDay = (idx: number) => {
    setSchedule(prev => prev.map((s, i) => i === idx ? { ...s, active: !s.active } : s));
  };

  return (
    <SettingsSection
      title="Operational Schedule"
      subtitle="Jam operasional toko untuk panduan customer service"
    >
      <div className="space-y-2 mb-5">
        <div className="grid grid-cols-4 gap-3 text-[8px] uppercase tracking-widest text-ink/40 font-medium mb-2 px-1">
          <span>Day</span>
          <span>Open</span>
          <span>Close</span>
          <span className="text-center">Status</span>
        </div>
        {schedule.map((s, idx) => (
          <div key={idx} className={cn(
            "grid grid-cols-4 gap-3 items-center px-3 py-2 rounded-sm transition-colors",
            s.active ? "bg-white border border-ink/10" : "bg-ink/[0.02] border border-dashed border-ink/5"
          )}>
            <span className="text-[10px] font-semibold text-ink">{s.day}</span>
            <Input
              type="time"
              value={s.open}
              disabled={!s.active}
              className="text-[10px]"
              onChange={e => setSchedule(prev => prev.map((s, i) => i === idx ? { ...s, open: e.target.value } : s))}
            />
            <Input
              type="time"
              value={s.close}
              disabled={!s.active}
              className="text-[10px]"
              onChange={e => setSchedule(prev => prev.map((s, i) => i === idx ? { ...s, close: e.target.value } : s))}
            />
            <div className="flex justify-center">
              <Toggle checked={s.active} onChange={() => toggleDay(idx)} label={s.active ? 'Open' : 'Closed'} />
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-ink/5 pt-4 space-y-3">
        <Field label="Pesan Auto-Reply Saat Libur" hint="Pesan otomatis saat customer chat di luar jam operasional">
          <Textarea rows={3} value={offMessage} onChange={e => setOffMessage(e.target.value)} />
        </Field>
        <div className="flex items-center gap-3">
          <Toggle checked={!autoReplyOff} onChange={v => setAutoReplyOff(!v)} />
          <span className="text-[9px] text-ink/50 font-medium">Aktifkan auto-reply saat off hours</span>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-ink/5 flex justify-end">
        <SaveButton />
      </div>
    </SettingsSection>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION: Store Decoration
// ─────────────────────────────────────────────────────────────────────
function DecorationSection() {
  const { settings, fetchSettings, updateSettings } = useSettings();
  const [storeName, setStoreName] = useState(settings.storeName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [accentColor, setAccentColor] = useState(settings.accentColor);
  const [heroBanner, setHeroBanner] = useState(settings.heroBannerUrl || '');
  const [saving, setSaving] = useState(false);

  // Sync local state when settings load from DB
  useState(() => {
    setStoreName(settings.storeName);
    setTagline(settings.tagline);
    setAccentColor(settings.accentColor);
    setHeroBanner(settings.heroBannerUrl || '');
  });

  // Fetch real products from DB
  const [products, setProducts] = useState<Array<{id: string; name: string; price: number; badge?: string}>>([]);
  const [categories, setCategories] = useState<Array<{id: string; label: string}>>([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, is_featured, category')
        .order('created_at', { ascending: false })
        .limit(4);
      if (data) {
        setProducts(data.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          badge: p.is_featured ? 'BEST SELLER' : undefined,
        })));
      }

      // Fetch categories
      const { data: catData } = await supabase
        .from('products')
        .select('category')
        .limit(20);
      if (catData) {
        const unique = [...new Map(catData.map(c => [c.category, c.category])).keys()] as string[];
        setCategories(unique.map(cat => ({ id: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) })).slice(0, 3));
      }
    }
    load();
  }, []);

  return (
    <SettingsSection title="Store Decoration" subtitle="Preview storefront decoration — live update saat ketik">
      <div className="space-y-5">

        {/* Browser Preview Frame */}
        <div className="rounded-sm overflow-hidden border border-ink/10">
          {/* Browser chrome */}
          <div className="bg-ink/5 px-3 py-1.5 flex items-center gap-1.5">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-red-400/40" />
              <div className="w-2 h-2 rounded-full bg-amber-400/40" />
              <div className="w-2 h-2 rounded-full bg-emerald-400/40" />
            </div>
            <div className="flex-1 bg-white border border-ink/10 rounded px-2 py-0.5 text-[7px] text-ink/30 font-mono truncate">
              ninoc.id
            </div>
          </div>

          {/* Website content */}
          <div className="bg-white">
            {/* Top nav */}
            <div className="border-b border-ink/5 px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-sm flex items-center justify-center text-white text-[8px] font-black" style={{ backgroundColor: '#141414' }}>N</div>
                <span className="text-[9px] font-black tracking-tight text-ink uppercase">{storeName || 'NINOC STORE'}</span>
              </div>
              <div className="flex items-center gap-3">
                {['Shop', 'About', 'Craft', 'Collections'].map(link => (
                  <span key={link} className="text-[7px] text-ink/40 font-medium uppercase tracking-wider">{link}</span>
                ))}
                <div className="w-4 h-4 rounded-full bg-ink/5" />
              </div>
            </div>

            {/* Hero Banner */}
            <div
              className="relative h-28 overflow-hidden"
              style={{
                background: heroBanner
                  ? `url(${heroBanner}) center/cover no-repeat`
                  : `linear-gradient(135deg, #141414 0%, #1a1a1a 60%, ${accentColor}22 100%`
              }}
            >
              <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-black/10 transition-colors group">
                <Upload size={16} className="text-white/40 group-hover:text-white/70 transition-colors" />
                <span className="text-[7px] text-white/40 group-hover:text-white/70 mt-1 transition-colors">Upload Hero Banner</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) setHeroBanner(URL.createObjectURL(f));
                }} />
              </label>
              {!heroBanner && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/60">{storeName || 'NINOC STORE'}</p>
                  <p className="text-[7px] text-white/30 mt-1">{tagline || 'Archival Garment Studio'}</p>
                  <button
                    className="mt-3 px-4 py-1 text-[7px] uppercase tracking-widest font-semibold rounded-sm text-white transition-colors"
                    style={{ backgroundColor: accentColor }}
                  >
                    Shop Now
                  </button>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: accentColor }} />
            </div>

            {/* Product Grid */}
            <div className="px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-ink">New Arrivals</p>
                <span className="text-[7px] text-ink/30 uppercase tracking-wider cursor-pointer hover:text-rose transition-colors">View All</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {products.length > 0 ? products.map((p) => (
                  <div key={p.id} className="border border-ink/5 rounded-sm overflow-hidden">
                    <div className="aspect-square bg-ink/[0.03] relative flex items-center justify-center">
                      <Package size={20} className="text-ink/10" />
                      {p.badge && (
                        <span
                          className="absolute top-1.5 left-1.5 text-[6px] uppercase tracking-widest font-black text-white px-1.5 py-0.5 rounded-sm"
                          style={{ backgroundColor: accentColor }}
                        >
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <div className="p-1.5">
                      <p className="text-[7px] font-semibold text-ink leading-tight truncate">{p.name}</p>
                      <p className="text-[7px] font-bold mt-0.5" style={{ color: accentColor }}>
                        IDR {p.price?.toLocaleString('id-ID', { minimumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>
                )) : (
                  [1,2,3,4].map(i => (
                    <div key={i} className="border border-ink/5 rounded-sm overflow-hidden">
                      <div className="aspect-square bg-ink/[0.03] relative flex items-center justify-center">
                        <Package size={20} className="text-ink/10" />
                      </div>
                      <div className="p-1.5">
                        <div className="h-2 w-3/4 bg-ink/[0.05] rounded-sm mb-1" />
                        <div className="h-2 w-1/2 bg-ink/[0.05] rounded-sm" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Collections Row */}
            <div className="px-4 pb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-ink">Collections</p>
                <span className="text-[7px] text-ink/30 uppercase tracking-wider cursor-pointer hover:text-rose transition-colors">View All</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {categories.length > 0 ? categories.map((col) => (
                  <div key={col.id} className="aspect-[4/3] rounded-sm border border-dashed border-ink/10 bg-ink/[0.02] flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-rose/30 transition-colors">
                    <Upload size={12} className="text-ink/20" />
                    <span className="text-[7px] text-ink/30 text-center px-1">{col.label}</span>
                  </div>
                )) : (
                  [1,2,3].map(i => (
                    <div key={i} className="aspect-[4/3] rounded-sm border border-dashed border-ink/10 bg-ink/[0.02] flex flex-col items-center justify-center gap-1">
                      <div className="w-3 h-3 bg-ink/[0.05] rounded-sm" />
                      <div className="w-8 h-2 bg-ink/[0.05] rounded-sm" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Editable Controls */}
        <div className="grid grid-cols-3 gap-4">
          <Field label="Nama Toko (preview)">
            <Input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="NINOC STORE" className="text-[10px]" />
          </Field>
          <Field label="Tagline">
            <Input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="Archival Garment Studio" className="text-[10px]" />
          </Field>
          <Field label="Accent Color (brand)">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={e => setAccentColor(e.target.value)}
                className="w-8 h-8 rounded-sm border border-ink/10 cursor-pointer shrink-0"
              />
              <Input value={accentColor} onChange={e => setAccentColor(e.target.value)} className="flex-1 font-mono text-[10px]" />
            </div>
          </Field>
        </div>

      </div>
      <div className="mt-4 pt-4 border-t border-ink/5 flex justify-end">
        <SaveButton
          loading={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await updateSettings({ storeName, tagline, accentColor, heroBannerUrl: heroBanner });
              await fetchSettings();
            } finally {
              setSaving(false);
            }
          }}
        />
      </div>
    </SettingsSection>
  );
}

// SECTION: Delivery
// SECTION: Delivery Setting
// ─────────────────────────────────────────────────────────────────────
function DeliverySection() {
  const [couriers, setCouriers] = useState([
    { id: 'jne', name: 'JNE Express', active: true, cod: true, insurable: true },
    { id: 'jnt', name: 'J&T Express', active: true, cod: true, insurable: false },
    { id: 'sicepat', name: 'SiCepat', active: true, cod: true, insurable: true },
    { id: 'anteraja', name: 'AnterAja', active: true, cod: false, insurable: false },
    { id: 'pos', name: 'POS Indonesia', active: false, cod: false, insurable: true },
  ]);
  const [defaultCourier, setDefaultCourier] = useState('jne');
  const [autoAssign, setAutoAssign] = useState(false);
  const [sameDayActive, setSameDayActive] = useState(false);
  const [instantActive, setInstantActive] = useState(false);

  const toggleCourier = (id: string) => {
    setCouriers(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  return (
    <SettingsSection
      title="Delivery Setting"
      subtitle="Konfigurasi kurir aktif dan metode pengiriman"
    >
      <div className="space-y-5">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-ink/50 font-medium mb-3">Aktifkan Kurir</p>
          <div className="space-y-2">
            {couriers.map(c => (
              <div key={c.id} className="flex items-center gap-3 py-2 border-b border-ink/5 last:border-0">
                <Toggle checked={c.active} onChange={() => toggleCourier(c.id)} />
                <div className="flex-1">
                  <span className="text-[10px] font-semibold text-ink">{c.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-[7px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm", c.cod ? "bg-emerald-50 text-emerald-600 font-bold" : "bg-ink/5 text-ink/30")}>COD</span>
                  <span className={cn("text-[7px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm", c.insurable ? "bg-blue-50 text-blue-600 font-bold" : "bg-ink/5 text-ink/30")}>Asuransi</span>
                </div>
                <button
                  onClick={() => setDefaultCourier(c.id)}
                  className={cn(
                    "text-[8px] uppercase tracking-widest px-2 py-1 rounded-sm border transition-colors",
                    defaultCourier === c.id ? "border-rose text-rose font-bold" : "border-ink/10 text-ink/30 hover:border-ink/30"
                  )}
                >
                  Default
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-ink/10 rounded-sm p-3.5 space-y-2">
            <p className="text-[9px] uppercase tracking-widest text-ink/50 font-medium">Same Day Delivery</p>
            <div className="flex items-center justify-between">
              <span className="text-[8px] text-ink/30">{sameDayActive ? 'Aktif' : 'Nonaktif'}</span>
              <Toggle checked={sameDayActive} onChange={setSameDayActive} />
            </div>
            {sameDayActive && (
              <Input type="number" placeholder="Add fee (IDR)" className="text-[10px]" />
            )}
          </div>
          <div className="border border-ink/10 rounded-sm p-3.5 space-y-2">
            <p className="text-[9px] uppercase tracking-widest text-ink/50 font-medium">Instant Delivery</p>
            <div className="flex items-center justify-between">
              <span className="text-[8px] text-ink/30">{instantActive ? 'Aktif' : 'Nonaktif'}</span>
              <Toggle checked={instantActive} onChange={setInstantActive} />
            </div>
            {instantActive && (
              <Input type="number" placeholder="Add fee (IDR)" className="text-[10px]" />
            )}
          </div>
          <div className="border border-ink/10 rounded-sm p-3.5 space-y-2">
            <p className="text-[9px] uppercase tracking-widest text-ink/50 font-medium">Auto-Assigned Waybill</p>
            <div className="flex items-center justify-between">
              <span className="text-[8px] text-ink/30">Otomatis buat resi</span>
              <Toggle checked={autoAssign} onChange={setAutoAssign} />
            </div>
            <p className="text-[7px] text-ink/25">Otomatis buat waybill saat print label</p>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-ink/5 flex justify-end">
        <SaveButton />
      </div>
    </SettingsSection>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION: Help Center
// ─────────────────────────────────────────────────────────────────────
function HelpCenterSection() {
  const [faqs, setFaqs] = useState([
    { id: '1', q: 'Bagaimana cara melacak pesanan?', a: 'Anda dapat melacak pesanan melalui halaman "Cek Resi" atau otomatis menerima update via WhatsApp saat paket bergerak.', active: true },
    { id: '2', q: 'Apakah bisa return/refund?', a: 'Produk dapat diretur dalam 3x24 jam sejak diterima dengan kondisi belum dicuci dan tag masih terpasang. Hubungi admin via chat.', active: true },
  ]);
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');

  return (
    <SettingsSection
      title="Help Center"
      subtitle="FAQ untuk halaman bantuan customer"
    >
      <div className="space-y-3 mb-4">
        {faqs.map(faq => (
          <div key={faq.id} className="border border-ink/10 rounded-sm p-4 bg-white">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2">
                <span className="text-[7px] uppercase tracking-widest bg-ink/5 text-ink/40 px-1.5 py-0.5 rounded-sm font-bold mt-0.5 shrink-0">Q</span>
                <p className="text-[10px] font-semibold text-ink">{faq.q}</p>
              </div>
              <button className="text-[8px] uppercase tracking-widest text-ink/30 hover:text-red-500 shrink-0">Hapus</button>
            </div>
            <div className="ml-5 mt-2">
              <span className="text-[7px] uppercase tracking-widest bg-rose/10 text-rose px-1.5 py-0.5 rounded-sm font-bold">A</span>
              <p className="text-[9px] text-ink/60 mt-1.5 leading-relaxed">{faq.a}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="border border-dashed border-ink/20 rounded-sm p-4 bg-ink/[0.015] space-y-2">
        <p className="text-[9px] uppercase tracking-widest text-ink/40 font-medium">Tambah FAQ</p>
        <Input value={newQ} onChange={e => setNewQ(e.target.value)} placeholder="Pertanyaan" />
        <Textarea value={newA} onChange={e => setNewA(e.target.value)} rows={2} placeholder="Jawaban" />
        <button className="px-4 py-1.5 bg-ink/10 text-ink/50 text-[9px] uppercase tracking-widest rounded-sm hover:bg-ink/20 transition-colors">+ Tambah FAQ</button>
      </div>
      <div className="mt-4 pt-4 border-t border-ink/5 flex justify-end">
        <SaveButton />
      </div>
    </SettingsSection>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION: Reply Template
// ─────────────────────────────────────────────────────────────────────
function ReplyTemplateSection() {
  const [templates, setTemplates] = useState([
    { id: '1', name: 'Konfirmasi Pesanan', content: 'Halo kak, terima kasih atas pesanannya! Pesanan #ORDER_ID sudah kami terima dan akan kami proses maksimal 1x24 jam. Akan kami kabari lagi setelah paket dikirim. 🙏', shortcut: '/konfirmasi', active: true },
    { id: '2', name: 'Pemberitahuan Kirim', content: 'Hai kak, kabar baik! Pesanan #ORDER_ID sudah kami kirim via #KURIR dengan no. resi #RESI. Perkiraan tiba 2-3 hari kerja ya. Jangan lupa cek secara berkala. 📦', shortcut: '/kirim', active: true },
    { id: '3', name: 'Reminder Payment', content: 'Halo kak, reminder nih! Pesanan #ORDER_ID belum dibayar. Mohon selesaikan pembayaran sebelum besok jam 12.00 WIB ya, agar bisa segera diproses. Terima kasih! 💳', shortcut: '/remind', active: true },
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  return (
    <SettingsSection
      title="Reply Template"
      subtitle="Template pesan cepat untuk chat customer service"
    >
      <div className="space-y-2 mb-4">
        {templates.map(t => (
          <div key={t.id} className={cn(
            "border rounded-sm overflow-hidden transition-colors",
            t.active ? "border-ink/10 bg-white" : "border-dashed border-ink/5 bg-ink/[0.015] opacity-60"
          )}>
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-ink/[0.02] border-b border-ink/5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-ink">{t.name}</span>
                <span className="text-[7px] font-mono bg-ink/5 text-ink/40 px-1.5 py-0.5 rounded-sm">{t.shortcut}</span>
              </div>
              <div className="flex items-center gap-3">
                <Toggle checked={t.active} onChange={() => {}} />
                <button className="text-[8px] uppercase tracking-widest text-ink/30 hover:text-rose">Edit</button>
                <button className="text-[8px] uppercase tracking-widest text-ink/30 hover:text-red-500">Hapus</button>
              </div>
            </div>
            <div className="px-3.5 py-2.5">
              <p className="text-[9px] text-ink/60 leading-relaxed">{t.content}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="flex items-center gap-2 px-4 py-2 border border-dashed border-ink/20 text-ink/40 text-[9px] uppercase tracking-widest rounded-sm hover:border-rose/40 hover:text-rose transition-colors">
        <Plus size={12} /> Tambah Template
      </button>
      <div className="mt-4 pt-4 border-t border-ink/5 flex justify-end">
        <SaveButton />
      </div>
    </SettingsSection>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION: Change Password
// ─────────────────────────────────────────────────────────────────────
function ChangePasswordSection() {
  const [current, setCurrent] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const strength = newPw.length >= 12 ? 'strong' : newPw.length >= 8 ? 'medium' : newPw.length > 0 ? 'weak' : 'none';

  return (
    <SettingsSection
      title="Change Password"
      subtitle="Ganti password admin dashboard"
    >
      <div className="max-w-sm space-y-4">
        <Field label="Password Saat Ini">
          <div className="relative">
            <Input type={showCurrent ? 'text' : 'password'} value={current} onChange={e => setCurrent(e.target.value)} placeholder="Masukkan password saat ini" className="pr-8" />
            <button onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30">
              {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        </Field>
        <Field label="Password Baru" hint="Minimal 12 karakter, kombinasi huruf besar, kecil, angka, dan simbol">
          <div className="relative">
            <Input type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Minimal 12 karakter" className="pr-8" />
            <button onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30">
              {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          {newPw && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="flex gap-0.5 flex-1">
                {['weak', 'medium', 'strong'].map((level, i) => (
                  <div key={level} className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    strength === 'none' ? 'bg-ink/10' :
                    (strength === 'weak' && i === 0) || (strength === 'medium' && i <= 1) || (strength === 'strong' && i <= 2)
                      ? (strength === 'strong' ? 'bg-emerald-500' : strength === 'medium' ? 'bg-amber-500' : 'bg-red-500')
                      : 'bg-ink/10'
                  )} />
                ))}
              </div>
              <span className={cn(
                "text-[7px] font-bold uppercase tracking-widest",
                strength === 'strong' ? 'text-emerald-600' : strength === 'medium' ? 'text-amber-600' : strength === 'weak' ? 'text-red-500' : 'text-ink/20'
              )}>
                {strength === 'strong' ? 'Kuat' : strength === 'medium' ? 'Sedang' : strength === 'weak' ? 'Lemah' : ''}
              </span>
            </div>
          )}
        </Field>
        <Field label="Konfirmasi Password Baru">
          <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Ulangi password baru" />
          {confirm && confirm !== newPw && (
            <p className="text-[7px] text-red-500 mt-1">Password tidak cocok</p>
          )}
        </Field>
        <button className="w-full py-2.5 bg-rose text-white text-[10px] uppercase tracking-widest font-bold rounded-sm hover:bg-rose/90 transition-colors">
          Update Password
        </button>
      </div>
    </SettingsSection>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION: SEO Optimization
// ─────────────────────────────────────────────────────────────────────
function SEOSection() {
  const [metaTitle, setMetaTitle] = useState('NINOC STORE — Premium Archival Garment Studio');
  const [metaDesc, setMetaDesc] = useState('NINOC adalah brand garment archival studio Indonesia yang menghadirkan koleksi apparel premium dengan desain industrial minimalist. Shop now!');
  const [ogImage, setOgImage] = useState('');
  const [canonical, setCanonical] = useState('https://ninoc.id');
  const [sitemapActive, setSitemapActive] = useState(true);
  const [robotsTxt, setRobotsTxt] = useState(true);
  const [schema, setSchema] = useState(true);
  const [keywords, setKeywords] = useState('ninoc, garment archival, apparel premium, industrial minimalist, fashion bandung, distro bandung');

  return (
    <SettingsSection
      title="SEO Optimization"
      subtitle="Konfigurasi search engine optimization untuk visibility Google"
    >
      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Meta Title" hint="Maksimal 60 karakter. Akan tampil di Google search result.">
            <Input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder="Judul toko" />
            <div className="flex justify-end mt-1">
              <span className={cn(
                "text-[7px] font-mono",
                metaTitle.length > 60 ? "text-red-500" : "text-ink/30"
              )}>{metaTitle.length}/60</span>
            </div>
          </Field>
          <Field label="Meta Description" hint="Maksimal 155 karakter.">
            <Textarea rows={3} value={metaDesc} onChange={e => setMetaDesc(e.target.value)} placeholder="Deskripsi singkat toko" />
            <div className="flex justify-end mt-1">
              <span className={cn(
                "text-[7px] font-mono",
                metaDesc.length > 155 ? "text-red-500" : "text-ink/30"
              )}>{metaDesc.length}/155</span>
            </div>
          </Field>
        </div>
        <Field label="Keywords" hint="Pisahkan dengan koma">
          <Input value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="keyword1, keyword2, keyword3" />
        </Field>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-ink/50 font-medium mb-3">OG Image (Social Share)</p>
          <div className="border border-dashed border-ink/20 rounded-sm p-6 text-center bg-ink/[0.015] hover:border-rose/30 transition-colors cursor-pointer">
            <Upload size={20} className="text-ink/20 mx-auto mb-2" />
            <p className="text-[9px] text-ink/50">Upload OG Image</p>
            <p className="text-[7px] text-ink/25 mt-1">JPG/PNG, 1200x630px, max 2MB</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Canonical URL">
            <Input value={canonical} onChange={e => setCanonical(e.target.value)} placeholder="https://domain.com" />
          </Field>
          <div className="space-y-3">
            <p className="text-[9px] uppercase tracking-widest text-ink/50 font-medium">SEO Tools</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2 border-b border-ink/5">
                <div className="flex items-center gap-2">
                  <Globe size={12} className="text-ink/40" />
                  <span className="text-[9px] text-ink/70">Auto-generate sitemap.xml</span>
                </div>
                <Toggle checked={sitemapActive} onChange={setSitemapActive} />
              </div>
              <div className="flex items-center justify-between py-2 border-b border-ink/5">
                <div className="flex items-center gap-2">
                  <FileText size={12} className="text-ink/40" />
                  <span className="text-[9px] text-ink/70">Enable robots.txt</span>
                </div>
                <Toggle checked={robotsTxt} onChange={setRobotsTxt} />
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Database size={12} className="text-ink/40" />
                  <span className="text-[9px] text-ink/70">Structured Data (Schema.org)</span>
                </div>
                <Toggle checked={schema} onChange={setSchema} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-ink/5 flex justify-end">
        <SaveButton />
      </div>
    </SettingsSection>
  );
}

// ─────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────
export function SettingsTab() {
  const [activeSection, setActiveSection] = useState('my-store');

  const renderSection = () => {
    switch (activeSection) {
      case 'my-store': return <MyStoreSection />;
      case 'bank-account': return <BankAccountSection />;
      case 'schedule': return <ScheduleSection />;
      case 'decoration': return <DecorationSection />;
      case 'delivery': return <DeliverySection />;
      case 'help-center': return <HelpCenterSection />;
      case 'reply-template': return <ReplyTemplateSection />;
      case 'change-password': return <ChangePasswordSection />;
      case 'seo': return <SEOSection />;
      default: return <MyStoreSection />;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header */}
      <div className="shrink-0">
        <h2 className="text-xl font-medium text-ink tracking-tight">Settings</h2>
        <p className="text-[10px] uppercase tracking-wider text-ink/40 mt-1">Konfigurasi dan manajemen toko</p>
      </div>

      {/* Sub-nav + Content layout */}
      <div className="flex flex-col lg:flex-row gap-4 flex-1 min-h-0">
        {/* Sub-nav sidebar */}
        <div className="lg:w-52 shrink-0 bg-white rounded-sm border border-ink/10 overflow-hidden">
          <div className="px-3 py-2.5 border-b border-ink/5 bg-ink/[0.02]">
            <p className="text-[8px] uppercase tracking-widest text-ink/40 font-medium">Configuration</p>
          </div>
          <nav className="divide-y divide-ink/5">
            {SETTINGS_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors",
                    isActive
                      ? "bg-rose/5 text-rose"
                      : "text-ink/50 hover:bg-ink/[0.02] hover:text-ink/70"
                  )}
                >
                  <Icon size={12} className={isActive ? 'text-rose' : ''} />
                  <span className="text-[9px] font-medium tracking-wide leading-none">{item.label}</span>
                  {isActive && <ChevronRight size={10} className="ml-auto" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0 overflow-y-auto minimal-scroll space-y-3">
          {renderSection()}
        </div>
      </div>
    </div>
  );
}