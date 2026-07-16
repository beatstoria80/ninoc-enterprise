-- Migration: Replace dummy placeholder content on L-009 and L-010 with full archival articles and illustrations
INSERT INTO public.logbook_entries (
    entry_id, 
    title, 
    title_en, 
    slug, 
    category, 
    excerpt, 
    excerpt_en, 
    content, 
    content_en, 
    image_url, 
    published_date
) VALUES 
(
    'L-009',
    'Obsesi Hardware: Presisi Akhir YKK Excella',
    'HARDWARE OBSESSION: THE YKK EXCELLA FINISH',
    'hardware-obsession',
    'PROCESS',
    'Tinjauan mikroskopis terhadap toleransi ritsleting dan alasan mengapa hardware standar gagal bertahan satu dekade. Mengapa kami mewajibkan ritsleting YKK Excella pada seluruh garmen luaran.',
    'A microscopic look at zipper tolerances and why standard hardware fails the decade test. Why we mandate YKK Excella zippers across all outer garments.',
    $$Kebanyakan brand fashion memperlakukan hardware hanya sebagai pelengkap — penutup logam generik yang dipilih semata-mata berdasarkan harga termurah demi memaksimalkan margin keuntungan. Bagi kami, hardware adalah tulang punggung mekanis dari sebuah garmen.

Ketika Anda mengenakan jaket berbobot berat atau mantel kanvas selama lima, tujuh, hingga sepuluh tahun ke depan, kainnya hampir tidak pernah rusak lebih dulu. Yang pertama kali mengalami kerusakan adalah hardware: gigi ritsleting mulai tidak sejajar, lapisan sepuhan terkelupas, dan tarikan patah akibat tarikan harian. Begitu ritsleting rusak, seluruh keutuhan fungsional garmen tersebut hancur.

Itulah sebabnya setiap garmen berat NINOC secara eksklusif menggunakan YKK Excella — kasta tertinggi dari hardware berpoles presisi yang diproduksi di Jepang. Berbeda dengan ritsleting cetak standar yang giginya memiliki gerigi mikro yang secara perlahan mengikis dan merusak tepi kain sekitarnya setelah ribuan kali ditarik, gigi YKK Excella dipoles secara individual sebelum dirakit. Setiap elemen terasa halus, berbobot, dan dilapisi presisi.

Sensasi menarik ritsleting Excella sangatlah khas. Tidak ada hambatan, tidak ada nyangkut, dan tidak ada suara berderak kasar — hanya pergerakan mekanis yang begitu mulus dan berbobot, terasa lebih dekat dengan presisi arloji mewah dibanding konveksi pakaian biasa.

Kami tidak memilih YKK Excella karena harganya murah; biayanya bisa mencapai enam kali lipat dari ritsleting komersial biasa. Kami memilihnya karena ketika Anda merancang pakaian untuk diarsipkan dan diwariskan, bukan dibuang musim depan, hardware Anda harus mampu bertahan lebih lama daripada kain yang menopangnya.$$,
    $$Most fashion brands treat hardware as an afterthought — a generic metal closure chosen solely on unit cost to maximize margin. We treat hardware as the load-bearing spine of the garment.

When you wear a heavy jacket or canvas coat over five, seven, or ten years, the fabric rarely fails first. What breaks down is the hardware: slider teeth misalign, electroplated coatings chip off, and pullers snap under stress. Once the zipper fails, the entire silhouette becomes dysfunctional.

That is why every NINOC heavy garment strictly utilizes YKK Excella — the highest tier of polished hardware produced in Japan. Unlike standard stamped zippers whose teeth have microscopic burrs that slowly chew and abrade surrounding textile edges over thousands of zips, Excella teeth are individually polished before assembly. Every element is smooth, weighty, and precision-plated.

The sensation of pulling an Excella slider is unmistakable. There is no resistance, no catching, and no abrasive rattle — only a smooth, weighted mechanical glide that feels closer to precision horology than apparel manufacturing.

We do not choose YKK Excella because it is inexpensive; it costs up to six times more than standard commercial closures. We choose it because when you design clothing intended to be passed down and archived rather than discarded next season, your hardware must outlive the fabric that holds it.$$,
    '/images/logbook/l009.png',
    '2026-01-18'
),
(
    'L-010',
    'Mengapa Kami Membangun untuk Arsip, Bukan untuk Musim',
    'WHY WE BUILD FOR THE ARCHIVE, NOT THE SEASON',
    'build-for-archive',
    'MANIFESTO',
    'Fast fashion membusuk. Garmen arsip mengapresiasi nilai. Filosofi mendasar di balik metode konstruksi NINOC dan mengapa kami menolak keusangan musiman.',
    'Fast fashion decays. Archival garments appreciate. The foundational philosophy behind the NINOC construction method and why we reject seasonal obsolescence.',
    $$Industri fashion modern bekerja di atas keusangan yang terencana. Sistem ini bergantung pada musim buatan, tren mikro instan, dan penurunan kualitas yang disengaja agar Anda terpaksa membeli ulang pakaian setiap beberapa bulan. Itu adalah sistem yang dibangun di atas pembusukan.

Di NINOC Studio, kami menolak gagasan bahwa pakaian memiliki tanggal kedaluwarsa. Kami berpegang teguh pada prinsip ketahanan arsip: menciptakan objek-objek yang integritas struktur dan relevansi visualnya justru semakin matang seiring bertambahnya usia.

Metode konstruksi kami bermula dari bobot kain dan kerapatan tenunan. Kami mengkurasi katun berbobot berat serat panjang serta campuran kanvas deadstock yang membutuhkan masa adaptasi awal. Seperti denim selvedge mentah atau kulit full-grain, garmen ini terasa kaku di hari pertama, namun setelah bertahun-tahun dipakai, kainnya akan menyesuaikan diri dengan kontur tubuh Anda, membentuk lipatan unik, pudar alami, dan dinamika jatuh kain yang berkarakter.

Setiap sambungan jahitan diperkuat dengan double-needle chain stitching dan bar tack berkerapatan tinggi pada titik-titik tekanan maksimal. Kami membuang karet elastis sintetis yang mudah melar dan mati seiring waktu, menggantinya dengan rekayasa pola mekanis serta potongan yang memberi ruang gerak alami.

Ketika kami merilis sebuah garmen, kami tidak pernah bertanya apakah warnanya cocok dengan tren musim semi/panas 2026. Kami bertanya apakah seseorang yang menemukan pakaian ini di arsip vintage pada tahun 2046 kelak akan langsung mengenali keaslian kualitas dan pengerjaannya tanpa ragu.

Kami tidak merancang untuk musim ini. Kami membangun untuk arsip jangka panjang.$$,
    $$The modern fashion industry operates on planned obsolescence. It relies on artificial seasons, manufactured micro-trends, and deliberate quality degradation to force you to repurchase a wardrobe twice a year. It is a system built on decay.

At NINOC Studio, we reject the idea that clothing should expire. We operate on the principle of archival longevity: creating objects whose structural integrity and aesthetic relevance only deepen with age.

Our construction method begins with fabric weight and weave density. We source heavyweight, high-twist long-staple cottons and deadstock canvas blends that require an initial break-in period. Like raw selvedge denim or full-grain leather, these garments are stiff on day one, but over years of wear, they conform precisely to the contours of your body, developing unique creases, fading patterns, and drape dynamics.

Every seam is reinforced with double-needle chain stitching and high-density bar tacks at maximum stress points. We eliminate unnecessary synthetic elastics that degrade and lose memory over time, relying instead on mechanical pattern engineering and generous allowances for freedom of movement.

When we release a garment, we do not ask whether it aligns with the color palette of Spring/Summer 2026. We ask whether someone pulling this exact piece from a vintage archive in 2046 will immediately recognize its uncompromising craftsmanship and integrity.

We do not design for the season. We build for the archive.$$,
    '/images/logbook/l010.png',
    '2026-03-02'
)
ON CONFLICT (slug) DO UPDATE SET
    entry_id = EXCLUDED.entry_id,
    title = EXCLUDED.title,
    title_en = EXCLUDED.title_en,
    category = EXCLUDED.category,
    excerpt = EXCLUDED.excerpt,
    excerpt_en = EXCLUDED.excerpt_en,
    content = EXCLUDED.content,
    content_en = EXCLUDED.content_en,
    image_url = EXCLUDED.image_url,
    published_date = EXCLUDED.published_date,
    updated_at = timezone('utc'::text, now());
