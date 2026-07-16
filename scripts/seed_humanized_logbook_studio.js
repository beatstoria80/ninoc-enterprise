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
    entry_id: 'L-013',
    title: 'Satu Atap, Tiga Dunia: Kurasi Silang Apparel, Objek Artisan, dan Specialty Coffee',
    title_en: 'ONE ROOF, THREE WORLDS: CURATING APPAREL, ARTISAN OBJECTS, AND SPECIALTY COFFEE',
    slug: 'satu-atap-tiga-dunia-ninoc',
    category: 'MANIFESTO',
    excerpt: 'Mengurai benang merah mengapa jaket kanvas 310 gsm, gelas keramik pembakaran tinggi, dan ekstraksi espresso 9 bar berada di bawah satu filter kurasi yang ketat. Bukan tentang menjual barang komoditas, melainkan membangun ekosistem ritel yang mengapresiasi waktu.',
    excerpt_en: 'Deconstructing the shared DNA between 310 gsm heavy-loop canvas jackets, high-fired ceramic vessels, and 9-bar espresso extractions. Why we reject disjointed retail in favor of an ecosystem governed by tactile longevity.',
    content: `Bagi pengamat luar, menyatukan lini garmen berat, objek keramik artisan, dan specialty coffee di dalam satu payung studio mungkin terlihat seperti dispersi fokus. Dalam kamus ritel konvensional, setiap kategori harus diverika dan dipisahkan demi efisiensi gudang serta optimasi algoritma periklanan. Namun di NINOC Studio, kami tidak sedang membangun supermarket komoditas. Kami membangun sebuah ekosistem kebiasaan hidup (living habit).

Benang merah yang mengikat ketiga dunia ini bukanlah tren gaya hidup, melainkan satu standar teknis yang ketat: ketahanan materi terhadap ujian waktu. Ketika kami memotong kain kanvas katun bergramasi 310 gsm di meja potong Bandung, kami mencari karakteristik yang persis sama saat kami menguji ketahanan termal gelas keramik stonewear hasil pembakaran tungku 1.220 derajat Celsius, atau saat kami mengalibrasi profil ekstraksi mesin espresso pada tekanan konstan 9 bar.

Ketiganya menuntut kejujuran material. Sebuah t-shirt berkatun serat panjang (long-staple cotton) tidak bisa membohongi kulit setelah melalui sepuluh kali pencucian industri; lipatan lehernya (rib collar) akan bertahan atau melar. Begitu pula dengan biji kopi arabika yang disangrai dengan kurva penurunan panas yang presisi—rasa manis alaminya tidak membutuhkan gula tambahan untuk menutupi kecacatan sangrai.

> "Kurasi bukan tentang mengumpulkan sebanyak mungkin barang bagus. Kurasi adalah keberanian untuk menolak 99 persen material yang mudah lapuk demi mempertahankan 1 persen esensi yang bertahan lintas dekade."

Di bawah atap NINOC, ketiga dunia ini saling melengkapi ritme keseharian Anda: pakaian yang memberi kebebasan gerak dan perlindungan termal saat bekerja, objek homeware yang menenangkan ruang personal, dan secangkir kopi dengan ekstraksi bersih yang memicu ketajaman fokus. Kami tidak sekadar menjual produk; kami menyodorkan standar materialitas yang bisa Anda pegang, rasakan, dan wariskan.`,
    content_en: `To an outside observer, housing heavy archival apparel, artisan stoneware, and specialty coffee under a single studio banner might resemble a diluted focus. In traditional retail textbooks, every product tier must be siloed to optimize fulfillment matrices and targeted ad budgets. At NINOC Studio, however, we are not operating a transactional commodity house. We are constructing an ecosystem governed by tactile longevity.

The common thread binding these three distinct practices is not a fleeting lifestyle aesthetic, but an unyielding technical baseline: material integrity under sustained daily friction. When our master cutters grade 310 gsm high-twist cotton canvas on the cutting tables of Bandung, they look for the exact same structural resilience that our ceramists demand from high-fired stoneware fired at 1,220 degrees Celsius, or that our baristas require from a steady 9-bar espresso extraction curve.

All three disciplines demand absolute material honesty. A garment engineered from long-staple cotton jersey cannot hide behind surface finishes after ten cycles in an industrial wash; its high-density 2x1 ribbed collar either retains its memory or collapses. Similarly, specialty arabica beans roasted with meticulous rate-of-rise profiling require no artificial sweetness to mask vegetal defects.

> "True curation is not the accumulation of objects. It is the ruthless discipline of rejecting 99 percent of disposable market noise to preserve the 1 percent of craftsmanship that endures for decades."

Under the NINOC roof, these three worlds synchronize with your daily rituals: heavy garments that provide structural confidence and mechanical ease, artisan objects that anchor your personal sanctum, and clean coffee extractions that sharpen daily discipline. We do not merely retail items; we curate physical standards engineered to be lived in, aged naturally, and passed down.`,
    image_url: '/images/logbook/l013.png',
    published_date: '2026-07-16'
  },
  {
    entry_id: 'L-012',
    title: 'Presisi Skala 96 Milimeter: Anatomi Mekanis dan Toleransi di Balik Fingerboard NINOC',
    title_en: 'THE 96MM PRECISION STANDARD: MECHANICAL ANATOMY OF A NINOC FINGERBOARD SET',
    slug: 'presisi-96mm-fingerboard-ninoc',
    category: 'PROCESS',
    excerpt: 'Mengapa mainan plastik injeksi murah tidak memiliki jiwa mekanis. Bedah teknis toleransi CNC aluminium truck, busing poliuretan 95A, roda bearing baja tertutup, dan geometri dek kayu murni 5 lapis pada skala 1:8.',
    excerpt_en: 'Why injection-molded plastic replicas fail the tactile test. A technical deep-dive into CNC aluminum truck tolerances, 95A polyurethane bushings, sealed steel bearings, and 5-ply Canadian maple deck geometry at 1:8 scale.',
    content: `Dalam industri mainan massal, fingerboard sering dicetak dari biji plastik ABS injeksi murah dalam hitungan detik. Moulding plastik menghasilkan sambungan kasar (flash seams), truck mati tanpa suspensi, dan roda plastik yang bergesit licin di atas permukaan meja tanpa traksi. Hasilnya adalah objek sekali pakai yang kehilangan presisi fisika dari bermain skateboard itu sendiri.

Koleksi Tech Deck NINOC dibangun dengan filosofi rekayasa mikro (micro-engineering) pada skala 1:8, berpusat pada spesifikasi emas: panjang dek 96 milimeter dengan lebar proporsional 32 milimeter. Setiap dek dipress dari 5 lapis kayu maple murni (5-ply maple veneer) menggunakan lem kayu bertekanan tinggi hidrolik, lalu dibentuk cekungannya (medium concave) untuk memberikan daya ungkit pop yang tajam dan terukur saat jari meluncurkan trik ollie maupun kickflip.

> "Skala mikroskopis tidak membenarkan penurunan standar mekanis. Toleransi 0.1 milimeter pada truck fingerboard setara dengan pergeseran 1 sentimeter pada skateboard sungguhan."

Kami mengganti truck logam cor murahan dengan konstruksi paduan aluminium CNC berpresisi tinggi. Bagian porosnya (axle) dipasangi busing karet poliuretan berkerapatan 95A yang memberikan artikulasi belok (turning response) organik—tidak terlalu kaku hingga mematahkan kingpin, namun tidak terlalu longgar hingga menyebabkan wheel-bite. 

Pada bagian roda, kami menggunakan material uretan berbearing baja tertutup tunggal (single shielded steel bearing). Saat meluncur di atas rintangan kayu atau marmer, roda ini tidak mengeluarkan suara gesekan plastik yang bising, melainkan dengungan mekanis halus dengan traksi gigitan yang stabil. Setiap unit sengaja dihadirkan dalam konfigurasi berpasangan (Set of 2) agar para praktisi dapat langsung menguji transfer ritme antar dua setup dengan bobot dan karakteristik dek yang berbeda.`,
    content_en: `In the mass-market toy sector, fingerboards are stamped out from cheap injection-molded ABS resin in fractional seconds. This hasty molding process leaves sharp parting seams, rigid fixed axles, and hard plastic wheels that skid uselessly across surfaces without friction. The result is a disposable novelty that strips away the actual physics and momentum of skateboarding.

The NINOC Tech Deck collection is approached through rigorous micro-engineering at 1:8 scale, anchored around the industry gold standard: a 96-millimeter deck length paired with a 32-millimeter stance width. Each deck is cold-pressed from 5 individual plies of Canadian maple veneer under high-tonnage hydraulic pressure, forming a precision medium concave that delivers sharp, predictable pop mechanics during finger-actuated ollies and technical flip transitions.

> "Miniaturized dimensions never justify compromised mechanical tolerances. A 0.1-millimeter deviation on a fingerboard axle translates to a catastrophic wobble in real-world physics."

We reject brittle zinc-cast hardware in favor of CNC-machined aluminum alloy trucks. Each hanger assembly is fitted with custom 95A durometer polyurethane bushings that provide responsive, organic turning articulation—stiff enough to prevent premature kingpin fatigue, yet supple enough to allow smooth carving without wheel-bite contact.

Our wheels are machined from high-rebound urethane and house single-shielded precision steel bearings. When rolled across polished wood or concrete obstacles, they eliminate abrasive plastic rattle, producing a clean mechanical hum with authentic surface bite. We deliberately issue our setups as paired units (Set of 2) so riders can immediately test stance transitions and weight distribution across two distinct deck geometries.`,
    image_url: '/images/logbook/l012.png',
    published_date: '2026-07-16'
  },
  {
    entry_id: 'L-011',
    title: 'Garis yang Jujur: Mengapa Kami Menolak Ilustrasi Digital yang Terlalu Sempurna',
    title_en: 'HONEST LINES: WHY WE REJECT STERILE DIGITAL ILLUSTRATION AND PERFECT VECTORS',
    slug: 'garis-jujur-menolak-ilustrasi-sempurna',
    category: 'MANIFESTO',
    excerpt: 'Ketika perangkat lunak vektor meratakan semua ketidaksempurnaan tangan manusia, desain kehilangan nadanya. Studi tentang sketsa mentah (naive sketch), reduksi piktogram Otl Aicher, dan sablon tinta plastisol bertekanan manual di atas katun mentah.',
    excerpt_en: 'When vector algorithms scrub away human hand tremors, graphic design loses its soul. A study on naive sketch raw linework, Otl Aicher pictogram reduction, and manual high-pressure plastisol screen printing on unbleached cotton.',
    content: `Perangkat lunak desain grafis modern telah melatih mata kita untuk memuja kesempurnaan vektor yang steril. Titik kurva Bezier ditarik secara matematis, gradasi dihitung oleh prosesor visual, dan setiap goresan diratakan hingga tidak ada lagi jejak getaran tangan manusia. Ketika semua grafis pakaian terlihat seperti hasil render komputer yang mengilap, estetika visual menjadi dingin, seragam, dan mudah dilupakan.

Pada lini graphic tee NINOC, kami sengaja mengambil langkah mundur ke arah ketidaksempurnaan yang jujur (naive sketch raw). Ilustrator kami tidak menggunakan filter perata garis otomatis. Kami menggambar langsung di atas kertas kasar menggunakan pena tinta pigmen dan kuas kering, membiarkan variasi ketebalan goresan (line weight variance) serta noda tinta mikro tetap hidup sebelum dipindahkan ke bingkai afdruk sablon.

> "Sebuah garis yang ditarik oleh tangan manusia membawa denyut nadi pembuatnya. Kesempurnaan algoritma vektor justru menghapus jejak kemanusiaan dari pakaian yang kita kenakan."

Pendekatan reduktif ini terinspirasi langsung oleh sistem piktogram Otl Aicher untuk Olimpiade Munich 1972—di mana bentuk geometri yang kompleks direduksi menjadi siluet esensial yang langsung komunikatif tanpa kehilangan karakter geometrisnya. 

Saat proses penyablonan di workshop kami di Bandung, kami menolak penggunaan tinta cetak digital DTG (Direct-to-Garment) yang tipis dan mudah pudar di atas permukaan kain. Kami menggunakan sablon manual dengan tinta plastisol berpigmen padat yang ditekan dengan rakel berkecepatan terukur ke dalam pori-pori katun 24s. Hasilnya adalah tekstur cetak berkarakter yang menyatu dengan serat kain, tidak pecah saat ditarik, dan justru semakin menawan setelah melalui siklus pemakaian bertahun-tahun.`,
    content_en: `Modern design software has conditioned the human eye to worship sterile vector perfection. Bezier curves are snapped to rigid mathematical grids, gradients are calculated by rendering engines, and every stroke is smoothed until no trace of human hand tremor remains. When apparel graphics begin to look like flawless digital renders, the visual landscape becomes cold, uniform, and instantly forgettable.

For our NINOC graphic releases, we deliberately step backward into the realm of honest imperfection—what we call the naive sketch raw aesthetic. Our illustrators refuse automated stroke smoothing algorithms. We draw directly onto textured paper using pigment ink pens and dry brushwork, preserving organic line-weight fluctuations, micro-bleed textures, and pressure variations right up until the screen-exposure process.

> "A line drawn by a human hand carries the pulse and breathing rhythm of its maker. Algorithmic vector perfection scrubs away the exact humanity that makes clothing meaningful."

This reductive methodology takes direct inspiration from Otl Aicher’s groundbreaking visual identity system for the 1972 Munich Olympics—where complex structural forms are distilled into essential, hard-hitting pictograms that communicate instantly without sacrificing structural gravitas.

During production inside our Bandung printing bays, we bypass thin, surface-level Direct-to-Garment (DTG) inkjet methods that wash out after minor use. We execute manual screen printing using high-solid pigment plastisol inks pressed firmly into the open grain of our 24s combed cotton jersey. The resulting print exhibits a rich, tactile relief that bonds mechanically with the cotton fibers, resisting cracking under tensile stress while developing a beautiful, lived-in patina over years of wear.`,
    image_url: '/images/logbook/l011.png',
    published_date: '2026-07-16'
  },
  {
    entry_id: 'L-010',
    title: 'Anatomi Jahitan Bertahan Lama: Mengapa Kami Membangun untuk Arsip, Bukan untuk Musim',
    title_en: 'STRUCTURAL ANATOMY OF LONGEVITY: WHY WE BUILD FOR THE ARCHIVE, NOT THE SEASON',
    slug: 'build-for-archive',
    category: 'MANIFESTO',
    excerpt: 'Bedah konstruksi garmen anti-musiman. Dari gramasi katun serat panjang 310 gsm, penguatan titik beban dengan jahitan bar-tack 42 jarum, hingga konstruksi kerah rib 2x1 berlapis ganda yang menolak keusangan.',
    excerpt_en: 'A technical dissection of anti-seasonal garment construction. From 310 gsm long-staple cotton density and 42-stitch bar-tack stress reinforcements, to double-layered 2x1 ribbed collar architecture engineered to defy decay.',
    content: `Industri fast fashion modern bekerja dengan model keusangan terencana (planned obsolescence). Kain dipertipis secara sengaja di bawah 140 gsm, jahitan pengunci dihilangkan untuk memangkas detik waktu produksi pabrik, dan tren warna diganti setiap tiga minggu sekali agar pakaian di lemari Anda terasa kedaluwarsa. Itu bukan model bisnis ritel; itu adalah mesin penghasil limbah tekstil global.

Di NINOC Studio, kami menolak konsep musim semi, panas, atau gugur. Kami bekerja dengan satu parameter ukur: apakah garmen ini masih memiliki integritas struktural dan martabat visual saat dikeluarkan dari lemari arsip 15 tahun dari sekarang?

Metode konstruksi kami dimulai dari pemilihan benang katun serat panjang (long-staple cotton). Serat yang lebih panjang menghasilkan pilinan benang yang jauh lebih kuat, meminimalisir bulu halus (pilling), dan mampu menahan gramasi berat hingga 310 gsm tanpa terasa pengap. Setiap lembar kain melalui proses pre-shrunk treatment untuk mengunci penyusutan alami maksimal di angka 1,5 persen—sehingga ukuran jaket atau kaos yang Anda beli hari ini akan tetap sama presisinya setelah ratusan kali pencucian.

> "Pakaian yang dirancang dengan benar tidak memerlukan instruksi perawatan yang rapuh. Garmen arsip harus tahan terhadap gesekan kasar, pencucian keras, dan cuaca ekstrem tanpa kehilangan bentuk dasarnya."

Pada titik-titik sambungan bertekanan tinggi—seperti ujung saku, ketiak, dan plakat kancing—kami menerapkan penguatan jahitan bar-tack berkerapatan 42 jarum dengan mesin industri SINGER kelas berat. Kami menggunakan konstruksi kerah rib 2x1 berlapis ganda yang di-binding dengan jahitan rantai ganda (double-needle chain stitch) agar lingkar leher tidak pernah melar atau bergelombang meskipun ditarik berulang kali.

Kami tidak pernah bertanya apakah potongannya mengikuti tren viral minggu ini. Kami hanya memastikan bahwa setiap detail konstruksi di jahit dengan presisi arsitektural, siap menemani perjalanan hidup Anda hingga layak diwariskan.`,
    content_en: `The modern fast-fashion apparatus operates entirely on planned obsolescence. Fabrics are deliberately thinned below 140 gsm, critical locking stitches are omitted to shave seconds off assembly line quotas, and seasonal palettes are rotated every twenty-one days to render your wardrobe psychologically obsolete. This is not sustainable apparel engineering; it is a global engine for textile decay.

At NINOC Studio, we reject arbitrary seasonal calendars. We evaluate every prototype against a singular architectural metric: will this garment retain its structural integrity and aesthetic dignity when pulled from an archival trunk fifteen years from today?

Our construction methodology originates at the fiber level with long-staple combed cottons. Extended staple length allows for tighter yarn twisting, eliminating abrasive surface pilling while supporting dense, heavy-loop 310 gsm weights that remain breathable under thermal load. Every fabric roll undergoes mechanical pre-shrunk stabilization, capping natural wash shrinkage at a strict 1.5 percent—ensuring that the silhouette you test in our studio maintains its exact geometry across hundreds of industrial wash cycles.

> "A properly engineered garment should never require fragile, neurotic care instructions. Archival clothing must withstand physical abrasion, heavy laundering, and environmental friction without losing its structural foundation."

At points of maximum structural stress—including pocket welts, armhole junctures, and button plackets—we enforce high-density 42-stitch bar-tack reinforcements using heavy-duty industrial sewing systems. Our necklines utilize a double-layered 2x1 ribbed collar bound by continuous double-needle chain stitching, preventing the collar from bowing, stretching out, or losing its memory regardless of daily tensile strain.

We do not design for the seasonal hype cycle. We engineer enduring material architecture built to age alongside your personal history and eventually be handed down to the next generation.`,
    image_url: '/images/logbook/l010.png',
    published_date: '2026-03-02'
  },
  {
    entry_id: 'L-009',
    title: 'Obsesi Hardware: Presisi Toleransi 0.02 Milimeter pada Ritsleting YKK Excella',
    title_en: 'HARDWARE OBSESSION: THE 0.02MM TOLERANCE OF JAPANESE YKK EXCELLA FINISHING',
    slug: 'hardware-obsession',
    category: 'PROCESS',
    excerpt: 'Mengapa penutup logam murah menjadi penyebab utama keruntuhan garmen luaran. Tinjauan mikroskopis terhadap pemolesan gigi kuningan individual, plating anti-korosi, dan sensasi gesekan mekanis tanpa hambatan.',
    excerpt_en: 'Why generic metal closures act as the single point of failure in outerwear. A microscopic study on individual brass teeth polishing, anti-corrosive electroplating, and frictionless mechanical glide.',
    content: `Dalam hitungan rancang bangun konveksi massal, hardware—seperti ritsleting, kancing jepret (snap button), dan gesper logam—sering diperlakukan sebagai komponen sisa. Produsen memilih ritsleting seng cetak termurah semata-mata untuk menghemat biaya produksi beberapa ribu rupiah per potong pakaian. Bagi kami, keputusan tersebut adalah sebuah kecacatan fatal.

Ketika Anda mengenakan jaket parka berbobot berat atau mantel kanvas selama bertahun-tahun, kain katun berkerapatan tinggi hampir tidak pernah robek lebih dulu. Titik kegagalan pertama selalu terjadi pada hardware: gigi ritsleting mulai macet, lapisan krom mengelupas karena keringat, dan kepala tarikan (slider puller) patah saat ditarik dalam kondisi terburu-buru. Begitu ritsleting utama gagal berfungsi, seluruh jaket bernilai ratusan ribu atau jutaan rupiah tersebut berubah menjadi kain mati yang tidak dapat digunakan.

> "Hardware adalah tulang punggung mekanis dari sebuah pakaian luaran. Jika ritsleting Anda macet atau patah, selembar mantel yang indah seketika kehilangan seluruh fungsi aslinya."

Itulah alasan mutlak mengapa seluruh garmen luaran berat NINOC secara eksklusif mewajibkan penggunaan YKK Excella—kasta tertinggi dari hardware berpresisi mikro buatan Jepang. Berbeda dengan ritsleting standar yang giginya dicetak sekaligus secara kasar dan menyisakan gerigi tajam berskala mikroskopis (burrs) yang perlahan menyayat pita kain sekitarnya, setiap elemen gigi YKK Excella dipotong dari paduan kuningan padat dan dipoles satu per satu (individually polished) sebelum dirakit ke atas pita woven berbahan poliester berdaya tahan tinggi.

Toleransi kerapatan antar giginya dijaga pada kisaran 0.02 milimeter. Ketika Anda menarik kepala slider Excella dari bawah ke atas, Anda tidak akan merasakan gesekan kasar atau suara derak logam yang menyangkut. Yang terasa adalah luncuran mekanis padat yang mulus, berbobot, dan presisi—mengingatkan kita pada putaran bingkai arloji Swiss mekanis dibanding ritsleting konveksi biasa. Kami tidak memilih YKK Excella karena murah; biayanya enam kali lipat lebih tinggi dari ritsleting standar. Kami memilihnya karena hardware pada garmen arsip wajib bertahan lebih lama dari umur kain itu sendiri.`,
    content_en: `In the cost-cutting calculations of mass-market garment manufacturing, closures—zippers, snap fasteners, and metal buckles—are treated as prime targets for margin optimization. Brands specify generic zinc-stamped zippers to shave mere cents off per-unit factory assembly bills. To us, this represents a fatal engineering oversight.

When you deploy a heavyweight parka or canvas field coat over sustained years of heavy wear, the high-density cotton shell rarely fails first. The primary point of catastrophic failure is invariably the hardware: slider teeth misalign under lateral stress, cheap electroplated coatings pit and oxidize from perspiration, and pull tabs snap off cleanly when yanked in harsh weather. Once the primary closure fails, the entire outer garment becomes functionally inert.

> "Hardware serves as the load-bearing mechanical spine of any serious outer shell. If your closure binds, jams, or snaps, even the finest textile construction is rendered instantly useless."

This is precisely why every single NINOC outer layer mandatorily mandates Japanese YKK Excella hardware—the absolute zenith of precision metal closures produced in Japan. Unlike standard commercial zippers whose teeth are stamped out in bulk, leaving microscopic metal burrs that slowly chew through surrounding fabric tape over thousands of zips, Excella elements are machined from solid brass alloys and individually polished to a mirror smoothness before assembly onto high-tensile polyester woven tape.

The interlocking tolerance between each tooth is calibrated to within 0.02 millimeters. When you actuate the Excella slider from base to collar, you encounter zero abrasive catch, zero binding, and zero harsh metallic chatter. Instead, you experience a smooth, weighted, frictionless glide that feels closer to the bezel action of a fine mechanical timepiece than typical apparel haberdashery. We do not specify YKK Excella because it is economical; it costs up to six times more than commercial closures. We specify it because the hardware on an archival garment must outlast the fabric shell that carries it.`,
    image_url: '/images/logbook/l009.png',
    published_date: '2026-01-18'
  }
];

async function run() {
  console.log("Humanizing and upgrading all 5 Logbook Studio entries with artisan technical copywriting...");
  for (const item of entries) {
    const { data, error } = await supabase
      .from('logbook_entries')
      .upsert(item, { onConflict: 'slug' })
      .select();
    if (error) {
      console.error(`Error upserting ${item.entry_id}:`, error.message);
    } else {
      console.log(`✓ Successfully humanized & upserted ${item.entry_id} (${item.slug}) with authentic technical prose.`);
    }
  }
}

run();
