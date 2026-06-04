"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettings } from '@/store/useSettings';
import { supabase } from '@/lib/supabase';
import {
  Store, CreditCard, Clock, Palette, Truck, HelpCircle,
  MessageSquare, Lock, Search, Plus, X, Save, Upload,
  ChevronRight, Eye, EyeOff, Globe, Bell,
  FileText, Shield, Database, Star, MapPin, Phone, Mail, Link, Package
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
  { id: 'help-guide', label: 'Help Guide', icon: HelpCircle },
  { id: 'help-center', label: 'FAQ', icon: HelpCircle },
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
  const [storeName, setStoreName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [contactWA, setContactWA] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [address, setAddress] = useState('');
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
                  <span className="text-[7px] uppercase tracking-widest bg-rose/10 text-rose px-1.5 py-0.5 rounded-sm font-medium">DEFAULT</span>
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
            <p className="text-[9px] font-medium text-rose uppercase tracking-widest">Tambah Rekening Baru</p>
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
    { day: 'Senin', open: '', close: '', active: false },
    { day: 'Selasa', open: '', close: '', active: false },
    { day: 'Rabu', open: '', close: '', active: false },
    { day: 'Kamis', open: '', close: '', active: false },
    { day: 'Jumat', open: '', close: '', active: false },
    { day: 'Sabtu', open: '', close: '', active: false },
    { day: 'Minggu', open: '', close: '', active: false },
  ]);
  const [autoReplyOff, setAutoReplyOff] = useState(false);
  const [offMessage, setOffMessage] = useState('');

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
                <div className="w-5 h-5 rounded-sm flex items-center justify-center text-white text-[8px] font-medium" style={{ backgroundColor: '#141414' }}>N</div>
                <span className="text-[9px] font-medium tracking-tight text-ink uppercase">{storeName || 'NINOC STORE'}</span>
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
                  <p className="text-[9px] font-medium uppercase tracking-[0.3em] text-white/60">{storeName || 'NINOC STORE'}</p>
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
                <p className="text-[9px] font-medium uppercase tracking-widest text-ink">New Arrivals</p>
                <span className="text-[7px] text-ink/30 uppercase tracking-wider cursor-pointer hover:text-rose transition-colors">View All</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {products.length > 0 ? products.map((p) => (
                  <div key={p.id} className="border border-ink/5 rounded-sm overflow-hidden">
                    <div className="aspect-square bg-ink/[0.03] relative flex items-center justify-center">
                      <Package size={20} className="text-ink/10" />
                      {p.badge && (
                        <span
                          className="absolute top-1.5 left-1.5 text-[6px] uppercase tracking-widest font-medium text-white px-1.5 py-0.5 rounded-sm"
                          style={{ backgroundColor: accentColor }}
                        >
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <div className="p-1.5">
                      <p className="text-[7px] font-semibold text-ink leading-tight truncate">{p.name}</p>
                      <p className="text-[7px] font-medium mt-0.5" style={{ color: accentColor }}>
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
                <p className="text-[9px] font-medium uppercase tracking-widest text-ink">Collections</p>
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
    { id: 'jne', name: 'JNE Express', active: false, cod: false, insurable: false },
    { id: 'jnt', name: 'J&T Express', active: false, cod: false, insurable: false },
    { id: 'sicepat', name: 'SiCepat', active: false, cod: false, insurable: false },
    { id: 'anteraja', name: 'AnterAja', active: false, cod: false, insurable: false },
    { id: 'pos', name: 'POS Indonesia', active: false, cod: false, insurable: false },
  ]);
  const [defaultCourier, setDefaultCourier] = useState('');
  const [autoAssign, setAutoAssign] = useState(false);
  const [sameDayActive, setSameDayActive] = useState(false);
  const [instantActive, setInstantActive] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('atelier_settings')
          .select('value')
          .eq('key', 'delivery_settings')
          .single();
          
        if (data?.value) {
          if (data.value.couriers) setCouriers(data.value.couriers);
          if (data.value.defaultCourier) setDefaultCourier(data.value.defaultCourier);
          if (data.value.autoAssign !== undefined) setAutoAssign(data.value.autoAssign);
          if (data.value.sameDayActive !== undefined) setSameDayActive(data.value.sameDayActive);
          if (data.value.instantActive !== undefined) setInstantActive(data.value.instantActive);
        }
      } catch (err) {
        console.error('Error loading delivery settings:', err);
      }
    }
    load();
  }, []);

  const toggleCourier = (id: string) => {
    setCouriers(prev => prev.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        key: 'delivery_settings',
        value: { couriers, defaultCourier, autoAssign, sameDayActive, instantActive }
      };
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Save failed');
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
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
                  <span className={cn("text-[7px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm", c.cod ? "bg-emerald-50 text-emerald-600 font-medium" : "bg-ink/5 text-ink/30")}>COD</span>
                  <span className={cn("text-[7px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm", c.insurable ? "bg-blue-50 text-blue-600 font-medium" : "bg-ink/5 text-ink/30")}>Asuransi</span>
                </div>
                <button
                  onClick={() => setDefaultCourier(c.id)}
                  className={cn(
                    "text-[8px] uppercase tracking-widest px-2 py-1 rounded-sm border transition-colors",
                    defaultCourier === c.id ? "border-rose text-rose font-medium" : "border-ink/10 text-ink/30 hover:border-ink/30"
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
        <SaveButton loading={saving} onClick={handleSave} />
      </div>
    </SettingsSection>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION: Biteship Activation
// ─────────────────────────────────────────────────────────────────────
function BiteshipActivationSection() {
  const [apiKeyName, setApiKeyName] = useState('');
  const [activatedCouriers, setActivatedCouriers] = useState<string[]>([]);
  const [testDelivered, setTestDelivered] = useState('');
  const [testCancelled, setTestCancelled] = useState('');
  const [supportsPriceChange, setSupportsPriceChange] = useState(false);
  const [supportsResiChange, setSupportsResiChange] = useState(false);
  const [hasInsurance, setHasInsurance] = useState(false);
  const [hasCod, setHasCod] = useState(false);
  const [usesOwnResi, setUsesOwnResi] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerType, setPickerType] = useState<'delivered' | 'cancelled'>('delivered');
  const [pickerOrders, setPickerOrders] = useState<any[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const ALL_COURIERS = [
    { id: 'jne', label: 'JNE Express' },
    { id: 'jnt', label: 'J&T Express' },
    { id: 'sicepat', label: 'SiCepat' },
    { id: 'tiki', label: 'TIKI' },
    { id: 'pos', label: 'POS Indonesia' },
    { id: 'anteraja', label: 'AnterAja' },
    { id: 'ninja', label: 'Ninja Van' },
  ];

  const toggleCourier = (id: string) => {
    setActivatedCouriers(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const openPicker = async (type: 'delivered' | 'cancelled') => {
    setPickerType(type);
    setPickerOpen(true);
    setPickerLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?status=${type}&limit=50`);
      const data = await res.json();
      setPickerOrders(data.orders || []);
    } catch (e) {
      console.error('Failed to load orders:', e);
      setPickerOrders([]);
    } finally {
      setPickerLoading(false);
    }
  };

  const selectOrder = (orderId: string) => {
    if (pickerType === 'delivered') {
      setTestDelivered(orderId);
    } else {
      setTestCancelled(orderId);
    }
    setPickerOpen(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const payload = {
        key: 'biteship_activation',
        value: {
          api_key_name: apiKeyName,
          activated_couriers: activatedCouriers,
          test_order_delivered: testDelivered,
          test_order_cancelled: testCancelled,
          supports_price_change: supportsPriceChange,
          supports_resi_change: supportsResiChange,
          has_insurance: hasInsurance,
          has_cod: hasCod,
          uses_own_resi: usesOwnResi,
        },
      };
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('[BiteshipActivation] save error:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsSection
      title="Formulir Aktivasi Order API"
      subtitle="Konfigurasi API Biteship untuk pemrosesan pesanan dan pelacakan real-time"
    >
      {/* 1. Pilih Kunci API */}
      <div className="mb-6">
        <p className="text-[9px] uppercase tracking-widest text-ink/50 font-semibold mb-3">
          1 — Pilih Kunci API
        </p>
        <div className="border border-ink/10 rounded-sm p-4 bg-ink/[0.015]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <input
                type="radio"
                id="api-webhook-ninoc"
                checked={apiKeyName === 'API_webhook_ninoc'}
                onChange={() => setApiKeyName('API_webhook_ninoc')}
                className="accent-rose"
              />
              <label htmlFor="api-webhook-ninoc" className="text-[10px] font-semibold text-ink cursor-pointer">
                API_webhook_ninoc
              </label>
            </div>
            <span className="text-[7px] uppercase tracking-widest bg-emerald-50 text-emerald-600 font-medium px-2 py-1 rounded-sm">Production</span>
          </div>
          <p className="text-[8px] text-ink/30 mt-2 ml-5">
            Biteship Production Key — digunakan untuk membuat waybill dan tracking real-time
          </p>
        </div>
      </div>

      {/* 2. Pilih Kurir yang Diaktifkan */}
      <div className="mb-6">
        <p className="text-[9px] uppercase tracking-widest text-ink/50 font-semibold mb-3">
          2 — Pilih Kurir yang Akan Diaktifkan
        </p>
        <div className="border border-ink/10 rounded-sm p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {ALL_COURIERS.map(c => {
              const isActive = activatedCouriers.includes(c.id);
              return (
                <div
                  key={c.id}
                  onClick={() => toggleCourier(c.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 border rounded-sm cursor-pointer transition-all",
                    isActive
                      ? "border-rose bg-rose/[0.04]"
                      : "border-ink/10 hover:border-ink/30"
                  )}
                >
                  <div className={cn(
                    "w-3 h-3 rounded-sm border flex items-center justify-center transition-colors",
                    isActive ? "bg-rose border-rose" : "border-ink/30 bg-white"
                  )}>
                    {isActive && (
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <span className={cn(
                    "text-[9px] font-semibold",
                    isActive ? "text-rose" : "text-ink/50"
                  )}>
                    {c.label}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="text-[8px] text-ink/30 mt-3">
            {activatedCouriers.length} kurir dipilih
          </p>
        </div>
      </div>

      {/* 3. Test Order IDs */}
      <div className="mb-6">
        <p className="text-[9px] uppercase tracking-widest text-ink/50 font-semibold mb-3">
          3 — ID Pesanan Test
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-ink/10 rounded-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[8px] uppercase tracking-widest text-ink/40 font-medium">
                Test Delivered (status &quot;delivered&quot;)
              </label>
              <span className="text-[7px] text-emerald-600 font-medium">Delivered</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={testDelivered}
                onChange={e => setTestDelivered(e.target.value)}
                placeholder="ID pesanan delivered"
                className="flex-1 px-3 py-2 text-[10px] border border-ink/10 rounded-sm bg-white focus:outline-none focus:border-rose/40 transition-colors placeholder:text-ink/20"
              />
              <button
                onClick={() => openPicker('delivered')}
                className="px-3 py-2 text-[9px] uppercase tracking-widest bg-ink/5 text-ink/60 border border-ink/10 rounded-sm hover:bg-ink/10 hover:text-ink transition-colors whitespace-nowrap"
              >
                Browse
              </button>
            </div>
            {testDelivered && (
              <p className="text-[7px] text-rose/70">Selected: {testDelivered}</p>
            )}
            <p className="text-[7px] text-ink/25 leading-relaxed">
              <span className="font-semibold">Pelajari simulasi test order:</span>{' '}
              Gunakan order dengan status akhir &quot;delivered&quot; untuk menguji verifikasi tracking sukses.
            </p>
          </div>
          <div className="border border-ink/10 rounded-sm p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[8px] uppercase tracking-widest text-ink/40 font-medium">
                Test Cancelled (status &quot;cancelled&quot;)
              </label>
              <span className="text-[7px] text-red-500 font-medium">Cancelled</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={testCancelled}
                onChange={e => setTestCancelled(e.target.value)}
                placeholder="ID pesanan cancelled"
                className="flex-1 px-3 py-2 text-[10px] border border-ink/10 rounded-sm bg-white focus:outline-none focus:border-rose/40 transition-colors placeholder:text-ink/20"
              />
              <button
                onClick={() => openPicker('cancelled')}
                className="px-3 py-2 text-[9px] uppercase tracking-widest bg-ink/5 text-ink/60 border border-ink/10 rounded-sm hover:bg-ink/10 hover:text-ink transition-colors whitespace-nowrap"
              >
                Browse
              </button>
            </div>
            {testCancelled && (
              <p className="text-[7px] text-rose/70">Selected: {testCancelled}</p>
            )}
            <p className="text-[7px] text-ink/25 leading-relaxed">
              <span className="font-semibold">Pelajari simulasi test order:</span>{' '}
              Gunakan order dengan status &quot;cancelled&quot; atau &quot;rejected&quot; untuk menguji skenario kegagalan.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Periksa */}
      <div className="mb-6">
        <p className="text-[9px] uppercase tracking-widest text-ink/50 font-semibold mb-3">
          4 — Periksa Jika Diperlukan
        </p>
        <div className="border border-ink/10 rounded-sm divide-y divide-ink/5">
          {[
            { checked: supportsPriceChange, onChange: setSupportsPriceChange, label: 'Aplikasi dapat menangani perubahan harga pengiriman' },
            { checked: supportsResiChange, onChange: setSupportsResiChange, label: 'Aplikasi dapat menangani perubahan resi pengiriman' },
            { checked: hasInsurance, onChange: setHasInsurance, label: 'Memiliki pesanan yang mencakup asuransi' },
            { checked: hasCod, onChange: setHasCod, label: 'Memiliki pesanan dengan Cash on Delivery (COD)' },
            { checked: usesOwnResi, onChange: setUsesOwnResi, label: 'Menggunakan resi pengiriman sendiri' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => item.onChange(!item.checked)}>
              <div className={cn(
                "w-3.5 h-3.5 rounded-sm border flex items-center justify-center transition-colors shrink-0",
                item.checked ? "bg-rose border-rose" : "border-ink/30 bg-white"
              )}>
                {item.checked && (
                  <svg width="9" height="9" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>
              <span className={cn(
                "text-[9px] leading-relaxed",
                item.checked ? "text-ink font-semibold" : "text-ink/50"
              )}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[8px] text-ink/30 mt-2">Centang semua yang berlaku</p>
      </div>

      {/* Order Picker Modal */}
      <AnimatePresence>
        {pickerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40"
            onClick={() => setPickerOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white w-[480px] max-h-[480px] border border-ink/10 rounded-sm shadow-lg overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-ink/5 bg-ink/[0.02]">
                <div>
                  <h3 className="text-[11px] font-semibold uppercase tracking-widest text-ink">
                    Pilih Order — {pickerType === 'delivered' ? 'Status Delivered' : 'Status Cancelled'}
                  </h3>
                  <p className="text-[8px] text-ink/40 mt-0.5">Klik order untuk dipilih sebagai test ID</p>
                </div>
                <button
                  onClick={() => setPickerOpen(false)}
                  className="text-ink/30 hover:text-ink transition-colors p-1"
                >
                  <X size={14} />
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {pickerLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <span className="inline-block w-5 h-5 border-2 border-ink/20 border-t-rose rounded-full animate-spin" />
                  </div>
                ) : pickerOrders.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package size={24} className="text-ink/20 mb-3" />
                    <p className="text-[10px] font-semibold text-ink/40">Belum ada order dengan status &quot;{pickerType}&quot;</p>
                    <p className="text-[8px] text-ink/25 mt-1">Order akan muncul setelah ada pesanan dengan status ini</p>
                  </div>
                ) : (
                  <div className="divide-y divide-ink/5">
                    {pickerOrders.map(order => (
                      <div
                        key={order.id}
                        onClick={() => selectOrder(order.id)}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-rose/[0.03] transition-colors"
                      >
                        <div className={cn(
                          "w-3 h-3 rounded-sm border flex items-center justify-center shrink-0",
                          (pickerType === 'delivered' ? testDelivered : testCancelled) === order.id
                            ? "bg-rose border-rose"
                            : "border-ink/20 bg-white"
                        )}>
                          {(pickerType === 'delivered' ? testDelivered : testCancelled) === order.id && (
                            <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                              <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-medium text-ink font-mono">{order.id.slice(0, 18)}…</span>
                            <span className={cn(
                              "text-[7px] uppercase tracking-widest px-1.5 py-0.5 rounded-sm font-medium",
                              pickerType === 'delivered'
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-red-50 text-red-500"
                            )}>
                              {pickerType}
                            </span>
                          </div>
                          {order.tracking_id && (
                            <p className="text-[7px] text-ink/30 mt-0.5">Resi: {order.tracking_id}</p>
                          )}
                          <p className="text-[7px] text-ink/30 mt-0.5">
                            {order.customer_name || 'Unknown'} · {order.courier || '—'}
                          </p>
                        </div>
                        <span className="text-[8px] text-ink/30 shrink-0">
                          {order.created_at ? new Date(order.created_at).toLocaleDateString('id-ID') : '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-ink/5 flex justify-end">
                <button
                  onClick={() => setPickerOpen(false)}
                  className="px-4 py-2 text-[9px] uppercase tracking-widest bg-ink/5 text-ink/50 border border-ink/10 rounded-sm hover:bg-ink/10 hover:text-ink transition-colors"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-4 pt-4 border-t border-ink/5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          {saved && (
            <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4" fill="#2E7D32"/>
                <path d="M2.5 5L4.5 7L7.5 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Tersimpan
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[8px] text-ink/30">
            {activatedCouriers.length} kurir aktif · {apiKeyName}
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose text-white text-[9px] uppercase tracking-widest font-semibold rounded-sm hover:bg-rose/90 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <span className="inline-block w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={11} />
            )}
            {saving ? 'Saving…' : 'Simpan Aktivasi'}
          </button>
        </div>
      </div>
    </SettingsSection>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION: Help Guide (Customer Care, Payment Methods, Return & Refund)
// ─────────────────────────────────────────────────────────────────────
function HelpGuideSection() {
  const [activeGuideTab, setActiveGuideTab] = useState<'customer-care' | 'payment' | 'return' | 'shipping' | 'how-to-order' | 'how-to-track' | 'terms' | 'privacy'>('customer-care');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  // Customer Care
  const [contactWA, setContactWA] = useState('08211983774');
  const [contactEmailSupport, setContactEmailSupport] = useState('');
  const [csHours, setCsHours] = useState('Senin–Sabtu, 08.00–17.00 WIB');
  const [csNotes, setCsNotes] = useState('Untuk pertanyaan mengenai pembayaran, retur, atau refund, silakan hubungi customer service kami melalui WhatsApp.');

  // Payment Methods
  const [paymentGuide, setPaymentGuide] = useState(`Kami menyediakan berbagai metode pembayaran yang aman dan mudah untuk kenyamanan Anda.

Metode Pembayaran yang Tersedia:

• Transfer Bank (BCA, Mandiri, BRI, BNI)
• Virtual Account
• QRIS
• Kartu Debit/Kredit (jika tersedia)

Proses Pembayaran:

1. Pilih produk yang ingin dibeli.
2. Lanjutkan ke halaman checkout.
3. Pilih metode pembayaran yang diinginkan.
4. Ikuti instruksi pembayaran.
5. Setelah pembayaran berhasil, pesanan akan otomatis diproses.

Informasi Penting:

• Pesanan akan diproses setelah pembayaran terverifikasi.
• Batas waktu pembayaran mengikuti ketentuan sistem.
• Jika pembayaran gagal, Anda dapat mencoba kembali dengan metode lain.
• Simpan bukti pembayaran untuk referensi jika diperlukan.`);
  const [bankAccounts, setBankAccounts] = useState<string[]>([]);
  const [newBank, setNewBank] = useState('');

  // Return & Refund
  const [returnPolicy, setReturnPolicy] = useState(`Kepuasan pelanggan adalah prioritas kami. Jika produk yang Anda terima tidak sesuai, rusak, atau terdapat kesalahan pengiriman, Anda dapat mengajukan retur atau refund sesuai ketentuan berikut.

Syarat Pengajuan:

• Produk diterima dalam kondisi rusak atau cacat.
• Produk yang dikirim tidak sesuai dengan pesanan.
• Pengajuan dilakukan maksimal 3 x 24 jam setelah barang diterima.
• Produk belum digunakan dan masih dalam kondisi lengkap.`);

  const [returnProcess, setReturnProcess] = useState(`1. Hubungi customer service kami melalui WhatsApp.
2. Sertakan nomor pesanan, foto produk, dan penjelasan kendala.
3. Tim kami akan melakukan verifikasi.
4. Jika disetujui, kami akan memberikan instruksi pengembalian barang atau proses refund.

Estimasi Proses:

• Verifikasi: 1–2 hari kerja
• Refund: 3–7 hari kerja setelah persetujuan

Catatan:

• Refund akan dikembalikan melalui metode pembayaran awal atau transfer bank.
• Biaya pengiriman retur ditanggung sesuai hasil verifikasi.`);

  const [refundNotes, setRefundNotes] = useState('');

  // Shipping Area
  const [shippingArea, setShippingArea] = useState('Kami mengirim ke seluruh Indonesia');

  const [shippingInfo, setShippingInfo] = useState(`Terima kasih telah berbelanja di toko kami.

Kami memproses pesanan setiap hari kerja (Senin–Sabtu) pukul 08.00–17.00 WIB.

Estimasi Pengiriman:

Jabodetabek: 1–2 hari kerja
Pulau Jawa: 2–4 hari kerja
Luar Pulau Jawa: 3–7 hari kerja

Jasa Pengiriman:

Kami bekerja sama dengan berbagai ekspedisi terpercaya seperti:

JNE
J&T Express
SiCepat
AnterAja
Pos Indonesia

Ketentuan Pengiriman:

• Pesanan yang masuk sebelum pukul 15.00 WIB akan diproses di hari yang sama.
• Pesanan setelah pukul 15.00 WIB akan diproses pada hari kerja berikutnya.
• Nomor resi akan dikirim otomatis setelah pesanan dikirim.
• Estimasi pengiriman dapat berubah tergantung lokasi dan kondisi ekspedisi.`);

  const removeBankAccount = (idx: number) => {
    setBankAccounts(prev => prev.filter((_, i) => i !== idx));
  };

  const [howToOrder, setHowToOrder] = useState(`Ikuti langkah mudah berikut untuk melakukan pemesanan:

1. Pilih produk yang ingin Anda beli.
2. Klik tombol Tambah ke Keranjang atau Beli Sekarang.
3. Masukkan jumlah produk yang diinginkan.
4. Isi data pengiriman dengan lengkap.
5. Pilih metode pembayaran yang tersedia.
6. Klik Buat Pesanan.
7. Lakukan pembayaran sesuai instruksi.
8. Pesanan Anda akan segera kami proses setelah pembayaran terverifikasi.

Catatan:

• Pastikan alamat dan nomor WhatsApp yang Anda masukkan sudah benar.
• Simpan nomor pesanan untuk memudahkan pengecekan status.`);
  const [howToTrack, setHowToTrack] = useState(`Setelah pesanan Anda dikirim, kami akan memberikan nomor resi pengiriman melalui WhatsApp atau email yang terdaftar.

Cara Melacak Pesanan:

1. Salin nomor resi yang telah kami kirimkan.
2. Kunjungi website resmi jasa pengiriman yang digunakan.
3. Masukkan nomor resi pada kolom pelacakan.
4. Klik tombol Lacak.
5. Informasi status pengiriman akan ditampilkan oleh pihak ekspedisi.

Informasi Penting:

• Nomor resi biasanya tersedia dalam waktu 1 x 24 jam setelah pesanan dikirim.
• Pembaruan status pengiriman mengikuti sistem dari pihak ekspedisi.
• Jika Anda belum menerima nomor resi, silakan hubungi customer service kami.

Hubungi Customer Service:

Jika mengalami kesulitan dalam melacak pesanan, tim kami siap membantu melalui WhatsApp pada jam operasional.

Jam Operasional: Senin–Sabtu, 08.00–17.00 WIB`);
  const [termsText, setTermsText] = useState(`Dengan mengakses dan bertransaksi di toko kami, Anda dianggap telah membaca, memahami, dan menyetujui syarat dan ketentuan berikut:

Ketentuan Umum

• Seluruh harga produk ditampilkan dalam Rupiah (IDR).
• Stok dan harga produk dapat berubah sewaktu-waktu tanpa pemberitahuan sebelumnya.
• Pesanan akan diproses setelah pembayaran berhasil diterima dan diverifikasi.
• Pembeli wajib memastikan data pemesanan dan alamat pengiriman sudah benar.
• Estimasi pengiriman mengikuti kebijakan jasa ekspedisi yang dipilih.
• Keluhan terkait produk dapat diajukan sesuai kebijakan Return & Refund yang berlaku.
• Kami berhak membatalkan pesanan apabila terjadi kendala stok, kesalahan harga, atau indikasi transaksi yang tidak wajar.

Tanggung Jawab Pembeli

• Membaca deskripsi produk dengan teliti sebelum melakukan pembelian.
• Memberikan informasi yang akurat dan lengkap.
• Melakukan pembayaran sesuai batas waktu yang ditentukan.

Tanggung Jawab Penjual

• Mengirim produk sesuai pesanan.
• Menjaga kualitas produk sebelum dikirim.
• Memberikan layanan pelanggan yang responsif.

Persetujuan

Dengan menyelesaikan transaksi, Anda dianggap telah menyetujui seluruh syarat dan ketentuan yang berlaku di toko kami.`);
  const [privacyText, setPrivacyText] = useState(`Kami menghargai kepercayaan Anda dan berkomitmen untuk menjaga keamanan serta kerahasiaan setiap data pribadi yang diberikan saat menggunakan layanan dan melakukan transaksi di toko kami.

Informasi yang kami kumpulkan, termasuk nama, nomor telepon, alamat email, alamat pengiriman, serta data transaksi, digunakan secara terbatas untuk keperluan:

• Pemrosesan dan konfirmasi pesanan
• Pengiriman produk
• Verifikasi pembayaran
• Layanan pelanggan dan penanganan keluhan
• Penyampaian informasi terkait pesanan dan promosi (jika disetujui)

Seluruh data pelanggan dikelola dengan standar keamanan yang wajar dan tidak akan diperjualbelikan, disewakan, maupun dibagikan kepada pihak ketiga, kecuali kepada mitra pembayaran dan jasa logistik yang diperlukan untuk menyelesaikan transaksi.

Dengan mengakses situs dan melakukan pembelian, Anda menyatakan telah membaca, memahami, dan menyetujui Kebijakan Privasi ini.`);

  const GUIDE_KEYS = [
    'help_guide_customer_care', 'help_guide_payment', 'help_guide_return',
    'help_guide_shipping', 'help_guide_how_to_order', 'help_guide_how_to_track',
    'help_guide_terms', 'help_guide_privacy',
  ];

  // Load from DB on mount
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('atelier_settings')
        .select('key, value')
        .in('key', GUIDE_KEYS);
      if (!data) return;
      data.forEach((item: { key: string; value: any }) => {
        if (item.key === 'help_guide_customer_care') {
          if (item.value?.wa) setContactWA(item.value.wa);
          if (item.value?.email) setContactEmailSupport(item.value.email);
          if (item.value?.hours) setCsHours(item.value.hours);
          if (item.value?.notes) setCsNotes(item.value.notes);
        }
        if (item.key === 'help_guide_payment') {
          if (item.value?.guide) setPaymentGuide(item.value.guide);
          if (item.value?.accounts) setBankAccounts(item.value.accounts);
        }
        if (item.key === 'help_guide_return') {
          if (item.value?.policy) setReturnPolicy(item.value.policy);
          if (item.value?.process) setReturnProcess(item.value.process);
          if (item.value?.notes) setRefundNotes(item.value.notes);
        }
        if (item.key === 'help_guide_shipping') {
          if (item.value?.info) setShippingInfo(item.value.info);
          if (item.value?.area) setShippingArea(item.value.area);
        }
        if (item.key === 'help_guide_how_to_order') {
          if (item.value) setHowToOrder(item.value);
        }
        if (item.key === 'help_guide_how_to_track') {
          if (item.value) setHowToTrack(item.value);
        }
        if (item.key === 'help_guide_terms') {
          if (item.value) setTermsText(item.value);
        }
        if (item.key === 'help_guide_privacy') {
          if (item.value) setPrivacyText(item.value);
        }
      });
    }
    load();
  }, GUIDE_KEYS);

  const handleSave = async (tab: string) => {
    setSaving(true);
    setSavedMsg('');
    try {
      const payload = { key: `help_guide_${tab}`, value: {} as any };
      if (tab === 'customer_care') payload.value = { wa: contactWA, email: contactEmailSupport, hours: csHours, notes: csNotes };
      if (tab === 'payment') payload.value = { guide: paymentGuide, accounts: bankAccounts };
      if (tab === 'return') payload.value = { policy: returnPolicy, process: returnProcess, notes: refundNotes };
      if (tab === 'shipping') payload.value = { info: shippingInfo, area: shippingArea };
      if (tab === 'how_to_order') payload.value = howToOrder;
      if (tab === 'how_to_track') payload.value = howToTrack;
      if (tab === 'terms') payload.value = termsText;
      if (tab === 'privacy') payload.value = privacyText;
      const res = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Save failed');
      setSavedMsg('Tersimpan ✓');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  const GUIDE_TABS = [
    { id: 'customer-care' as const, label: 'Customer Care' },
    { id: 'payment' as const, label: 'Payment' },
    { id: 'return' as const, label: 'Return & Refund' },
    { id: 'shipping' as const, label: 'Shipping' },
    { id: 'how-to-order' as const, label: 'How to Order' },
    { id: 'how-to-track' as const, label: 'Tracking' },
    { id: 'terms' as const, label: 'Terms' },
    { id: 'privacy' as const, label: 'Privacy' },
  ];

  return (
    <SettingsSection
      title="Help Guide"
      subtitle="Panduan customer care, metode pembayaran, dan retur — tampil di halaman help publik"
    >
      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-ink/5 pb-4">
        {GUIDE_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveGuideTab(tab.id)}
            className={cn(
              "px-4 py-2 text-[9px] font-semibold uppercase tracking-wider rounded-sm transition-colors",
              activeGuideTab === tab.id ? "bg-rose text-white" : "text-ink/40 hover:bg-ink/5"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Customer Care Tab */}
      {activeGuideTab === 'customer-care' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="WhatsApp CS">
              <Input value={contactWA} onChange={e => setContactWA(e.target.value)} placeholder="08211983774" />
            </Field>
            <Field label="Email CS">
              <Input value={contactEmailSupport} onChange={e => setContactEmailSupport(e.target.value)} placeholder="cs@ninoc.id" />
            </Field>
            <Field label="Jam Operasional CS">
              <Input value={csHours} onChange={e => setCsHours(e.target.value)} placeholder="Senin-Sabtu, 08.00–17.00 WIB" />
            </Field>
          </div>
          <Field label="Catatan Tambahan (visible di halaman help)">
            <Textarea
              value={csNotes}
              onChange={e => setCsNotes(e.target.value)}
              rows={5}
              placeholder="Untuk pertanyaan mengenai pembayaran, retur, atau refund..."
            />
          </Field>
          <div className="flex justify-end gap-3">
            {saved && <span className="text-[9px] text-emerald-600 font-semibold">Tersimpan ✓</span>}
            <button onClick={() => handleSave('customer_care')} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-rose text-white text-[9px] uppercase tracking-widest font-semibold rounded-sm hover:bg-rose/90 transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Payment Method Tab */}
      {activeGuideTab === 'payment' && (
        <div className="space-y-4">
          <Field label="Panduan Pembayaran (visible di halaman help)">
            <Textarea
              value={paymentGuide}
              onChange={e => setPaymentGuide(e.target.value)}
              rows={18}
              placeholder="Kami menyediakan berbagai metode pembayaran..."
            />
          </Field>
          <div>
            <Field label="Daftar Rekening (otomatis tampil di halaman help)">
              <div className="space-y-2 mb-2">
                {bankAccounts.map((acc, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 border border-ink/10 bg-ink/[0.015]">
                    <span className="text-[10px] font-medium flex-1">{acc}</span>
                    <button onClick={() => removeBankAccount(i)} className="text-rose text-[8px] uppercase tracking-widest hover:underline">Hapus</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={newBank} onChange={e => setNewBank(e.target.value)} placeholder="BCA 123456789 a.n. PT NINOC" className="flex-1" />
                <button onClick={() => { if (newBank.trim()) { setBankAccounts(prev => [...prev, newBank.trim()]); setNewBank(''); } }} className="px-3 py-2 bg-ink/10 text-[9px] font-semibold uppercase tracking-wider hover:bg-ink/20 transition-colors shrink-0">+ Tambah</button>
              </div>
            </Field>
          </div>
          <div className="flex justify-end gap-3">
            {saved && <span className="text-[9px] text-emerald-600 font-semibold">Tersimpan ✓</span>}
            <button onClick={() => handleSave('payment')} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-rose text-white text-[9px] uppercase tracking-widest font-semibold rounded-sm hover:bg-rose/90 transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Return & Refund Tab */}
      {activeGuideTab === 'return' && (
        <div className="space-y-4">
          <Field label="Kebijakan Retur (visible di halaman help)">
            <Textarea
              value={returnPolicy}
              onChange={e => setReturnPolicy(e.target.value)}
              rows={16}
              placeholder="Kepuasan pelanggan adalah prioritas kami..."
            />
          </Field>
          <Field label="Alur Proses Retur">
            <Textarea
              value={returnProcess}
              onChange={e => setReturnProcess(e.target.value)}
              rows={10}
              placeholder="Hubungi customer service kami melalui WhatsApp..."
            />
          </Field>
          <Field label="Catatan Refund">
            <Textarea
              value={refundNotes}
              onChange={e => setRefundNotes(e.target.value)}
              rows={6}
              placeholder="Refund akan dikembalikan melalui metode pembayaran awal..."
            />
          </Field>
          <div className="flex justify-end gap-3">
            {saved && <span className="text-[9px] text-emerald-600 font-semibold">Tersimpan ✓</span>}
            <button onClick={() => handleSave('return')} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-rose text-white text-[9px] uppercase tracking-widest font-semibold rounded-sm hover:bg-rose/90 transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Shipping Info Tab */}
      {activeGuideTab === 'shipping' && (
        <div className="space-y-4">
          <Field label="Informasi Pengiriman Umum (tampil di halaman help)">
            <Textarea value={shippingInfo} onChange={e => setShippingInfo(e.target.value)} rows={5} placeholder="Kami mengirim via JNE, J&T, SiCepat, dan kurir lain sesuai pilihan saat checkout..." />
          </Field>
          <Field label="Catatan Area Pengiriman">
            <Input value={shippingArea} onChange={e => setShippingArea(e.target.value)} placeholder="Kami mengirim ke seluruh Indonesia" />
          </Field>
          <div className="flex justify-end">
            {savedMsg && <span className="text-[9px] text-emerald-600 font-semibold mr-3">{savedMsg}</span>}
            <button onClick={() => handleSave('shipping')} disabled={saving} className="px-4 py-2 bg-rose text-white text-[9px] uppercase tracking-widest font-semibold rounded-sm hover:bg-rose/90 transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* How to Order Tab */}
      {activeGuideTab === 'how-to-order' && (
        <div className="space-y-4">
          <Field label="Cara Memesan">
            <Textarea value={howToOrder} onChange={e => setHowToOrder(e.target.value)} rows={8} placeholder="1. Pilih produk yang diinginkan&#10;2. Pilih size dan jumlah&#10;3. Masukkan ke keranjang&#10;4. Checkout dan isi alamat&#10;5. Pilih metode pembayaran&#10;6. Transfer dan konfirmasi" />
          </Field>
          <div className="flex justify-end">
            {savedMsg && <span className="text-[9px] text-emerald-600 font-semibold mr-3">{savedMsg}</span>}
            <button onClick={() => handleSave('how_to_order')} disabled={saving} className="px-4 py-2 bg-rose text-white text-[9px] uppercase tracking-widest font-semibold rounded-sm hover:bg-rose/90 transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* How to Track Tab */}
      {activeGuideTab === 'how-to-track' && (
        <div className="space-y-4">
          <Field label="Cara Melacak Pesanan">
            <Textarea value={howToTrack} onChange={e => setHowToTrack(e.target.value)} rows={6} placeholder="1. Buka halaman Order History di profil&#10;2. Pilih pesanan yang ingin dilacak&#10;3. Nomor resi tersedia setelah pesanan dikirim&#10;4. Klik nomor resi untuk melacak di website kurir" />
          </Field>
          <div className="flex justify-end">
            {savedMsg && <span className="text-[9px] text-emerald-600 font-semibold mr-3">{savedMsg}</span>}
            <button onClick={() => handleSave('how_to_track')} disabled={saving} className="px-4 py-2 bg-rose text-white text-[9px] uppercase tracking-widest font-semibold rounded-sm hover:bg-rose/90 transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Terms Tab */}
      {activeGuideTab === 'terms' && (
        <div className="space-y-4">
          <Field label="Syarat & Ketentuan">
            <Textarea value={termsText} onChange={e => setTermsText(e.target.value)} rows={12} placeholder="Syarat dan Ketentuan Penggunaan&#10;&#10;Dengan mengakses dan menggunakan website NINOC..." />
          </Field>
          <div className="flex justify-end">
            {savedMsg && <span className="text-[9px] text-emerald-600 font-semibold mr-3">{savedMsg}</span>}
            <button onClick={() => handleSave('terms')} disabled={saving} className="px-4 py-2 bg-rose text-white text-[9px] uppercase tracking-widest font-semibold rounded-sm hover:bg-rose/90 transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Privacy Tab */}
      {activeGuideTab === 'privacy' && (
        <div className="space-y-4">
          <Field label="Kebijakan Privasi">
            <Textarea value={privacyText} onChange={e => setPrivacyText(e.target.value)} rows={12} placeholder="Kebijakan Privasi&#10;&#10;NINOC menghargai privasi Anda..." />
          </Field>
          <div className="flex justify-end">
            {savedMsg && <span className="text-[9px] text-emerald-600 font-semibold mr-3">{savedMsg}</span>}
            <button onClick={() => handleSave('privacy')} disabled={saving} className="px-4 py-2 bg-rose text-white text-[9px] uppercase tracking-widest font-semibold rounded-sm hover:bg-rose/90 transition-colors disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </SettingsSection>
  );
}

// ─────────────────────────────────────────────────────────────────────
// SECTION: Help Center (FAQ)
// ─────────────────────────────────────────────────────────────────────
function HelpCenterSection() {
  const [faqs, setFaqs] = useState<{id: string; q: string; a: string; active: boolean}[]>([]);
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
                <span className="text-[7px] uppercase tracking-widest bg-ink/5 text-ink/40 px-1.5 py-0.5 rounded-sm font-medium mt-0.5 shrink-0">Q</span>
                <p className="text-[10px] font-semibold text-ink">{faq.q}</p>
              </div>
              <button className="text-[8px] uppercase tracking-widest text-ink/30 hover:text-red-500 shrink-0">Hapus</button>
            </div>
            <div className="ml-5 mt-2">
              <span className="text-[7px] uppercase tracking-widest bg-rose/10 text-rose px-1.5 py-0.5 rounded-sm font-medium">A</span>
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
  const [templates, setTemplates] = useState<{id: string; name: string; content: string; shortcut: string; active: boolean}[]>([]);
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
                "text-[7px] font-medium uppercase tracking-widest",
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
        <button className="w-full py-2.5 bg-rose text-white text-[10px] uppercase tracking-widest font-medium rounded-sm hover:bg-rose/90 transition-colors">
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
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [canonical, setCanonical] = useState('');
  const [sitemapActive, setSitemapActive] = useState(true);
  const [robotsTxt, setRobotsTxt] = useState(true);
  const [schema, setSchema] = useState(true);
  const [keywords, setKeywords] = useState('');

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
      case 'biteship-activation': return <BiteshipActivationSection />;
      case 'help-guide': return <HelpGuideSection />;
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