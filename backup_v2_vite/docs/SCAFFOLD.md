# 📋 SCAFFOLD — Manager Content App
> Platform Monitoring Konten TikTok · Mei 2026  
> Versi: 2.0 · Stack: Vanilla HTML/CSS/JS + Google Apps Script

---

## 🚀 Quick Start (Local Testing)
Untuk menjalankan aplikasi secara lokal di komputer Anda:
1. Pastikan Anda sudah menginstal **Node.js**.
2. Buka terminal di folder ini.
3. Jalankan perintah: `node test-server.js`
4. Buka browser di: `http://localhost:3000`

---

## 📁 Struktur File

```
manager-content/
├── index.html              ← Single-file app (seluruh UI + logic)
├── SCAFFOLD.md             ← Dokumentasi ini
├── gas/
│   └── Code.gs             ← Google Apps Script (backend)
└── sheets/
    └── Tiktok_master_calendar_BB_21.xlsx   ← Template data sumber
```

---

## 🔐 Autentikasi & Akses

### Credential PIC
| Nama | Password | Akun TikTok | Post/Akun |
|------|----------|-------------|-----------|
| Risa | `RH-001` | akunsagita, enmeiofficial, sportone87 | Unlimited |
| Rahma | `RM-002` | upgrand.official, power.oversize, officialfunsport | Unlimited |
| Ayu | `AY-003` | hightysport, funsport, whatsthename | Unlimited |
| Atep | `AT-004` | Denuber6, nextseven | **Maks. 3/akun** |

### Credential Admin
| Nama | Password | Level |
|------|----------|-------|
| Ijang | `IB-111` | Full Access · Admin Panel |

### Aturan Akses
- PIC **hanya** bisa login dengan password milik sendiri
- Password PIC lain atau Admin → ditolak (`"Akses ditolak — bukan password Anda"`)
- Admin bisa melihat data semua PIC, kirim notifikasi, lihat activity log
- Saat link di-share → tiap user harus login sendiri (tidak ada bypass)

---

## 🗺️ Struktur Halaman (Bottom Navigation)

```
┌─────────────────────────────────────┐
│  [🏠 Home] [📋 Post] [📊 Stats] [🛡 Admin*]  │
└─────────────────────────────────────┘
* Admin tab hanya muncul jika login sebagai Ijang
```

### 1. 🏠 Home — Dashboard Utama
```
┌─────────────────────────┐
│  [Hero Card]            │
│  Avatar · Nama PIC      │
│  Ring Progress (SVG)    │
│  X% selesai             │
│  Total | Uploaded | Rem │
├─────────────────────────┤
│  [Notifikasi Admin]     │  ← muncul jika ada notif
├─────────────────────────┤
│  🏪 Akun Saya           │
│  [Tile Akun A] [Tile B] │  ← tap → filter ke halaman Post
│  [Tile Akun C] [...]    │
├─────────────────────────┤
│  📅 Progress Harian     │
│  01 Mei ████░░ 3/5      │
│  02 Mei ██████ 5/5 ✓    │
└─────────────────────────┘
```

**Data yang ditampilkan:**
- `hTotal` — total post bulan ini
- `hDone` — post yang sudah ada link posting
- `hPending` — belum ada link
- Ring SVG: animasi `stroke-dashoffset` dari 0% → actual%
- Akun tiles: klik → langsung filter Post page ke akun itu

---

### 2. 📋 Post — Kalender & Daftar Posting

```
┌─────────────────────────┐
│  [Date Strip]           │
│  01 02 03 ●04 05 ...    │
├─────────────────────────┤
│  [Filter Akun Pills]    │
│  Semua @akun1 @akun2   │
├─────────────────────────┤
│  ┌─ Card Posting ─────┐ │
│  │ No.1 · @akunsagita │ │
│  │ Risa · 01 Mei      │ │
│  │ 🏷️ Produk A        │ │
│  │ [REVIEW] tag       │ │
│  ├────────────────────┤ │
│  │ 📹 Video           │ │
│  │ [📥 Download]      │ │
│  ├────────────────────┤ │
│  │ Caption            │ │
│  │ [teks caption...]  │ │
│  │ [📋 Copy Caption]  │ │
│  ├────────────────────┤ │
│  │ 🔗 Link TikTok     │ │
│  │ [input] [Save]     │ │
│  │ atau [link saved]  │ │
│  │ [🔄 Fetch Metrics] │ │
│  │ Views Likes Comment│ │
│  └────────────────────┘ │
└─────────────────────────┘
```

