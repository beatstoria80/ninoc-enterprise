import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabase as browserSupabase } from './supabase';

/**
 * ============================================================================
 * UTILITY: BULLETPROOF TYPE COERCION FOR LLM PAYLOADS
 * ============================================================================
 * LLMs (Groq, OpenAI, Llama) frequently serialize numbers (like invoice IDs
 * e.g., 1782791806880) as integers instead of strings in JSON tool arguments.
 * Calling .trim() or .toLowerCase() directly on non-strings causes runtime
 * TypeError crashes in serverless production environments.
 */
function toSafeString(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'bigint') {
    return String(val).trim();
  }
  try {
    return JSON.stringify(val);
  } catch {
    return '';
  }
}

/**
 * ============================================================================
 * DATA ACCESS LAYER: DATABASE CLIENT LOADER
 * ============================================================================
 * Conditionally loads Server-Side Supabase Admin client with bypass-RLS
 * capabilities when executing inside API routes, falling back to Browser client.
 */
// Singleton cache for server-side execution
let cachedServerClient: SupabaseClient | null = null;

function getDbClient(): SupabaseClient {
  if (
    typeof window === 'undefined' &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    if (!cachedServerClient) {
      cachedServerClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: { persistSession: false, autoRefreshToken: false },
          db: { schema: 'public' }
        }
      );
    }
    return cachedServerClient;
  }
  return browserSupabase as unknown as SupabaseClient;
}

/**
 * ============================================================================
 * TOOL DECLARATION SCHEMA (OPENAI / GROQ COMPLIANT)
 * ============================================================================
 */
