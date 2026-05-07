function doGet(e) {
  try {
    var p = e.parameter;
    var action = p.action;
    var callback = p.callback;
    var result;

    if (action === 'getData') {
      result = getAllData(p.pic);
    } else if (action === 'saveLink') {
      result = saveToSheet(p.row, CONFIG.COL.LINK_POSTING + 1, p.link);
    } else if (action === 'saveDailyBatch') {
      result = handleDailyBatch(p.pic, JSON.parse(p.links));
    } else if (action === 'sendNotif') {
      result = handleSendNotif(p.targets, p.type, p.msg, p.from);
    } else if (action === 'getNotifs') {
      result = handleGetNotifs(p.pic);
    } else if (action === 'logActivity') {
      result = handleLogActivity(p.pic, p.type, p.msg);
    } else if (action === 'getMetrics') {
      result = handleGetMetrics(p.link, p.row);
    } else if (action === 'getPicAkun') {
      result = getPicAkunData();
    } else if (action === 'getDailyLinks') {
      result = getDailyLinks(p.pic);
    } else if (action === 'saveDailyLink') {
      result = saveDailyLink(p.row, p.slot, p.link);
    } else if (action === 'migrate') {
      setupAndMigrateDailyPICs();
      result = { status: 'ok', message: 'Migrasi selesai! Tab DAILY PIC (Rahma, Risa, Ayu) sudah diformat ulang.' };
    } else if (action === 'saveCaptions' || p.data) {
      result = handleSaveCaptions(p.data);
    } else {
      result = { status: 'error', message: 'Action tidak dikenal: ' + action };
    }

    var output = JSON.stringify(result);
    if (callback) {
      return ContentService.createTextOutput(callback + '(' + output + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService.createTextOutput(output)
        .setMimeType(ContentService.MimeType.JSON);
    }

  } catch (err) {
    var errRes = JSON.stringify({ status: 'error', message: err.toString() });
    if (e && e.parameter && e.parameter.callback) {
      return ContentService.createTextOutput(e.parameter.callback + '(' + errRes + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(errRes)
      .setMimeType(ContentService.MimeType.JSON);
  }
}


// ─── CONFIGURATION ──────────────────────────────────────────────────────────
var CONFIG = {
  SPREADSHEET_ID: '1mTQ8R_MZgLSIFLp4A5Kiwo42W1yP-wh0sG7m80-Oats',
  PIC_SHEETS: { 'risa': '📋 RISA', 'rahma': '📋 RAHMA', 'ayu': '📋 AYU', 'atep': '📋 ATEP' },
  DAILY_SHEETS: { 'risa': '📝 DAILY RISA', 'rahma': '📝 DAILY RAHMA', 'ayu': '📝 DAILY AYU', 'atep': '📝 DAILY ATEP' },
  DATA_PIC_AKUN: 'DATA PIC AKUN',
  DAILY_REPORT: 'DAILY REPORT',
  NOTIFICATIONS: 'NOTIFICATIONS',
  SYSTEM_LOGS: 'SYSTEM_LOGS',
  PIC_DATA_START: 5,
  AKUN_DATA_START: 3,
  COL: { NO: 0, NAMA_PIC: 1, AKUN: 2, TAUTAN: 3, POST: 4, TGL: 5, HARI: 6, KATEGORI: 7, PRODUK: 8, FOTO: 9, VIDEO: 10, HEADLINE: 11, DESKRIPSI: 12, CTA: 13, HASHTAG: 14, CAPTION: 15, LINK_POSTING: 16, VIEWS: 17, LIKES: 18, COMMENTS: 19, SHARES: 20, SAVES: 21, POSTING_TIME: 22, FOLLOWER: 23, BASKET: 24 },
  DAILY_COL: { NO: 0, PIC: 1, TGL: 2, HARI: 3, AKUN: 4, LINK1: 5 }
};

function getActive() {
  try {
    return SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  } catch (e) {
    return SpreadsheetApp.getActiveSpreadsheet();
  }
}

// ─── GET ALL DATA (Main Data Feed) ───────────────────────────────────────────
function getAllData(picFilter) {
  picFilter = (picFilter || 'ALL').toLowerCase().trim();
  var ss = getActive();
  var allData = [];
  var foundSheets = [];

  // Tentukan sheet mana yang akan dibaca (Admin/ALL membaca semua sheet)
  var targetPICs = (picFilter === 'all' || picFilter === 'admin')
    ? Object.keys(CONFIG.PIC_SHEETS)
    : [picFilter];

  targetPICs.forEach(function(pic) {
    var sheetName = "";
    // Cari PIC secara case-insensitive
    for (var key in CONFIG.PIC_SHEETS) {
      if (key.toLowerCase() === pic) {
        sheetName = CONFIG.PIC_SHEETS[key];
        break;
      }
    }
    if (!sheetName) return;

    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    foundSheets.push(sheetName);

    var lastRow = sheet.getLastRow();
    if (lastRow < CONFIG.PIC_DATA_START) return;

    var numRows = lastRow - CONFIG.PIC_DATA_START + 1;
    var values = sheet.getRange(CONFIG.PIC_DATA_START, 1, numRows, 26).getValues();

    values.forEach(function(row, idx) {
      var no    = row[CONFIG.COL.NO];
      var akun  = row[CONFIG.COL.AKUN];
      if (!no && !akun) return; // skip baris kosong

      var rawLink  = String(row[CONFIG.COL.LINK_POSTING] || '').trim();
      var cleanLink = rawLink.startsWith('http') ? rawLink : '';

      var basket = null;
      try {
        var basketRaw = row[CONFIG.COL.BASKET];
        if(basketRaw && (String(basketRaw).startsWith('{') || String(basketRaw).startsWith('['))){
          basket = JSON.parse(basketRaw);
        }
      } catch(e){}

      allData.push({
        pic:       row[CONFIG.COL.NAMA_PIC],
        no:        no || (idx + 1),
        akun:      akun,
        tautan:    row[CONFIG.COL.TAUTAN] || '',
        post:      row[CONFIG.COL.POST] || '',
        tgl:       formatDateMei(row[CONFIG.COL.TGL]),
        hari:      row[CONFIG.COL.HARI] || '',
        kategori:  row[CONFIG.COL.KATEGORI] || '',
        produk:    row[CONFIG.COL.PRODUK] || '',
        foto:      row[CONFIG.COL.FOTO] || '',
        vid:       row[CONFIG.COL.VIDEO] || '',
        headline:  row[CONFIG.COL.HEADLINE] || '',
        deskripsi: row[CONFIG.COL.DESKRIPSI] || '',
        cta:       row[CONFIG.COL.CTA] || '',
        hashtag:   row[CONFIG.COL.HASHTAG] || '',
        cap:       row[CONFIG.COL.CAPTION] || '',
        caption:   row[CONFIG.COL.CAPTION] || '',
        up:        cleanLink,
        views:     _int(row[CONFIG.COL.VIEWS]),
        likes:     _int(row[CONFIG.COL.LIKES]),
        comments:  _int(row[CONFIG.COL.COMMENTS]),
        shares:    _int(row[CONFIG.COL.SHARES]),
        saves:     _int(row[CONFIG.COL.SAVES]),
        postingHr: row[CONFIG.COL.POSTING_TIME] || '',
        followers: _int(row[CONFIG.COL.FOLLOWER]),
        basket:    basket,
        r:         sheetName + '!' + (CONFIG.PIC_DATA_START + idx)
      });
    });
  });

  // Ambil data DAILY REPORT
  var dailyReports = _getDailyReportMap(ss);

  // Ambil notifikasi
  var notifs = handleGetNotifs(picFilter !== 'all' ? picFilter : 'ALL').data;

  return {
    status: 'ok',
    data: allData,
    debug: { foundSheets: foundSheets, totalRows: allData.length },
    notifications: notifs,
    dailyReports: dailyReports
  };
}

// ─── GET DATA PIC & AKUN (dari sheet DATA PIC AKUN) ──────────────────────────
/*
  Struktur sheet DATA PIC AKUN (0-based setelah skip baris judul):
    Baris header (row 2 di sheet): NAMA PIC | PASSWORD | TOKO/AKUN | TAUTAN TOKO
    Data mulai baris 3:
      Risa   | RH-001 | akunsagita     | https://...
      (blank)| (blank)| enmeiofficial  | https://...
      (blank)| (blank)| sportone87     | https://...
      Rahma  | RM-002 | upgrand.official | ...
      dst.
  Kita merge PIC name ke bawah (forward-fill) karena ada baris kosong.
*/
function getPicAkunData() {
  var ss = getActive();
  var sheet = ss.getSheetByName(CONFIG.DATA_PIC_AKUN);
  if (!sheet) return { status: 'error', message: 'Sheet DATA PIC AKUN tidak ditemukan' };

  var lastRow = sheet.getLastRow();
  // Data mulai dari AKUN_DATA_START (baris 3 = row index 2)
  var numRows = lastRow - CONFIG.AKUN_DATA_START + 1;
  if (numRows < 1) return { status: 'ok', data: [] };

  var values = sheet.getRange(CONFIG.AKUN_DATA_START, 1, numRows, 4).getValues();

  var result = [];
  var currentPic = '';
  var currentPwd = '';

  values.forEach(function(row) {
    if (row[0]) { currentPic = String(row[0]).trim(); }
    if (row[1]) { currentPwd = String(row[1]).trim(); }
    var akun   = String(row[2] || '').trim();
    var tautan = String(row[3] || '').trim();
    if (!akun) return;

    result.push({
      pic:      currentPic,
      password: currentPwd,
      akun:     akun,
      tautan:   tautan
    });
  });

  // Buat juga summary per PIC (untuk login validation)
  var picMap = {};
  result.forEach(function(r) {
    if (!picMap[r.pic]) {
      picMap[r.pic] = { password: r.password, akuns: [] };
    }
    picMap[r.pic].akuns.push({ akun: r.akun, tautan: r.tautan });
  });

  return { status: 'ok', data: result, picMap: picMap };
}

// ─── GET DAILY LINKS (sheet 📝 DAILY xxx) ────────────────────────────────────
/*
  Header di baris 4, data mulai baris 5.
  Kolom: NO | NAMA PIC | TANGGAL KALENDER | HARI | NAMA TOKO / AKUN | LINK1..LINK10
  Filter by pic + optional tgl.
*/
function getDailyLinks(pic, tglFilter) {
  pic = (pic || '').toLowerCase().trim();
  var sheetName = CONFIG.DAILY_SHEETS[pic];
  if (!sheetName) return { status: 'error', message: 'PIC tidak dikenal: ' + pic };

  var ss = getActive();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { status: 'error', message: 'Sheet ' + sheetName + ' tidak ditemukan' };

  var lastRow = sheet.getLastRow();
  if (lastRow < CONFIG.PIC_DATA_START) return { status: 'ok', data: [] };

  var numRows = lastRow - CONFIG.PIC_DATA_START + 1;
  var values = sheet.getRange(CONFIG.PIC_DATA_START, 1, numRows, 15).getValues();

  var result = [];
  values.forEach(function(row, idx) {
    var no   = row[0];
    var tgl  = String(row[2] || '').trim();
    var akun = String(row[4] || '').trim();
    if (!no && !akun) return;

    // Filter tanggal jika diberikan
    if (tglFilter && tgl.indexOf(tglFilter) === -1) return;

    var links = [];
    for (var i = 5; i <= 14; i++) {
      var lnk = String(row[i] || '').trim();
      if (lnk.startsWith('http')) links.push(lnk);
    }

    result.push({
      no:   no,
      pic:  row[1],
      tgl:  tgl,
      hari: row[3],
      akun: akun,
      links: links,
      // rowRef untuk saveDailyLink
      r: sheetName + '!' + (CONFIG.PIC_DATA_START + idx)
    });
  });

  return { status: 'ok', data: result };
}

// ─── SAVE DAILY LINK (ke sheet 📝 DAILY xxx, kolom slot tertentu) ─────────────
/*
  slot: 1–10 → kolom 6–15 (1-based) atau index 5–14 (0-based)
*/
function saveDailyLink(rowRef, slot, link) {
  var stats = { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 };
  if (link && link.startsWith('http')) {
    stats = scrapeTikTok(link);
  }

  // Update Link (Kolom 6 / F)
  saveToSheet(rowRef, 6, link);
  
  // Update Metrics (Kolom 7 s/d 11)
  saveToSheet(rowRef, 7,  stats.views);
  saveToSheet(rowRef, 8,  stats.likes);
  saveToSheet(rowRef, 9,  stats.comments);
  saveToSheet(rowRef, 10, stats.shares);
  saveToSheet(rowRef, 11, stats.saves);

  // Update Nama Produk (Kolom 12 / L)
  if (stats.basket) {
    var b = Array.isArray(stats.basket) ? stats.basket[0] : stats.basket;
    var prodInfo = b.name;
    // Proteksi: Jika di G-Sheet sudah ada nama manual, gunakan itu
    try {
      var parts = rowRef.split('!');
      var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(parts[0]);
      var existing = s.getRange(parts[1], 12).getValue();
      if(existing && (prodInfo.indexOf('Heuristic') !== -1)) prodInfo = existing;
    } catch(e){}
    
    saveToSheet(rowRef, 12, prodInfo);
  }

  return { status: 'ok', data: stats };
}

// ─── SAVE TO SHEET (universal) ────────────────────────────────────────────────
function saveToSheet(rowRef, colIndex, value) {
  try {
    if (!rowRef || rowRef.indexOf('!') === -1) {
      return { status: 'error', message: 'rowRef tidak valid: ' + rowRef };
    }

    // Anti-Cheat: Global Duplicate Check
    if (value && String(value).startsWith('http') && _checkLinkDuplicate(value, rowRef)) {
      handleLogActivity('SYSTEM', 'cheat_attempt', 'Duplicate link blocked: ' + value + ' at ' + rowRef);
      return { status: 'error', message: 'DUPLICATE_LINK_DETECTED' };
    }
    var parts    = rowRef.split('!');
    var sheetName = parts[0];
    var rowNum    = parseInt(parts[1]);

    if (!rowNum || rowNum < 2) {
      return { status: 'error', message: 'Nomor baris tidak valid: ' + parts[1] };
    }

    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);

    if (!sheet) {
      handleLogActivity('SYSTEM', 'sheet_not_found', 'Sheet: ' + sheetName + ' | rowRef: ' + rowRef);
      return { status: 'error', message: 'Sheet tidak ditemukan: ' + sheetName };
    }

    sheet.getRange(rowNum, colIndex).setValue(value);
    return { status: 'ok' };

  } catch (e) {
    handleLogActivity('SYSTEM', 'save_error', 'rowRef: ' + rowRef + ' col: ' + colIndex + ' err: ' + e.toString());
    return { status: 'error', message: e.toString() };
  }
}

// ─── GET METRICS (scrape TikTok) ──────────────────────────────────────────────
/*
  Menyimpan ke kolom PIC sheet:
    Views  → kolom 18 (1-based) = index 17
    Likes  → kolom 19
    Comments → kolom 20
    Shares → kolom 21
    Saves  → kolom 22
    PostingTime → kolom 23 (waktu scraping WIB)
    Followers → kolom 24
*/
function handleGetMetrics(link, rowRef) {
  try {
    if (!link || (link.indexOf('tiktok.com') === -1 && link.indexOf('vt.tiktok') === -1)) {
      return { status: 'error', message: 'Link bukan TikTok: ' + link };
    }

    var stats = scrapeTikTok(link);

    if (rowRef) {
      try {
        saveToSheet(rowRef, CONFIG.COL.VIEWS    + 1, stats.views);
        saveToSheet(rowRef, CONFIG.COL.LIKES    + 1, stats.likes);
        saveToSheet(rowRef, CONFIG.COL.COMMENTS + 1, stats.comments);
        saveToSheet(rowRef, CONFIG.COL.SHARES   + 1, stats.shares);
        saveToSheet(rowRef, CONFIG.COL.SAVES    + 1, stats.saves);

        var now     = new Date();
        var timeStr = Utilities.formatDate(now, 'GMT+7', 'dd/MM HH:mm');
        saveToSheet(rowRef, CONFIG.COL.POSTING_TIME + 1, timeStr);

        if (stats.followers) {
          saveToSheet(rowRef, CONFIG.COL.FOLLOWER + 1, stats.followers);
        }
        // Simpan data basket ke kolom BASKET (index 24, kolom 25)
        if (stats.basket) {
          saveToSheet(rowRef, CONFIG.COL.BASKET + 1, JSON.stringify(stats.basket));
          
          var bArr = Array.isArray(stats.basket) ? stats.basket : [stats.basket];
          if (bArr.length > 0 && bArr[0].link) {
            saveToSheet(rowRef, CONFIG.COL.TAUTAN + 1, bArr[0].link);
            
            // --- PROTEKSI TOTAL: JANGAN PERNAH TULIS NAMA PRODUK KE G-SHEET ---
            var existingProd = "";
            try {
              var parts = rowRef.split('!');
              var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(parts[0]);
              existingProd = s.getRange(parts[1], CONFIG.COL.PRODUK + 1).getValue();
            } catch(e) {}
            
            if (existingProd) {
              bArr[0].name = existingProd; 
            }
          }
        } else {
          saveToSheet(rowRef, CONFIG.COL.BASKET + 1, "");
        }
      } catch (saveErr) {
        handleLogActivity('SYSTEM', 'scraper_save_error',
          'Row: ' + rowRef + ' | Err: ' + saveErr.toString());
      }
    }

    return { status: 'ok', data: stats };

  } catch (e) {
    handleLogActivity('SYSTEM', 'scraper_error', 'Link: ' + link + ' | Err: ' + e.toString());
    return { status: 'error', message: e.toString() };
  }
}

// ─── DAILY BATCH (simpan batch link ke DAILY REPORT sheet) ───────────────────
/*
  linksArray: [{ akun, tgl, slot, produk, link }, ...]
  Kolom DAILY REPORT: Timestamp | PIC | Akun | Tanggal | Slot | Link | Views | Likes | Comm | Share | Save | Product
*/
function handleDailyBatch(pic, linksArray) {
  var ss = getActive();
  
  // Ambil sheet PIC yang sesuai (contoh: 📝 DAILY RISA)
  var sheetName = CONFIG.DAILY_SHEETS[(pic || '').toLowerCase()];
  if (!sheetName) return { status: 'error', message: 'Sheet PIC ' + pic + ' tidak ditemukan' };
  
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { status: 'error', message: 'Sheet ' + sheetName + ' tidak ada di spreadsheet' };

  var now = new Date();
  var data = sheet.getDataRange().getValues();

  linksArray.forEach(function(item) {
    if (!item.link) return;
    var stats = scrapeTikTok(item.link);
    var slotName = 'Slot ' + item.slot;
    var foundRow = -1;

    // Cari baris yang sudah ada berdasarkan detail format (Akun + Tanggal + Slot)
    for (var i = 1; i < data.length; i++) {
      if (data[i][2] === item.akun && formatDateMei(data[i][3]) === formatDateMei(item.tgl) && data[i][4] === slotName) {
        foundRow = i + 1;
        break;
      }
    }

    var prodInfo = '';
    if (stats.basket) {
      var b = Array.isArray(stats.basket) ? stats.basket[0] : stats.basket;
      prodInfo = b.name;
      if (foundRow !== -1) {
        var existingDailyProd = data[foundRow-1][11];
        var isHeurDaily = (prodInfo.indexOf('(Heuristic)') !== -1 || prodInfo.indexOf('(Pattern)') !== -1);
        if (existingDailyProd && isHeurDaily) prodInfo = existingDailyProd;
      }
    }

    var rowValues = [
      now, pic, item.akun, item.tgl, slotName, item.link,
      stats.views, stats.likes, stats.comments, stats.shares, stats.saves,
      prodInfo || item.produk || ''
    ];

    if (foundRow > 0) {
      sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
  });

  return { status: 'ok', message: 'Daily batch saved to ' + sheetName };
}

// ─── FUNGSI SETUP FORMAT TABEL DAN MIGRASI ───
// Jalankan fungsi ini SATU KALI dari Google Apps Script Editor untuk menyiapkan format tabel
// masing-masing PIC (Rahma, Risa, Ayu - kecuali Atep) dan memindahkan data dari DAILY REPORT.
function setupAndMigrateDailyPICs() {
  var ss = getActive();
  
  // 1. Siapkan format header untuk PIC (Kecuali ATEP)
  var targetPics = ['rahma', 'risa', 'ayu'];
  var headers = [
    'Timestamp', 'PIC', 'Akun', 'Tanggal', 'Slot', 'Link',
    'Views', 'Likes', 'Comm', 'Share', 'Save', 'Product'
  ];
  
  var allSheets = ss.getSheets();
  var targetSheets = {};
  
  targetPics.forEach(function(pic) {
    var picUpper = pic.toUpperCase();
    var sheet = null;
    
    // Cari sheet secara dinamis dengan nama yang mengandung "DAILY" dan nama PIC (Abaikan Emoji)
    for (var j = 0; j < allSheets.length; j++) {
      var sName = allSheets[j].getName().toUpperCase();
      if (sName.indexOf('DAILY') !== -1 && sName.indexOf(picUpper) !== -1) {
        sheet = allSheets[j];
        break;
      }
    }
    
    if (!sheet) {
      // Jika benar-benar tidak ketemu, buat baru
      sheet = ss.insertSheet('📝 DAILY ' + picUpper);
    } else {
      // Bersihkan isi sheet yang lama (format lama akan dihapus)
      sheet.clear();
    }
    
    // Buat header baru yang sama dengan DAILY REPORT
    sheet.appendRow(headers);
    
    // Styling header agar rapi
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setBackground('#4c51b5'); // Warna ungu elegan
    headerRange.setFontColor('#ffffff');
    headerRange.setFontWeight('bold');
    
    // Simpan referensi sheet untuk proses migrasi nanti
    targetSheets[pic] = sheet;
  });

  // 2. Memindahkan (Migrasi) data lama dari sheet DAILY REPORT
  var oldSheet = null;
  for (var k = 0; k < allSheets.length; k++) {
    if (allSheets[k].getName().toUpperCase().indexOf('DAILY REPORT') !== -1) {
      oldSheet = allSheets[k];
      break;
    }
  }
  
  if (oldSheet) {
    var data = oldSheet.getDataRange().getValues();
    if (data.length > 1) { // Pastikan ada data selain header
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var picName = String(row[1] || '').toLowerCase().trim();
        
        // Pindahkan baris data ke sheet PIC masing-masing jika PIC tsb ada di targetSheets
        if (targetSheets[picName]) {
          targetSheets[picName].appendRow(row);
        }
      }
    }
  }
}

// ─── SCRAPER TIKTOK ───────────────────────────────────────────────────────────
function scrapeTikTok(url) {
  var MAX_RETRIES = 3;
  var RETRY_MS    = 500;
  var OPTS        = { muteHttpExceptions: true, followRedirects: true };

  if (!url || typeof url !== 'string' || !url.trim().startsWith('http')) {
    handleLogActivity('SYSTEM', 'invalid_url', 'URL tidak valid: ' + url);
    return { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, followers: 0 };
  }

  for (var attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Resolve short URL to full URL for better metadata exposure
      var resolvedUrl = url;
      if (url.indexOf('vt.tiktok.com') !== -1) {
        var headResp = UrlFetchApp.fetch(url, { followRedirects: false, muteHttpExceptions: true });
        resolvedUrl = headResp.getHeaders()['Location'] || url;
      }

      // Force HD Metadata and Browser Emulation
      var finalUrl = 'https://www.tikwm.com/api/?url=' + encodeURIComponent(resolvedUrl) + '&hd=1';
      var fetchOpts = {
        muteHttpExceptions: true,
        followRedirects: true,
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1"
        }
      };

      var resp = UrlFetchApp.fetch(finalUrl, fetchOpts);
      var code = resp.getResponseCode();

      if (code !== 200) {
        handleLogActivity('SYSTEM', 'fetch_error', 'HTTP ' + code + ' untuk: ' + url);
        if (code >= 500 && attempt < MAX_RETRIES) {
          Utilities.sleep(RETRY_MS * attempt);
          continue;
        }
        break;
      }

      var json = JSON.parse(resp.getContentText());
      if (!json || !json.data) {
        handleLogActivity('SYSTEM', 'no_data', 'API Response Error for: ' + url + " | Raw: " + resp.getContentText().substring(0,200));
        break;
      }

      var d = json.data;
      var basket = null;
      
      // --- MULTI-LAYER COMMERCE DETECTION ---
      // Layer 1: Standard Anchors (TikTok Shop / Product Tags)
      if (d.anchors && d.anchors.length > 0) {
        basket = d.anchors.map(function(a) {
          return { name: a.keyword || 'Produk', link: a.url || '' };
        });
      } 
      // Layer 2: Commerce Info (Ads, Promotable content, or Shop items)
      else if (d.commerce_info && (d.commerce_info.adv_promotable || d.commerce_info.product_count > 0)) {
        basket = [{ 
          name: d.commerce_info.title || "Produk Terdeteksi (TikTok Shop)", 
          link: d.commerce_info.url || url 
        }];
      }
      // Layer 3: Custom Anchor / Shop Link Structure
      else if (d.anchor_custom) {
        basket = [{ 
          name: d.anchor_custom.title || "Tautan Toko/Produk", 
          link: d.anchor_custom.url || url 
        }];
      }
      // Layer 4: Author Shop Profile (Detection via creator)
      else if (d.author && d.author.shop_id) {
        basket = [{ 
          name: "Toko Kreator Terdeteksi", 
          link: "https://www.tiktok.com/@" + (d.author.unique_id || d.author.id) + "/shop" 
        }];
      }

      // Layer 6: Deep Recursive Scan (Total War Fallback)
      if (!basket) {
        var deepResults = _findAnchorsRecursive(d);
        if (deepResults.length > 0) {
          var valid = deepResults.filter(function(a) { return (a.url || a.link) && (a.keyword || a.title || a.name); });
          if (valid.length > 0) {
            basket = valid.map(function(a) {
              return { name: "TAUTAN PRODUCT READY", link: a.url || a.link || '' };
            });
          }
        }
      }

      // --- GERILYA DUMP: Jika masih null, dump ke sheet DEBUG_RAW ---
      if (!basket) {
        try {
          var ss = getActive();
          var dbgSheet = ss.getSheetByName('DEBUG_RAW') || ss.insertSheet('DEBUG_RAW');
          dbgSheet.clear();
          dbgSheet.getRange(1, 1).setValue('RAW JSON DUMP - ' + new Date().toLocaleString());
          dbgSheet.getRange(2, 1).setValue(url);
          dbgSheet.getRange(3, 1).setValue(JSON.stringify(json));
          handleLogActivity('DEBUG', 'raw_dumped', 'Data mentah disimpan di sheet DEBUG_RAW untuk: ' + url);
        } catch(e) {}
      }
      
      // Layer 5: Caption Heuristics (Smart Detection)
      var caption = (d.title || '').toLowerCase();
      if (!basket && (caption.indexOf('keranjang') !== -1 || caption.indexOf('🛒') !== -1 || caption.indexOf('produk') !== -1)) {
         // Cek apakah ada indikasi visual ikon tas di metadata (Digital OCR)
         var hasVisualIcon = JSON.stringify(d).indexOf('shop_anchor') !== -1 || JSON.stringify(d).indexOf('cart_icon') !== -1;
         
         basket = [{ 
           name: "TAUTAN PRODUCT READY", 
           link: resolvedUrl 
         }];
      }

      // --- DEBUG LOGGING ---
      if (!basket && (caption.indexOf('keranjang') !== -1 || caption.indexOf('kuning') !== -1)) {
         handleLogActivity('DEBUG', 'basket_missed', 'Link: ' + url + ' | Data: ' + JSON.stringify(d).substring(0, 1000));
      }

      return {
        views:     _int(d.play_count),
        likes:     _int(d.digg_count),
        comments:  _int(d.comment_count),
        shares:    _int(d.share_count),
        saves:     _int(d.collect_count),
        followers: (d.author ? _int(d.author.follower_count) : 0),
        basket:    basket
      };

    } catch (e) {
      handleLogActivity('SYSTEM', 'tikwm_error',
        'URL: ' + url + ' | Err: ' + e.toString());
      if (attempt < MAX_RETRIES) {
        Utilities.sleep(RETRY_MS * Math.pow(2, attempt - 1));
        continue;
      }
    }
  }

  return { views: 0, likes: 0, comments: 0, shares: 0, saves: 0, followers: 0 };
}

