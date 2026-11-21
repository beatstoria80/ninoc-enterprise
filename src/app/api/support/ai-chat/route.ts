import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { executeAiTool } from '@/lib/aiTools';

// REFACTOR: Explicit strict typing interfaces replacing all 'any' types
interface ProductVariantRecord {
  color?: string | null;
  size?: string | null;
  stock_quantity?: number | null;
  sku?: string | null;
}

interface ProductRecord {
  id: string;
  name: string;
  price: number;
  category?: string | null;
  slug: string;
  variants?: ProductVariantRecord[] | null;
}

interface OrderItemRecord {
  product_name?: string | null;
  quantity?: number | null;
  size?: string | null;
  color?: string | null;
}

interface OrderRecord {
  id: string;
  status: string;
  courier?: string | null;
  tracking_code?: string | null;
  total_amount?: number | null;
  created_at?: string | null;
  order_items?: OrderItemRecord[] | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GroqChatPayload {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  temperature: number;
  top_p: number;
  max_tokens: number;
  presence_penalty: number;
  frequency_penalty: number;
  stream: boolean;
}

interface GeminiPayload {
  system_instruction: {
    parts: Array<{ text: string }>;
  };
  contents: Array<{
    role: string;
    parts: Array<{ text: string }>;
  }>;
  generationConfig: {
    temperature: number;
    topP: number;
    maxOutputTokens: number;
  };
}

interface GeminiCandidate {
  content?: {
    parts?: Array<{ text?: string }>;
  };
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
}

// ─── STRICT SYSTEM PROMPT TEMPLATE (Closed-Domain RAG & Zero-Hallucination) ─
const STRICT_SYSTEM_PROMPT_TEMPLATE = `Kamu adalah Asisten Layanan Pelanggan Resmi NINOC. Tugasmu adalah menjawab pertanyaan pengguna secara ramah, santun, hangat, dan humanis HANYA dan EKSKLUSIF berdasarkan "BASIS PENGETAHUAN RESMI (KNOWLEDGE BASE)" yang dilampirkan di bawah ini.

PERSONA & GAYA KOMUNIKASI (HUMANIS & RAMAH):
- Bertindaklah seperti staf representatif brand fashion NINOC yang berempati, profesional, dan bersahabat (gunakan sapaan sopan seperti "Halo kak!", "kakak", santun, dan solutif).
- HINDARI bahasa birokratis yang kaku atau robotik (JANGAN membuka pesan dengan kalimat kaku seperti "Saya adalah Asisten Informasi Resmi Aplikasi NINOC").
- Jika pengguna hanya menyapa (halo/hai/p/selamat pagi/siang), sambutlah dengan ramah dan singkat:
  "Halo kak! Selamat datang di NINOC. Ada yang bisa aku bantu seputar produk atau pesanan kakak hari ini? 😊"

==================================================
BASIS PENGETAHUAN RESMI (KNOWLEDGE BASE):
{{INSERT_KNOWLEDGE_BASE_HERE}}

==================================================
ATURAN KETAT MENJAWAB (ZERO-HALLUCINATION GUARDRAILS):

PRINSIP SUMBER TERTUTUP (STRICT GROUNDING):
- Kamu HANYA diperbolehkan mengambil fakta, data, definisi, dan instruksi dari BASIS PENGETAHUAN di atas.
- DILARANG menggunakan pengetahuan eksternal, asumsi, perkiraan, atau beropini di luar dokumen yang diberikan.
- Pahami variasi penulisan bahasa Indonesia sehari-hari, singkatan, serta salah ketik (typo) wajar pengguna (contoh: "pemgiriman" = pengiriman, "tersesdia" = tersedia, "ongkir" = ongkos kirim, "resi" = nomor resi/tracking).
- Jika pengguna menanyakan seputar fashion, produk pakaian, koleksi terbaru, new arrivals, kaos, hoodie, polo, pesanan, pengiriman, pembayaran, atau panduan toko, kamu WAJIB menjawab secara ramah, jelas, dan informatif berdasarkan data pada BASIS PENGETAHUAN di atas. Sebutkan informasi faktual secara lugas.

PENANGANAN PRODUK/KATEGORI YANG BELUM TERSEDIA DI KATALOG:
- Jika pengguna menanyakan produk, aksesoris, atau kategori yang TIDAK ADA di katalog NINOC (contoh: "ada topi", "jual sepatu?", "ada celana jeans?", "ada jaket kulit?", dsb):
  * DILARANG KERAS menjawab dengan kalimat kaku seperti "informasi mengenai hal tersebut belum tersedia di dalam pusat data panduan resmi"!
  * Jawablah secara ramah dan solutif: Jelaskan dengan santun bahwa produk tersebut (misal: topi) saat ini belum tersedia di katalog resmi NINOC.
  * Jelaskan bahwa lini produk utama NINOC saat ini adalah Kaos (Graphic T-Shirt Streetwear), Hoodie Street Art & Graffiti, Polo Shirt Gothic, dan Aksesoris Skateboard Tech Deck.
  * Berikan rekomendasi produk ready stock terpopuler yang tersedia di website beserta tautan halamannya agar pelanggan tetap dapat melihat koleksi terbaik NINOC.

PENANGANAN PERTANYAAN SEPUTAR SEPAK BOLA & KLASEMEN LIGA 1 / BRI SUPER LEAGUE 2026-27:
- Jika pengguna menanyakan seputar klasemen sepak bola, BRI Super League 2026-27, peringkat klub (seperti Persija, Persib Bandung, Bali United, Dewa United, Persebaya, Arema, Madura United, dll), posisi tim, atau perolehan poin:
  * Jawablah secara ramah, presisi, dan informatif HANYA berdasarkan [DATA VALIDASI RESMI KLASEMEN SEPAK BOLA BRI SUPER LEAGUE 2026-27 (SUMBER RESMI: ILEAGUE.ID)] yang terlampir di basis pengetahuan resmi.
  * Sebutkan peringkat klub, jumlah pertandingan dimainkan (Main), catatan menang-seri-kalah (M/S/K), selisih gol, dan total poin secara tepat.
  * Sebutkan bahwa data tervalidasi langsung dari portal resmi I.League: https://ileague.id/table/index/BRI_SUPER_LEAGUE_2026-27.
  * Sebagai representasi brand streetwear asal Bandung (NINOC), jika pengguna menanyakan Persib Bandung, sampaikan dengan ramah dan bangga bahwa Persib saat ini menempati posisi ke-6 dengan 16 poin dari 9 laga (5 menang, 1 seri, 3 kalah, selisih gol +6).
  * DILARANG KERAS mengarang peringkat, membuat data palsu, atau menggunakan data usang dari musim sebelumnya!

PENANGANAN PERTANYAAN DI LUAR TOKO (OFF-TOPIC FALLBACK):
- Kalimat fallback HANYA digunakan jika pertanyaan pengguna SAMA SEKALI tidak berkaitan dengan toko, fashion, atau belanja (misal: membahas resep makanan, politik, sains, tugas sekolah):
  "Mohon maaf kak, aku hanya dapat melayani informasi seputar produk, panduan ukuran, pengiriman, pembayaran, dan pesanan di toko NINOC ya! Ada yang bisa aku bantu seputar koleksi NINOC?"
- DILARANG mengarang jawaban alternatif atau berspekulasi jika data tidak ada.

DILARANG MELEBAR (NO DRIFTING):
- Jawab hanya hal spesifik yang ditanyakan pengguna.
- Jangan menambahkan materi, tips, atau saran ekstra yang tidak relevan dengan pertanyaan langsung.

FORMAT & KEBERSIHAN TEKS (MOBILE/WEB FRIENDLY - BEBAS SIMBOL ASTERISK/UNDERSCORE):
- DILARANG KERAS menggunakan tanda asterisk ganda (**) atau tanda bintang tunggal (*).
- DILARANG KERAS menggunakan garis bawah/underscore (_) atau tanda formatting aneh (**_**).
- DILARANG menggunakan tanda pagar heading markdown (#, ##, ###, dst).
- DILARANG menggunakan tag HTML mentah (<br>, <p>, <div>, dst).
- Gunakan teks biasa yang bersih, natural, dan mudah dibaca di layar chat.
- Gunakan bullet point strip ("- ") atau penomoran ("1. ", "2. ") jika menyajikan langkah-langkah atau daftar produk.`;

const FALLBACK_RESPONSE = 'Mohon maaf kak, aku hanya dapat melayani informasi seputar produk, panduan ukuran, pengiriman, pembayaran, dan pesanan di toko NINOC ya! Ada yang bisa aku bantu seputar koleksi NINOC?';

// ─── STRING SANITIZER (PEMBERSIH TANDA BACA RAW MARKDOWN) ───────────────────
function sanitizeChatResponse(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/\*{1,3}_{1,3}\*{1,3}/g, '')
    .replace(/_{1,3}\*{1,3}_{1,3}/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_([a-zA-Z0-9]+)_/g, '$1')
    .replace(/\*{2,}/g, '')
    .replace(/_{2,}/g, '')
    .replace(/^#+\s+/gm, '')
    .trim();
}

// ─── RAG PRODUCT CATALOG RETRIEVER ──────────────────────────────────────────
async function fetchProductsForRAG(query: string): Promise<ProductRecord[]> {
  const SELECT_FIELDS = 'id, name, price, category, slug, variants(color, size, stock_quantity, sku)';

  try {
    // 1. Fetch latest published products
    const { data: latest } = await supabaseAdmin
      .from('products')
      .select(SELECT_FIELDS)
      .order('created_at', { ascending: false })
      .limit(8);

    // 2. Fetch specific matching products if query has relevant keywords
    const qClean = (query || '').toLowerCase().replace(/[^a-zA-Z0-9\s]/g, ' ').trim();
    const stopWords = new Set(['apa', 'yang', 'dari', 'ada', 'dan', 'ini', 'itu', 'saya', 'kak', 'min', 'bisa', 'dong']);
    const tokens = qClean.split(/\s+/).filter(t => t.length > 2 && !stopWords.has(t));

    // REFACTOR: Replaced any[] with typed ProductRecord[]
    let matched: ProductRecord[] = [];
    if (tokens.length > 0) {
      const orFilter = tokens
        .slice(0, 4)
        .map(t => `name.ilike.%${t}%,category.ilike.%${t}%,description.ilike.%${t}%`)
        .join(',');

      const { data: mData } = await supabaseAdmin
        .from('products')
        .select(SELECT_FIELDS)
        .or(orFilter)
        .limit(6);

      // REFACTOR: Type assertion with ProductRecord[]
      if (mData) matched = mData as unknown as ProductRecord[];
    }

    // Combine and deduplicate
    // REFACTOR: Replaced Map<string, any> with Map<string, ProductRecord>
    const map = new Map<string, ProductRecord>();
    const latestTyped = (latest || []) as unknown as ProductRecord[];
    [...matched, ...latestTyped].forEach((p: ProductRecord) => {
      if (p?.id && !map.has(p.id)) {
        map.set(p.id, p);
      }
    });

    return Array.from(map.values()).slice(0, 8);
  } catch (err: unknown) { // REFACTOR: Replaced 'err: any' with 'err: unknown'
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[AI-Chat-RAG] Product fetch error:', errorMsg);
    return [];
  }
}

// ─── LIGA 1 / BRI SUPER LEAGUE 2026-27 VALIDATED STANDINGS DATA (ILEAGUE.ID) ─
const VERIFIED_LIGA1_STANDINGS_SNAPSHOT = `Tabel Klasemen Sementara BRI Super League 2026-27 (Tervalidasi Resmi via https://ileague.id/table/index/BRI_SUPER_LEAGUE_2026-27):
1. Persija Jakarta | Main: 9 | Menang: 7 | Seri: 0 | Kalah: 2 | Gol: 19-8 (SG: +11) | Poin: 21
2. Dewa United Banten FC | Main: 10 | Menang: 6 | Seri: 2 | Kalah: 2 | Gol: 16-13 (SG: +3) | Poin: 20
3. Bali United FC | Main: 9 | Menang: 6 | Seri: 1 | Kalah: 2 | Gol: 26-9 (SG: +17) | Poin: 19
4. Madura United FC | Main: 10 | Menang: 6 | Seri: 1 | Kalah: 3 | Gol: 16-11 (SG: +5) | Poin: 19
5. Persita | Main: 9 | Menang: 5 | Seri: 3 | Kalah: 1 | Gol: 18-11 (SG: +7) | Poin: 18
6. Persib Bandung | Main: 9 | Menang: 5 | Seri: 1 | Kalah: 3 | Gol: 16-10 (SG: +6) | Poin: 16
7. Garudayaksa FC | Main: 10 | Menang: 4 | Seri: 2 | Kalah: 4 | Gol: 13-16 (SG: -3) | Poin: 14
8. Java United FC | Main: 9 | Menang: 4 | Seri: 3 | Kalah: 2 | Gol: 14-11 (SG: +3) | Poin: 13 (terkena sanksi -2 poin)
9. Persebaya Surabaya | Main: 9 | Menang: 3 | Seri: 4 | Kalah: 2 | Gol: 10-8 (SG: +2) | Poin: 13
10. Bhayangkara Lampung FC | Main: 9 | Menang: 2 | Seri: 6 | Kalah: 1 | Gol: 12-11 (SG: +1) | Poin: 12
11. Arema FC | Main: 10 | Menang: 3 | Seri: 3 | Kalah: 4 | Gol: 20-20 (SG: 0) | Poin: 12
12. Borneo FC Samarinda | Main: 8 | Menang: 3 | Seri: 1 | Kalah: 4 | Gol: 8-10 (SG: -2) | Poin: 10
13. PSM Makassar | Main: 9 | Menang: 2 | Seri: 4 | Kalah: 3 | Gol: 10-14 (SG: -4) | Poin: 10
14. Persik Kediri | Main: 9 | Menang: 3 | Seri: 1 | Kalah: 5 | Gol: 9-14 (SG: -5) | Poin: 10
15. Isenmulang Kalteng FC | Main: 9 | Menang: 2 | Seri: 2 | Kalah: 5 | Gol: 4-16 (SG: -12) | Poin: 6 (terkena sanksi -2 poin)
16. PSS Sleman | Main: 10 | Menang: 1 | Seri: 2 | Kalah: 7 | Gol: 12-20 (SG: -8) | Poin: 5
17. PSIM Yogyakarta | Main: 9 | Menang: 1 | Seri: 2 | Kalah: 6 | Gol: 6-14 (SG: -8) | Poin: 5
18. Persijap Jepara | Main: 9 | Menang: 0 | Seri: 2 | Kalah: 7 | Gol: 5-18 (SG: -13) | Poin: 2`;

let standingsCache: { data: string; timestamp: number } | null = null;
const STANDINGS_CACHE_TTL = 1000 * 60 * 30; // 30 minutes in-memory cache

async function fetchOrGetLiga1Standings(): Promise<string> {
  const now = Date.now();
  if (standingsCache && (now - standingsCache.timestamp < STANDINGS_CACHE_TTL)) {
    return standingsCache.data;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second safety timeout

    const res = await fetch('https://ileague.id/table/index/BRI_SUPER_LEAGUE_2026-27', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const html = await res.text();
      const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
      if (tbodyMatch) {
        const rows = tbodyMatch[1].match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
        if (rows.length >= 10) {
          const lines = rows.map((r, idx) => {
            const cols = (r.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || []).map(c =>
              c.replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ')
            );
            const rank = cols[0] || `${idx + 1}`;
            const club = cols[1] || `Klub ${idx + 1}`;
            const pld = cols[2] || '0';
            const w = cols[3] || '0';
            const d = cols[4] || '0';
            const l = cols[5] || '0';
            const gf = cols[6] || '0';
            const ga = cols[7] || '0';
            const gd = cols[8] || '0';
            const pts = cols[9] || '0';
            return `${rank}. ${club} | Main: ${pld} | Menang: ${w} | Seri: ${d} | Kalah: ${l} | Gol: ${gf}-${ga} (SG: ${gd}) | Poin: ${pts}`;
          });
          const parsedText = `Tabel Klasemen Sementara BRI Super League 2026-27 (Tervalidasi Real-time via https://ileague.id/table/index/BRI_SUPER_LEAGUE_2026-27):\n${lines.join('\n')}`;
          standingsCache = { data: parsedText, timestamp: now };
          return parsedText;
        }
      }
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.warn('[AI-Chat-RAG] Real-time fetch of ileague standings skipped or timed out, using verified snapshot:', errMsg);
  }

  return VERIFIED_LIGA1_STANDINGS_SNAPSHOT;
}

// ─── RAG KNOWLEDGE BASE RETRIEVER ──────────────────────────────────────────
async function buildKnowledgeBase(ticketId: string, userMessage: string): Promise<string> {
  const sections: string[] = [];

  // 1. Identitas & Kebijakan Standar Toko Resmi NINOC
  sections.push(`[PROFIL & INFORMASI RESMI TOKO]
- Nama Toko: NINOC
- Website Resmi: https://ninoc.store
- Instagram Resmi: @ninoc.co
- Kategori Fashion Resmi yang Dijual: Kaos / Graphic T-Shirt Streetwear (Pria, Wanita, Unisex), Hoodie Street Art & Graffiti, Polo Shirt Gothic, Aksesoris & Skateboard Tech Deck.
- Produk yang Belum Tersedia / Tidak Dijual: Topi/Headwear, Sepatu/Footwear, Celana Jeans, Kemeja Formal, Tas Ransel. Jika customer menanyakan produk ini, jelaskan secara ramah dan santun bahwa produk tersebut saat ini belum tersedia di katalog NINOC, lalu rekomendasikan pilihan produk ready stock (Kaos, Hoodie, Polo, Tech Deck) yang ada di website.
- Alamat Toko Fisik & Gudang: Kompleks Griya Saluyu, Blok AA No.87, Mekarjaya, Rancasari, Bandung, Jawa Barat 40292
- Layanan Ekspedisi Pengiriman: JNE, J&T, Sicepat, serta Instant/Sameday (Grab/Gojek)
- Jangkauan Wilayah Pengiriman: Mendukung pengiriman ke SELURUH INDONESIA (termasuk Papua, Maluku, Sulawesi, Kalimantan, Sumatra, Bali, Nusa Tenggara, dan Pulau Jawa) menggunakan ekspedisi reguler & kargo nasional (JNE, J&T, SiCepat). Ongkos kirim dihitung secara otomatis saat proses checkout di website sesuai alamat lengkap tujuan.
- Pengiriman Instant / Sameday: Tersedia khusus wilayah Bandung dan sekitarnya menggunakan Grab/Gojek.
- Metode Pembayaran Resmi: QRIS, Transfer Bank (BCA, Mandiri, BNI, BRI), E-Wallet (GoPay, OVO, ShopeePay), Virtual Account, Kartu Kredit
- Kebijakan Pengembalian & Garansi (Return Policy): Garansi tukar size atau pengembalian dana (refund) apabila produk cacat, rusak, atau tidak sesuai pesanan. Form pengajuan retur: https://ninoc.store/retur
- Panduan Ukuran Standar (Size Guide):
  * Tinggi 150-165 cm, Berat 45-55 kg: Size S atau M
  * Tinggi 165-175 cm, Berat 55-68 kg: Size M atau L
  * Tinggi 175-183 cm, Berat 68-80 kg: Size L atau XL
  * Tinggi >180 cm atau Berat >80 kg: Size XL atau XXL / 2XL
- Pusat Bantuan Resmi: https://ninoc.store/help`);

  // 2. FAQ & Kebiasaan Belanja Konsumen Indonesia (Indonesian E-Commerce Habits)
  sections.push(`[FAQ RESMI & KEBIASAAN BELANJA KONSUMEN INDONESIA (E-COMMERCE HABIT KNOWLEDGE)]
1. BAHAN, KAIN, & KUALITAS PRODUK:
- Bahan Kaos: 100% Cotton Combed 24s kualitas premium. Gramasi pas (tidak tipis menerawang, tidak tebal gerah), adem, halus, dan berdaya serap keringat tinggi sehingga sangat nyaman di iklim tropis.
- Bahan Hoodie: Heavyweight Cotton Fleece berkualitas tinggi yang tebal, lembut di bagian dalam, hangat namun tetap breathable.
- Sablon & Grafis: Menggunakan teknologi High-Quality DTF (Direct-to-Film) & Plastisol dengan warna tajam, detail presisi, serta tahan cuci dan tidak mudah retak/pecah.
- Kerah & Jahitan: O-Neck dengan rib leher kokoh tidak mudah melar, dijahit rapi dengan standar clothing/distro garmen premium.
- Asal Produksi: 100% Original Brand NINOC Studio, dirancang dan diproduksi langsung di Bandung, Jawa Barat (Made in Bandung, Indonesia).

2. KESESUAIAN GENDER & MODEL POTONGAN (FIT):
- Gender: Semua koleksi kaos dan hoodie NINOC didesain UNISEX (sangat cocok dan pas dikenakan oleh pria maupun wanita).
- Model Potongan (Cutting): Tersedia pilihan Regular Fit dan Oversized Boxy Streetwear yang trendi.
- Panduan Ukuran (Size Guide):
  * TB 150-165 cm, BB 45-55 kg: Size S atau M
  * TB 165-175 cm, BB 55-68 kg: Size M atau L
  * TB 175-183 cm, BB 68-80 kg: Size L atau XL
  * TB >180 cm atau BB >80 kg: Size XL atau XXL / 2XL

3. METODE PEMBAYARAN & SISTEM COD:
- Metode Pembayaran Tersedia: QRIS (dapat dipindai dari semua bank & e-wallet seperti GoPay, OVO, ShopeePay, Dana, LinkAja), Virtual Account (BCA, Mandiri, BNI, BRI), serta Kartu Kredit/Debit.
- Transaksi Non-Tunai: Seluruh pembayaran dilakukan secara cashless melalui payment gateway resmi di website https://ninoc.store demi verifikasi instan otomatis dan keamanan transaksi pelanggan.

4. PENGIRIMAN, GUDANG, ESTIMASI SAMPAI, & ONGKIR:
- Asal Pengiriman: Dikirim langsung dari warehouse pusat NINOC di Kota Bandung, Jawa Barat.
- Jangkauan Wilayah: Menjangkau SELURUH INDONESIA (dari Sabang sampai Merauke, termasuk Papua, Maluku, Sulawesi, Kalimantan, Sumatra, Bali, Nusa Tenggara, hingga seluruh Pulau Jawa).
- Pilihan Ekspedisi: JNE, J&T, SiCepat (Layanan Reguler & Kargo).
- Kurir Instant / Sameday: Tersedia kurir Grab & Gojek khusus untuk pembeli di wilayah Bandung dan sekitarnya.
- Estimasi Waktu Pengiriman: Pulau Jawa 1-3 hari kerja; Luar Pulau Jawa 3-5 hari kerja; Wilayah Papua dan pelosok 5-8 hari kerja.
- Cek Tarif Ongkir: Ongkos kirim dihitung dan ditampilkan secara transparan dan otomatis di halaman checkout website sesuai alamat lengkap tujuan.

5. KEBIJAKAN GARANSI, RETUR, & TUKAR SIZE:
- Garansi Tukar Size: Jika baju kebesaran atau kekecilan, pelanggan dapat mengajukan penukaran ukuran (tukar size).
- Garansi Produk Cacat / Salah Kirim: Penggantian produk baru atau pengembalian dana (refund) penuh jika produk yang diterima cacat, rusak, atau tidak sesuai pesanan.
- Prosedur Retur: Cukup mengisi formulir pengajuan retur resmi di https://ninoc.store/retur.
- Syarat Retur: Hangtag produk masih utuh/terpasang, produk belum dicuci, pengajuan maksimal 3 hari setelah paket diterima, dan menyertakan video unboxing.

6. CEK RESI & LACAK STATUS PESANAN:
- Nomor Resi Otomatis: Resi pengiriman akan otomatis terbit setelah pesanan diserahkan ke kurir dan dapat dicek pada akun pembeli di website.
- Lacak via Chat: Pelanggan dapat menanyakan status pesanan langsung di live chat ini dengan memberikan Nomor Pesanan (contoh: NINOC-xxxx).

7. PENGEMASAN & KEAMANAN PACKING:
- Standar Packing: Setiap produk dikemas higienis dengan plastik pelindung dalam ziplock/polybag dan dibungkus polymailer tebal waterproof (tahan air & anti-robek) atau kotak kardus tebal untuk menjaga produk tiba dalam kondisi sempurna.

8. KEASLIAN & REQUEST CUSTOM DESAIN:
- 100% Produk Original: Semua produk yang dijual adalah koleksi asli brand NINOC Studio.
- Custom Desain: Saat ini NINOC hanya menjual koleksi grafis & artwork eksklusif original karya studio kreatif NINOC, dan belum melayani jasa custom sablon satuan dari desain eksternal.

9. CARA BELANJA DI WEBSITE:
- Cara Order: Buka https://ninoc.store/shop -> Pilih produk, varian warna, dan ukuran -> Klik "Beli Sekarang" atau "Tambah ke Keranjang" -> Masukkan alamat pengiriman -> Pilih kurir dan bayar via QRIS/VA.`);

  // 3. Panduan & Dokumen dari Atelier Settings (CMS Database)
  try {
    const keys = [
      'help_guide_customer_care',
      'help_guide_payment',
      'help_guide_return',
      'help_guide_shipping',
      'help_guide_how_to_order',
    ];
    const { data: helpGuides } = await supabaseAdmin
      .from('atelier_settings')
      .select('key, value')
      .in('key', keys);

    if (helpGuides && helpGuides.length > 0) {
      const guideLines = helpGuides
        .filter(item => item.value)
        .map(item => `- Panduan ${item.key.replace('help_guide_', '').toUpperCase()}: ${item.value}`);
      if (guideLines.length > 0) {
        sections.push(`[PANDUAN OPERASIONAL & BANTUAN SISTEM]\n${guideLines.join('\n')}`);
      }
    }
  } catch (err: unknown) { // REFACTOR: Type-safe unknown error handling
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[AI-Chat-RAG] Failed to load atelier help guides:', errorMsg);
  }

  // 4. Retrieval Data Pesanan Pelanggan (Jika Tiket / Chat Terkait Pesanan)
  try {
    let orderId: string | null = null;

    if (!ticketId.startsWith('guest-')) {
      const { data: ticketData } = await supabaseAdmin
        .from('support_tickets')
        .select('order_id')
        .eq('id', ticketId)
        .single();

      if (ticketData?.order_id) {
        orderId = ticketData.order_id;
      }
    }

    if (!orderId) {
      const orderMatch = userMessage.match(/NINOC-\d+|INV-[A-Z0-9-]+|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
      if (orderMatch) {
        orderId = orderMatch[0];
      }
    }

    if (orderId) {
      const orderResult = await executeAiTool('get_order_details', { order_id: orderId });
      if (orderResult?.success && orderResult.order) {
        // REFACTOR: Typed OrderRecord mapping
        const o: OrderRecord = orderResult.order as OrderRecord;
        const items = Array.isArray(o.order_items)
          ? o.order_items.map((it: OrderItemRecord) => `${it.product_name || 'Produk'} (Qty: ${it.quantity || 1}, Size: ${it.size || '-'}, Warna: ${it.color || '-'})`).join(', ')
          : '-';

        sections.push(`[DATA PESANAN PENGGUNA TERVERIFIKASI]
- Nomor Pesanan: ${o.id}
- Status Pesanan: ${o.status}
- Kurir Pengiriman: ${o.courier || '-'}
- Nomor Resi: ${o.tracking_code || 'Belum terbit (pesanan sedang diproses gudang)'}
- Total Nilai Pesanan: Rp ${(o.total_amount || 0).toLocaleString('id-ID')}
- Daftar Produk: ${items}
- Tanggal Pesanan: ${o.created_at || '-'}`);
      }
    }
  } catch (err: unknown) { // REFACTOR: Replaced 'err: any' with 'err: unknown'
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[AI-Chat-RAG] Failed to load order context:', errorMsg);
  }

  // 5. Retrieval Katalog Produk & Koleksi Fashion Resmi (RAG Terverifikasi Database)
  const products = await fetchProductsForRAG(userMessage);
  if (products.length > 0) {
    // REFACTOR: Replaced (p: any) with (p: ProductRecord)
    const productLines = products.map((p: ProductRecord) => {
      const variants = Array.isArray(p.variants)
        // REFACTOR: Replaced (v: any) with (v: ProductVariantRecord)
        ? p.variants.map((v: ProductVariantRecord) => `${v.size || 'OS'}${v.color ? ` (${v.color})` : ''}: Stok ${v.stock_quantity ?? 0}`).join(', ')
        : 'Cek di website';
      return `- Nama Produk: ${p.name}
  Kategori: ${p.category || 'Pakaian'}
  Harga Resmi: Rp ${(p.price || 0).toLocaleString('id-ID')}
  Varian & Ketersediaan Stok: ${variants}
  Tautan Halaman Produk: https://ninoc.store/shop/${p.slug} [PRODUK:${p.slug}]`;
    });

    sections.push(`[KOLEKSI FASHION TERBARU & KATALOG PRODUK RESMI NINOC]
Koleksi fashion terbaru, rilisan anyar (new arrivals), dan produk ready stock saat ini meliputi:
${productLines.join('\n\n')}`);
  }

  // 6. Validasi Klasemen BRI Super League 2026-27 (Sumber Resmi: ileague.id)
  const footballKeywords = [
    'klasemen', 'liga 1', 'super league', 'bri super league', 'ileague', 'sepak bola', 'bola',
    'persib', 'persija', 'persebaya', 'arema', 'bali united', 'dewa united', 'madura united',
    'persita', 'garudayaksa', 'java united', 'bhayangkara', 'borneo', 'psm', 'persik',
    'isenmulang', 'pss', 'sleman', 'psim', 'persijap', 'peringkat', 'posisi liga', 'poin liga', 'juara liga'
  ];
  const isFootballQuery = footballKeywords.some(kw => userMessage.toLowerCase().includes(kw));

  if (isFootballQuery) {
    const standingsData = await fetchOrGetLiga1Standings();
    sections.push(`[DATA VALIDASI RESMI KLASEMEN SEPAK BOLA BRI SUPER LEAGUE 2026-27 (SUMBER RESMI: ILEAGUE.ID)]
Sumber Resmi Terverifikasi: https://ileague.id/table/index/BRI_SUPER_LEAGUE_2026-27

${standingsData}

PANDUAN MENJAWAB SEPUTAR LIGA 1 / BRI SUPER LEAGUE 2026-27:
- Gunakan data klasemen resmi di atas secara akurat dan presisi. DILARANG KERAS MENGARANG ANGKA ATAU POSISI!
- Jika pengguna menanyakan siapa pemuncak klasemen: Jawab Persija Jakarta di peringkat 1 dengan 21 poin (9 main, 7 menang, 0 seri, 2 kalah, selisih gol +11).
- Jika pengguna menanyakan posisi Persib Bandung (klub kebanggaan kota Bandung, markas NINOC): Jawab dengan ramah dan antusias bahwa Persib saat ini berada di peringkat ke-6 dengan 16 poin dari 9 laga (5 menang, 1 seri, 3 kalah, selisih gol +6).
- Jika pengguna menanyakan klub lain (misal: Dewa United, Bali United, Madura United, Persita, Arema, Persebaya, dll), sebutkan posisi peringkat, jumlah main, menang-seri-kalah, selisih gol, dan poin sesuai tabel di atas.
- Sertakan tautan sumber resmi verifikasi: https://ileague.id/table/index/BRI_SUPER_LEAGUE_2026-27.`);
  }

  return sections.join('\n\n==================================================\n\n');
}

// ─── Chat History Helper ────────────────────────────────────────────────────
async function fetchChatHistory(ticketId: string, currentMessage: string): Promise<ChatMessage[]> {
  const { data: historyData } = await supabaseAdmin
    .from('support_messages')
    .select('message, sender_role')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false })
    .limit(6);

  // REFACTOR: Replaced Array<any> with ChatMessage[]
  const rawMessages: ChatMessage[] = [];
  if (historyData) {
    const chronologicalData = [...historyData].reverse();
    for (const msg of chronologicalData) {
      rawMessages.push({
        role: msg.sender_role === 'customer' ? 'user' : 'assistant',
        content: msg.message,
      });
    }
  }

  // Safely append currentMessage if missing
  const lastRaw = rawMessages.length > 0 ? rawMessages[rawMessages.length - 1] : null;
  const isDuplicateUserMessage = lastRaw && lastRaw.role === 'user' && lastRaw.content === currentMessage;
  
  if (!isDuplicateUserMessage) {
    rawMessages.push({ role: 'user', content: currentMessage });
  }

  // Combine consecutive messages with the same role
  // REFACTOR: Replaced Array<any> with ChatMessage[]
  const mergedMessages: ChatMessage[] = [];
  for (const msg of rawMessages) {
    if (mergedMessages.length > 0 && mergedMessages[mergedMessages.length - 1].role === msg.role) {
      mergedMessages[mergedMessages.length - 1].content += `\n${msg.content}`;
    } else {
      mergedMessages.push({ role: msg.role, content: msg.content });
    }
  }

  // Ensure the history starts with a user message
  while (mergedMessages.length > 0 && mergedMessages[0].role === 'assistant') {
    mergedMessages.shift();
  }

  // Safety Net: History MUST end with a user prompt
  if (mergedMessages.length === 0 || mergedMessages[mergedMessages.length - 1].role === 'assistant') {
    mergedMessages.push({ role: 'user', content: currentMessage });
  }

  return mergedMessages;
}

// ─── Groq API Retry Helper ─────────────────────────────────────────────────
async function fetchGroqWithRetry(url: string, options: RequestInit, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    const res = await fetch(url, options);
    if (res.ok || (res.status !== 429 && res.status < 500)) {
      return res;
    }
    console.warn(`[AI-Chat] Groq API status ${res.status}, retrying ${i + 1}/${retries}...`);
    if (i < retries) {
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
    } else {
      return res;
    }
  }
  return fetch(url, options);
}

