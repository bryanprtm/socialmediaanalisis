## Kenapa lambat

Halaman News memuat **seluruh 53.968 baris** `news_articles` dengan `select("*")` (termasuk kolom `content` yang besar) sebelum menampilkan apa pun, lalu memfilter di browser. Setiap event realtime juga men-trigger ulang seluruh fetch itu. Pagination cuma di UI (6/halaman), bukan di query — jadi payload jaringan tetap puluhan MB.

## Rencana perbaikan (khusus halaman News, tanpa ubah UI)

### 1. Pindah paginasi ke server
- Query cuma ambil 1 halaman saja: `.range((page-1)*PAGE_SIZE, page*PAGE_SIZE - 1)`.
- Pakai `PAGE_SIZE` lebih besar dari 6 (mis. 20) supaya paging terasa gesit.
- Total baris dihitung sekali via `select("id", { count: "exact", head: true })` (tanpa transfer data) untuk menampilkan metric "Total Berita" dan jumlah halaman.

### 2. Hilangkan kolom besar dari list
Ganti `select("*")` → daftar kolom eksplisit **tanpa `content`**:
`id, title, url, source, category, excerpt, sentiment, sentiment_score, confidence, published_at, region, keywords`.
Ini saja memangkas payload sangat besar. `content` hanya diambil kalau user buka detail artikel.

### 3. Filter & keyword aktif diterapkan di query, bukan browser
- `filter !== "all"` → `.eq("sentiment", filter)` (sudah ada).
- Rentang tanggal → `.gte("published_at", startDate).lte("published_at", endDate)`.
- Keyword aktif (dari `useActiveKeyword`) → `.overlaps("keywords", active.terms)` atau `.textSearch` pada `title`. Jatuhkan sisanya sebagai filter tambahan client-side untuk ekspresi kompleks.

### 4. Realtime tidak lagi refetch semua
Handler channel: kalau event `INSERT` dan berada di halaman 1 tanpa filter aktif → prepend baris baru ke state; selain itu cukup naikkan counter "ada X berita baru — klik untuk refresh" (mencegah refetch beruntun saat sync jalan).

### 5. Stat metric ringan
"Positive/Negative/Neutral" di header dihitung dengan 3 query `count head:true` per sentiment (murah, tidak transfer baris) dan hanya di-refresh saat filter/keyword/tanggal berubah.

### 6. Loading progresif
Tampilkan skeleton tabel + metric kosong dulu, isi bertahap begitu masing-masing query selesai — tidak menunggu semua data untuk render pertama.

## File yang diubah

- `src/routes/news.tsx` — refactor `load()` jadi paginated + column-scoped, tambahkan query count, ubah realtime handler.

Tidak menyentuh `ArticlesProvider` global (halaman lain masih pakai cache in-memory seperti sekarang). Tidak ada perubahan tampilan.

## Hasil yang diharapkan

- First paint halaman News turun dari "menit-an" jadi <1 detik pada koneksi normal.
- Pindah halaman = 1 query kecil (≈20 baris), instan.
- Sync RSS otomatis tidak lagi bikin halaman freeze karena refetch 54k baris tiap menit.