// ─── NOTIFIKASI ───────────────────────────────────────────────────────────────
function handleSendNotif(targets, type, msg, from) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.NOTIFICATIONS);
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.NOTIFICATIONS);
    sheet.appendRow(['Timestamp','From','To','Type','Message']);
  }
  String(targets).split(',').forEach(function(t) {
    sheet.appendRow([new Date(), from, t.trim(), type, msg]);
  });
  return { status: 'ok' };
}

function handleGetNotifs(pic) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.NOTIFICATIONS);
  if (!sheet) return { status: 'ok', data: [] };

  var data    = sheet.getDataRange().getValues();
  var results = [];
  for (var i = data.length - 1; i >= 1; i--) {
    var to = String(data[i][2] || '').toLowerCase().trim();
    var p  = String(pic || '').toLowerCase().trim();
    if (to === p || to === 'all') {
      results.push({
        time: Utilities.formatDate(data[i][0], 'GMT+7', 'dd MMM, HH:mm'),
        from: data[i][1],
        type: data[i][3],
        msg:  data[i][4]
      });
    }
    if (results.length >= 50) break;
  }
  return { status: 'ok', data: results };
}

// ─── SYSTEM LOGS ──────────────────────────────────────────────────────────────
function handleLogActivity(pic, type, msg) {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.SYSTEM_LOGS);
  if (!sheet) sheet = ss.insertSheet(CONFIG.SYSTEM_LOGS);
  sheet.appendRow([new Date(), pic, type, msg]);
  return { status: 'ok' };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// Parse integer aman
