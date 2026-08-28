const pptxgen = require("pptxgenjs");

// ---------- Palette ----------
const BLACK = "111111";
const INK = "1A1A1A";
const OFFWHITE = "F6F5F2";
const WHITE = "FFFFFF";
const GOLD = "B8935A";
const GOLD_LIGHT = "E7D9C3";
const GREY = "6B6B6B";
const LINE = "E2E0DB";

function icon(name, color) {
  return `icons/${name}_${color}.png`;
}

function newDeck() {
  const p = new pptxgen();
  p.layout = "LAYOUT_WIDE"; // 13.33 x 7.5
  p.defineSlideMaster({
    title: "BLANK",
    background: { color: WHITE },
  });
  return p;
}

const p = newDeck();
const W = 13.33, H = 7.5;

function footer(slide, pageNum, dark = false) {
  slide.addText("NINOC ENTERPRISE", {
    x: 0.5, y: H - 0.42, w: 7, h: 0.3, fontFace: "Calibri", fontSize: 9,
    color: dark ? "9A9A9A" : GREY, align: "left", margin: 0,
  });
  slide.addText(String(pageNum).padStart(2, "0"), {
    x: W - 1.0, y: H - 0.42, w: 0.5, h: 0.3, fontFace: "Calibri", fontSize: 9,
    color: dark ? "9A9A9A" : GREY, align: "right", margin: 0,
  });
}

function iconCircle(slide, x, y, d, iconName, iconColorHex, circleColor) {
  slide.addShape("ellipse", { x, y, w: d, h: d, fill: { color: circleColor }, line: { type: "none" } });
  const pad = d * 0.28;
  slide.addImage({ path: icon(iconName, iconColorHex), x: x + pad / 2, y: y + pad / 2, w: d - pad, h: d - pad });
}

// =========================================================
// SLIDE 1 — COVER
// =========================================================
{
  const s = p.addSlide();
  s.background = { color: BLACK };

  // subtle corner accent using large faint circle (not a stripe)
  s.addShape("ellipse", { x: 9.6, y: -2.8, w: 7, h: 7, fill: { color: "1E1E1E" }, line: { type: "none" } });
  s.addShape("ellipse", { x: 10.6, y: -1.8, w: 5, h: 5, fill: { color: "232323" }, line: { type: "none" } });

  s.addText("PROPOSAL KEMITRAAN STRATEGIS", {
    x: 0.9, y: 1.55, w: 10, h: 0.4, fontFace: "Calibri", fontSize: 13, color: GOLD,
    charSpacing: 3, bold: true, margin: 0,
  });

  s.addText("Premium Curated E-Commerce Mall\n& Multi-Vendor Dropship Ecosystem", {
    x: 0.85, y: 2.05, w: 10.8, h: 2.0, fontFace: "Cambria", fontSize: 40, bold: true,
    color: WHITE, margin: 0, lineSpacingMultiple: 1.08,
  });

  s.addShape("line", { x: 0.9, y: 4.25, w: 2.2, h: 0, line: { color: GOLD, width: 1.5 } });

  s.addText([
    { text: "Ninoc Enterprise", options: { bold: true, color: WHITE } },
  ], { x: 0.9, y: 4.5, w: 10.5, h: 0.5, fontFace: "Calibri", fontSize: 16, margin: 0 });

  s.addText("Kemitraan brand premium dengan platform Webcommerce Mall terkurasi — tanpa hambatan logistik, dengan skema komersial yang kompetitif dan transparan.", {
    x: 0.9, y: 5.05, w: 8.8, h: 0.9, fontFace: "Calibri", fontSize: 13, color: "C9C9C9", margin: 0, lineSpacingMultiple: 1.25,
  });

  s.addText("EST. 2024 · BANDUNG, INDONESIA", {
    x: 0.9, y: 6.75, w: 6, h: 0.3, fontFace: "Calibri", fontSize: 10, color: GOLD, charSpacing: 2, margin: 0,
  });
}

