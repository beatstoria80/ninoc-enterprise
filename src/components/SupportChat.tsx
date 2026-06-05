"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MessageSquare, X, Send, ChevronRight, ArrowLeft, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Quick Action Buttons ──────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    id: 'track',
    label: 'Lacak Pesanan',
    sublabel: 'Cek status & resi',
    icon: 'Truck',
    color: 'bg-blue-50 border-blue-100 text-blue-600',
    iconColor: 'text-blue-500',
    subject: 'Tracking Pesanan',
    category: 'shipping',
    placeholder: 'Ketik nomor pesanan atau resi Anda...',
  },
  {
    id: 'return',
    label: 'Ajukan Retur',
    sublabel: 'Refund atau tukar barang',
    icon: 'RefreshCw',
    color: 'bg-rose/10 border-rose/10 text-rose',
    iconColor: 'text-rose',
    subject: 'Pengajuan Retur / Refund',
    category: 'return',
    placeholder: 'Ketik nomor pesanan dan masalah yang dialami...',
  },
  {
    id: 'product',
    label: 'Tanya Produk',
    sublabel: 'Stok, ukuran, warna',
    icon: 'Package',
    color: 'bg-purple-50 border-purple-100 text-purple-600',
    iconColor: 'text-purple-500',
    subject: 'Tanya Stok & Produk',
    category: 'product',
    placeholder: 'Ketik nama produk atau pertanyaan Anda...',
  },
  {
    id: 'payment',
    label: 'Masalah Bayar',
    sublabel: 'Transfer, Midtrans, COD',
    icon: 'CreditCard',
    color: 'bg-amber-50 border-amber-100 text-amber-600',
    iconColor: 'text-amber-500',
    subject: 'Masalah Pembayaran',
    category: 'payment',
    placeholder: 'Ketik nomor pesanan dan masalah pembayarannya...',
  },
  {
    id: 'other',
    label: 'Lainnya',
    sublabel: 'Pertanyaan umum',
    icon: 'MessageSquare',
    color: 'bg-ink/5 border-ink/10 text-ink/60',
    iconColor: 'text-ink/40',
    subject: 'Pertanyaan Lainnya',
    category: 'other',
    placeholder: 'Ketik pertanyaan Anda...',
  },
];

// ─── Icon helper ────────────────────────────────────────────────────────────
function QuickIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case 'Truck': return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 8 23 16 16 16 16 13 1 13"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
    case 'RefreshCw': return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>;
    case 'Package': return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16.5 9.4 7.5 3.5"/><path d="m21 21-5.97-5.97a8.04 8.04 0 0 0-.91-11.6 8.1 8.1 0 0 0-12.22 0 8.06 8.06 0 0 0 .91 11.6l5.97 5.97"/><path d="M3.27 6.96 8 12l4.73-5.04"/><path d="M20.73 17 16 12l4.73-5.04"/></svg>;
    case 'CreditCard': return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/></svg>;
    case 'MessageSquare': return <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    default: return null;
  }
}

interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  order_id: string | null;
  category: string;
  status: string;
  created_at: string;
}

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: 'customer' | 'admin';
  message: string;
  created_at: string;
  is_auto_reply?: boolean;
}

interface PlaceholderConfig {
  id: string;
  label: string;
  content: string;
  category: string;
}