function _int(v) {
  var n = parseInt(v);
  return isNaN(n) ? 0 : n;
}

/**
 * Konversi input tanggal ke format "DD Mei"
 */
function formatDateMei(val) {
  if (!val) return "";
  
  // Jika sudah berupa string "DD Mei" — kembalikan langsung
  var s = String(val).trim();
  if (s.toLowerCase().indexOf('mei') !== -1) {
    var parts = s.split(/\s+/);
    var day = parseInt(parts[0]);
    if (!isNaN(day)) {
      return (day < 10 ? '0' + day : String(day)) + ' Mei';
    }
    return s;
  }
  
  // Jika Date object dari Google Sheets
  if (val instanceof Date) {
    try {
      // Gunakan timezone GMT+7 agar tanggal tidak bergeser
      var formatted = Utilities.formatDate(val, 'Asia/Jakarta', 'dd');
      return formatted + ' Mei';
    } catch(e) {
      var day2 = val.getDate();
      return (day2 < 10 ? '0' + day2 : String(day2)) + ' Mei';
    }
  }
  
  // Jika angka (misal 1, 2, 3)
  var num = parseInt(s);
  if (!isNaN(num) && num >= 1 && num <= 31) {
    return (num < 10 ? '0' + num : String(num)) + ' Mei';
  }
  
  // Jika format tanggal lain (misal "2026-05-01" atau "05/01/2026")
  var d = new Date(val);
  if (!isNaN(d.getTime())) {
    // Koreksi timezone: tambah offset GMT+7
    var utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    var gmt7 = new Date(utc + (7 * 3600000));
    var dayNum = gmt7.getDate();
    return (dayNum < 10 ? '0' + dayNum : String(dayNum)) + ' Mei';
  }
  
  return s;
}