// =========================================================
// SLIDE 2 — Pendahuluan & Konsep Bisnis
// =========================================================
{
  const s = p.addSlide();
  s.background = { color: WHITE };

  s.addText("01 — Pendahuluan", { x: 0.7, y: 0.5, w: 6, h: 0.35, fontFace: "Calibri", fontSize: 12, color: GOLD, bold: true, charSpacing: 2, margin: 0 });
  s.addText("Konsep Bisnis NINOC ENTERPRISE", { x: 0.7, y: 0.85, w: 9.5, h: 0.7, fontFace: "Cambria", fontSize: 30, bold: true, color: BLACK, margin: 0 });

  s.addText("Ninoc Enterprise adalah platform Webcommerce Mall terkurasi yang berfokus pada produk Premium Lifestyle & Eco-Living — mempertemukan brand owner langsung dengan basis konsumen premium kami melalui sistem Multi-Vendor Terintegrasi, tanpa hambatan logistik tradisional.", {
    x: 0.7, y: 1.75, w: 5.6, h: 2.0, fontFace: "Calibri", fontSize: 14, color: "2B2B2B", margin: 0, lineSpacingMultiple: 1.35,
  });

  // stat callout
  s.addShape("rect", { x: 0.7, y: 4.0, w: 5.6, h: 1.55, fill: { color: OFFWHITE }, line: { type: "none" } });
  s.addText("2024", { x: 0.95, y: 4.15, w: 2.4, h: 0.75, fontFace: "Cambria", fontSize: 40, bold: true, color: BLACK, margin: 0 });
  s.addText("Tahun berdiri,\nBandung — Jawa Barat", { x: 0.95, y: 4.85, w: 2.6, h: 0.6, fontFace: "Calibri", fontSize: 11, color: GREY, margin: 0, lineSpacingMultiple: 1.15 });
  s.addShape("line", { x: 3.55, y: 4.2, w: 0, h: 1.2, line: { color: LINE, width: 1 } });
  s.addText("Mall", { x: 3.8, y: 4.15, w: 2.3, h: 0.5, fontFace: "Cambria", fontSize: 22, bold: true, color: BLACK, margin: 0 });
  s.addText("Model: Multi-Vendor\nTerkurasi (bukan marketplace terbuka)", { x: 3.8, y: 4.65, w: 2.4, h: 0.8, fontFace: "Calibri", fontSize: 10.5, color: GREY, margin: 0, lineSpacingMultiple: 1.15 });

  // right column: 3 icon rows
  const items = [
    { icon: "gem", title: "Kurasi Premium", desc: "Fokus pada produk lifestyle & eco-living berkualitas tinggi, bukan volume massal." },
    { icon: "store", title: "Multi-Vendor Terintegrasi", desc: "Brand owner terhubung langsung ke dashboard vendor & basis konsumen premium." },
    { icon: "shipping", title: "Tanpa Hambatan Logistik", desc: "Alur fulfillment otomatis menghilangkan kerumitan operasional harian brand." },
  ];
  let iy = 1.75;
  items.forEach((it) => {
    iconCircle(s, 7.0, iy, 0.62, it.icon, WHITE, BLACK);
    s.addText(it.title, { x: 7.85, y: iy - 0.02, w: 4.7, h: 0.35, fontFace: "Calibri", fontSize: 15, bold: true, color: BLACK, margin: 0 });
    s.addText(it.desc, { x: 7.85, y: iy + 0.35, w: 4.75, h: 0.75, fontFace: "Calibri", fontSize: 11.5, color: GREY, margin: 0, lineSpacingMultiple: 1.25 });
    iy += 1.5;
  });

  footer(s, 2);
}