// ─── Auto-Reply Keyword Map ───────────────────────────────────────────────────
const AUTO_REPLY_RULES: Record<string, string[]> = {
  // Greeting — friendly first contact
  greeting: [
    'halo', 'hai', 'hallo', 'hi', 'hey', 'yo', 'pagi', 'siang', 'sore', 'malam',
    'apa kabar', 'good morning', 'good evening', 'good night', 'selamat'
  ],
  // Return & Refund — product issue requests
  return: [
    'retur', 'refund', 'tukar', 'exchange', 'kembalikan', 'barang rusak', 'cacat',
    'size salah', 'tidak cocok', 'kirim ulang', 'return', 'garansi', 'komplain',
    'ganti barang', 'tukar barang', 'uang kembali', 'refund dana'
  ],
  // Shipping & Logistics
  shipping: [
    'kirim', 'pesanan', 'order', 'tracking', 'lacak', 'resi', 'delivery', 'bawa',
    'sampai', 'pengiriman', 'estimasi', 'kapan sampai', 'belum sampai',
    'resi', 'waybill', 'AWB', 'ekspedisi', 'kurir', 'diantar', 'antar'
  ],
  // Payment & Transaction
  payment: [
    'bayar', 'transfer', 'midtrans', 'pembayaran', 'bukti', 'lunas', 'pending',
    'gagal', 'error payment', 'bukti transfer', 'konfirmasi bayar', 'sudah transfer',
    'belum transfer', 'virtual account', 'va', 'rekening', 'metode bayar'
  ],
  // English — detected language triggers friendly bilingual response
  english: [
    'how are', 'how do', 'how can', 'what is', 'what are', 'where is', 'where are',
    'when will', 'when is', 'can i', 'can you', 'could you', 'would you', 'please',
    'help', 'order', 'track', 'shipping', 'return', 'refund', 'exchange',
    'payment', 'price', 'cost', 'buy', 'purchase', 'item', 'product', 'stock',
    'size', 'available', 'hello', 'hi there', 'good day', 'thank you', 'thanks',
    'want to', 'need to', 'looking for', 'is there', 'are there'
  ],
  // Product Inquiry
  product: [
    'stock', 'tersedia', 'available', 'ada', 'size', 'ukuran', 'warna', 'color',
    'katalog', 'catalog', 'product', 'model', 'bahan', 'material', 'gramasi',
    'berat', 'panjang', 'lebar', 'size chart', 'chart'
  ],
  // Complaint & General Dissatisfaction
  complaint: [
    'kecewa', 'buruk', 'jelek', 'difitnah', 'tidak puas', 'protes', 'keluhan',
    'salah', 'kacau', 'belum', 'belum ada', 'lama', 'lambat', 'nunggu', 'ditipu',
    'palsu', 'tidak sesuai', 'tidak sesuai deskripsi', 'beda', 'beda dari foto'
  ],
  // General Inquiry
  general: [
    'informasi', 'studio', 'ninoc', 'brand', 'tentang', 'siapa', 'alamat',
    'jam', 'buka', 'tutup', 'kontak', 'whatsapp', 'WA', 'telepon', 'email'
  ],
  // SARA / PROfanity / PErkataan Buruk — WARNING + FLAG
  sara: [
    // Indonesian slurs & profanity
    'bangsat', 'kafir', 'babi', 'anjing', 'goblok', 'idiot', 'bodoh', 'tolol',
    'ngaca', 'kaum', 'suku', 'etnis', 'ras', 'sara', 'diskriminasi', 'hitam', 'putih',
    'cina', 'arab', 'jawa', 'sunda', 'papua', 'amber', 'minang', 'bugis', 'batak',
    // Indonesian profanity & curse words
    'anjir', 'ajg', 'anjg', 'bangsat', 'brengsek', 'bego', 'bem', 'bemgok', 'bengak',
    'buta', 'cilaka', 'cuk', 'dancuk', 'dasar', 'deek', 'dongok', 'dos', 'gblk', 'gblok',
    'geblek', 'gelo', 'gila', 'gilo', 'gki', 'goblog', 'goblok', 'goblo', 'gokil',
    'golok', 'guoblo', 'hayang', 'hedoh', 'heng', 'het', 'hoe', 'hof', 'idiot',
    'itil', 'jablay', 'jali', 'jancok', 'jeng', 'jle', 'ka', 'kafir', 'kampret',
    'kampret', 'kancut', 'kari', 'katok', 'keparat', 'kescuk', 'kimak', 'kisluk',
    'kontol', 'korosi', 'kudy', 'lalau', 'lancang', 'lebay', 'lehu', 'lok', 'lucu',
    'mampus', 'mampus lu', 'mampus kau', 'mampus kamu', 'matamu', 'mblook', 'meki', 'memek',
    'mEnchu', 'mencuk', 'mgg', 'minggat', 'mli', 'mls', 'mn', 'monyek', 'monyet',
    'ngacak', 'ngacung', 'ngalah', 'ngambe', 'ngamo', 'nganya', 'ngantri', 'ngapa',
    'ngapa2', 'ngapain', 'ngapakes', 'ngarep', 'ngatip', 'ngawur', 'ngebacot',
    'ngebug', 'ngebut', 'ngeceng', 'ngedance', 'ngedi', 'ngedum', 'ngegan', 'ngegar',
    'ngeheng', 'ngekek', 'ngela', 'ngelap', 'ngelantur', 'ngelapuk', 'ngelawak',
    'ngeleb', 'ngelepar', 'ngeli', 'ngelind', 'ngelindur', 'ngelit', 'ngelu',
    'ngeluar', 'ngeluk', 'ngelum', 'ngelundung', 'ngelunjur', 'ngelup', 'ngelus',
    'ngemban', 'ngembang', 'ngempos', 'ngena', 'ngenak', 'ngendali', 'ngendap',
    'ngendar', 'ngendok', 'ngenduk', 'ngeneng', 'ngenital', 'ngentak', 'ngenten',
    'ngento', 'ngentot', 'ngenthong', 'ngenu', 'ngenuh', 'ngepit', 'ngepol', 'ngeprek',
    'ngepuk', 'ngere', 'ngereget', 'ngerek', 'ngeres', 'ngesek', 'ngesi', 'ngeskek',
    'ngetak', 'ngental', 'ngenten', 'ngenthong', 'ngentuk', 'ngenum', 'ngepe', 'ngepet',
    'ngepok', 'ngera', 'ngered', 'ngereget', 'ngerek', 'ngerem', 'ngeremp', 'ngeri',
    'ngeriap', 'ngesel', 'ngeseng', 'ngesi', 'ngeskek', 'ngeson', 'ngespok', 'ngewer',
    'ngilu', 'ngincut', 'nginthil', 'ngitung', 'ngiwes', 'ngli', 'ngliar', 'nglib',
    'nglind', 'nglindur', 'nglithik', 'nglotong', 'nglotrok', 'nglubuk', 'ngluyar',
    'ngmak', 'ngmal', 'ngmalak', 'ngmaleng', 'ngmanip', 'ngap', 'ngeb', 'ngebacot',
    'ngebet', 'nebak', 'ngel', 'ngele', 'ngeli', 'ngemp', 'ngempuk', 'ngenduk',
    'ngenthong', 'ngenum', 'ngers', 'ngesek', 'ngesel', 'ngesit', 'ngeskot', 'ngeso',
    'ngilu', 'nginem', 'ngiper', 'ngipur', 'ngirus', 'ngitik', 'ngitip', 'ngiu',
    'ngka', 'ngkek', 'ngki', 'ngkp', 'ngojek', 'ngok', 'ngoke', 'ngolok', 'ngong',
    'ngontek', 'ngotak', 'ngowoh', 'ngowok', 'ngradat', 'ngrampa', 'ngrancuk', 'ngrang',
    'ngre', 'ngrebes', 'ngrecel', 'ngredeg', 'ngrek', 'ngrekan', 'ngrentek', 'ngresik',
    'ngri', 'ngriwik', 'ngrok', 'ngrudug', 'ngrungu', 'ngs', 'ngsok', 'nguak', 'nguale',
    'ngubek', 'ngubur', 'ngucap', 'ngucek', 'ngucil', 'ngudag', 'ngudap', 'nguent',
    'nguentel', 'nguet', 'nguk', 'ngul', 'ngula', 'ngulama', 'ngular', 'ngule',
    'ngulek', 'nguliat', 'ngulun', 'ngulum', 'ngumpak', 'ngumpluk', 'nguna', 'ngunem',
    'ngungut', 'nguntat', 'ngupil', 'ngupuk', 'ngur', 'ngurem', 'ngusuk', 'ngutok',
    'njir', 'njrit', 'njur', 'nkr', 'nnt', 'nov', 'npr', 'nt', 'ntar', 'ntkt', 'ntr',
    'ntut', 'nyet', 'nyole', 'ony', 'oy', 'pak', 'palkon', 'pante', 'pantek', 'pantat',
    'pari', 'park', 'pcak', 'pe', 'pecac', 'pecat', 'peju', 'peju', 'pelak', 'peli',
    'pen', 'peng', 'pentung', 'perkosa', 'pesing', 'pest', 'pi', 'pik', 'pimpong',
    'pising', 'pit', 'pitut', 'pok', 'porn', 'pos', 'prec', 'prest', 'prim', 'prof',
    'puki', 'puk', 'pukima', 'pulus', 'pung', 'pura', 'puruk', 'racun', 'radak',
    'rahmat', 'rame', 'randa', 'rangkek', 'rap', 'rapa', 'ratek', 'rim', 'risih',
    'rit', 'rom', 'rotic', 'rotok', 'ruk', 'rungi', 'rusuh', 'saha', 'sakar', 'sakti',
    'salak', 'sam', 'sambar', 'same', 'sampah', 'samping', 'sampun', 'samsak', 'sanda',
    'sandung', 'sang', 'sanga', 'sanggam', 'sangkak', 'sangkar', 'sangkem', 'sap', 'sapi',
    'satre', 'sawawa', 'se', 'sed', 'segan', 'segers', 'sekeng', 'sekop', 'seks', 'sel',
    'seng', 'sengkul', 'sep', 'ser', 'serak', 'set', 'si', 'silang', 'sing', 'siu',
    'sle', 'smp', 'sok', 'sot', 'sting', 'su', 'suci', 'suka', 'sukma', 'sulteng',
    'sum', 'sun', 'sung', 'sup', 'suster', 'tabok', 'taek', 'taek', 'tai', 'tak',
    'tampol', 'tan', 'tanding', 'tangkok', 'tarek', 'tek', 'tem', 'teng', 'tepol',
    'ti', 'tilang', 'tj', 'to', 'toak', 'toba', 'tobak', 'tobo', 'tok', 'tokcer',
    'tolan', 'tolol', 'tolot', 'tom', 'tong', 'tonjok', 'tontong', 'top', 'tran', 'trash',
    'tri', 'tsm', 'tu', 'tubik', 'tukang', 'tukul', 'tuli', 'tum', 'tung', 'turu',
    'tus', 'tusuk', 'twat', 'tya', 'ub', 'ud', 'udung', 'ug', 'uh', 'ujik', 'uk',
    'ula', 'uli', 'ulk', 'ull', 'uluk', 'ulul', 'um', 'umm', 'umuk', 'un', 'uncang',
    'uncet', 'undan', 'undi', 'undur', 'ung', 'unggas', 'ungkit', 'ungok', 'unik',
    'unit', 'unpol', 'untu', 'untut', 'up', 'ur', 'urat', 'uri', 'us', 'usil', 'ut',
    'utut', 'vagina', 'wage', 'wah', 'wahyu', 'wak', 'waktu', 'wan', 'wang', 'wantek',
    'war', 'ware', 'warga', 'wates', 'waya', 'we', 'wej', 'wek', 'wel', 'welu',
    'weton', 'wi', 'wiru', 'wis', 'wit', 'wiwit', 'wl', 'wls', 'wn', 'wolu', 'wort',
    'wortel', 'wp', 'ws', 'wt', 'ya', 'yag', 'yak', 'yal', 'yam', 'yang', 'yank', 'yao',
    'yau', 'yeg', 'yek', 'yel', 'yen', 'yeo', 'yer', 'yes', 'yet', 'yg', 'yoh', 'yok',
    'yon', 'you', 'yp', 'yud', 'yuh', 'yuk', 'yus', 'za', 'zab', 'zai', 'zal', 'zam',
    'zan', 'zap', 'zayn', 'ze', 'zeb', 'zee', 'zen', 'zer', 'zest', 'zetta', 'zh',
    'zi', 'ziet', 'zig', 'zil', 'zinc', 'zip', 'zit', 'zl', 'zm', 'zn', 'zo', 'zom',
    'zoo', 'zp', 'zr', 'zs', 'zt', 'zu', 'zuk', 'zw', 'zx', 'zy', 'zz',
    // English profanity
    'fuck', 'fck', 'fuk', 'fuq', 'phuck', 'fukn', 'fukin', 'fukn',
    'shit', 'sht', 'shyt', 'sh1t', 'sh1t',
    'bitch', 'btch', 'b1tch', 'bitc',
    'whore', 'ho', 'hoes',
    'nigger', 'nigga', 'nigg', 'nig', 'niger', 'nigerian',
    'retard', 'tard', 'ret', 'retert',
    'slut', 'slu', 'slag',
    'faggot', 'fagot', 'fggt', 'fagot',
    'asshole', 'ashole', 'azz', 'azzhole',
    'bastard', 'bast', 'basterd',
    'cunt', 'c0unt', 'cnt',
    'dick', 'dck', 'dik', 'dickhead',
    'pussy', 'puss', 'pusy', 'pussee',
    'cock', 'cok', 'c0ck', 'cokcok',
    'damn', 'dmn', 'dam',
    'hell', 'h3ll', 'hll',
    'stupid', 'stpd', 'stupidass',
    'dumb', 'dum', 'dmb',
    'moron', 'mrn', 'moro',
    'idiot', 'iidiot',
    'loser', 'luser', 'lusr',
    'ugly', 'ug1y', 'ugli',
    'jerk', 'jrk', 'jerkk',
    'douche', 'douch', 'duche',
    'crap', 'crp', 'krapp',
    'suck', 'suk', 'sck',
    'scum', 'scumbag',
    // Other languages / mixed
    'bodoh sekali', 'goblok sekali', 'gila lu', 'gila kau', 'goblok lu', 'bangsat lu',
    'anjing lu', 'babi lu', 'kafir lu', 'muka kau', 'bakal kau', 'binatang kau',
    'dewa kecewa', 'nista', 'ASUSUL', 'dajal', 'iblis'
  ],
  // NSFW — PORNOGRAPHIC / SEXUAL content → REJECT + FLAG
  nsfw: [
    // Indonesian
    'kontol', 'memek', 'ngentot', 'pepek', 'toket', 'bubungan', 'situ',
    'ngulum', 'ngewe', 'ngenital', 'coli', 'masturbat', 'porno', 'pornografi',
    'telanjang', 'seks', 'sex', 'anal', 'vagina', 'penis', 'erotis', 'mesum',
    // English
    'porn', 'xxx', 'nude', 'naked', 'sexy', 'erotic', 'nsfw', 'adult content',
    'strip', 'escort', ' prostitute', 'fucking', 'horny', 'dick', 'pussy',
    // Combined
    'pornografi', 'konten dewasa', 'adult content', 'sex tape', 'video mesum'
  ],
  // Closing
  closing: ['terima kasih', 'makasih', 'terima kasih banyak', 'bye', 'sampai jumpa', 'goodbye', 'terimakasi', 'mantap', 'oke', 'siap', 'all good', 'solved']
};

