# Kenapa Tiap Halaman Lambat?

## Penyebab utama

Hook `useFilteredArticles` (dipakai hampir semua halaman: Dashboard, Media, Sentiment, Trends, Comparative, News, Map, Export, dll) melakukan ini **setiap kali halaman dibuka**:

1. `useEffect` jalan ulang dari nol → set `loading=true`.
2. Loop fetch ke Supabase `news_articles` per 1000 baris sampai habis (bisa beberapa kali round-trip).
3. Subscribe channel realtime baru.
4. Saat pindah halaman → unmount → semua state hilang → halaman berikutnya mengulang proses yang sama dari awal.

Jadi walau datanya sama, setiap navigasi = full refetch seluruh tabel artikel. Itulah kenapa terasa lama di setiap halaman.

Faktor pendukung:
- Tidak ada cache (tidak pakai TanStack Query / context bersama).
- Query ambil `select("*")` termasuk kolom `content` yang besar.
- Channel realtime dibuat ulang tiap mount.

## Rencana Perbaikan

### 1. Pindahkan data ke cache global (sekali fetch, dipakai semua halaman)
Buat `ArticlesProvider` (context) di `src/hooks/use-filtered-articles.tsx` atau provider baru:
- Fetch artikel **sekali** saat app mount (di `__root.tsx` atau provider tingkat atas, sejajar `ActiveKeywordProvider`).
- Simpan `articles`, `loading` di context.
- Subscribe realtime **satu kali** untuk seluruh app, bukan per halaman.
- `useFilteredArticles()` cukup baca dari context lalu jalankan filter keyword + tanggal (murah, in-memory).

Efeknya: pindah halaman = instan, tidak ada refetch.

### 2. Kurangi payload query
Ubah `select("*")` → daftar kolom eksplisit tanpa `content` (kolom paling besar). `content` hanya diambil saat dibutuhkan (mis. detail artikel di `ArticleDialog`). Ini memperkecil ukuran response secara signifikan.

### 3. Loading skeleton tetap halus
Saat fetch awal masih jalan, halaman tampil dengan skeleton/empty state seperti sekarang — tapi hanya sekali di awal sesi, bukan tiap navigasi.

### 4. (Opsional) Batas awal untuk first paint
Fetch 1000 baris pertama dulu → tampilkan UI → lanjut fetch sisanya di background. Membuat halaman pertama terasa lebih cepat kalau data sangat banyak.

## File yang akan diubah

- `src/hooks/use-filtered-articles.tsx` — pecah jadi `ArticlesProvider` + `useFilteredArticles()` yang baca context.
- `src/routes/__root.tsx` — bungkus app dengan `ArticlesProvider` (di dalam `ActiveKeywordProvider`).
- `src/components/ArticleDialog.tsx` — kalau perlu `content`, fetch on-demand per artikel.

Tidak ada perubahan UI/desain — hanya layer data.

## Hasil yang diharapkan

- Buka halaman pertama: sama seperti sekarang (1x fetch).
- Buka halaman berikutnya: **instan**, tidak ada loading lagi.
- Realtime tetap jalan; perubahan data otomatis ter-reflect di semua halaman.