// =========================================================
// SLIDE 3 — Alur Operasional (Automated Dropship)
// =========================================================
{
  const s = p.addSlide();
  s.background = { color: WHITE };

  s.addText("02 — Skenario Operasional", { x: 0.7, y: 0.5, w: 8, h: 0.35, fontFace: "Calibri", fontSize: 12, color: GOLD, bold: true, charSpacing: 2, margin: 0 });
  s.addText("Alur Kerja Automated Dropship", { x: 0.7, y: 0.85, w: 10, h: 0.7, fontFace: "Cambria", fontSize: 30, bold: true, color: BLACK, margin: 0 });
  s.addText("Teknologi terintegrasi menjaga efisiensi kerja sekaligus kerahasiaan bisnis kedua belah pihak.", {
    x: 0.7, y: 1.5, w: 10.5, h: 0.4, fontFace: "Calibri", fontSize: 13, color: GREY, margin: 0,
  });

  const steps = [
    { icon: "creditcard", title: "Fasilitator Transaksi", desc: "Seluruh transaksi & payment gateway (Midtrans) terpusat di rekening Ninoc Enterprise." },
    { icon: "exchange", title: "Penerusan Pesanan Otomatis", desc: "Data pesanan masuk real-time ke dashboard vendor mitra setelah pembayaran sah." },
    { icon: "box", title: "Fulfillment & Cetak Resi", desc: "Tim gudang mitra mengemas & mencetak resi otomatis via API Biteship." },
    { icon: "shipping", title: "Pengiriman ke Konsumen", desc: "Ongkos kirim sepenuhnya dibebankan kepada konsumen akhir." },
  ];

  const startX = 0.7, cardW = 2.85, gap = 0.24, cardY = 2.35, cardH = 3.7;
  steps.forEach((st, i) => {
    const x = startX + i * (cardW + gap);
    s.addShape("rect", { x, y: cardY, w: cardW, h: cardH, fill: { color: OFFWHITE }, line: { type: "none" } });
    s.addText(String(i + 1).padStart(2, "0"), { x: x + 0.2, y: cardY + 0.18, w: 1.2, h: 0.5, fontFace: "Cambria", fontSize: 22, bold: true, color: GOLD, margin: 0 });
    iconCircle(s, x + 0.2, cardY + 0.8, 0.7, st.icon, WHITE, BLACK);
    s.addText(st.title, { x: x + 0.2, y: cardY + 1.68, w: cardW - 0.4, h: 0.65, fontFace: "Calibri", fontSize: 13.5, bold: true, color: BLACK, margin: 0, lineSpacingMultiple: 1.1 });
    s.addText(st.desc, { x: x + 0.2, y: cardY + 2.35, w: cardW - 0.4, h: 1.2, fontFace: "Calibri", fontSize: 10.5, color: "3A3A3A", margin: 0, lineSpacingMultiple: 1.25 });
    if (i < steps.length - 1) {
      s.addText("→", { x: x + cardW - 0.02, y: cardY + cardH / 2 - 0.25, w: gap + 0.05, h: 0.5, fontFace: "Arial", fontSize: 18, color: GOLD, align: "center", margin: 0 });
    }
  });

  footer(s, 3);
}

// =========================================================
// SLIDE 4 — Proteksi Data & Keamanan Aset Konsumen
// =========================================================
{
  const s = p.addSlide();
  s.background = { color: BLACK };

  s.addText("02 — Perlindungan Data", { x: 0.7, y: 0.5, w: 8, h: 0.35, fontFace: "Calibri", fontSize: 12, color: GOLD, bold: true, charSpacing: 2, margin: 0 });
  s.addText("Keamanan Aset Data Konsumen", { x: 0.7, y: 0.85, w: 10, h: 0.7, fontFace: "Cambria", fontSize: 30, bold: true, color: WHITE, margin: 0 });

  s.addText("Untuk melindungi hak kepemilikan konsumen Ninoc Enterprise, akses data pada dashboard vendor dibatasi secara ketat — hanya informasi yang benar-benar diperlukan untuk pemenuhan pesanan yang ditampilkan.", {
    x: 0.7, y: 1.75, w: 5.6, h: 1.5, fontFace: "Calibri", fontSize: 14, color: "D8D8D8", margin: 0, lineSpacingMultiple: 1.35,
  });

  iconCircle(s, 0.7, 3.5, 0.9, "shield", BLACK, GOLD);
  s.addText("Data Minimization by Design", { x: 1.8, y: 3.6, w: 4.5, h: 0.4, fontFace: "Calibri", fontSize: 14, bold: true, color: WHITE, margin: 0 });
  s.addText("Prinsip akses data dirancang berdasarkan kebutuhan operasional minimum, bukan akses penuh.", { x: 1.8, y: 4.0, w: 4.5, h: 0.9, fontFace: "Calibri", fontSize: 11, color: "B5B5B5", margin: 0, lineSpacingMultiple: 1.25 });

  // right: two comparison cards - visible vs hidden
  const rx = 7.1, rw = 5.5;
  s.addShape("rect", { x: rx, y: 1.75, w: rw, h: 2.15, fill: { color: "1D1D1D" }, line: { type: "none" } });
  iconCircle(s, rx + 0.3, rx > 0 ? 2.0 : 2.0, 0.55, "check", BLACK, GOLD);
  s.addText("DITAMPILKAN di Dashboard Vendor", { x: rx + 1.05, y: 2.02, w: rw - 1.3, h: 0.4, fontFace: "Calibri", fontSize: 13, bold: true, color: WHITE, margin: 0 });
  s.addText("•  Nama penerima\n•  Alamat pengiriman logistik", { x: rx + 0.35, y: 2.6, w: rw - 0.7, h: 1.1, fontFace: "Calibri", fontSize: 12.5, color: "D8D8D8", margin: 0, lineSpacingMultiple: 1.4 });

  s.addShape("rect", { x: rx, y: 4.1, w: rw, h: 2.15, fill: { color: "1D1D1D" }, line: { type: "none" } });
  iconCircle(s, rx + 0.3, 4.35, 0.55, "lock", BLACK, GOLD);
  s.addText("TIDAK DIBUKA ke Vendor", { x: rx + 1.05, y: 4.37, w: rw - 1.3, h: 0.4, fontFace: "Calibri", fontSize: 13, bold: true, color: WHITE, margin: 0 });
  s.addText("•  Alamat email konsumen\n•  Nomor telepon lengkap", { x: rx + 0.35, y: 4.95, w: rw - 0.7, h: 1.1, fontFace: "Calibri", fontSize: 12.5, color: "D8D8D8", margin: 0, lineSpacingMultiple: 1.4 });

  footer(s, 4, true);
}

