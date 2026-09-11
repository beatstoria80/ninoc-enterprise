# History Case: Checkout Pipeline Hardening & Turnstile Captcha (11 September 2026)

**Background & Context:**
Sebuah audit menyeluruh (Full Pipeline Audit) dilakukan pada alur transaksi Checkout (dari Cart hingga Midtrans Success) untuk mengeliminasi potensi error kritis (Crash/500 Server Error) yang dapat mengganggu konversi e-commerce saat traffic tinggi (misal: Flash Sale).

**Root Causes Discovered & Fixed:**
1. **Midtrans Decimal Rejection (Bug):** Midtrans API secara ketat menolak transaksi (HTTP 400) jika `gross_amount` memiliki nilai desimal. 
   - *Fix:* Ditambahkan `Math.round(calculatedGrossAmount)` di dalam `PricingEngine.ts` sebagai proteksi absolut.
2. **Phantom Stock pada Snap Failure:** Jika Midtrans Snap gagal dibuat (karena timeout/error server), stok dan kuota flash sale yang sudah dikunci oleh `create_order_transaction` akan hangus permanen.
   - *Fix:* Diimplementasikan blok `try-catch` membungkus `processPaymentGateway`. Jika gagal, sistem memanggil RPC `restock_inventory` dan `rollback_flash_sale_stock` untuk mengembalikan barang secara instan ke sistem.
3. **Voucher Race Condition:** Penggunaan voucher yang di-cek secara asinkron rentan terkena *double-spending* jika di-klik bersamaan.
   - *Fix:* Diganti menjadi RPC SQL `increment_voucher_usage` yang bersifat *atomic* di database PostgreSQL.
4. **Cloudflare Turnstile Domain Mismatch:** Captcha Turnstile gagal memuat dan menghalangi user login (tombol Masuk *disabled* / abu-abu) dengan error `400020`. 
   - *Root Cause:* Adanya typo pada environment variable (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`) dan karena tes dilakukan di `localhost` sedangkan key dibuat untuk `ninoc.store`.
   - *Fix:* Perbaikan typo pada `.env.vercel.prod` dan keharusan mengupdate Vercel Dashboard env vars, lalu me-redeploy karena `NEXT_PUBLIC_` adalah build-time variable.

**CRITICAL Rules for Future Agents — DO NOT VIOLATE:**
1. **Midtrans Payload Mutation:** JANGAN PERNAH menghapus `Math.round()` pada kalkulasi `grossAmount` di `PricingEngine.ts`. Menghapus baris ini akan mengakibatkan Midtrans menolak semua transaksi yang melibatkan diskon persentase.
2. **Inventory Lock Pattern:** Saat membuat arsitektur checkout baru, JANGAN kunci stok tanpa memiliki skenario *rollback* otomatis jika eksternal API (Payment Gateway / Shipping API) gagal merespon. 
3. **Cloudflare Turnstile di Localhost:** Jika pengguna mengeluh Captcha tidak muncul saat proses *development* lokal, JANGAN hapus logika Captcha dari source code! Beritahu pengguna untuk menambahkan `localhost` ke Hostname Cloudflare Turnstile, atau anjurkan mengecek langsung di URL Vercel production.
4. **Webhook Idempotency:** Biarkan fungsi pengecekan kriptografi `SHA512` berpadu dengan fallback `coreApi.transaction.notification()` di `webhook/route.ts`. Jangan ubah alur ini karena mencegah hacker melakukan pemalsuan transaksi. Tugas berat (seperti WA, Email, Affiliate ledger) harus SELALU berada di dalam blok `after(async () => {...})` agar Midtrans menerima status HTTP 200 di bawah limit timeout 10 detik.