// ─── Classification Result ──────────────────────────────────────────────────
type ClassificationResult =
  | { type: 'auto_reply'; template: PlaceholderConfig; category: string }
  | { type: 'sara_warn'; template: PlaceholderConfig; message: string }
  | { type: 'nsfw_reject'; message: string }
  | { type: 'english_bilingual'; template: PlaceholderConfig };

// ─── Classify incoming message ────────────────────────────────────────────────
function classifyMessage(
  message: string,
  placeholders: PlaceholderConfig[]
): ClassificationResult {
  const lower = message.toLowerCase().trim();

  // 1. Check NSFW first — HIGHEST PRIORITY, REJECT silently + flag
  for (const keyword of AUTO_REPLY_RULES.nsfw) {
    if (lower.includes(keyword)) {
      const rejectTpl = placeholders.find(p => p.category === 'nsfw_reject');
      return {
        type: 'nsfw_reject',
        message: rejectTpl?.content ||
          '⚠️ Kami tidak dapat memproses pesan ini karena mengandung konten yang tidak pantas. Silakan kirim ulang dengan bahasa yang sopan.'
      };
    }
  }

  // 2. Check SARA — WARNING + flag to admin
  for (const keyword of AUTO_REPLY_RULES.sara) {
    if (lower.includes(keyword)) {
      const warnTpl = placeholders.find(p => p.category === 'sara_warn');
      return {
        type: 'sara_warn',
        template: warnTpl || {
          id: 'sara-default', label: 'SARA Warning', content:
            '⚠️ Kami memperhatikan pesan Anda mengandung konten yang kurang pantas. Silakan kirim ulang dengan bahasa yang sopan. Tim kami akan meninjau pesan ini.',
          category: 'sara_warn'
        },
        message: `[FLAGGED - SARA] Kata trigger: "${keyword}" — customer: ${message.slice(0, 100)}`
      };
    }
  }

  // 3. Check English — bilingual friendly response
  for (const keyword of AUTO_REPLY_RULES.english) {
    if (lower.includes(keyword)) {
      const engTpl = placeholders.find(p => p.category === 'english');
      if (engTpl) return { type: 'english_bilingual', template: engTpl };
      // Fallback: extend greeting with English hint
      const fallback = placeholders.find(p => p.category === 'greeting');
      if (fallback) {
        return {
          type: 'english_bilingual',
          template: {
            ...fallback,
            content: fallback.content + '\n\n— This is an automated reply. Our team will respond in English shortly. 🙏'
          }
        };
      }
    }
  }

  // 4. Category matching — priority order
  const categoryPriority = ['complaint', 'return', 'shipping', 'payment', 'product', 'general', 'closing', 'greeting'];

  for (const cat of categoryPriority) {
    const keywords = AUTO_REPLY_RULES[cat] || [];
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        const tpl = placeholders.find(p => p.category === cat);
        if (tpl) return { type: 'auto_reply', template: tpl, category: cat };
      }
    }
  }

  // 5. Default greeting
  const defaultTpl = placeholders.find(p => p.category === 'greeting');
  return defaultTpl
    ? { type: 'auto_reply', template: defaultTpl, category: 'greeting' }
    : { type: 'nsfw_reject', message: 'Halo! Terima kasih telah menghubungi NINOC. Tim kami akan segera merespons.' };
}