// =========================================================
// SLIDE 5 — Skema Komersial: Two-Tier Commission
// =========================================================
{
  const s = p.addSlide();
  s.background = { color: WHITE };

  s.addText("03 — Penawaran Komersial", { x: 0.7, y: 0.5, w: 8, h: 0.35, fontFace: "Calibri", fontSize: 12, color: GOLD, bold: true, charSpacing: 2, margin: 0 });
  s.addText("Skema Komisi Dua Fase", { x: 0.7, y: 0.85, w: 10, h: 0.7, fontFace: "Cambria", fontSize: 30, bold: true, color: BLACK, margin: 0 });
  s.addText("Struktur biaya kompetitif dan rendah risiko untuk mempermudah penetrasi pasar awal brand besar.", {
    x: 0.7, y: 1.5, w: 10.5, h: 0.4, fontFace: "Calibri", fontSize: 13, color: GREY, margin: 0,
  });

  // Left: two phase cards
  s.addShape("rect", { x: 0.7, y: 2.2, w: 4.55, h: 4.35, fill: { color: OFFWHITE }, line: { type: "none" } });
  s.addText("FASE 1 — Masa Uji Coba", { x: 0.95, y: 2.4, w: 4.1, h: 0.35, fontFace: "Calibri", fontSize: 12, bold: true, color: GOLD, charSpacing: 1, margin: 0 });
  s.addText("7%", { x: 0.95, y: 2.7, w: 3.2, h: 1.2, fontFace: "Cambria", fontSize: 66, bold: true, color: BLACK, margin: 0 });
  s.addText("flat per transaksi sukses", { x: 0.95, y: 3.9, w: 4.0, h: 0.35, fontFace: "Calibri", fontSize: 12, color: GREY, margin: 0 });
  s.addShape("line", { x: 0.95, y: 4.4, w: 4.05, h: 0, line: { color: LINE, width: 1 } });
  s.addText("Durasi 90 hari pertama — komisi ditekan serendah mungkin guna meringankan penetrasi pasar awal.", { x: 0.95, y: 4.55, w: 4.0, h: 0.9, fontFace: "Calibri", fontSize: 11.5, color: "3A3A3A", margin: 0, lineSpacingMultiple: 1.3 });
  iconCircle(s, 0.95, 5.65, 0.55, "chart", WHITE, BLACK);
  s.addText("Fokus: kecepatan\npenetrasi pasar", { x: 1.65, y: 5.72, w: 3.3, h: 0.7, fontFace: "Calibri", fontSize: 10.5, color: GREY, margin: 0, lineSpacingMultiple: 1.2 });

  s.addShape("rect", { x: 5.45, y: 2.2, w: 4.55, h: 4.35, fill: { color: BLACK }, line: { type: "none" } });
  s.addText("FASE 2 — Skala Berkelanjutan", { x: 5.7, y: 2.4, w: 4.1, h: 0.35, fontFace: "Calibri", fontSize: 12, bold: true, color: GOLD, charSpacing: 1, margin: 0 });
  s.addText("10%", { x: 5.7, y: 2.7, w: 3.2, h: 1.2, fontFace: "Cambria", fontSize: 66, bold: true, color: WHITE, margin: 0 });
  s.addText("setelah volume penjualan stabil", { x: 5.7, y: 3.9, w: 4.0, h: 0.35, fontFace: "Calibri", fontSize: 12, color: "B5B5B5", margin: 0 });
  s.addShape("line", { x: 5.7, y: 4.4, w: 4.05, h: 0, line: { color: "3A3A3A", width: 1 } });
  s.addText("Penyesuaian komisi berlaku setelah masa uji coba selesai dan performa penjualan terbukti stabil.", { x: 5.7, y: 4.55, w: 4.0, h: 0.9, fontFace: "Calibri", fontSize: 11.5, color: "D8D8D8", margin: 0, lineSpacingMultiple: 1.3 });
  iconCircle(s, 5.7, 5.65, 0.55, "handshake", BLACK, GOLD);
  s.addText("Fokus: kemitraan\njangka panjang", { x: 6.4, y: 5.72, w: 3.3, h: 0.7, fontFace: "Calibri", fontSize: 10.5, color: "B5B5B5", margin: 0, lineSpacingMultiple: 1.2 });

  // right: native chart comparing to typical marketplace commission (context) - simple 2 bar chart of phase1 vs phase2
  const chartData = [
    { name: "Komisi (%)", labels: ["Fase 1\n(90 Hari)", "Fase 2\n(Berkelanjutan)"], values: [7, 10] },
  ];
  s.addChart(p.ChartType.bar, chartData, {
    x: 10.35, y: 2.2, w: 2.3, h: 4.35,
    barDir: "col",
    showTitle: true, title: "Perbandingan Komisi", titleFontSize: 11, titleColor: BLACK,
    showValue: true, dataLabelFontSize: 12, dataLabelColor: BLACK, dataLabelPosition: "outEnd",
    catAxisLabelFontSize: 9, catAxisLabelColor: GREY,
    valAxisHidden: true, valGridLine: { style: "none" },
    catGridLine: { style: "none" },
    chartColors: [GOLD],
    showLegend: false,
    dataLabelFormatCode: '0"%"',
  });

  footer(s, 5);
}