**Kolom data (dari Sheets):**
| Field | Source | Keterangan |
|-------|--------|------------|
| `no` | Kolom NO | Nomor urut |
| `pic` | NAMA PIC | Nama PIC |
| `akun` | TOKO/AKUN | Handle akun TikTok |
| `tgl` | TGL POSTING | Format "DD Mei" |
| `kat` | KATEGORI KONTEN | Tag kategori |
| `produk` | NAMA PRODUCT | ex-Format Video |
| `cap` | COPY/CAPTION | Teks caption |
| `vid` | LINK VIDEO (GDrive) | URL download |
| `up` | LINK POSTING | URL TikTok posting |
| `views/likes/comments` | Realtime fetch | Via GAS getMetrics |

**Kolom dihapus dari tabel:** STATUS, DEADLINE EDIT, APPROVAL, CATATAN, HARGA, ENGRATE, SAVE RATE, SCORE

---

### 3. 📊 Stats — Analytics & Leaderboard

```
┌─────────────────────────┐
│  Total | Upload | Belum │
├─────────────────────────┤
│  🏆 Leaderboard         │
│  🥇 @akunsagita  45.2K  │
│  🥈 @enmeiofficial 31K  │
│  🥉 @sportone87   28K   │
│  #4 @upgrand...   22K   │
├─────────────────────────┤
│  📊 Metrics per Akun    │
│  ┌── @akun ───────────┐ │
│  │ Views Likes Comm   │ │
│  │ Done/Total Posts   │ │
│  └────────────────────┘ │
└─────────────────────────┘
```

**Leaderboard ranking:** berdasarkan total `views` akumulasi semua posting  
**Metrics source:** `localStorage` + GAS `getMetrics` action (realtime fetch)

---

### 4. 🛡 Admin Panel *(khusus Ijang)*

```
┌─────────────────────────┐
│  👥 Overview PIC        │
│  [Risa] [Rahma]         │
│  [Ayu]  [Atep]          │
│  Progress bar per PIC   │
├─────────────────────────┤
│  📢 Kirim Notifikasi    │
│  [Target PIC ▾] [Type ▾]│
│  [textarea pesan]       │
│  [📤 Kirim]             │
├─────────────────────────┤
│  📋 Activity Log        │
│  ● login · 14:32        │
│  ● link saved · 14:45   │
│  ● notif sent · 15:01   │
├─────────────────────────┤
│  🏆 Leaderboard All PIC │
│  (same as Stats page)   │
└─────────────────────────┘
```

**Notifikasi types:**
- 📌 Arahan
- ⚠️ Reminder  
- ✅ Apresiasi
- 🔴 Urgent

---

## 🎨 Design System

### Color Palette (Light Theme)
```css
--bg:       #f5f4f0   /* Warm off-white background */
--surf:     #ffffff   /* Surface / cards */
--border:   #e4e2d8   /* Subtle border */
--accent:   #1d6b4a   /* Primary green — CTA, active state */
--accent2:  #28a265   /* Lighter green */
--accentL:  #e8f5ee   /* Tint green — backgrounds */
--indigo:   #4c51b5   /* Admin / secondary action */
--indigoL:  #eef0fc   /* Tint indigo */
--red:      #e5304a   /* Error / pending */
--orange:   #e07b22   /* Warning / notification */
--gold:     #c9930a   /* Comments metric / medal */
--cyan:     #0891b2   /* Video / fetch / links */
--txt:      #1a1915   /* Primary text */
--txt2:     #6b6856   /* Secondary text */
--muted:    #b0ac9a   /* Placeholder / disabled */
```

### Typography Hierarchy
| Level | Font | Size | Weight | Usage |
|-------|------|------|--------|-------|
| Brand | Unbounded | 36px | 900 | Login screen |
| Title | Unbounded | 18px | 700 | Page headers |
| Nav brand | Unbounded | 17px | 900 | Topbar |
| Card title | Space Grotesk | 16px | 700 | Akun name |
| Body | Space Grotesk | 13–14px | 400–500 | General text |
| Meta | Space Grotesk | 11–12px | 400 | Dates, roles |
| Label | Space Grotesk | 9–10px | 600 | Uppercase tags |
| Metric | Unbounded | 14–24px | 700 | Numbers |

### Border Radius
```
Cards:     16px (--radius)
Buttons:   10–14px
Pills:     20px (full)
Avatars:   50%
Inputs:    10px
Tags:      6–8px
```

---

## ⚡ Motion & Animation System

### Keyframes
| Name | Duration | Easing | Usage |
|------|----------|--------|-------|
| `fadeInUp` | 350ms | spring(34,1.56,.64,1) | Page enter, cards |
| `popIn` | 300ms | spring | Modal, toast, badge |
| `slideInRight` | 300ms | spring | Slide panels |
| `toastIn` | 300ms | spring | Toast notification |
| `countUp` | 400ms | spring | Stat numbers |
| `spin` | 700ms | linear | Loading spinner |
| `pulse` | 1.5s | ease | Notif dot |
| `shake` | 350ms | ease | Wrong password |
| `ripple` | 500ms | ease | Button tap feedback |

