# RAB Optimizer Web

Aplikasi web untuk membaca file RAB `.xls` / `.xlsx`, mengklasifikasikan item pekerjaan yang bisa ditinjau, membantu pengguna menyesuaikan volume, lalu menyusun rekomendasi penghematan dengan bantuan Gemini.

Project ini dibuat dengan Next.js App Router, TypeScript, Tailwind CSS, parser Excel `xlsx`, dan Google Gemini API melalui package `@google/genai`.

## Fitur utama

- Upload file RAB format `.xls` atau `.xlsx`.
- Parsing sheet RAB detail, dengan prioritas sheet `RAB_Sipil` atau sheet lain yang mengandung kata `RAB`.
- Klasifikasi item menjadi:
  - `flexible`: item yang dapat ditinjau volumenya.
  - `locked`: item yang sebaiknya tidak diubah dan hanya diverifikasi.
- Input target nilai akhir RAB dan perhitungan target penghematan.
- Generate pertanyaan review volume menggunakan Gemini.
- Generate rekomendasi akhir dan estimasi penghematan berdasarkan perubahan volume.

## Teknologi

- Next.js `16`
- React `19`
- TypeScript
- Tailwind CSS `4`
- Google Gemini API (`@google/genai`)
- `xlsx` untuk membaca file Excel

## Struktur penting

```text
app/
  api/
    parse/route.ts       # Parse file Excel RAB
    questions/route.ts   # Generate pertanyaan review dengan Gemini
    recommend/route.ts   # Generate rekomendasi akhir dengan Gemini
  page.tsx               # Flow utama aplikasi
components/              # Komponen tiap step UI
lib/
  ai/                    # Client Gemini dan prompt
  classifier/            # Rule klasifikasi item RAB
  parser/                 # Parser file Excel
  types/                  # TypeScript type RAB
```

## Persiapan lokal

Pastikan Node.js sudah terinstall. Disarankan pakai Node.js versi LTS terbaru.

Install dependency:

```bash
npm install
```

Buat file environment lokal dari contoh:

```bash
cp .env.local.example .env.local
```

Isi API key Gemini di `.env.local`:

```env
GEMINI_API_KEY=isi_api_key_gemini_kamu_di_sini
```

API key bisa dibuat dari Google AI Studio: <https://aistudio.google.com/app/apikey>

Catatan penting: jangan pakai nama `NEXT_PUBLIC_GEMINI_API_KEY`. API key ini dipakai di server route Next.js, jadi cukup `GEMINI_API_KEY` supaya tidak terekspos ke browser.

Jalankan development server:

```bash
npm run dev
```

Buka aplikasi di:

```text
http://localhost:3000
```

## Script yang tersedia

```bash
npm run dev      # Jalankan development server
npm run build    # Build production
npm run start    # Jalankan hasil build production
npm run lint     # Jalankan ESLint
```

## Format file RAB yang didukung

Aplikasi menerima file `.xls` dan `.xlsx`.

Parser akan mencari sheet dengan urutan berikut:

1. Sheet bernama `RAB_Sipil`.
2. Jika tidak ada, sheet yang namanya mengandung `RAB` dan bukan `Rekap`.

Data item dibaca dari struktur kolom yang saat ini diasumsikan sebagai berikut:

- Kolom A: nomor item atau angka romawi kategori.
- Kolom B: uraian pekerjaan atau nama kategori.
- Kolom C: satuan.
- Kolom D: volume.
- Kolom E: harga material.
- Kolom F: harga upah.

Jika struktur file berbeda, parser kemungkinan perlu disesuaikan di `lib/parser/xlsx-parser.ts`.

## Environment variable

| Nama | Wajib | Dipakai di | Keterangan |
| --- | --- | --- | --- |
| `GEMINI_API_KEY` | Ya | Server/API routes | API key Gemini untuk generate pertanyaan dan rekomendasi |

Contoh file tersedia di `.env.local.example`.

## Deploy ke Vercel

Ada dua cara umum: lewat dashboard Vercel atau lewat Vercel CLI. Cara dashboard biasanya paling mudah.

### 1. Push project ke GitHub

Pastikan project sudah ada di repository GitHub/GitLab/Bitbucket.

Sebelum push, pastikan `.env.local` tidak ikut masuk repository. File tersebut berisi API key pribadi.

### 2. Import project di Vercel

1. Buka <https://vercel.com/new>.
2. Pilih repository project ini.
3. Framework biasanya otomatis terdeteksi sebagai Next.js.
4. Build command biarkan default:

   ```bash
   npm run build
   ```

5. Output directory biarkan default Next.js.

### 3. Tambahkan API key Gemini di Vercel

Di halaman project Vercel:

1. Buka `Settings`.
2. Masuk ke `Environment Variables`.
3. Tambahkan variable:

   ```text
   Name  : GEMINI_API_KEY
   Value : API key Gemini kamu
   ```

4. Pilih environment yang dibutuhkan, biasanya minimal `Production`, dan bisa juga `Preview` / `Development`.
5. Simpan.

### 4. Deploy ulang

Kalau environment variable ditambahkan setelah deploy pertama, lakukan redeploy:

1. Buka tab `Deployments`.
2. Pilih deployment terbaru.
3. Klik `Redeploy`.

Tanpa redeploy, deployment lama bisa saja belum membaca environment variable baru.

## Cara kerja singkat

1. User upload file RAB.
2. API `/api/parse` membaca file Excel dan mengubahnya menjadi data item RAB.
3. User memasukkan target nilai akhir RAB.
4. API `/api/questions` meminta Gemini membuat pertanyaan review untuk item RAB.
5. User menyesuaikan volume item yang relevan.
6. API `/api/recommend` meminta Gemini membuat catatan rekomendasi.
7. Estimasi penghematan dihitung secara matematis dari harga satuan dan selisih volume, bukan dari Gemini.

## Troubleshooting

### Error: `GEMINI_API_KEY belum di-set`

Artinya environment variable belum tersedia.

Untuk lokal:

- Pastikan ada file `.env.local` di root project.
- Pastikan isinya memakai nama `GEMINI_API_KEY`.
- Restart `npm run dev` setelah mengubah file env.

Untuk Vercel:

- Pastikan `GEMINI_API_KEY` sudah ditambahkan di `Settings > Environment Variables`.
- Pastikan variable aktif untuk environment yang sedang dipakai (`Production` / `Preview`).
- Redeploy setelah menambahkan variable.

### File Excel gagal dibaca

- Pastikan format file `.xls` atau `.xlsx`.
- Pastikan sheet utama bernama `RAB_Sipil`, atau minimal mengandung kata `RAB` dan bukan `Rekap`.
- Jika kolom RAB berbeda dari asumsi parser, update mapping di `lib/parser/xlsx-parser.ts`.

### Gemini mengembalikan error

- Pastikan API key valid dan masih aktif.
- Pastikan billing/quota Google AI Studio mencukupi.
- Coba ulang dengan jumlah item lebih sedikit jika file RAB sangat besar.

## Keamanan

- Jangan commit `.env.local`.
- Jangan taruh API key di kode frontend.
- Jangan gunakan prefix `NEXT_PUBLIC_` untuk secret key.
- Rotasi API key jika pernah tidak sengaja ter-push ke repository publik.