// ─── Send auto-reply to a ticket ────────────────────────────────────────────
async function sendAutoReply(ticketId: string, content: string, isFlag = false): Promise<void> {
  await supabase.from('support_messages').insert({
    ticket_id: ticketId,
    sender_id: null,
    sender_role: 'admin',
    message: content,
    is_auto_reply: true,
    is_flagged: isFlag,
  });
}

// ─── Flag ticket for admin review ──────────────────────────────────────────
async function flagTicket(ticketId: string, reason: string, severity: 'sara' | 'nsfw'): Promise<void> {
  await supabase.from('support_tickets').update({
    status: 'flagged',
    flagged_reason: reason,
    flagged_at: new Date().toISOString(),
    flagged_severity: severity,
  }).eq('id', ticketId);

  // Also send flag notification to admin via channel
  const channel = supabase.channel('flagged-ticket-alert');
  await channel.send({
    type: 'broadcast',
    event: 'ticket-flagged',
    payload: { ticketId, reason, severity }
  });
}

// ─── Send notification to customer ──────────────────────────────────────────
async function sendCustomerNotification(ticketId: string, message: string): Promise<void> {
  await supabase.from('support_messages').insert({
    ticket_id: ticketId,
    sender_id: null,
    sender_role: 'admin',
    message,
    is_auto_reply: true,
  });
}

