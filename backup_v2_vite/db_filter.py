python3 << 'PYEOF'
import re

with open('/mnt/user-data/outputs/caption_generator_v12.html', 'r', encoding='utf-8') as f:
    v = f.read()

# ── 1. CSS tambahan untuk product filter chips ─────────────────────────────
new_css = """
/* ── PRODUCT FILTER ─────────────────────────────────────── */
.prod-filter-wrap{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}
.pf-chip{
  padding:6px 14px;border-radius:20px;
  border:1px solid var(--border2);
  font-size:11px;cursor:pointer;
  background:var(--bg3);color:var(--text2);
  transition:all .2s;font-weight:700;
  font-family:'Space Mono',monospace;
  letter-spacing:.01em;user-select:none;
}
.pf-chip:hover{border-color:var(--orange);color:var(--orange);background:#1a1000}
.pf-chip.active{
  background:#2a1800;border-color:var(--orange);color:var(--orange);
  box-shadow:0 0 10px rgba(255,179,64,.12);
}
.pf-all-btns{display:flex;gap:6px;margin-top:8px}
.pf-all-btns button{
  flex:1;padding:6px;font-size:11px;
  border-radius:var(--rs);border:1px solid var(--border2);
  background:var(--bg3);cursor:pointer;color:var(--text2);
  transition:all .2s;font-family:'DM Sans',sans-serif;
}
.pf-all-btns button:hover{border-color:var(--orange);color:var(--orange)}
.prod-map-info{
  margin-top:10px;font-size:10px;color:var(--text3);
  font-family:'Space Mono',monospace;line-height:1.8;
  padding:8px 12px;background:var(--bg3);
  border-radius:var(--rs);border:1px solid var(--border);
}
"""
# Sisipkan CSS sebelum </style>
v = v.replace('</style>', new_css + '\n</style>', 1)

# ── 2. HTML: Tambah Step 3.5 Product Filter antara Slot dan Gaya ──────────
# Cari HTML untuk STEP 4 GAYA untuk insertBefore
step4_html = '<!-- STEP 4: GAYA -->'
new_step35 = """<!-- STEP 3.5: PRODUCT FILTER -->
<div class="sec" id="prod-filter-sec">
  <div class="step-label">
    <div class="snum orange">3.5</div>
    <span class="stitle">Filter Produk <small>— pilih produk yang mau di-generate</small></span>
  </div>
  <div class="prod-filter-wrap" id="prod-filter-chips"></div>
  <div class="pf-all-btns">
    <button onclick="selAllProds()">✅ Semua Produk</button>
    <button onclick="clrAllProds()">✕ Hapus Semua</button>
  </div>
  <div class="prod-map-info" id="prod-map-info"></div>
</div>

"""
v = v.replace(step4_html, new_step35 + step4_html, 1)

# ── 3. JS: Tambah PIC_PRODUK map + selProds state + fungsi filter ─────────
# Sisipkan setelah STATE block (setelah var selSlots = [1,2,3];)
state_anchor = 'var selSlots = [1,2,3];'
js_insert = """
var selSlots = [1,2,3];
/* ── PRODUCT CONFIG PER PIC ─── */
var PIC_PRODUK = {
  "RISA":  {"#1":"JOGGER WAFFLE","#2":"SETELAN DRY-FIT","#3":"MANSET BASELAYER THUMBHOLE"},
  "RAHMA": {"#1":"JOGGER WAFFLE","#2":"JERSEY DRY-FIT","#3":"MANSET BASELAYER STANDAR"},
  "AYU":   {"#1":"SETELAN DRY-FIT","#2":"JERSEY DRY-FIT","#3":"MANSET BASELAYER THUMBHOLE"},
  "ATEP":  {"#1":"JOGGER WAFFLE","#2":"TRAINING HYPEBEAST","#3":"POLO SCUBA"}
};
var selProds = []; /* produk yang DIIZINKAN di-generate (nama produk string) */"""

# Ganti state_anchor dengan versi baru (hapus yang lama, sisipkan baru)
v = v.replace(state_anchor, js_insert, 1)

# ── 4. JS: Fungsi buildProdFilter, selAllProds, clrAllProds ───────────────
prod_filter_js = """
/* ═══════════════════════════════════════
   PRODUCT FILTER
═══════════════════════════════════════ */
function buildProdFilter(){
  var cfg = PIC_PRODUK[curPIC] || {};
  var wrap = document.getElementById('prod-filter-chips');
  var info = document.getElementById('prod-map-info');
  wrap.innerHTML = '';

  // Build unique produk list per slot, maintain slot order
  var seen = {};
  var items = []; // [{slot, produk}]
  ['#1','#2','#3'].forEach(function(slot){
    var prod = cfg[slot];
    if(prod && !seen[prod]){
      seen[prod] = true;
      items.push({slot:slot, produk:prod});
    }
  });

  // Default: semua aktif
  selProds = items.map(function(it){return it.produk});

  items.forEach(function(it){
    var chip = document.createElement('div');
    chip.className = 'pf-chip active';
    chip.dataset.prod = it.produk;
    chip.textContent = it.slot + ' · ' + it.produk;
    chip.onclick = function(){
      chip.classList.toggle('active');
      var idx = selProds.indexOf(it.produk);
      if(idx === -1) selProds.push(it.produk);
      else selProds.splice(idx,1);
      updateSummary();
    };
    wrap.appendChild(chip);
  });

  // Info mapping slot → produk
  var lines = [];
  Object.keys(cfg).forEach(function(slot){
    lines.push(slot + ' → ' + cfg[slot]);
  });
  info.textContent = 'Mapping: ' + lines.join('  |  ');
}

function selAllProds(){
  var cfg = PIC_PRODUK[curPIC] || {};
  selProds = [];
  var seen = {};
  Object.values(cfg).forEach(function(p){
    if(!seen[p]){seen[p]=true;selProds.push(p);}
  });
  document.querySelectorAll('.pf-chip').forEach(function(c){c.classList.add('active')});
  updateSummary();
}

function clrAllProds(){
  selProds = [];
  document.querySelectorAll('.pf-chip').forEach(function(c){c.classList.remove('active')});
  updateSummary();
}
"""
# Sisipkan fungsi sebelum HASH ENGINE
hash_anchor = '/* ═══════════════════════════════════════\n   HASH ENGINE'
v = v.replace(hash_anchor, prod_filter_js + '\n' + hash_anchor, 1)