// ─── Groq Cloud (Strict Zero-Hallucination Closed-Domain Configuration) ─────
// REFACTOR: Replaced Array<any> with ChatMessage[]
async function callGroq(messages: ChatMessage[], systemPrompt: string): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('[AI-Chat] GROQ_API_KEY not set.');
    return null;
  }

  // High-performance Groq Models with Zero-Hallucination & Closed-Domain RAG
  const models = [
    'qwen/qwen3.8-27b',
    'openai/gpt-oss-120b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant'
  ];

  for (const modelName of models) {
    // REFACTOR: Replaced 'any' with typed GroqChatPayload
    const payload: GroqChatPayload = {
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.1,        // WAJIB RENDAH: 0.0 - 0.2 agar AI patuh 100% pada teks basis data
      top_p: 0.85,             // Menjaga fokus pada token probabilitas tertinggi
      max_tokens: 1000,        // Mencegah jawaban bertele-tele
      presence_penalty: 0.0,   // Netral agar tidak memicu topik baru di luar konteks
      frequency_penalty: 0.0,
      stream: false,
    };

    try {
      const response = await fetchGroqWithRetry('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`[AI-Chat-Error] Groq ${modelName} gagal (${response.status}):`, errText);
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content && typeof content === 'string' && content.trim().length > 0) {
        return content.trim();
      }
    } catch (err: unknown) { // REFACTOR: Replaced 'err: any' with 'err: unknown'
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[AI-Chat] Exception with Groq model ${modelName}:`, errorMsg);
      continue;
    }
  }

  return null;
}

// ─── Gemini AI (Strict Fallback Resiliency) ─────────────────────────────────
// REFACTOR: Replaced Array<any> with ChatMessage[]
async function callGemini(messages: ChatMessage[], systemPrompt: string): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[AI-Chat] GEMINI_API_KEY not set in environment.');
    return null;
  }

  const geminiMessages = messages.map(msg => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content || '' }],
  }));

  // REFACTOR: Replaced 'any' with typed GeminiPayload
  const payload: GeminiPayload = {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: geminiMessages,
    generationConfig: {
      temperature: 0.1,
      topP: 0.85,
      maxOutputTokens: 1000,
    },
  };

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[AI-Chat] Gemini API failed:', errText);
      return null;
    }

    // REFACTOR: Replaced 'any' casting with GeminiResponse interface
    const data = (await res.json()) as GeminiResponse;
    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts.map(p => p.text || '').filter(Boolean).join('\n').trim();

    return text || null;
  } catch (err: unknown) { // REFACTOR: Replaced 'err: any' with 'err: unknown'
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[AI-Chat] Exception with Gemini fallback:', errorMsg);
    return null;
  }
}

// ─── Main Route Handler ─────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { ticketId, message } = await req.json();

    if (!ticketId || !message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({
        response: 'Pesan tidak dapat diproses. Silakan coba lagi.',
      }, { status: 400 });
    }

    const trimmedMessage = message.trim();

    // 1. RAG Step: Bangun Basis Pengetahuan Resmi (Closed-Domain Knowledge Base)
    const knowledgeBase = await buildKnowledgeBase(ticketId, trimmedMessage);

    // 2. Injeksi Basis Pengetahuan ke Blueprint Strict System Prompt
    const finalSystemPrompt = STRICT_SYSTEM_PROMPT_TEMPLATE.replace('{{INSERT_KNOWLEDGE_BASE_HERE}}', knowledgeBase);

    // 3. Ambil Riwayat Chat
    const chatMessages = await fetchChatHistory(ticketId, trimmedMessage);

    // 4. Eksekusi LLM: Groq Cloud (Prioritas Utama)
    let aiResponse = await callGroq(chatMessages, finalSystemPrompt);

    // 5. Fallback ke Gemini jika Groq tidak merespon
    if (!aiResponse) {
      console.warn('[AI-Chat] Groq unavailable, switching to Gemini fallback...');
      aiResponse = await callGemini(chatMessages, finalSystemPrompt);
    }

    // 6. Final Static Fallback Protocol & String Sanitizer
    if (!aiResponse) {
      aiResponse = FALLBACK_RESPONSE;
      console.warn('[AI-Chat] All AI providers failed. Using static fallback protocol.');
    } else {
      aiResponse = sanitizeChatResponse(aiResponse);
      console.log(`[AI-Chat] ✅ Zero-Hallucination Humanized AI Response generated (${aiResponse.length} chars)`);
    }

    // 7. Simpan Pesan Respon ke Database Supabase (support_messages)
    const { error: insertError } = await supabaseAdmin.from('support_messages').insert({
      ticket_id: ticketId,
      sender_id: null,
      sender_role: 'admin',
      message: aiResponse,
      is_auto_reply: true,
    });

    if (insertError) {
      console.error('[AI-Chat] Insert error to support_messages:', insertError);
    }

    return NextResponse.json({ response: aiResponse });

  } catch (error: unknown) { // REFACTOR: Replaced 'error: any' with 'error: unknown'
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[AI-Chat] Unexpected error:', errorMsg);
    return NextResponse.json({ response: FALLBACK_RESPONSE });
  }
}
