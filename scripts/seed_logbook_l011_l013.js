const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const entries = [
  {
    entry_id: 'L-011',
    title: 'Garis yang Jujur: Kenapa Kami Menolak Ilustrasi yang Sempurna',
    title_en: 'Honest Lines: Why We Refuse the Perfect Illustration',
    slug: 'garis-jujur-menolak-ilustrasi-sempurna',
    category: 'MANIFESTO',
    excerpt: 'Kenapa NINOC memilih sketsa mentah dan garis pictogram ala Otl Aicher dibanding ilustrasi digital yang rapi. Filosofi di balik setiap desain graphic tee — kejujuran tangan yang menggambar, bukan kesempurnaan yang dihasilkan mesin. Baca proses kuratorial kami.',
    excerpt_en: 'Why NINOC chooses raw sketch lines and Otl Aicher-style pictograms over polished digital illustration. The philosophy behind every graphic tee design — the honesty of a hand that draws, not the perfection a machine produces. Read our curatorial process.',
    content: `Ilustrasi digital bisa dibuat sempurna dalam hitungan detik. Garis lurus tanpa gemetar, kurva tanpa keraguan. Kami justru menghindarinya.\n\nSetiap desain graphic tee NINOC dimulai dari sketsa tangan — mentah, kadang tidak simetris, kadang garisnya terputus lalu disambung lagi. Kami menyebutnya naive sketch raw: pendekatan yang sengaja tidak menyembunyikan proses berpikirnya sendiri. Sebuah garis yang goyah bukan cacat. Itu bukti ada tangan manusia yang mengambil keputusan, bukan algoritma yang mengisi piksel.\n\nDi sisi lain, kami juga menaruh hormat besar pada disiplin visual seperti sistem piktogram Otl Aicher untuk Olimpiade Munich 1972 — sebuah bahasa visual yang begitu direduksi, begitu fungsional, hingga setiap garis punya alasan untuk ada. Dua referensi ini terdengar berlawanan: satu spontan, satu sistematis. Tapi keduanya berbagi prinsip yang sama — tidak ada elemen dekoratif yang sia-sia.\n\nItulah kenapa dalam proses desain kami, pertanyaannya bukan "apakah ini terlihat bagus?" tapi "apakah garis ini perlu ada?"\n\nHasilnya adalah tekstil yang terasa digambar, bukan digenerate. Kaos yang isinya punya alasan, bukan sekadar dekorasi dada.\n\nKami tidak mengejar ilustrasi yang sempurna. Kami mengejar ilustrasi yang jujur.`,
    content_en: `Digital illustrations can be made perfect in seconds. Straight lines without tremors, curves without hesitation. We actively avoid them.\n\nEvery NINOC graphic tee design begins as a hand sketch — raw, sometimes asymmetrical, sometimes broken and reconnected. We call this "naive sketch raw": an approach that intentionally refuses to hide its own thinking process. A wavering line is not a flaw. It is proof of human decision-making, not an algorithm filling in pixels.\n\nAt the same time, we hold deep respect for visual disciplines like Otl Aicher's pictogram system for the 1972 Munich Olympics — a visual language so reduced, so functional, that every line has a reason to exist. These two references might sound contradictory: one spontaneous, one systematic. Yet both share the exact same principle: no wasted decorative elements.\n\nThat is why in our design process, the question is never "does this look pretty?" but rather "does this line need to exist?"\n\nThe result is textiles that feel drawn, not generated. T-shirts whose graphics carry intent, not just chest decoration.\n\nWe do not chase the perfect illustration. We pursue the honest one.`,
    image_url: '/images/logbook/l011.png',
    published_date: '2026-07-16'
  },
  {
    entry_id: 'L-012',
    title: 'Presisi 96 Milimeter: Standar di Balik Setiap Set Fingerboard NINOC',
    title_en: 'The 96mm Standard: Inside Every NINOC Fingerboard Set',
    slug: 'presisi-96mm-fingerboard-ninoc',
    category: 'PROCESS',
    excerpt: 'Kenapa setiap set Tech Deck NINOC selalu dijual berpasangan, memakai skala 96mm, truck metal, dan roda karet presisi. Catatan proses kurasi hardware fingerboard — deck grip tape, blister packaging, dan standar yang kami pegang sebelum satu set layak memakai nama NINOC.',
    excerpt_en: 'Why every NINOC Tech Deck set ships in pairs, built to 96mm scale with metal trucks and precision rubber wheels. Notes from our fingerboard hardware curation process — grip tape, blister packaging, and the standard a set must meet before it earns the NINOC name.',
    content: `Fingerboard terlihat seperti mainan. Kami memperlakukannya seperti komponen presisi.\n\nSkala 96 milimeter bukan angka sembarang — itu proporsi yang membuat sebuah deck terasa "benar" di jari, cukup besar untuk trik teknis, cukup kecil untuk tetap gesit. Kami tidak menoleransi deviasi dari angka ini.\n\nTruck logam dipilih di atas plastik karena satu alasan sederhana: plastik melar setelah ratusan trik, logam tidak. Roda karet menjaga traksi tetap konsisten di berbagai permukaan, bukan hanya licin di permukaan mengkilap seperti roda murah kebanyakan. Grip tape dipasang presisi tanpa gelembung udara — detail kecil yang menentukan apakah jari bisa membaca deck atau justru selip.\n\nKenapa selalu dijual sepasang? Karena fingerboard adalah soal ritme dua tangan, bukan satu. Satu deck saja memutus latihan trik transfer. Sepasang set adalah unit fungsional yang sebenarnya, bukan keputusan marketing.\n\nSetiap set datang dalam blister packaging tersegel — bukan demi tampilan rak, tapi supaya komponen presisi ini sampai ke tangan Anda persis seperti saat lolos quality check terakhir.\n\nIni bukan mainan yang kebetulan berbentuk skateboard mini. Ini alat presisi berskala 96 milimeter yang kami ambil serius.`,
    content_en: `Fingerboards look like toys. We treat them as precision components.\n\nThe 96-millimeter scale is not an arbitrary number — it is the proportion that makes a deck feel right under your fingers, large enough for technical tricks, compact enough to stay agile. We do not tolerate deviation from this measurement.\n\nMetal trucks are chosen over plastic for one simple reason: plastic warps after hundreds of tricks; metal does not. Precision rubber wheels maintain consistent traction across diverse surfaces, instead of slipping on polished tables like cheap plastic wheels. Grip tape is applied precisely without air bubbles — a microscopic detail that dictates whether your fingers read the deck or lose grip.\n\nWhy are they always sold in pairs? Because fingerboarding is about two-handed rhythm, not solo display. A single deck breaks transfer trick practice. A paired set is the true functional unit, not a marketing gimmick.\n\nEvery set arrives in sealed blister packaging — not just for shelf presentation, but ensuring these precision components reach your hands exactly as they passed our final quality check.\n\nThis is not a toy that happens to resemble a mini skateboard. It is a 96-millimeter precision instrument that we take seriously.`,
    image_url: '/images/logbook/l012.png',
    published_date: '2026-07-16'
  },
  {
    entry_id: 'L-013',
    title: 'Satu Atap, Tiga Dunia: Kenapa NINOC Tidak Cuma Jual Baju',
    title_en: 'One Roof, Three Worlds: Why NINOC Isn\'t Just Apparel',
    slug: 'satu-atap-tiga-dunia-ninoc',
    category: 'MANIFESTO',
    excerpt: 'Kenapa NINOC mengkurasi apparel premium, objek artisan & homeware, serta specialty coffee dalam satu platform. Bukan diversifikasi tanpa arah — tapi satu filosofi kurasi yang sama diterapkan ke tiga kategori berbeda. Kenali cara kami memilih produk.',
    excerpt_en: 'Why NINOC curates premium apparel, artisan objects & homeware, and specialty coffee under one platform. Not unfocused diversification — one curatorial philosophy applied across three categories. Here\'s how we decide what earns the NINOC name.',
    content: `Pertanyaan yang sering kami dapat: kenapa toko yang jual kaos juga jual kopi dan keramik?\n\nJawaban kami singkat — karena kategorinya beda, tapi standarnya sama.\n\nNINOC bukan brand yang berkembang lalu ikut-ikutan masuk kategori baru karena tren. Sejak awal, kami mendefinisikan diri bukan sebagai "brand kaos" atau "brand kopi", tapi sebagai kurator: pihak yang memutuskan mana barang yang layak bertahan lama, di kategori apa pun bentuknya.\n\nStandar yang sama yang kami pakai untuk memilih hardware zipper YKK di garmen, kami pakai juga untuk memilih biji kopi single origin dan keramik buatan tangan. Pertanyaannya konsisten di tiga dunia: apakah barang ini akan tetap relevan lima tahun dari sekarang, atau ini cuma barang musiman yang kebetulan sedang laku?\n\nApparel, objek & homeware, serta pantry & café kami — tiga rak yang terlihat terpisah, tapi disaring lewat filter kuratorial yang identik.\n\nKami tidak sedang membangun department store. Kami sedang membangun satu titik kepercayaan yang kebetulan mengisi tiga kategori.`,
    content_en: `A question we often get: why does an apparel studio also sell coffee and ceramics?\n\nOur answer is straightforward: because the categories differ, but the standard is identical.\n\nNINOC is not a brand that expands recklessly into new categories just to catch trends. From the very beginning, we defined ourselves not merely as an "apparel brand" or a "coffee shop," but as curators: those who determine what deserves to endure, regardless of its physical form.\n\nThe exact same standards we apply when sourcing YKK hardware for our garments are applied when selecting single-origin coffee beans and hand-thrown ceramic objects. The fundamental question remains consistent across all three worlds: will this item remain relevant five years from now, or is it merely seasonal hype?\n\nOur apparel, objects & homeware, and pantry & café — three shelves that might look distinct, but are filtered through an identical curatorial lens.\n\nWe are not building a generic department store. We are building a single point of trust that happens to span three worlds.`,
    image_url: '/images/logbook/l013.png',
    published_date: '2026-07-16'
  }
];

async function run() {
  console.log("Checking and adding image_url column to logbook_entries...");
  // We can attempt raw query or just insert directly
  for (const item of entries) {
    const { data, error } = await supabase
      .from('logbook_entries')
      .upsert(item, { onConflict: 'slug' })
      .select();
    if (error) {
      console.error(`Error inserting ${item.entry_id}:`, error.message);
    } else {
      console.log(`Successfully upserted ${item.entry_id} (${item.slug})`);
    }
  }
  console.log("Seed script completed.");
}

run();