// Baca DAILY REPORT jadi Map (key = akun_tgl_slot)
function _getDailyReportMap(ss) {
  var sheet = ss.getSheetByName(CONFIG.DAILY_REPORT);
  if (!sheet) return {};

  var data = sheet.getDataRange().getValues();
  var map  = {};

  for (var i = 1; i < data.length; i++) {
    var row  = data[i];
    var akun = row[2];
    var tgl  = formatDateMei(row[3]);

    var slot = String(row[4] || '').replace(' ', '').toLowerCase();
    var key  = akun + '_' + tgl + '_' + slot;

    map[key] = {
      link:      row[5]  || '',
      views:     _int(row[6]),
      likes:     _int(row[7]),
      comments:  _int(row[8]),
      shares:    _int(row[9]),
      saves:     _int(row[10]),
      produk:    row[11] || ''
    };
  }
  return map;
}

/**
 * BACKGROUND WORKER: Otomatis update data yang kosong (BASKET/VIEWS)
 * Jalankan ini via Trigger (misal tiap 1 jam)
 */
function triggerAutoScrape() {
  var ss = getActive();
  var pics = Object.keys(CONFIG.PIC_SHEETS);
  
  pics.forEach(function(pic) {
    var sheetName = CONFIG.PIC_SHEETS[pic];
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    
    var lastRow = sheet.getLastRow();
    if (lastRow < CONFIG.PIC_DATA_START) return;
    
    var data = sheet.getRange(CONFIG.PIC_DATA_START, 1, lastRow - CONFIG.PIC_DATA_START + 1, 25).getValues();
    
    data.forEach(function(row, idx) {
      var link = String(row[CONFIG.COL.LINK_POSTING] || '').trim();
      var basket = String(row[CONFIG.COL.BASKET] || '').trim();
      
      // Jika ada link tapi tidak ada data basket/views, lakukan scrape
      if (link.startsWith('http') && (!basket || basket === 'null' || _int(row[CONFIG.COL.VIEWS]) === 0)) {
        var rowRef = sheetName + '!' + (CONFIG.PIC_DATA_START + idx);
        handleGetMetrics(link, rowRef);
        Utilities.sleep(500); // Jeda agar tidak kena rate limit
      }
    });
  });
}