// =========================================================
// SLIDE 6 — Price Parity Guarantee
// =========================================================
{
  const s = p.addSlide();
  s.background = { color: WHITE };

  s.addText("03 — Jaminan Kebijakan", { x: 0.7, y: 0.5, w: 8, h: 0.35, fontFace: "Calibri", fontSize: 12, color: GOLD, bold: true, charSpacing: 2, margin: 0 });
  s.addText("Garansi Price Parity", { x: 0.7, y: 0.85, w: 10, h: 0.7, fontFace: "Cambria", fontSize: 30, bold: true, color: BLACK, margin: 0 });

  s.addText("Harga jual di Ninoc Enterprise dikunci agar selalu serasi dengan harga resmi mitra di kanal lain — menjaga kepercayaan konsumen dan melindungi ekuitas merek di seluruh kanal penjualan.", {
    x: 0.7, y: 1.75, w: 5.5, h: 1.8, fontFace: "Calibri", fontSize: 14, color: "2B2B2B", margin: 0, lineSpacingMultiple: 1.35,
  });

  iconCircle(s, 0.7, 3.7, 0.75, "balance", WHITE, BLACK);
  s.addText("Konsistensi harga lintas kanal", { x: 1.65, y: 3.85, w: 4.5, h: 0.6, fontFace: "Calibri", fontSize: 13.5, bold: true, color: BLACK, margin: 0 });
  s.addText("Tidak ada perang harga internal antar kanal penjualan brand.", { x: 1.65, y: 4.35, w: 4.5, h: 0.6, fontFace: "Calibri", fontSize: 11, color: GREY, margin: 0, lineSpacingMultiple: 1.25 });

  // Right: 3 marketplace comparison cards (parity)
  const channels = [
    { label: "Ninoc Enterprise", tag: "Mall Terkurasi" },
    { label: "Shopee", tag: "Official Store" },
    { label: "Tokopedia", tag: "Official Store" },
  ];
  const cw = 3.6, cx0 = 7.1, cy = 1.9, gap = 0.35;
  channels.forEach((c, i) => {
    const x = cx0 + i * (cw + gap) * 0 + 0; // will layout vertically instead
  });

  // Vertical stacked equal-price cards
  let vy = 1.9;
  channels.forEach((c, i) => {
    const isNinoc = i === 0;
    s.addShape("rect", { x: 7.1, y: vy, w: 5.5, h: 1.35, fill: { color: isNinoc ? BLACK : OFFWHITE }, line: { type: "none" } });
    s.addText(c.label, { x: 7.4, y: vy + 0.18, w: 3.0, h: 0.4, fontFace: "Calibri", fontSize: 15, bold: true, color: isNinoc ? WHITE : BLACK, margin: 0 });
    s.addText(c.tag, { x: 7.4, y: vy + 0.58, w: 3.0, h: 0.35, fontFace: "Calibri", fontSize: 10.5, color: isNinoc ? "B5B5B5" : GREY, margin: 0 });
    s.addText("Harga Resmi\nSerasi", { x: 10.7, y: vy + 0.18, w: 1.7, h: 0.9, fontFace: "Calibri", fontSize: 11, bold: true, color: isNinoc ? GOLD : BLACK, align: "right", margin: 0, lineSpacingMultiple: 1.15 });
    vy += 1.35 + 0.25;
  });

  footer(s, 6);
}