export default function SupportChat() {
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'new_ticket' | 'chat'>('home');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<SupportMessage[]>([]);

  const [subject, setSubject] = useState('');
  const [orderId, setOrderId] = useState('');
  const [category, setCategory] = useState('');

  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [notifCount, setNotifCount] = useState(0);
  const [showNotifCard, setShowNotifCard] = useState(false);
  const [lastNotif, setLastNotif] = useState<{ subject: string; message: string; from: string } | null>(null);
  const [placeholders, setPlaceholders] = useState<PlaceholderConfig[]>([]);
  // Track auto-reply sent per ticket ID (Map for multi-ticket support)
  const [autoReplySentMap, setAutoReplySentMap] = useState<Map<string, boolean>>(new Map());
  
  // Dispatch unread count to other components (like MobileLayout)
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('support-unread-count', { detail: notifCount }));
  }, [notifCount]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const hasUnreadRef = useRef(false);

  const fetchTickets = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setTickets(data);
  }, []);

  const openTicket = useCallback(async (ticket: SupportTicket) => {
    setActiveTicket(ticket);
    setActiveTab('chat');
    setAutoReplySentMap(prev => {
      const next = new Map(prev);
      next.set(ticket.id, true);
      return next;
    });
    const { data } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });
    if (data) setChatMessages(data);
    hasUnreadRef.current = false;
    setNotifCount(0);
  }, []);

  // Fetch logged-in user OR allow guest mode
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (user) {
          setUser(user);
          fetchTickets(user.id);
        } else {
          // Guest mode: no user, but still show UI and allow chat
          console.log('[Support] Guest mode active.');
        }
      } catch (err) {
        // Guest mode on error — still allow chat
        console.log('[Support] Guest mode active (auth error):', err);
      }
    };
    fetchUser();
  }, [fetchTickets]);

  // Fetch placeholders for auto-reply
  useEffect(() => {
    const fetchPlaceholders = async () => {
      try {
        const res = await fetch('/api/placeholders');
        const data = await res.json();
        if (data.placeholders) setPlaceholders(data.placeholders);
      } catch (err) {
        console.error('[SupportChat] fetch placeholders error:', err);
      }
    };
    fetchPlaceholders();
  }, []);

  // Real-time subscription for new admin messages
  useEffect(() => {
    const channel = supabase
      .channel('support-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'support_messages',
          filter: `sender_role=eq.admin`
        },
        async (payload) => {
          const newMsg = payload.new as SupportMessage;
          
          // Only notify if this message belongs to our tickets or active session
          const isRelevant = activeTicket?.id === newMsg.ticket_id || tickets.some(t => t.id === newMsg.ticket_id);
          if (!isRelevant) return;

          if (activeTab === 'chat' && activeTicket?.id === newMsg.ticket_id) {
            setChatMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            return;
          }

          // Show notification card + badge
          hasUnreadRef.current = true;
          setNotifCount(prev => prev + 1);
          
          const relevantTicket = activeTicket?.id === newMsg.ticket_id ? activeTicket : tickets.find(t => t.id === newMsg.ticket_id);
          
          setLastNotif({
            subject: relevantTicket?.subject || 'Status Update',
            message: newMsg.message,
            from: 'Studio'
          });
          setShowNotifCard(true);

          setTimeout(() => {
            setShowNotifCard(false);
          }, 6000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTicket, tickets, activeTab]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const startNewTicket = async () => {
    if (!subject || !category) return;
    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user?.id || null,
        subject,
        order_id: orderId || null,
        category,
        status: 'open'
      })
      .select()
      .single();

    if (error) {
      alert(`Error creating ticket: ${error.message}`);
      console.error("Ticket Insert Error:", error);
      return;
    }

    if (data) {
      setTickets(prev => [data, ...prev]);
      setActiveTicket(data);
      setActiveTab('chat');
      setChatMessages([]);
      setMessage('');
      setSubject('');
      setOrderId('');
      setCategory('');
    }
  };

  const sendMessage = async (overrideMessage?: string, overrideTicket?: SupportTicket) => {
    const msgToSend = overrideMessage || message;
    const targetTicket = overrideTicket || activeTicket;

    if (!msgToSend.trim() || !targetTicket) return;

    const newMessage = {
      ticket_id: targetTicket.id,
      sender_id: null,
      sender_role: 'customer' as const,
      message: msgToSend.trim()
    };

    const { data, error } = await supabase
      .from('support_messages')
      .insert(newMessage)
      .select()
      .single();

    if (error) {
      console.error('[sendMessage] Supabase error:', error.code, error.message);
      return;
    }

    if (data) {
      setChatMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, data];
      });
      setMessage('');

      // Auto-reply: classify message and respond accordingly (only once per ticket)
      if (activeTicket && !autoReplySentMap.get(activeTicket.id)) {
        const classification = classifyMessage(msgToSend.trim(), placeholders);

        if (classification.type === 'nsfw_reject') {
          // Silent reject — send warning to customer, flag ticket
          setAutoReplySentMap(prev => {
            const next = new Map(prev);
            next.set(activeTicket!.id, true);
            return next;
          });
          await sendCustomerNotification(activeTicket.id, classification.message);
          await flagTicket(activeTicket.id, `NSFW: ${msgToSend.slice(0, 100)}`, 'nsfw');
          window.dispatchEvent(new CustomEvent('support-auto-reply', { detail: { ticketId: activeTicket.id } }));

        } else if (classification.type === 'sara_warn') {
          // Send warning + flag to admin
          setAutoReplySentMap(prev => {
            const next = new Map(prev);
            next.set(activeTicket!.id, true);
            return next;
          });
          await sendCustomerNotification(activeTicket.id, classification.template.content);
          await flagTicket(activeTicket.id, classification.message, 'sara');
          window.dispatchEvent(new CustomEvent('support-auto-reply', { detail: { ticketId: activeTicket.id } }));

        } else if (classification.type === 'english_bilingual' || classification.type === 'auto_reply') {
          // Normal auto-reply
          setAutoReplySentMap(prev => {
            const next = new Map(prev);
            next.set(activeTicket!.id, true);
            return next;
          });
          await sendAutoReply(activeTicket.id, classification.template.content);
          window.dispatchEvent(new CustomEvent('support-auto-reply', { detail: { ticketId: activeTicket.id } }));
        }
      }
    }
  };

  const startGeneralChat = async () => {
    if (!message.trim()) return;
    if (message.length > 500) return;

    const msgToSend = message;
    const tempId = `guest-${Date.now()}`;

    // Optimistic UI: langsung tampilkan di chat
    const optimisticMsg: SupportMessage = {
      id: tempId,
      ticket_id: tempId,
      sender_id: '',
      sender_role: 'customer',
      message: msgToSend,
      created_at: new Date().toISOString()
    };
    setChatMessages(prev => [...prev, optimisticMsg]);
    setMessage('');

    try {
      // Create or find General Inquiry ticket
      let genTicket = tickets.find(t => t.subject === 'General Inquiry');

      if (!genTicket) {
        const { data: ticketData, error: ticketError } = await supabase
          .from('support_tickets')
          .insert({
            user_id: user?.id || null,
            subject: 'General Inquiry',
            category: 'other',
            status: 'open'
          })
          .select()
          .single();

        if (ticketError) {
          console.error('[startGeneralChat] Ticket insert error:', ticketError);
          // Remove optimistic message on error
          setChatMessages(prev => prev.filter(m => m.id !== tempId));
          // Show user-friendly error
          const errorMsg: SupportMessage = {
            id: `err-${Date.now()}`,
            ticket_id: tempId,
            sender_id: '',
            sender_role: 'admin',
            message: 'Maaf, gagal membuat tiket. Silakan coba lagi atau login terlebih dahulu.',
            created_at: new Date().toISOString(),
            is_auto_reply: true
          };
          setChatMessages(prev => [...prev, errorMsg]);
          return;
        }

        if (ticketData) {
          genTicket = ticketData;
          setTickets(prev => [ticketData, ...prev]);
        }
      }

      if (genTicket) {
        // Insert message
        const { data: savedMsg, error: msgError } = await supabase
          .from('support_messages')
          .insert({
            ticket_id: genTicket.id,
            sender_id: null,
            sender_role: 'customer',
            message: msgToSend
          })
          .select()
          .single();

        if (msgError) {
          console.error('[startGeneralChat] Message insert error:', msgError);
          // Remove optimistic message on error
          setChatMessages(prev => prev.filter(m => m.id !== tempId));
          const errorMsg: SupportMessage = {
            id: `err-${Date.now()}`,
            ticket_id: tempId,
            sender_id: '',
            sender_role: 'admin',
            message: 'Maaf, gagal mengirim pesan. Silakan coba lagi.',
            created_at: new Date().toISOString(),
            is_auto_reply: true
          };
          setChatMessages(prev => [...prev, errorMsg]);
          return;
        }

        if (savedMsg) {
          // Replace optimistic message with real one
          setChatMessages(prev =>
            prev.map(m => m.id === tempId ? savedMsg : m)
          );
          setActiveTicket(genTicket);
          setActiveTab('chat');

          // Auto-reply for general inquiry using classification (per-ticket tracking)
          if (!autoReplySentMap.get(genTicket.id)) {
            const classification = classifyMessage(msgToSend, placeholders);

            if (classification.type === 'nsfw_reject') {
              setAutoReplySentMap(prev => {
                const next = new Map(prev);
                next.set(genTicket!.id, true);
                return next;
              });
              await sendCustomerNotification(genTicket.id, classification.message);
              await flagTicket(genTicket.id, `NSFW: ${msgToSend.slice(0, 100)}`, 'nsfw');
              window.dispatchEvent(new CustomEvent('support-auto-reply', { detail: { ticketId: genTicket.id } }));

            } else if (classification.type === 'sara_warn') {
              setAutoReplySentMap(prev => {
                const next = new Map(prev);
                next.set(genTicket!.id, true);
                return next;
              });
              await sendCustomerNotification(genTicket.id, classification.template.content);
              await flagTicket(genTicket.id, `SARA: ${msgToSend.slice(0, 100)}`, 'sara');
              window.dispatchEvent(new CustomEvent('support-auto-reply', { detail: { ticketId: genTicket.id } }));

            } else if (classification.type === 'english_bilingual' || classification.type === 'auto_reply') {
              setAutoReplySentMap(prev => {
                const next = new Map(prev);
                next.set(genTicket!.id, true);
                return next;
              });
              await sendAutoReply(genTicket.id, classification.template.content);
              window.dispatchEvent(new CustomEvent('support-auto-reply', { detail: { ticketId: genTicket.id } }));
            }
          }
        }
      } else {
        // No genTicket found/created — show error message
        setChatMessages(prev => prev.filter(m => m.id !== tempId));
        const errorMsg: SupportMessage = {
          id: `err-${Date.now()}`,
          ticket_id: '',
          sender_id: '',
          sender_role: 'admin',
          message: 'Maaf, gagal memulai chat. Silakan coba lagi.',
          created_at: new Date().toISOString(),
          is_auto_reply: true
        };
        setChatMessages(prev => [...prev, errorMsg]);
      }
    } catch (err) {
      console.error('[startGeneralChat] Error:', err);
      setChatMessages(prev => prev.filter(m => m.id !== tempId));
      const errorMsg: SupportMessage = {
        id: `err-${Date.now()}`,
        ticket_id: '',
        sender_id: '',
        sender_role: 'admin',
        message: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
        created_at: new Date().toISOString(),
        is_auto_reply: true
      };
      setChatMessages(prev => [...prev, errorMsg]);
    }
  };

  // Listen for external open events (from Burger Menu)
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-support-chat', handleOpen);
    return () => window.removeEventListener('open-support-chat', handleOpen);
  }, []);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [message, activeTab]);

  // Hide floating chat on admin dashboard (admin has its own Support Chat tab)
  if (isAdminPage) return null;

  return (
    <>
      {/* ================================================ */}
      {/* CENTER-SCREEN NOTIFICATION CARD (Top Right) */}
      {/* ================================================ */}
      <AnimatePresence>
        {showNotifCard && lastNotif && activeTab !== 'chat' && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-20 right-6 z-[600] w-[300px] bg-white rounded-2xl shadow-2xl border border-ink/5 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-ink px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-rose rounded-full animate-pulse" />
                <p className="text-[6px] font-medium uppercase tracking-[0.2em] text-white/40">Studio Reply</p>
              </div>
              <button
                onClick={() => setShowNotifCard(false)}
                className="text-white/30 hover:text-white transition-colors"
              >
                <X size={12} strokeWidth={1.5} />
              </button>
            </div>
            {/* Body */}
            <div className="p-4 space-y-3">
              <p className="text-[8px] font-medium text-rose uppercase tracking-widest">New Message</p>
              <p className="text-[9px] font-medium text-ink uppercase italic">{lastNotif.subject}</p>
              <p className="text-[9px] font-medium text-ink/50 leading-relaxed line-clamp-2">{lastNotif.message}</p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setShowNotifCard(false);
                  // Find the ticket and open it
                  const t = tickets.find(t => t.subject === lastNotif.subject);
                  if (t) {
                    setIsOpen(true);
                    openTicket(t);
                  }
                }}
                className="w-full bg-rose text-white py-2.5 rounded-lg text-[8px] font-medium uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-600 transition-colors"
              >
                <MessageSquare size={10} /> Open Support
              </motion.button>
            </div>
            {/* Progress bar */}
            <div className="h-[2px] bg-ink/5">
              <motion.div
                className="h-full bg-rose"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 6, ease: 'linear' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================================================ */}
      {/* MICRO TRIGGER - Desktop Only */}
      {/* ================================================ */}
      <div className="fixed bottom-5 right-5 z-[500] hidden md:block">
        {/* Badge counter */}
        <AnimatePresence>
          {notifCount > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute -top-2 -right-2 bg-rose text-white text-[8px] font-medium rounded-full w-5 h-5 flex items-center justify-center shadow-lg z-10"
            >
              {notifCount > 9 ? '9+' : notifCount}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) setShowNotifCard(false);
          }}
          className="relative w-9 h-9 bg-ink rounded-full shadow-lg flex items-center justify-center hover:bg-rose transition-colors duration-300"
        >
          {/* Subtle breathe pulse */}
          <motion.div
            className="absolute inset-0 bg-rose rounded-full opacity-0"
            animate={notifCount > 0 ? { scale: [1, 1.4, 1], opacity: [0, 0.3, 0] } : { scale: [1, 1.3, 1], opacity: [0, 0, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <X size={14} strokeWidth={1.5} className="text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
              >
                <MessageSquare size={14} strokeWidth={1.5} className="text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* COMPACT PANEL - Responsive */}
      <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={typeof window !== 'undefined' && window.innerWidth < 768 
                ? { opacity: 0, y: '100%' } 
                : { opacity: 0, y: 8, scale: 0.96 }
              }
              animate={typeof window !== 'undefined' && window.innerWidth < 768 
                ? { opacity: 1, y: 0 } 
                : { opacity: 1, y: 0, scale: 1 }
              }
              exit={typeof window !== 'undefined' && window.innerWidth < 768 
                ? { opacity: 0, y: '100%' } 
                : { opacity: 0, y: 8, scale: 0.96 }
              }
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={cn(
                "fixed z-[600] bg-white shadow-2xl overflow-hidden border border-ink/5 flex flex-col transition-all",
                "bottom-0 left-0 right-0 h-[80vh] rounded-t-3xl md:bottom-12 md:right-5 md:left-auto md:w-[300px] md:h-[480px] md:rounded-2xl"
              )}
            >
              {/* Backdrop for mobile */}
              <div className="md:hidden absolute inset-0 bg-ink/20 backdrop-blur-sm -z-10" onClick={() => setIsOpen(false)} />
              {/* HEADER */}
              <motion.div
                className="bg-ink p-4 text-white relative"
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsOpen(false)}
                  className="absolute top-3 right-3 text-white/30 hover:text-white transition-colors"
                >
                  <X size={14} strokeWidth={1.5} />
                </motion.button>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[6px] font-medium uppercase tracking-[0.2em] text-white/30 flex items-center gap-1.5">
                      <span className={cn("w-1 h-1 rounded-full", user ? "bg-emerald-500" : "bg-rose animate-pulse")} />
                      NINOC Support
                    </p>
                    <h3 className="text-xs font-display font-medium italic uppercase tracking-widest">Support <span className="text-rose">Center</span></h3>
                  </div>
                  {user && (
                    <p className="text-[5px] font-medium text-white/10 uppercase tracking-widest">SPEC: {user.email?.split('@')[0]}</p>
                  )}
                </div>
              </motion.div>

              <div className="flex-1 overflow-hidden flex flex-col">
                {activeTab === 'home' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col h-full overflow-hidden bg-white"
                  >
                    <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4">
                      {/* QUICK ACTION GRID */}
                      <div>
                        <p className="text-[6px] font-medium uppercase tracking-[0.15em] text-ink/30 mb-3">Pilih Topik</p>
                        <div className="grid grid-cols-2 gap-2">
                          {QUICK_ACTIONS.map((action) => (
                            <motion.button
                              key={action.id}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => {
                                setSubject(action.subject);
                                setCategory(action.category);
                                setActiveTab('new_ticket');
                              }}
                              className={cn(
                                "flex flex-col items-start gap-1.5 p-3 rounded-xl border transition-all duration-200 text-left",
                                action.color,
                                "hover:shadow-sm hover:-translate-y-0.5"
                              )}
                            >
                              <QuickIcon name={action.icon} className={action.iconColor} />
                              <div>
                                <p className="text-[9px] font-semibold uppercase tracking-wide leading-tight">{action.label}</p>
                                <p className="text-[7px] opacity-60 leading-snug">{action.sublabel}</p>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                      </div>

                      {/* ACTIVE CONVERSATIONS */}
                      <div>
                        <p className="text-[6px] font-medium uppercase tracking-[0.1em] text-ink/15 mb-2">Percakapan Aktif</p>
                        {tickets.length > 0 ? (
                          <div className="space-y-1">
                            {tickets.slice(0, 5).map((t, i) => (
                              <motion.button
                                key={t.id}
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={() => openTicket(t)}
                                className="w-full flex items-center justify-between p-2.5 bg-ink/[0.02] border border-ink/5 rounded-xl hover:bg-ink/[0.04] hover:border-ink/10 transition-all duration-200 text-left group"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-[9px] font-medium text-ink uppercase truncate">{t.subject}</p>
                                  <p className="text-[6px] font-medium text-ink/30 uppercase tracking-widest mt-0.5">#{t.id.split('-')[0]} · {t.status}</p>
                                </div>
                                <ChevronRight size={10} className="text-ink/10 group-hover:text-rose transition-colors duration-200 ml-2 flex-shrink-0" />
                              </motion.button>
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 opacity-25">
                            <MessageSquare size={18} strokeWidth={1} />
                            <p className="text-[7px] italic text-ink/40 uppercase tracking-widest">Belum ada percakapan</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* BOTTOM INPUT — always visible for quick type-in */}
                    <div className="relative z-10 p-3 bg-white border-t border-ink/5 shrink-0">
                      <textarea
                        ref={textareaRef}
                        rows={1}
                        value={message}
                        onChange={e => { if (e.target.value.length <= 500) setMessage(e.target.value); }}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startGeneralChat(); } }}
                        placeholder="Ketik pertanyaan Anda..."
                        className="w-full bg-ink/[0.02] text-ink py-2.5 px-3.5 rounded-[5px] text-[11px] font-medium outline-none placeholder:text-ink/20 border border-ink/[0.08] transition-all focus:border-rose/30 focus:bg-white resize-none min-h-[40px]"
                      />
                      <div className="flex items-end gap-1 mt-1.5">
                        <p className="flex-1 text-[5px] text-ink/15 uppercase tracking-widest font-medium">
                          {user ? 'Studio Direct' : 'Guest Mode — chat aktif'}
                        </p>
                        <button
                          onClick={startGeneralChat}
                          className="flex items-center gap-1 text-[6px] uppercase tracking-widest text-ink/20 hover:text-rose transition-colors font-semibold"
                        >
                          Kirim <Send size={10} />
                        </button>
                        <span className={cn('text-[5px]', message.length > 450 ? 'text-rose font-semibold' : 'text-ink/15')}>
                          {message.length}/500
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'new_ticket' && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="p-4 space-y-3 flex-1 flex flex-col justify-center relative bg-white"
                  >
                    <motion.button
                      whileHover={{ x: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab('home')}
                      className="text-[7px] font-medium uppercase tracking-[0.2em] text-rose flex items-center gap-1 absolute top-4 left-4"
                    >
                      <ArrowLeft size={8} /> Back
                    </motion.button>
                    
                    <div className="text-center space-y-1 mb-4 pt-6">
                      <p className="text-[6px] font-medium uppercase tracking-widest text-ink/40">Topik Terpilih</p>
                      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-ink">{subject}</h4>
                    </div>

                    <div className="space-y-3 bg-ink/[0.02] p-4 rounded-xl border border-ink/5">
                      <div className="space-y-1.5 text-center">
                        <label className="text-[7px] font-medium uppercase tracking-widest text-ink/50">Punya ID Pesanan? (Opsional)</label>
                        <input 
                          type="text" 
                          value={orderId} 
                          onChange={(e) => setOrderId(e.target.value)} 
                          placeholder="Contoh: NINOC-12345" 
                          className="w-full bg-white border border-ink/10 rounded-lg py-2.5 px-3 text-[10px] font-medium outline-none placeholder:text-ink/20 focus:border-rose/30 focus:shadow-sm transition-all text-center" 
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={startNewTicket}
                        className="w-full bg-ink text-white py-2.5 rounded-lg text-[9px] font-medium uppercase tracking-[0.2em] mt-3 hover:bg-rose transition-colors duration-200"
                      >
                        Mulai Chat
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'chat' && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col h-full overflow-hidden"
                  >
                    <div className="p-2.5 border-b border-ink/5 flex items-center justify-between bg-white">
                      <motion.button
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setActiveTab('home')}
                        className="text-rose"
                      >
                        <ArrowLeft size={12} strokeWidth={1.5} />
                      </motion.button>
                      <div className="text-center">
                        <p className="text-[8px] font-medium text-ink uppercase truncate max-w-[140px]">{activeTicket?.subject}</p>
                        <p className="text-[6px] font-medium text-ink/20 uppercase tracking-widest">#{activeTicket?.id.split('-')[0]}</p>
                      </div>
                      <div className="w-4" />
                    </div>
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5 no-scrollbar bg-ink/[0.01]">
                      {chatMessages.map((m, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 5, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.2 }}
                          className={`flex ${m.sender_role === 'customer' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className="max-w-[80%]">
                            <div className={`px-2.5 py-1.5 rounded-xl text-[9px] leading-relaxed ${m.sender_role === 'customer' ? 'bg-ink text-white rounded-br-none' : m.is_auto_reply ? 'bg-rose/10 border border-rose/20 text-ink rounded-bl-none' : 'bg-white border border-ink/5 text-ink rounded-bl-none'}`}>
                              {m.message}
                            </div>
                            {(m.sender_role === 'admin' || m.is_auto_reply) && (
                              <div className={`flex items-center gap-1 mt-0.5 ${m.sender_role === 'customer' ? 'justify-end' : 'justify-start'}`}>
                                {m.is_auto_reply ? (
                                  <span className="text-[5px] text-rose/60 uppercase tracking-widest font-medium flex items-center gap-0.5">
                                    <Zap size={6} strokeWidth={2} /> Auto-reply
                                  </span>
                                ) : (
                                  <span className="text-[5px] text-ink/20 uppercase tracking-widest">Studio</span>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                    <div className="p-3 bg-white border-t border-ink/5 space-y-1.5">
                      <div className="flex items-end gap-1.5">
                        <textarea
                          ref={textareaRef}
                          rows={1}
                          value={message}
                          onChange={(e) => {
                            if (e.target.value.length <= 500) {
                              setMessage(e.target.value);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendMessage();
                            }
                          }}
                          placeholder="Type message..."
                          className="flex-1 bg-ink/[0.02] border border-ink/[0.08] rounded-[5px] py-2.5 px-3.5 text-[11px] font-medium outline-none placeholder:text-ink/20 focus:bg-white focus:border-rose/30 transition-all resize-none min-h-[40px] focus:shadow-md"
                        />
                        <button
                          onClick={() => sendMessage()}
                          className="w-8 h-10 flex items-center justify-center text-ink/20 hover:text-rose transition-all duration-300 flex-shrink-0 active:scale-90"
                          aria-label="Send message"
                        >
                          <Send size={13} strokeWidth={2} />
                        </button>
                      </div>
                      <div className="flex justify-end px-0.5">
                        <p className={cn('text-[5.5px] font-medium tracking-widest uppercase', message.length > 450 ? 'text-rose' : 'text-ink/15')}>
                          {message.length}/500
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
    </>
  );
}