/**
 * Server-side Anti-Cheat: Check if a link already exists in any relevant sheet
 */
function _checkLinkDuplicate(newLink, excludeRow) {
  if (!newLink || String(newLink).length < 8) return false;
  var ss = getActive();
  
  // 1. Check in all PIC Sheets
  var pics = Object.keys(CONFIG.PIC_SHEETS);
  for (var i = 0; i < pics.length; i++) {
    var sheet = ss.getSheetByName(CONFIG.PIC_SHEETS[pics[i]]);
    if (!sheet) continue;
    var data = sheet.getDataRange().getValues();
    for (var j = 1; j < data.length; j++) {
      var existing = String(data[j][CONFIG.COL.LINK_POSTING] || '').trim();
      if (existing === newLink) {
        var rowRef = CONFIG.PIC_SHEETS[pics[i]] + '!' + (j + 1);
        if (rowRef !== excludeRow) return true;
      }
    }
  }
  
  // 2. Check in DAILY REPORT
  var daily = ss.getSheetByName(CONFIG.DAILY_REPORT);
  if (daily) {
    var dData = daily.getDataRange().getValues();
    for (var k = 1; k < dData.length; k++) {
      if (String(dData[k][5] || '').trim() === newLink) {
        var dRef = CONFIG.DAILY_REPORT + '!' + (k + 1);
        if (dRef !== excludeRow) return true;
      }
    }
  }
  
  return false;
}