# ── 5. JS: Update selectPIC agar panggil buildProdFilter ─────────────────
old_selectPIC = """function selectPIC(pic,el){
  curPIC=pic;
  document.querySelectorAll('.pic-tab').forEach(function(t){t.classList.remove('active')});
  el.classList.add('active');
  selDates=[];
  buildDates();
  updatePICInfo();
  updateSummary();
}"""
new_selectPIC = """function selectPIC(pic,el){
  curPIC=pic;
  document.querySelectorAll('.pic-tab').forEach(function(t){t.classList.remove('active')});
  el.classList.add('active');
  selDates=[];
  buildDates();
  updatePICInfo();
  buildProdFilter();
  updateSummary();
}"""
v = v.replace(old_selectPIC, new_selectPIC, 1)

# ── 6. JS: Update buildCombos agar filter by selProds ────────────────────
old_buildCombos = """function buildCombos(){
  var rows=DB[curPIC]||[];
  var slotSet=new Set(selSlots.map(function(s){return '#'+s}));
  var dateSet=new Set(selDates);
  return rows.filter(function(r){
    return dateSet.has(r[2])&&slotSet.has(r[1])&&r[3];
  }).map(function(r){
    return {pic:curPIC,akun:r[0],slot:r[1],tanggal:r[2],produk:r[3]};
  });
}"""
new_buildCombos = """function buildCombos(){
  var rows=DB[curPIC]||[];
  var slotSet=new Set(selSlots.map(function(s){return '#'+s}));
  var dateSet=new Set(selDates);
  var prodSet=new Set(selProds);
  return rows.filter(function(r){
    return dateSet.has(r[2])&&slotSet.has(r[1])&&r[3]&&prodSet.has(r[3]);
  }).map(function(r){
    return {pic:curPIC,akun:r[0],slot:r[1],tanggal:r[2],produk:r[3]};
  });
}"""
v = v.replace(old_buildCombos, new_buildCombos, 1)

# ── 7. JS: Update INIT agar panggil buildProdFilter ──────────────────────
old_init = """document.getElementById('gas-url').value=GAS_URL;
updatePICInfo();
buildDates();
updateSummary();"""
new_init = """document.getElementById('gas-url').value=GAS_URL;
updatePICInfo();
buildDates();
buildProdFilter();
updateSummary();"""
v = v.replace(old_init, new_init, 1)

# ── 8. Update versi ──────────────────────────────────────────────────────
v = v.replace('v12 · 7 PRODUK · MEI 2026', 'v13 · 7 PRODUK · PRODUCT FILTER')
v = v.replace('<title>Caption Generator v12 — BB21</title>',
              '<title>Caption Generator v13 — BB21</title>')
v = v.replace('DB 7 Produk · 1–31 Mei 2026', 'DB 7 Produk · Filter per Produk · Mei 2026')

with open('/mnt/user-data/outputs/caption_generator_v13.html', 'w', encoding='utf-8') as f:
    f.write(v)

print("v13 written:", round(len(v)/1024, 1), "KB")

# Verifikasi
checks = [
  ('PIC_PRODUK',        'PIC_PRODUK' in v),
  ('selProds var',      'var selProds' in v),
  ('buildProdFilter fn','function buildProdFilter' in v),
  ('selAllProds fn',    'function selAllProds' in v),
  ('clrAllProds fn',    'function clrAllProds' in v),
  ('prodSet filter',    'prodSet.has' in v),
  ('pf-chip CSS',       'pf-chip' in v),
  ('prod-filter-sec',   'prod-filter-sec' in v),
  ('Step 3.5 HTML',     '3.5' in v),
  ('buildProdFilter in selectPIC', 'buildProdFilter();\n  updateSummary' in v or 'buildProdFilter();\n  updateSummary' in v.replace('\n  ',' ')),
  ('buildProdFilter in INIT', 'buildProdFilter();\nupdateSummary' in v or 'buildProdFilter();\nupdate' in v),
]
print("\nVerifikasi:")
for name, ok in checks:
    print("  [" + ("OK" if ok else "FAIL") + "] " + name)
PYEOF
Output

v13 written: 136.8 KB

Verifikasi:
  [OK] PIC_PRODUK
  [OK] selProds var
  [OK] buildProdFilter fn
  [OK] selAllProds fn
  [OK] clrAllProds fn
  [OK] prodSet filter
  [OK] pf-chip CSS
  [OK] prod-filter-sec
  [OK] Step 3.5 HTML
  [OK] buildProdFilter in selectPIC
  [OK] buildProdFilter in INIT
Done