### Interaction Triggers
| Event | Element | Animation |
|-------|---------|-----------|
| Page switch | All pages | `fadeInUp` 280ms |
| Card render | Post cards | Staggered `fadeInUp` (60ms delay each) |
| Button tap | save-btn, login-btn, copy-btn | Ripple wave |
| PIC card select | Login grid | Border + bg transition |
| Date btn press | Date strip | `translateY(-1px)` + shadow |
| Akun tile tap | Home tiles | Ripple + scale(.96) |
| Hero ring load | SVG circle | `stroke-dashoffset` 1s cubic |
| Wrong password | passIn field | `shake` + red border |
| Progress bar | All bars | Width 700ms cubic |
| Toast appear | Toast | `toastIn` spring |
| Toast dismiss | Toast | `fadeInUp` reverse 250ms |
| Nav item active | Bottom nav | Accent dot `::before` |

---

## 🔌 Google Apps Script (GAS) — API Endpoints

**Base URL:**
```
https://script.google.com/macros/s/{DEPLOYMENT_ID}/exec
```

### Action: `getData`
```
GET ?action=getData&pic=Risa&month=Mei&callback=fn
```
Response:
```json
{
  "status": "ok",
  "data": [
    {
      "no": 1, "pic": "Risa", "akun": "akunsagita",
      "tgl": "01 Mei", "kat": "Review", "produk": "Produk A",
      "cap": "caption text...", "vid": "https://drive.google.com/...",
      "up": "https://tiktok.com/...",
      "r": "akunsagita:1",
      "views": 0, "likes": 0, "comments": 0
    }
  ]
}
```

### Action: `saveLink`
```
GET ?action=saveLink&row=akunsagita:1&link=https://tiktok.com/...&pic=Risa&callback=fn
```
Response: `{"status":"ok"}` atau `{"status":"error","message":"..."}`

### Action: `getMetrics`
```
GET ?action=getMetrics&link=https://tiktok.com/...&row=akunsagita:1&callback=fn
```
Response:
```json
{ "status": "ok", "views": 45200, "likes": 2100, "comments": 87 }
```

### Action: `sendNotif`
```
GET ?action=sendNotif&targets=Risa,Rahma&type=📌 Arahan&msg=...&from=Ijang&callback=fn
```
Response: `{"status":"ok"}`

> ⚠️ Semua endpoint menggunakan JSONP (script tag injection) karena CORS restriction GAS

---

## 💾 Local Storage Schema

```js
// Per-PIC link storage
'bb21_links_{picName}'  → JSON: { [rowRef]: "https://tiktok.com/..." }

// Per-PIC metrics cache
'bb21_metrics_{picName}' → JSON: { [rowRef]: { views, likes, comments } }

// Global notifications
'bb21_notifs' → JSON: { Risa: [{from, type, msg, time}], ... }

// Activity log
'bb21_log' → JSON: [{type, msg, time}, ...] // max 50 entries
```

`rowRef` format: `"{akun}:{no}"` — e.g. `"akunsagita:1"`

---

## 📊 Data Constraints

| PIC | Akun | Post/Akun | Total Max |
|-----|------|-----------|-----------|
| Risa | 3 akun | Unlimited | dari Sheets |
| Rahma | 3 akun | Unlimited | dari Sheets |
| Ayu | 3 akun | Unlimited | dari Sheets |
| **Atep** | 2 akun | **3 post** | **6 total** |

Atep cap applied di `initApp()`:
```js
const POSTS_LIMIT = { Atep: 3 };
// Filter: max 3 posts per akun per bulan
```

---

## 🗓️ Kalender Mei 2026

- Total hari: **31 hari** (01–31 Mei)
- Date strip: horizontal scroll, active date highlight
- Dot indicator: hari yang punya posting data
- Format tanggal internal: `"DD Mei"` (contoh: `"01 Mei"`, `"15 Mei"`)

---

## 🔄 Fallback & Offline

Jika GAS tidak merespons (timeout 12 detik):
1. App tetap berjalan dengan **demo data** (`buildDemoData()`)
2. Demo data: setiap PIC + akun → generated posting per `POSTS_LIMIT`
3. Link & metrics tetap bisa diisi → tersimpan ke `localStorage`

---

## 🛠️ Setup GAS (Google Apps Script)

### Langkah integrasi Sheets → GAS:

1. Buka Google Sheets yang menjadi sumber data
2. **Extensions → Apps Script**
3. Paste `Code.gs` (template di bawah)
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy Deployment URL → paste ke `GAS_URL` di `index.html`