// =========================================================
// SLIDE 7 — Zero-Cost Launch Marketing Support
// =========================================================
{
  const s = p.addSlide();
  s.background = { color: BLACK };

  s.addText("03 — Dukungan Peluncuran", { x: 0.7, y: 0.5, w: 8, h: 0.35, fontFace: "Calibri", fontSize: 12, color: GOLD, bold: true, charSpacing: 2, margin: 0 });
  s.addText("Zero-Cost Launch Marketing Support", { x: 0.7, y: 0.85, w: 11, h: 0.7, fontFace: "Cambria", fontSize: 30, bold: true, color: WHITE, margin: 0 });
  s.addText("Ninoc Enterprise menanggung penuh biaya kampanye digital selama 30 hari pertama peluncuran toko — tanpa biaya tambahan bagi mitra brand.", {
    x: 0.7, y: 1.55, w: 10.8, h: 0.5, fontFace: "Calibri", fontSize: 13, color: "C9C9C9", margin: 0,
  });

  const boxW = 3.55, boxH = 3.9, gap = 0.35, startX = 0.7, boxY = 2.4;
  const items = [
    { icon: "store", title: "Banner Utama Web", desc: "Penempatan visual brand pada posisi paling strategis di halaman utama Ninoc Enterprise." },
    { icon: "tags", title: "Promosi Produk Unggulan", desc: "Slot kurasi khusus untuk produk pilihan mitra agar lebih terlihat oleh konsumen premium." },
    { icon: "envelopeopen", title: "Blast Email Anggota", desc: "Kampanye email langsung ke basis anggota terdaftar Ninoc Enterprise." },
  ];
  items.forEach((it, i) => {
    const x = startX + i * (boxW + gap);
    s.addShape("rect", { x, y: boxY, w: boxW, h: boxH, fill: { color: "1D1D1D" }, line: { type: "none" } });
    iconCircle(s, x + 0.3, boxY + 0.35, 0.75, it.icon, BLACK, GOLD);
    s.addText(it.title, { x: x + 0.3, y: boxY + 1.35, w: boxW - 0.6, h: 0.6, fontFace: "Calibri", fontSize: 15, bold: true, color: WHITE, margin: 0, lineSpacingMultiple: 1.15 });
    s.addText(it.desc, { x: x + 0.3, y: boxY + 2.0, w: boxW - 0.6, h: 1.6, fontFace: "Calibri", fontSize: 11.5, color: "C0C0C0", margin: 0, lineSpacingMultiple: 1.3 });
  });

  s.addText("30 HARI PERTAMA · TANPA BIAYA TAMBAHAN", { x: 0.7, y: 6.55, w: 8, h: 0.35, fontFace: "Calibri", fontSize: 11, color: GOLD, bold: true, charSpacing: 1.5, margin: 0 });

  footer(s, 7, true);
}

