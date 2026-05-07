# Panduan Update Data via AI (Claude/ChatGPT)

Gunakan instruksi di bawah ini untuk meminta AI memperbarui data **Jadwal** atau **Bank Caption** tanpa merusak script aplikasi.

---

## 1. Instruksi Update JADWAL (`var DB`)
*Gunakan ini jika Anda ingin mengganti jadwal posting PIC harian.*

**Copy-Paste Prompt ini ke AI:**
> "Saya ingin memperbarui jadwal posting dalam file HTML saya. Tolong buatkan ulang kode untuk bagian `var DB = { ... }`.
> 
> **ATURAN KETAT:**
> 1. Gunakan format array: `["Nama Akun", "#Slot", "Tanggal (Hari)", "Nama Produk"]`.
> 2. Contoh format tanggal: `'01 Mei (Jumat)'`.
> 3. Jangan mengubah struktur kunci PIC (RISA, RAHMA, AYU, ATEP).
> 4. Pastikan Nama Produk sesuai dengan daftar resmi (JOGGER WAFFLE, SETELAN DRY-FIT, dll).
> 5. Kembalikan hanya kodenya saja, dimulai dari `var DB = {` sampai penutup `};`."

**Lokasi Paste:** Tempelkan di antara penanda `[AI-SAFE-ZONE: DB-START]` dan `[AI-SAFE-ZONE: DB-END]`.

---

## 2. Instruksi Update CAPTION (`var CAP`)
*Gunakan ini jika Anda ingin AI menulis variasi caption baru yang lebih segar.*

**Copy-Paste Prompt ini ke AI:**
> "Tolong buatkan variasi caption baru untuk bank caption saya. Update bagian `var CAP = { ... }`.
> 
> **ATURAN KETAT:**
> 1. Untuk setiap produk, buatlah **20 variasi** unik.
> 2. Isi bagian `h` (Headline), `d` (Deskripsi), `c` (CTA), dan `t` (Hashtag).
> 3. Gunakan gaya bahasa yang [Gaul/Hype/Soft/Funny] sesuai kebutuhan.
> 4. JANGAN mengubah kunci nama produk (Case-Sensitive).
> 5. Kembalikan hanya kodenya saja, dimulai dari `var CAP = {` sampai penutup `};`."

**Lokasi Paste:** Tempelkan di antara penanda `[AI-SAFE-ZONE: START]` dan `[AI-SAFE-ZONE: END]`.

---

## 3. Langkah-Langkah Update di HTML
1. Dapatkan kode hasil generate dari AI.
2. Buka file `caption_generator_v12.html` di editor teks (Notepad++/VS Code).
3. Cari (Ctrl+F) kata kunci `AI-SAFE-ZONE`.
4. Hapus kode lama di antara penanda START dan END yang sesuai.
5. Tempelkan (Paste) kode baru dari AI.
6. Simpan file (Ctrl+S) dan Refresh browser Anda.

---

## Daftar Produk Resmi (Gunakan Nama Ini Persis):
1. `JOGGER WAFFLE`
2. `SETELAN DRY-FIT`
3. `MANSET BASELAYER THUMBHOLE`
4. `JERSEY DRY-FIT`
5. `MANSET BASELAYER STANDAR`
6. `POLO SCUBA`
7. `TRAINING HYPEBEAST`