export const aiToolsDeclaration = [
  {
    type: 'function',
    function: {
      name: 'get_order_details',
      description:
        'Dapatkan detail pesanan berdasarkan ID pesanan (misal: NINOC-1782791806880 atau ID Invoice). Gunakan ini saat pelanggan menanyakan status pesanan, resi, atau kendala pengiriman.',
      parameters: {
        type: 'object',
        properties: {
          order_id: {
            type: 'string',
            description: 'ID Pesanan / Invoice ID (contoh: NINOC-1782791806880)',
          },
        },
        required: ['order_id'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_products',
      description:
        'Cari dan urutkan produk di katalog toko (termasuk cek ukuran/size S, M, L, XL, XXL, warna, stok, harga termurah, termahal, promo, dan filter budget/harga). Gunakan selalu tool ini saat customer bertanya seputar produk, harga, diskon, atau rekomendasi.',
      parameters: {
        type: 'object',
        properties: {
          keyword: {
            type: 'string',
            description:
              'Kata kunci nama produk, ukuran (misal: "XL", "L"), warna ("hitam", "putih"), atau kategori ("kaos", "celana", "hoodie", "jaket", "totebag").',
          },
          sort_by: {
            type: 'string',
            enum: ['newest', 'cheapest', 'most_expensive', 'popular'],
            description:
              'Urutan produk: "cheapest" (termurah/paling murah), "most_expensive" (termahal/paling mahal), "newest" (terbaru/new arrival), "popular" (terlaris/best seller/rekomendasi).',
          },
          min_price: {
            type: 'number',
            description:
              'Harga minimal (misal: 100000 jika customer mencari harga di atas 100rb).',
          },
          max_price: {
            type: 'number',
            description:
              'Harga maksimal/budget (misal: 150000 jika customer mencari harga di bawah 150rb atau budget 150rb).',
          },
          category: {
            type: 'string',
            description:
              'Filter kategori spesifik jika disebutkan (contoh: "pakaian", "aksesoris", "utilities", "kaos", "celana", "hoodie", "outer", "jacket").',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'escalate_to_human',
      description:
        'Gunakan ini jika AI tidak bisa menjawab, informasi terlalu kompleks, butuh campur tangan manusia (misal: refund, komplain keras), atau customer meminta admin manusia.',
      parameters: {
        type: 'object',
        properties: {
          ticket_id: {
            type: 'string',
            description: 'ID tiket support',
          },
          reason: {
            type: 'string',
            description: 'Alasan eskalasi ke manusia',
          },
        },
        required: ['ticket_id', 'reason'],
      },
    },
  },
];

/**
 * ============================================================================
 * DOMAIN SERVICE: INDONESIAN NLP & QUERY SANITIZATION ENGINE
 * ============================================================================
 * Separates linguistic scrubbing, typo normalization, and synonym expansion
 * from database query logic for clean maintainability and O(1) set lookups.
 */
class IndonesianNlpEngine {
  private static readonly CHAT_FILLERS = new Set([
    'pakah', 'apkah', 'pkh', 'apakah', 'apa', 'ada', 'ad', 'ready', 'redy', 'redi', 'rdy',
    'size', 'sz', 'ukuran', 'ukrn', 'uk', 'gak', 'ga', 'gk', 'enggak', 'nggak', 'ngga', 'engga', 'tdk', 'disini',
    'di', 'sini', 'harga', 'hrg', 'termurah', 'termahal', 'murah', 'mahal', 'bawah',
    'atas', 'budget', 'paling', 'brp', 'yg', 'dong', 'deh', 'kah', 'ya', 'min',
    'spill', 'atu', 'atau', 'atw', 'ataupun', 'desain', 'design', 'dsn', 'motif',
    'gambar', 'gbr', 'seri', 'series', 'tipe', 'type', 'model', 'mdl', 'koleksi',
    'collection', 'punya', 'pnya', 'gaada', 'adaa', 'adakah', 'jual', 'jl', 'nyari',
    'cari', 'cri', 'mau', 'mw', 'pengen', 'pngn', 'beli', 'bli', 'buat', 'bt',
    'untuk', 'utk', 'si', 'sih', 'nih', 'tuh', 'lah', 'pun', 'kek', 'kaya', 'kayak', 'yang',
  ]);

  private static readonly PROFANITY = new Set([
    'anjing', 'njing', 'anying', 'bangsat', 'bgst', 'tai', 'bego', 'tolol', 'goblok',
    'babi', 'kontol', 'memek', 'jancok', 'jancuk', 'asu', 'sundala', 'pantek',
    'bajingan', 'kampret', 'setan',
  ]);

  private static readonly GENERIC_KEYWORDS = new Set([
    'baru', 'new', 'terbaru', 'promo', 'diskon', 'discount', 'sale', 'murah',
    'termurah', 'mahal', 'termahal', 'best', 'seller', 'terlaris', 'rekomendasi',
    'favorit', 'budget', 'semua', 'all', 'produk', 'barang',
  ]);

  private static readonly SYNONYM_MAP: Record<string, string> = {
    // Ukuran / Sizes (Singkatan & Sehari-hari)
    xxl: '2XL',
    '2xl': 'XXL',
    xxxl: '3XL',
    '3xl': 'XXXL',
    jumbo: 'XXL',
    gedong: 'XXL',
    smal: 'S',
    kecil: 'S',
    sedang: 'M',
    med: 'M',
    larg: 'L',
    besar: 'L',
    eksel: 'XL',

    // Warna / Colors (Gaul, Singkatan & Typo)
    item: 'hitam',
    htm: 'hitam',
    puti: 'putih',
    pti: 'putih',
    pth: 'putih',
    ijo: 'hijau',
    ijoo: 'hijau',
    green: 'hijau',
    mirah: 'merah',
    red: 'merah',
    biru: 'biru',
    blue: 'biru',
    coklat: 'cokelat',
    cklt: 'cokelat',
    brown: 'cokelat',
    abu: 'abu-abu',
    grey: 'abu-abu',
    gray: 'abu-abu',
    kuning: 'kuning',
    yellow: 'kuning',
    oren: 'oranye',
    orange: 'oranye',
    pink: 'merah muda',
    ungu: 'purple',

    // Sasaran / Gender (Gaul & Sehari-hari)
    cewek: 'wanita',
    cewe: 'wanita',
    cwk: 'wanita',
    cwe: 'wanita',
    perempuan: 'wanita',
    girl: 'wanita',
    women: 'wanita',
    lady: 'wanita',
    ciwi: 'wanita',
    ciwi2: 'wanita',
    cowok: 'pria',
    cowo: 'pria',
    cwok: 'pria',
    cwo: 'pria',
    laki: 'pria',
    boy: 'pria',
    men: 'pria',
    man: 'pria',
    cogan: 'pria',
    kapel: 'unisex',
    couple: 'unisex',
    sarimbit: 'unisex',
    netral: 'unisex',

    // Jenis Pakaian & Cutting (Gaul & Sehari-hari)
    atasan: 'kaos',
    tee: 'kaos',
    tshirt: 'kaos',
    bawahan: 'celana',
    pants: 'celana',
    kolor: 'celana pendek',
    celpen: 'celana pendek',
    celpan: 'celana panjang',
    hodi: 'hoodie',
    hudie: 'hoodie',
    switer: 'hoodie',
    sweater: 'hoodie',
    luaran: 'outer',
    gombrong: 'oversize',
    longgar: 'oversize',
    onggrok: 'oversize',
    kebesaran: 'oversize',
    ngepas: 'slim fit',
    ketat: 'slim fit',
    standar: 'regular',
    biasa: 'regular',
  };

  public static isGenericQuery(kw: string): boolean {
    const tokens = toSafeString(kw).toLowerCase().split(/\s+/);
    return (
      tokens.some((w) => this.GENERIC_KEYWORDS.has(w)) ||
      this.GENERIC_KEYWORDS.has(toSafeString(kw).toLowerCase())
    );
  }

  public static parseKeyword(rawKeyword?: any): {
    raw: string;
    safe: string;
    cleaned: string;
    tokens: string[];
    synonym?: string;
  } {
    const raw = toSafeString(rawKeyword).toLowerCase();
    if (!raw) {
      return { raw: '', safe: '', cleaned: '', tokens: [] };
    }

    // Strip special symbols to prevent PostgREST .or() comma/syntax crashes
    const safe = raw.replace(/[^a-z0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim() || raw;
    const allWords = safe.split(/\s+/);

    // Filter out chat noise, filler words, and profanity
    const meaningfulWords = allWords.filter(
      (w) => !this.CHAT_FILLERS.has(w) && !this.PROFANITY.has(w)
    );
    const cleaned = meaningfulWords.join(' ').trim() || safe;
    const tokens = meaningfulWords.filter((w) => w.length > 2);

    // Lookup attribute synonyms and push to tokens (supports multi-word slang expansion)
    // Split multi-word synonym values (e.g. 'celana pendek') into individual tokens for PostgREST safety
    let synonym: string | undefined;
    for (const [key, val] of Object.entries(this.SYNONYM_MAP)) {
      if (cleaned === key || cleaned.includes(key) || safe.includes(key) || allWords.includes(key)) {
        if (!synonym) synonym = val;
        const synParts = val.split(/\s+/).filter(p => p.length > 1);
        for (const sp of synParts) {
          if (!tokens.includes(sp)) tokens.push(sp);
        }
      }
    }

    return { raw, safe, cleaned, tokens, synonym };
  }
}

/**
 * ============================================================================
 * INTERFACES & ARCHITECTURAL CONTRACTS
 * ============================================================================
 */
export interface AiToolHandler<TArgs = any> {
  readonly name: string;
  execute(args: TArgs, db: SupabaseClient): Promise<any>;
}

interface GetOrderDetailsArgs {
  order_id: any; // Allow integer IDs serialized by LLMs
}

interface SearchProductsArgs {
  keyword?: any;
  sort_by?: 'newest' | 'cheapest' | 'most_expensive' | 'popular' | string;
  min_price?: number;
  max_price?: number;
  category?: any;
}

interface EscalateToHumanArgs {
  ticket_id: any;
  reason: any;
}

/**
 * ============================================================================
 * DOMAIN HANDLER: GET ORDER DETAILS
 * ============================================================================
 */
class GetOrderDetailsHandler implements AiToolHandler<GetOrderDetailsArgs> {
  public readonly name = 'get_order_details';

  public async execute(args: GetOrderDetailsArgs, db: SupabaseClient): Promise<any> {
    const cleanId = toSafeString(args?.order_id).replace(/[,().%_\\/]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!cleanId) {
      return { error: 'ID pesanan tidak boleh kosong.' };
    }

    const { data, error } = await db
      .from('orders')
      .select(`
        id, order_number, status, payment_status, total_price, courier, tracking_id, created_at, customer_name, shipping_address,
        order_items ( id, product_name, size, color, quantity, price )
      `)
      .or(`id.eq.${cleanId},order_number.eq.${cleanId}`)
      .maybeSingle();

    if (error || !data) {
      return { error: 'Pesanan tidak ditemukan atau ID pesanan/invoice tidak valid.' };
    }
    return { success: true, order: data };
  }
}

/**
 * ============================================================================
 * DOMAIN HANDLER: SEARCH PRODUCTS (WITH ADVANCED NLP & FALLBACK ARCHITECTURE)
 * ============================================================================
 */
class SearchProductsHandler implements AiToolHandler<SearchProductsArgs> {
  public readonly name = 'search_products';
  private readonly SELECT_FIELDS =
    'id, name, price, description, category, slug, variants(color, size, stock, sku)';

  private readonly AI_ETHICS_INSTRUCTION =
    `INFO PENTING UNTUK AI: Pencarian spesifik user (warna, ukuran, desain) TIDAK DITEMUKAN di database. Produk di bawah ini adalah ALTERNATIF Best Seller. 🚨 ANTI-HALLUCINATION RULES: 1. JANGAN MENGARANG/BERBOHONG bahwa produk di bawah ini memiliki warna/ukuran yang dicari user! Cek array 'variants' secara faktual. 2. JANGAN menjawab "kosong" atau "tidak ada". 3. GUNAKAN POSITIF RESPON: "Wah kak, untuk warna/motif/ukuran tersebut saat ini sedang dalam proses kurasi & pengembangan oleh tim kreatif NINOC ya! 😊 Tapi tenang aja kak, biar style kakak makin kece, yuk cek pilihan best seller NINOC lainnya di bawah ini:" (lalu sebutkan rekomendasi alternatif). 4. JANGAN MENGARANG LINK! Gunakan HANYA format https://ninoc.store/shop/[slug] berdasarkan properti 'slug' dari data produk di bawah.`;

  public async execute(args: SearchProductsArgs, db: SupabaseClient): Promise<any> {
    const { keyword, sort_by, min_price, max_price, category } = args || {};
    const parsedKw = IndonesianNlpEngine.parseKeyword(keyword);

    let query = db.from('products').select(this.SELECT_FIELDS);

    // 1. Apply Category Filter securely
    const catStr = toSafeString(category).replace(/[,().%_\\/]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    if (catStr) {
      query = query.or(`category.ilike.%${catStr}%,name.ilike.%${catStr}%,description.ilike.%${catStr}%`);
    }

    // 2. Apply Price Range Filters
    if (typeof min_price === 'number' && Number.isFinite(min_price) && min_price >= 0) {
      query = query.gte('price', min_price);
    }
    if (typeof max_price === 'number' && Number.isFinite(max_price) && max_price >= 0) {
      query = query.lte('price', max_price);
    }

    // 3. Resolve Sorting Strategy
    query = this.applySortingStrategy(query, toSafeString(sort_by), parsedKw.raw);

    // 4. Apply NLP Keyword Attributes & Variant Search
    if (parsedKw.raw && !IndonesianNlpEngine.isGenericQuery(parsedKw.raw)) {
      query = await this.applyKeywordFilter(db, query, parsedKw);
    }

    const { data, error } = await query.limit(10);

    if (error || !data || data.length === 0) {
      return this.executeFallbackQuery(db, toSafeString(sort_by), parsedKw.raw);
    }

    return { success: true, products: data };
  }

  private applySortingStrategy(query: any, sortBy: string = '', kwRaw: string = ''): any {
    const kw = kwRaw.toLowerCase();
    if (
      sortBy === 'cheapest' ||
      kw.includes('termurah') ||
      kw.includes('paling murah') ||
      kw === 'murah'
    ) {
      return query.order('price', { ascending: true });
    } else if (
      sortBy === 'most_expensive' ||
      kw.includes('termahal') ||
      kw.includes('paling mahal') ||
      kw === 'mahal'
    ) {
      return query.order('price', { ascending: false });
    } else if (
      sortBy === 'newest' ||
      kw.includes('terbaru') ||
      kw.includes('new arrival') ||
      kw.includes('baru')
    ) {
      return query.order('created_at', { ascending: false });
    } else if (
      sortBy === 'popular' ||
      kw.includes('terlaris') ||
      kw.includes('best seller') ||
      kw.includes('paling laris') ||
      kw.includes('rekomendasi') ||
      kw.includes('favorit')
    ) {
      return query.order('created_at', { ascending: false });
    }
    return query.order('created_at', { ascending: false });
  }

  private async applyKeywordFilter(
    db: SupabaseClient,
    query: any,
    parsedKw: ReturnType<typeof IndonesianNlpEngine.parseKeyword>
  ): Promise<any> {
    const { safe, cleaned, tokens, synonym } = parsedKw;

    // Build unique search terms, filtering out empty strings or single-character noise
    // and stripping PostgREST delimiter characters
    const validTerms = Array.from(new Set([safe, cleaned, synonym, ...tokens]))
      .map(t => (t || '').replace(/[,().%_\\/]/g, ' ').replace(/\s+/g, ' ').trim())
      .filter((t) => t && t.length > 1);

    // If query was entirely punctuation or emojis and produced no valid search terms, return early
    if (validTerms.length === 0) {
      return query;
    }

    try {
      // Build variant search clause dynamically to prevent empty ilike patterns (.ilike.%%)
      const varOrClauses = validTerms
        .slice(0, 4)
        .flatMap((t) => [`size.ilike.%${t}%,color.ilike.%${t}%,sku.ilike.%${t}%`]);

      const { data: varData } = await db
        .from('variants')
        .select('product_id')
        .or(varOrClauses.join(','))
        .gt('stock', 0)
        .limit(30);

      const variantProductIds = Array.from(
        new Set(varData?.map((v) => v.product_id).filter(Boolean) || [])
      );

      if (variantProductIds.length > 0) {
        return query.in('id', variantProductIds.slice(0, 30));
      }
    } catch (err) {
      console.warn('[SearchProductsHandler] Variant search warning:', err);
    }

    // Fallback to name/description search without allowing empty .ilike.%% patterns
    const orClauses = validTerms
      .slice(0, 5)
      .flatMap((t) => [`name.ilike.%${t}%`, `description.ilike.%${t}%`, `category.ilike.%${t}%`]);

    if (orClauses.length > 0) {
      return query.or(Array.from(new Set(orClauses)).join(','));
    }
    return query;
  }

  private async executeFallbackQuery(
    db: SupabaseClient,
    sortBy: string = '',
    kwRaw: string = ''
  ): Promise<any> {
    let fallbackQuery = db.from('products').select(this.SELECT_FIELDS);
    const kw = kwRaw.toLowerCase();

    if (sortBy === 'cheapest' || kw.includes('termurah') || kw.includes('murah')) {
      fallbackQuery = fallbackQuery.order('price', { ascending: true });
    } else if (sortBy === 'most_expensive' || kw.includes('termahal') || kw.includes('mahal')) {
      fallbackQuery = fallbackQuery.order('price', { ascending: false });
    } else {
      fallbackQuery = fallbackQuery.order('created_at', { ascending: false });
    }

    const { data: fallbackData } = await fallbackQuery.limit(6);
    if (fallbackData && fallbackData.length > 0) {
      return {
        success: true,
        note: this.AI_ETHICS_INSTRUCTION,
        products: fallbackData,
      };
    }
    return { error: 'Tidak ditemukan produk di database.' };
  }
}

/**
 * ============================================================================
 * DOMAIN HANDLER: ESCALATE TO HUMAN AGENT
 * ============================================================================
 */
class EscalateToHumanHandler implements AiToolHandler<EscalateToHumanArgs> {
  public readonly name = 'escalate_to_human';

  public async execute(args: EscalateToHumanArgs, db: SupabaseClient): Promise<any> {
    const ticket_id = toSafeString(args?.ticket_id);
    const reason = toSafeString(args?.reason);

    if (!ticket_id || !reason) {
      return { error: 'ticket_id dan reason wajib diisi.' };
    }

    const { error } = await db
      .from('support_tickets')
      .update({ status: 'escalated' })
      .eq('id', ticket_id);

    if (error) {
      return { error: 'Failed to escalate ticket.' };
    }

    // Insert audit log / system message
    await db.from('support_messages').insert({
      ticket_id,
      sender_id: null,
      sender_role: 'admin',
      message: `[SYSTEM] Ticket escalated to human agent. Reason: ${reason}`,
      is_auto_reply: true,
    });

    return { success: true, message: 'Ticket escalated.' };
  }
}

/**
 * ============================================================================
 * COMMAND REGISTRY & DISPATCHER (OPEN/CLOSED PRINCIPLE)
 * ============================================================================
 * Manages tool registrations and routes execution without procedural switch blocks.
 */
class AiToolRegistry {
  private static instance: AiToolRegistry;
  private readonly handlers = new Map<string, AiToolHandler>();

  private constructor() {
    this.register(new GetOrderDetailsHandler());
    this.register(new SearchProductsHandler());
    this.register(new EscalateToHumanHandler());
  }

  public static getInstance(): AiToolRegistry {
    if (!AiToolRegistry.instance) {
      AiToolRegistry.instance = new AiToolRegistry();
    }
    return AiToolRegistry.instance;
  }

  public register(handler: AiToolHandler): void {
    this.handlers.set(handler.name, handler);
  }

  public async dispatch(name: string, args: Record<string, any>): Promise<any> {
    const handler = this.handlers.get(name);
    if (!handler) {
      return { error: `Unknown tool ${name}` };
    }

    try {
      const db = getDbClient();
      return await handler.execute(args || {}, db);
    } catch (err: any) {
      console.error(`[AiToolRegistry] Execution error for tool '${name}':`, err?.message || err);
      return { error: `Internal tool error: ${err?.message || 'Unknown error'}` };
    }
  }
}

/**
 * ============================================================================
 * PUBLIC ENTRY POINT
 * ============================================================================
 * Executes the requested AI tool by name using the Command Registry.
 */
export async function executeAiTool(name: string, args: Record<string, any>): Promise<any> {
  return AiToolRegistry.getInstance().dispatch(name, args);
}