// =========================================================
// SLIDE 8 — Ringkasan Value Proposition
// =========================================================
{
  const s = p.addSlide();
  s.background = { color: WHITE };

  s.addText("04 — Ringkasan", { x: 0.7, y: 0.5, w: 8, h: 0.35, fontFace: "Calibri", fontSize: 12, color: GOLD, bold: true, charSpacing: 2, margin: 0 });
  s.addText("Mengapa Bermitra dengan NINOC ENTERPRISE", { x: 0.7, y: 0.85, w: 11, h: 0.7, fontFace: "Cambria", fontSize: 28, bold: true, color: BLACK, margin: 0 });

  const cards = [
    { icon: "chart", title: "Komisi Kompetitif", desc: "7% di 90 hari pertama, hanya naik ke 10% saat penjualan sudah stabil." },
    { icon: "shield", title: "Proteksi Data", desc: "Akses vendor dibatasi hanya pada data yang perlu untuk pengiriman." },
    { icon: "balance", title: "Price Parity Terjaga", desc: "Harga jual selaras dengan kanal resmi mitra lainnya." },
    { icon: "bullhorn", title: "Marketing Gratis", desc: "Kampanye peluncuran 30 hari ditanggung penuh oleh Ninoc Enterprise." },
  ];

  const cw = 2.9, ch = 3.7, gap = 0.28, startX = 0.7, y0 = 1.95;
  cards.forEach((c, i) => {
    const x = startX + i * (cw + gap);
    s.addShape("rect", { x, y: y0, w: cw, h: ch, fill: { color: OFFWHITE }, line: { type: "none" } });
    iconCircle(s, x + 0.28, y0 + 0.3, 0.68, c.icon, WHITE, BLACK);
    s.addText(c.title, { x: x + 0.28, y: y0 + 1.2, w: cw - 0.56, h: 0.75, fontFace: "Calibri", fontSize: 14, bold: true, color: BLACK, margin: 0, lineSpacingMultiple: 1.15 });
    s.addText(c.desc, { x: x + 0.28, y: y0 + 1.95, w: cw - 0.56, h: 1.6, fontFace: "Calibri", fontSize: 11, color: "3A3A3A", margin: 0, lineSpacingMultiple: 1.3 });
  });

  footer(s, 8);
}

// =========================================================
// SLIDE 9 — Closing / CTA
// =========================================================
{
  const s = p.addSlide();
  s.background = { color: BLACK };

  s.addShape("ellipse", { x: -2.5, y: 4.2, w: 6, h: 6, fill: { color: "1E1E1E" }, line: { type: "none" } });

  s.addText("MARI MEMBANGUN", { x: 0.9, y: 1.9, w: 10, h: 0.5, fontFace: "Calibri", fontSize: 14, color: GOLD, bold: true, charSpacing: 3, margin: 0 });
  s.addText("Kemitraan yang Saling\nMenguntungkan", { x: 0.85, y: 2.35, w: 10.5, h: 1.7, fontFace: "Cambria", fontSize: 36, bold: true, color: WHITE, margin: 0, lineSpacingMultiple: 1.1 });

  s.addText("Kami percaya kemitraan bersama Ninoc Enterprise akan menghadirkan pertumbuhan yang berkelanjutan, aman, dan saling menguntungkan bagi brand Anda.", {
    x: 0.9, y: 4.1, w: 7.6, h: 1.0, fontFace: "Calibri", fontSize: 13, color: "C9C9C9", margin: 0, lineSpacingMultiple: 1.35,
  });

  iconCircle(s, 0.9, 5.4, 0.5, "mapmarker", BLACK, GOLD);
  s.addText("Kompleks Griya Saluyu, Blok AA No.87, Mekarjaya\nKec. Rancasari, Kota Bandung, Jawa Barat 40292", { x: 1.55, y: 5.42, w: 6.5, h: 0.6, fontFace: "Calibri", fontSize: 10.5, color: "C9C9C9", margin: 0, lineSpacingMultiple: 1.2 });

  iconCircle(s, 0.9, 6.15, 0.5, "whatsapp", BLACK, GOLD);
  s.addText("+62 821 1983 774", { x: 1.55, y: 6.28, w: 3, h: 0.4, fontFace: "Calibri", fontSize: 11.5, color: WHITE, margin: 0 });

  iconCircle(s, 4.9, 6.15, 0.5, "envelope", BLACK, GOLD);
  s.addText("ninocenterprise@gmail.com", { x: 5.55, y: 6.28, w: 3.5, h: 0.4, fontFace: "Calibri", fontSize: 11.5, color: WHITE, margin: 0 });

  footer(s, 9, true);
}

p.writeFile({ fileName: "ninoc_enterprise_partnership_pitch.pptx" }).then(() => console.log("written"));
