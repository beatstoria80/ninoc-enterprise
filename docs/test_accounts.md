# Daftar Akun Uji Coba (QA & Testing Credentials)

Dokumen ini berisi daftar akun kredensial yang aman digunakan untuk keperluan pengujian UI/UX, simulasi pembayaran, integrasi logistik, dan audit fitur di lingkungan lokal maupun *production* (sepanjang tidak memodifikasi data asli pelanggan).

## 1. Admin Dashboard (NINOC Hub)
Gunakan akun ini untuk masuk ke panel utama Admin (Kelola Pesanan, Produk, dan Keuangan Utama).
- **Email:** `admin@ninoc.store`
- **Kata Sandi:** `NinocAdmin2026!`
- **Jalur Pintas (Smart Backdoor):** Pada halaman *Login*, Anda dapat sekadar mengetikkan `adm` di kolom email dan `111` di kolom kata sandi. Sistem akan otomatis memasukkan Anda ke akun ini.

## 2. Supplier Dashboard (B2B Partner)
Gunakan akun ini untuk masuk ke panel Supplier (Kelola *Virtual Inventory*, *Request Allocation*, dan memantau *Ledger / Campaign Fee*).
- **Email:** `audit_it@ninoc.store`
- **Kata Sandi:** `akses123!`
- **Keterangan:** Akun khusus audit IT. Akun ini ditautkan ke entitas Supplier simulasi (PT Tairflask Indonesia Utama). Sangat aman untuk menguji *checkout* potongan HPP dan *Campaign Fee*.

## 3. Akun Pelanggan (User Tamu / Guest)
Untuk pengujian simulasi alur pembelian (Cart -> Checkout -> Midtrans):
- **Email Pembeli Bebas:** Gunakan format email sembarang yang valid, contoh: `tester1@gmail.com`
- **Nomor Telepon:** `081234567890`
- **Keterangan:** Untuk pengujian kurir instan (Biteship Grab/Gojek), pastikan Anda memasukkan alamat dan titik kordinat peta di sekitar Kota Bandung (karena gudang pengiriman diset di Bandung, 40292). Jika menggunakan alamat di luar jangkauan (misal di luar kota), kurir instan tidak akan muncul, dan yang muncul adalah kurir Reguler (JNE, Paxel, dll).
