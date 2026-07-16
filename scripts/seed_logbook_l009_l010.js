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
    entry_id: 'L-009',
    title: 'Obsesi Hardware: Presisi Akhir YKK Excella',
    title_en: 'HARDWARE OBSESSION: THE YKK EXCELLA FINISH',
    slug: 'hardware-obsession',
    category: 'PROCESS',
    excerpt: 'Tinjauan mikroskopis terhadap toleransi ritsleting dan alasan mengapa hardware standar gagal bertahan satu dekade. Mengapa kami mewajibkan ritsleting YKK Excella pada seluruh garmen luaran.',
    excerpt_en: 'A microscopic look at zipper tolerances and why standard hardware fails the decade test. Why we mandate YKK Excella zippers across all outer garments.',
    content: `Kebanyakan brand fashion memperlakukan hardware hanya sebagai pelengkap — penutup logam generik yang dipilih semata-mata berdasarkan harga termurah demi memaksimalkan margin keuntungan. Bagi kami, hardware adalah tulang punggung mekanis dari sebuah garmen.\n\nKetika Anda mengenakan jaket berbobot berat atau mantel kanvas selama lima, tujuh, hingga sepuluh tahun ke depan, kainnya hampir tidak pernah rusak lebih dulu. Yang pertama kali mengalami kerusakan adalah hardware: gigi ritsleting mulai tidak sejajar, lapisan sepuhan terkelupas, dan tarikan patah akibat tarikan harian. Begitu ritsleting rusak, seluruh keutuhan fungsional garmen tersebut hancur.\n\nItulah sebabnya setiap garmen berat NINOC secara eksklusif menggunakan YKK Excella — kasta tertinggi dari hardware berpoles presisi yang diproduksi di Jepang. Berbeda dengan ritsleting cetak standar yang giginya memiliki gerigi mikro yang secara perlahan mengikis dan merusak tepi kain sekitarnya setelah ribuan kali ditarik, gigi YKK Excella dipoles secara individual sebelum dirakit. Setiap elemen terasa halus, berbobot, dan dilapisi presisi.\n\nSensasi menarik ritsleting Excella sangatlah khas. Tidak ada hambatan, tidak ada nyangkut, dan tidak ada suara berderak kasar — hanya pergerakan mekanis yang begitu mulus dan berbobot, terasa lebih dekat dengan presisi arloji mewah dibanding konveksi pakaian biasa.\n\nKami tidak memilih YKK Excella karena harganya murah; biayanya bisa mencapai enam kali lipat dari ritsleting komersial biasa. Kami memilihnya karena ketika Anda merancang pakaian untuk diarsipkan dan diwariskan, bukan dibuang musim depan, hardware Anda harus mampu bertahan lebih lama daripada kain yang menopangnya.`,
    content_en: `Most fashion brands treat hardware as an afterthought — a generic metal closure chosen solely on unit cost to maximize margin. We treat hardware as the load-bearing spine of the garment.\n\nWhen you wear a heavy jacket or canvas coat over five, seven, or ten years, the fabric rarely fails first. What breaks down is the hardware: slider teeth misalign, electroplated coatings chip off, and pullers snap under stress. Once the zipper fails, the entire silhouette becomes dysfunctional.\n\nThat is why every NINOC heavy garment strictly utilizes YKK Excella — the highest tier of polished hardware produced in Japan. Unlike standard stamped zippers whose teeth have microscopic burrs that slowly chew and abrade surrounding textile edges over thousands of zips, Excella teeth are individually polished before assembly. Every element is smooth, weighty, and precision-plated.\n\nThe sensation of pulling an Excella slider is unmistakable. There is no resistance, no catching, and no abrasive rattle — only a smooth, weighted mechanical glide that feels closer to precision horology than apparel manufacturing.\n\nWe do not choose YKK Excella because it is inexpensive; it costs up to six times more than standard commercial closures. We choose it because when you design clothing intended to be passed down and archived rather than discarded next season, your hardware must outlive the fabric that holds it.`,
    image_url: '/images/logbook/l009.png',
    published_date: '2026-01-18'
  },
  {
    entry_id: 'L-010',
    title: 'Mengapa Kami Membangun untuk Arsip, Bukan untuk Musim',
    title_en: 'WHY WE BUILD FOR THE ARCHIVE, NOT THE SEASON',
    slug: 'build-for-archive',
    category: 'MANIFESTO',
    excerpt: 'Fast fashion membusuk. Garmen arsip mengapresiasi nilai. Filosofi mendasar di balik metode konstruksi NINOC dan mengapa kami menolak keusangan musiman.',
    excerpt_en: 'Fast fashion decays. Archival garments appreciate. The foundational philosophy behind the NINOC construction method and why we reject seasonal obsolescence.',
    content: `Industri fashion modern bekerja di atas keusangan yang terencana. Sistem ini bergantung pada musim buatan, tren mikro instan, dan penurunan kualitas yang disengaja agar Anda terpaksa membeli ulang pakaian setiap beberapa bulan. Itu adalah sistem yang dibangun di atas pembusukan.\n\nDi NINOC Studio, kami menolak gagasan bahwa pakaian memiliki tanggal kedaluwarsa. Kami berpegang teguh pada prinsip ketahanan arsip: menciptakan objek-objek yang integritas struktur dan relevansi visualnya justru semakin matang seiring bertambahnya usia.\n\nMetode konstruksi kami bermula dari bobot kain dan kerapatan tenunan. Kami mengkurasi katun berbobot berat serat panjang serta campuran kanvas deadstock yang membutuhkan masa adaptasi awal. Seperti denim selvedge mentah atau kulit full-grain, garmen ini terasa kaku di hari pertama, namun setelah bertahun-tahun dipakai, kainnya akan menyesuaikan diri dengan kontur tubuh Anda, membentuk lipatan unik, pudar alami, dan dinamika jatuh kain yang berkarakter.\n\nSetiap sambungan jahitan diperkuat dengan double-needle chain stitching dan bar tack berkerapatan tinggi pada titik-titik tekanan maksimal. Kami membuang karet elastis sintetis yang mudah melar dan mati seiring waktu, menggantinya dengan rekayasa pola mekanis serta potongan yang memberi ruang gerak alami.\n\nKetika kami merilis sebuah garmen, kami tidak pernah bertanya apakah warnanya cocok dengan tren musim semi/panas 2026. Kami bertanya apakah seseorang yang menemukan pakaian ini di arsip vintage pada tahun 2046 kelak akan langsung mengenali keaslian kualitas dan pengerjaannya tanpa ragu.\n\nKami tidak merancang untuk musim ini. Kami membangun untuk arsip jangka panjang.`,
    content_en: `The modern fashion industry operates on planned obsolescence. It relies on artificial seasons, manufactured micro-trends, and deliberate quality degradation to force you to repurchase a wardrobe twice a year. It is a system built on decay.\n\nAt NINOC Studio, we reject the idea that clothing should expire. We operate on the principle of archival longevity: creating objects whose structural integrity and aesthetic relevance only deepen with age.\n\nOur construction method begins with fabric weight and weave density. We source heavyweight, high-twist long-staple cottons and deadstock canvas blends that require an initial break-in period. Like raw selvedge denim or full-grain leather, these garments are stiff on day one, but over years of wear, they conform precisely to the contours of your body, developing unique creases, fading patterns, and drape dynamics.\n\nEvery seam is reinforced with double-needle chain stitching and high-density bar tacks at maximum stress points. We eliminate unnecessary synthetic elastics that degrade and lose memory over time, relying instead on mechanical pattern engineering and generous allowances for freedom of movement.\n\nWhen we release a garment, we do not ask whether it aligns with the color palette of Spring/Summer 2026. We ask whether someone pulling this exact piece from a vintage archive in 2046 will immediately recognize its uncompromising craftsmanship and integrity.\n\nWe do not design for the season. We build for the archive.`,
    image_url: '/images/logbook/l010.png',
    published_date: '2026-03-02'
  }
];

async function run() {
  for (const item of entries) {
    const { data, error } = await supabase
      .from('logbook_entries')
      .upsert(item, { onConflict: 'slug' })
      .select();
    if (error) {
      console.error(`Error inserting ${item.entry_id}:`, error.message);
    } else {
      console.log(`Successfully upserted ${item.entry_id} (${item.slug}) with full content.`);
    }
  }
}

run();