/**
 * Helper: Mencari field 'anchors' secara rekursif di seluruh objek metadata
 */
function _findAnchorsRecursive(obj) {
  var found = [];
  if (!obj || typeof obj !== 'object') return found;
  
  if (Array.isArray(obj)) {
    obj.forEach(function(item) {
      found = found.concat(_findAnchorsRecursive(item));
    });
  } else {
    for (var key in obj) {
      // Perluas pencarian ke field-field potensial
      if ((key === 'anchors' || key === 'anchor' || key === 'anchor_info' || key === 'commerce_info') && obj[key]) {
        if (Array.isArray(obj[key])) found = found.concat(obj[key]);
        else found.push(obj[key]);
      } 
      // Field tersembunyi di slideshow/music atau deteksi URL mentah
      else if (typeof obj[key] === 'string' && (obj[key].indexOf('shop.tiktok.com') !== -1 || obj[key].indexOf('tiktok.com/t/') !== -1)) {
        found.push({ keyword: 'Produk Terdeteksi (Pattern)', url: obj[key] });
      }
      else if ((key === 'shop_info' || key === 'product_info' || key === 'image_post_info') && obj[key]) {
        if (typeof obj[key] === 'object') found.push(obj[key]);
      }
      else if (typeof obj[key] === 'object') {
        found = found.concat(_findAnchorsRecursive(obj[key]));
      }
    }
  }
  return found;
}