### Template `Code.gs` minimal:
```javascript
const SHEET_ID = 'YOUR_SHEET_ID';
const SHEET_NAMES = { Risa:'📋 RISA', Rahma:'📋 RAHMA', Ayu:'📋 AYU', Atep:'📋 ATEP' };

function doGet(e) {
  const p = e.parameter;
  const cb = p.callback || 'callback';
  let result;

  if (p.action === 'getData') {
    result = getData(p.pic, p.month);
  } else if (p.action === 'saveLink') {
    result = saveLink(p.row, p.link, p.pic);
  } else if (p.action === 'getMetrics') {
    result = getMetrics(p.link, p.row);
  } else if (p.action === 'sendNotif') {
    result = sendNotif(p.targets, p.type, p.msg, p.from);
  } else {
    result = { status: 'error', message: 'Unknown action' };
  }

  return ContentService
    .createTextOutput(`${cb}(${JSON.stringify(result)})`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function getData(pic, month) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const rows = [];
  const sheets = pic === 'ALL' ? Object.values(SHEET_NAMES) : [SHEET_NAMES[pic]];

  sheets.forEach(sName => {
    const sheet = ss.getSheetByName(sName);
    if (!sheet) return;
    const data = sheet.getDataRange().getValues();
    // Row 3 = headers (index 2), data starts row 5 (index 4)
    for (let i = 4; i < data.length; i++) {
      const r = data[i];
      if (!r[0]) continue;
      rows.push({
        no: r[0], pic: r[1], akun: r[2],
        tgl: r[3], kat: r[4], produk: r[5],
        cap: r[6], vid: r[7], up: r[8],
        r: `${r[2]}:${r[0]}`,
        views: r[9]||0, likes: r[10]||0, comments: r[11]||0
      });
    }
  });
  return { status: 'ok', data: rows };
}

function saveLink(row, link, pic) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAMES[pic]);
  if (!sheet) return { status: 'error', message: 'Sheet not found' };
  const data = sheet.getDataRange().getValues();
  const [akun, no] = row.split(':');
  for (let i = 4; i < data.length; i++) {
    if (String(data[i][0]) === no && String(data[i][2]) === akun) {
      sheet.getRange(i + 1, 9).setValue(link); // Column I = LINK POSTING
      return { status: 'ok' };
    }
  }
  return { status: 'error', message: 'Row not found' };
}

function getMetrics(link, row) {
  // TODO: implement TikTok scraping or API call
  // For now return placeholder
  return { status: 'ok', views: 0, likes: 0, comments: 0 };
}

function sendNotif(targets, type, msg, from) {
  // Optional: save to a Notifications sheet
  return { status: 'ok' };
}
```

---

## 🧩 Komponen UI — Referensi Cepat

### Card Posting
```html
<div class="card ani-fadein">
  <div class="card-head"> ... </div>
  <div class="vid-sec"> ... </div>   <!-- optional -->
  <div class="cap-sec"> ... </div>
  <div class="link-sec"> ... </div>
</div>
```

### Hero Card
```html
<div class="hero-card">
  <div class="hero-bg-glow"></div>
  <div class="hero-top"> ... avatar + info + badge ... </div>
  <div class="hero-ring-wrap"> ... SVG ring ... </div>
  <div class="hero-stats"> ... total | done | pending ... </div>
</div>
```

### Toast
```js
toast('Pesan sukses', 'ok');   // green border
toast('Pesan error', 'err');   // red border
toast('Pesan info', 'info');   // cyan border
// Auto dismiss 2.8s + fade-out 250ms
```

### Notifikasi
```js
// Admin kirim → target PIC lihat di Home notif panel
// Stored: localStorage 'bb21_notifs' → { Risa: [{from,type,msg,time}] }
```

---

## 📐 Layout Grid

```
Max-width: 480px (mobile-first, centered desktop)
Padding page: 14px 18px
Gap cards: 10px
Grid stat: 3 kolom 1fr
Grid akun tiles: 2 kolom 1fr
Grid PIC overview (admin): 2 kolom 1fr
Grid metrics akun: 4 kolom 1fr
```

---

## ✅ Checklist Deployment

- [ ] Paste `GAS_URL` deployment di `index.html` line ~600
- [ ] Verifikasi nama sheet sama persis: `📋 RISA`, `📋 RAHMA`, `📋 AYU`, `📋 ATEP`
- [ ] Kolom Sheets sesuai urutan: NO, NAMA PIC, TOKO/AKUN, TGL POSTING, KATEGORI KONTEN, NAMA PRODUCT, COPY/CAPTION, LINK VIDEO, LINK POSTING, VIEWS, LIKES, COMMENTS
- [ ] Test login semua PIC + Admin
- [ ] Test save link + sync ke Sheets
- [ ] Test fetch metrics (atau implementasi getMetrics di GAS)
- [ ] Test kirim notifikasi dari Admin ke PIC
- [ ] Test Atep: pastikan max 3 post per akun tampil

---

*Dokumentasi ini di-generate otomatis · Manager Content v2.0 · Mei 2026*