// ─── SAVE CAPTIONS (from v12 HTML) ──────────────────────────────────────────
// Helper to match date string like "06 Mei"
function fmtDate(d) {
  if (!d) return "";
  if (d instanceof Date) {
    var day = ("0" + d.getDate()).slice(-2);
    var months = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    return day + " " + months[d.getMonth()];
  }
  return String(d).trim();
}

function handleSaveCaptions(rawData) {
  try {
    if (!rawData) return { status: 'error', message: 'No data' };
    var payload = JSON.parse(decodeURIComponent(rawData));
    var ss = getActive();
    var results = [];

    var grouped = {};
    payload.forEach(function(it) {
      var p = (it.pic || 'UNKNOWN').toUpperCase().trim();
      if (!grouped[p]) grouped[p] = [];
      grouped[p].push(it);
    });

    var sheets = ss.getSheets();

    for (var picName in grouped) {
      var items = grouped[picName];
      var sheet = null;

      for (var j = 0; j < sheets.length; j++) {
        var sn = sheets[j].getName().toUpperCase();
        if (sn.indexOf(picName) !== -1 && sn.indexOf("DAILY") === -1 && sn.indexOf("REPORT") === -1) {
          sheet = sheets[j];
          break;
        }
      }

      if (!sheet) {
        items.forEach(function(it) { results.push({ status: "no_sheet", pic: it.pic }); });
        continue;
      }

      var rows = sheet.getDataRange().getValues();
      var dataStart = 5; 
      for (var h = 0; h < Math.min(10, rows.length); h++) {
        var cv = String(rows[h][2] || "").toUpperCase().trim();
        if (cv === "TOKO / AKUN" || cv === "TOKO/AKUN" || cv === "AKUN TOKO") { dataStart = h + 1; break; }
      }

      var hdr = rows[dataStart - 1] || [];
      var cAkun = 2, cSlot = 4, cTgl = 5, cProd = 8;
      var cHL = 11, cDS = 12, cCTA = 13, cHT = 14, cCP = 15;

      for (var c = 0; c < hdr.length; c++) {
        var hv = String(hdr[c] || "").toUpperCase().trim().replace(/\n/g, " ");
        if (hv === "TOKO / AKUN" || hv === "TOKO/AKUN") cAkun = c;
        else if (hv === "POST") cSlot = c;
        else if (hv === "TGL POSTING") cTgl = c;
        else if (hv === "NAMA PRODUK") cProd = c;
        else if (hv.indexOf("HEADLINE") !== -1 || hv.indexOf("HOOK") !== -1) cHL = c;
        else if (hv.indexOf("DESKRIPSI") !== -1) cDS = c;
        else if (hv === "CTA") cCTA = c;
        else if (hv.indexOf("HASHTAG") !== -1) cHT = c;
        else if (hv.indexOf("COPY") !== -1 || hv.indexOf("CAPTION") !== -1) cCP = c;
      }

      // Build row map: key -> [{rowIdx, data}]
      var rowMap = {};
      for (var r = dataStart; r < rows.length; r++) {
        var row = rows[r];
        var ak = String(row[cAkun] || "").trim().toLowerCase();
        var sl = String(row[cSlot] || "").trim();
        var tg = fmtDate(row[cTgl]);
        var key = ak + "_" + sl + "_" + tg;
        if (!rowMap[key]) rowMap[key] = [];
        rowMap[key].push({ row: r + 1, data: row });
      }

      items.forEach(function(item) {
        var targetRows = [];
        var isAll = (item.akun === "ALL");
        
        if (isAll) {
          // Match by Slot + Date across all accounts in this sheet
          var suffix = "_" + String(item.slot).trim() + "_" + String(item.tanggal).trim();
          for (var k in rowMap) {
            if (k.endsWith(suffix)) targetRows = targetRows.concat(rowMap[k]);
          }
        } else {
          var itemKey = String(item.akun).trim().toLowerCase() + "_" + 
                        String(item.slot).trim() + "_" + 
                        String(item.tanggal).trim();
          targetRows = rowMap[itemKey] || [];
        }

        if (targetRows.length > 0) {
          targetRows.forEach(function(tr) {
            var exRow = tr.row;
            var copyFull = item.headline + "\n\n" + item.deskripsi + "\n\n" + item.cta + "\n\n" + item.hashtag;
            
            if (cDS === cHL + 1 && cCTA === cDS + 1 && cHT === cCTA + 1 && cCP === cHT + 1) {
              sheet.getRange(exRow, cHL + 1, 1, 5).setValues([[item.headline, item.deskripsi, item.cta, item.hashtag, copyFull]]);
            } else {
              sheet.getRange(exRow, cHL + 1).setValue(item.headline);
              sheet.getRange(exRow, cDS + 1).setValue(item.deskripsi);
              sheet.getRange(exRow, cCTA + 1).setValue(item.cta);
              sheet.getRange(exRow, cHT + 1).setValue(item.hashtag);
              sheet.getRange(exRow, cCP + 1).setValue(copyFull);
            }
            results.push({ status: "ok", row: exRow, akun: tr.data[cAkun] });
          });
        } else {
          results.push({ status: "not_found", akun: item.akun, slot: item.slot, tanggal: item.tanggal });
        }
      });
    }
    return { success: true, results: results };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

