# MathKu — Belajar Berhitung Jadi Menyenangkan

<div align="center">

**Aplikasi edukasi matematika untuk anak Indonesia**

Belajar berhitung dengan cara yang menyenangkan — penjumlahan, pengurangan, perkalian, pembagian, kombinasi, soal advance, dan mode ujian. Progres otomatis tersimpan, bisa dipasang sebagai aplikasi (PWA), dan berfungsi offline.

![Versi](https://img.shields.io/badge/versi-1.2.0_%28Beta%29%20%C2%B7%20PWA%20%C2%B7%20Multi--User%20%C2%B7%20i18n-FF7043?style=flat-square)
![Lisensi](https://img.shields.io/badge/lisensi-MIT%20%2B%20CC0-4CAF50?style=flat-square)
![Bahasa](https://img.shields.io/badge/bahasa-Indonesia%20%2F%20English-42A5F5?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Web%20%2F%20Android%20%2F%20iOS%20%2F%20Desktop-AB47BC?style=flat-square)

</div>

---

## Daftar Isi

1. [Tentang MathKu](#tentang-mathku)
2. [Fitur Utama](#fitur-utama)
3. [Cara Menggunakan](#cara-menggunakan)
4. [Kode Akses & Gate](#kode-akses--gate)
5. [Multi-User](#multi-user)
6. [Pengenalan Angka](#pengenalan-angka)
7. [Soal Cerita](#soal-cerita)
8. [Level Campuran (Mixed)](#level-campuran-mixed)
9. [Bahasa (i18n)](#bahasa-i18n)
10. [Struktur File](#struktur-file)
11. [Memasang sebagai Aplikasi (PWA)](#memasang-sebagai-aplikasi-pwa)
12. [Menjalankan Secara Lokal](#menjalankan-secara-lokal)
13. [Mengembangkan Aplikasi](#mengembangkan-aplikasi)
14. [Tentang MathKu (Info di App)](#tentang-mathku-info-di-app)
15. [Lisensi & Kredit](#lisensi--kredit)
16. [Changelog Lengkap](#changelog-lengkap)
17. [Mengunduh Aplikasi](#mengunduh-aplikasi)

---

## Tentang MathKu

MathKu adalah aplikasi web edukatif yang dirancang khusus untuk membantu anak-anak Indonesia belajar berhitung dengan cara yang interaktif dan menyenangkan. Aplikasi ini dikembangkan dengan fokus pada pengalaman pengguna yang ramah anak: warna-warna cerah, animasi yang lembut, rewards visual (bintang & confetti), serta musik prosedural yang dihasilkan langsung oleh browser tanpa perlu file audio eksternal.

Aplikasi ini mendukung sembilan kategori pembelajaran dengan total **88 level** (termasuk level soal cerita dan level campuran), mulai dari menghitung benda (berhitung) hingga soal kombinasi operasi yang menantang. Mode Ujian menguji pemahaman menyeluruh dengan batas waktu per kategori.

Aplikasi juga sudah dikonfigurasi sebagai **Progressive Web App (PWA)** — dapat dipasang langsung dari browser ke layar utama perangkat, berjalan layar penuh tanpa address bar, dan tetap dapat digunakan tanpa koneksi internet.

---

## Fitur Utama

### Pembelajaran Terstruktur
- **9 Kategori Matematika** — Berhitung, Penjumlahan, Pengurangan, Jumlah & Kurang, Perkalian, Pembagian, Kali & Bagi, Advance, dan Ujian
- **88 Level Total** — Termasuk level reguler, level soal cerita, dan level campuran
- **Sistem Bintang** — Kumpulkan 3 bintang di setiap level untuk membuka level berikutnya
- **Mode Ujian** — 7 sesi ujian dengan batas waktu berbeda (10-20 menit), 10 soal per sesi
- **Soal Visual** — Level dasar menggunakan emoji buah & hewan agar mudah dipahami anak

### Soal Cerita dari CSV
- **300+ soal cerita** dari 6 file CSV (`+.csv`, `-.csv`, `+_.csv`, `x.csv`, `b.csv`, `xb.csv`)
- Soal cerita muncul sebagai **level terpisah** (bukan disisipkan di level reguler)
- Bilingual: teks cerita bisa diubah bahasa **saat kuis berlangsung**
- Setiap kategori punya 2 level story kecuali Jumlah & Kurang (3 story) dan Kali & Bagi (3 story)

### Level Campuran (Mixed)
- **Jumlah & Kurang Level 3**: 5 soal cerita Penjumlahan + 5 soal cerita Pengurangan, diacak
- **Kali & Bagi Level 3**: 5 soal cerita Perkalian + 5 soal cerita Pembagian, diacak
- **Advance Level 1**: 5 soal cerita Penjumlahan + 5 soal cerita Pengurangan, diacak
- **Advance Level 3**: 5 soal cerita Perkalian + 5 soal cerita Pembagian, diacak

### Pengalaman Pengguna
- **Desain Ramah Anak** — Warna pastel, ikon intuitif, animasi konfeti saat berhasil
- **Penyimpanan Otomatis** — Progres tersimpan di `localStorage` dengan fallback `cookie`
- **Musik Prosedural** — 12 melodi original via Web Audio API
- **Tombol Toggle Musik** — On/off di pojok kanan atas, preferensi tersimpan
- **Animasi Mikro** — Pulse, pop, shake, dan konfeti untuk feedback visual
- **Responsif** — Tampil optimal di HP, tablet, dan desktop

### Multi-Bahasa (i18n)
- **Dua Bahasa** — Indonesia (default) & English
- **Toggle Real-time** — Tombol ID/EN di pojok kanan atas, perubahan langsung diterapkan
- **Auto-Deteksi** — Mendeteksi bahasa browser saat pertama dibuka
- **Persisten** — Pilihan bahasa tersimpan di localStorage & cookie
- **Lengkap** — Semua teks UI diterjemahkan termasuk soal cerita

### PWA (Progressive Web App)
- **Dapat Dipasang** — Tombol "Pasang Aplikasi" memicu prompt install native
- **Berfungsi Offline** — Service Worker meng-cache app shell
- **App Shortcuts** — Long-press ikon app untuk akses cepat
- **Splash Screen** — Otomatis menggunakan icon & warna tema

### Akses & Keamanan
- **Multi-User** — Mendukung sampai 5 user, masing-masing punya progres terpisah
- **Gate Kode Akses** — Level 1 gratis; Level 2+ & tambah user butuh kode akses
- **Reset Progress** — Hanya reset user aktif, tidak mengganggu user lain
- **Tentang MathKu** — Info versi, fitur, teknologi, lisensi di modal popup

---

## Cara Menggunakan

1. **Buka aplikasi** di browser modern (Chrome, Edge, Firefox, Safari)
2. **Masukkan Nama** Anda pada kolom yang tersedia
3. **Klik "Mulai Belajar"** — selamat datang di MathKu!
4. **Pilih kategori** dari halaman utama
5. **Pilih level** — mulai dari Level 1 yang sudah terbuka
6. **Kerjakan 10 soal** — skor di atas 70% memberi 1 bintang
7. **Kumpulkan 3 bintang** untuk membuka level berikutnya
8. **Coba mode Ujian** setelah menguasai kategori-kategori dasar

Untuk pengalaman terbaik di HP Android, klik tombol **"Pasang Aplikasi"** agar MathKu tersimpan di layar utama.

---

## Kode Akses & Gate

> Aplikasi memerlukan kode akses untuk membuka Level 2 dan seterusnya. Level 1 di setiap kategori bisa dicoba gratis tanpa kode.

### Cara Kerja Gate

1. **Saat pertama buka aplikasi**: User hanya diminta memasukkan nama (tanpa kode akses)
2. **Level 1 gratis**: User bisa mencoba Level 1 di semua kategori tanpa kode
3. **Level 2+ terkunci**: Saat user klik Level 2+ di kategori mana pun, modal gate muncul
4. **Ujian section 2+ terkunci**: Sama seperti kategori biasa
5. **Tambah user butuh kode**: Jika user belum punya kode, menambah user memunculkan gate
6. **Sekali masukkan, semua terbuka**: Setelah kode benar, gate nonaktif untuk semua kategori & tambah user

### Cara Mendapatkan Kode Akses

- **Untuk pengguna akhir**: Saat gate muncul, klik link **"Minta akses"** — akan mengarahkan ke [lynk.id/qafstudio/1nl20ng051gn](https://lynk.id/qafstudio/1nl20ng051gn)
- **Untuk pengembang/admin**: Buka `js/app.js`, cari `var DEV_CODE =` (sekitar baris 486)

---

## Multi-User

MathKu mendukung **sampai 5 user** dalam satu perangkat:

- **Tombol User Switch**: Di halaman utama, klik tombol oranye dengan ikon people & badge (mis. "Budi 1/5")
- **Progres Terpisah**: Setiap user punya progres level & bintang sendiri
- **Tambah User**: Klik "Tambah User" di User Manager (butuh kode akses jika belum)
- **Hapus User**: Klik tombol × di samping nama user (dengan konfirmasi)
- **Ganti User**: Klik nama user di daftar untuk beralih
- **Reset Progress**: Tombol reset hanya menghapus progres user aktif

---

## Pengenalan Angka

Kategori "Berhitung" punya mode **Pengenalan Angka** di awal:

- 10 slide pengenalan angka 1-10 secara berurutan
- Setiap slide: kata ("ini ada satu"), angka ("1"), dan emoji sesuai jumlahnya ("🐱")
- Emoji berbeda untuk setiap angka (anjing, kucing, kelinci, hamster, katak, harimau, rubah, monyet, sapi, beruang)
- Tombol **"Ulangi"** & **"Lanjut"**
- Slide terakhir: tombol **"Mulai Berhitung"**
- Bilingual: "ini ada satu" (ID) / "this is one" (EN)

---

## Soal Cerita

MathKu mendukung **300+ soal cerita** dari 6 file CSV sebagai **level terpisah**:

| File CSV | Kategori | Level Story | Range Angka |
|----------|----------|-------------|-------------|
| `+.csv` (65 cerita) | Penjumlahan | L2, L4 | a,b: 1-10 / 1-20 |
| `-.csv` (65 cerita) | Pengurangan | L2, L4 | a,b: 1-10 / 1-20, a>b |
| `+_.csv` (50 cerita) | Jumlah & Kurang | L4, L6 | a,b,c: 1-10 / 5-25, a+b>c |
| `x.csv` (40 cerita) | Perkalian | L2, L4 | a,b: 1-10 / 1-20 |
| `b.csv` (40 cerita) | Pembagian | L2, L4 | a,b: 1-25 / 1-100, hasil bulat |
| `xb.csv` (40 cerita) | Kali & Bagi | L4, L6 | a,b,c: 1-25 / 1-50, (a×b)÷c bulat |

### Detail
- **Level cerita** = 10 soal cerita murni dari CSV
- Level reguler digeser nomornya (mis. Penjumlahan dari 9 → 11 level)
- Ikon level cerita: buku (berbeda dari level reguler yang pakai angka)
- Warna level cerita sama dengan level reguler (abu saat terkunci, warna kategori saat terbuka)
- Bilingual: teks cerita bisa diubah bahasa **saat kuis berlangsung**
- Pembagian: hasil selalu bilangan bulat, quotient ≥ 2
- Ujian: soal diambil dari SEMUA level (regular + story + mixed)

---

## Level Campuran (Mixed)

Level campuran menggabungkan soal cerita dari 2 kategori:

| Kategori | Level | Komposisi |
|----------|-------|-----------|
| Jumlah & Kurang | L3 | 5 cerita Penjumlahan (1-20) + 5 cerita Pengurangan (1-20, a>b) |
| Kali & Bagi | L3 | 5 cerita Perkalian (1-10) + 5 cerita Pembagian (1-25) |
| Advance | L1 | 5 cerita Penjumlahan (1-20) + 5 cerita Pengurangan (1-20, a>b) |
| Advance | L3 | 5 cerita Perkalian (1-10) + 5 cerita Pembagian (1-25) |

---

## Bahasa (i18n)

MathKu mendukung dua bahasa: **Bahasa Indonesia** (default) dan **English**.

### Cara Mengganti Bahasa
1. Klik tombol **ID/EN** di pojok kanan atas
2. Seluruh teks UI langsung berubah
3. Pilihan tersimpan otomatis

### Deteksi Otomatis
Saat pertama dibuka, MathKu mendeteksi bahasa browser: `en-*` → English, lainnya → Indonesia.

---

## Struktur File

```
mathku/
├── index.html              # HTML utama (9 KB) - struktur & referensi
├── manifest.json           # Konfigurasi PWA
├── sw.js                    # Service Worker (caching & offline)
├── icon.svg                 # Ikon SVG master
├── README.md                # Dokumentasi ini
├── LICENSE                  # Lisensi MIT + CC0
├── css/
│   └── style.css            # Semua styling (23 KB)
├── js/
│   └── app.js               # Semua logika aplikasi (181 KB)
├── data/                    # Bank soal cerita (CSV)
│   ├── +.csv                    # 65 soal Penjumlahan
│   ├── -.csv                    # 65 soal Pengurangan
│   ├── +_.csv                   # 50 soal Jumlah & Kurang
│   ├── x.csv                    # 40 soal Perkalian
│   ├── b.csv                    # 40 soal Pembagian
│   └── xb.csv                   # 40 soal Kali & Bagi
└── icons/                   # Ikon PNG untuk berbagai ukuran
    ├── favicon-32x32.png
    ├── apple-touch-icon-180x180.png
    ├── icon-192x192.png
    ├── icon-256x256.png
    ├── icon-384x384.png
    └── icon-512x512.png
```

### Penjelasan File Kunci

**`index.html`** — HTML minimal yang berisi struktur DOM dan referensi ke `css/style.css` dan `js/app.js`. Tidak ada inline CSS atau JS.

**`css/style.css`** — Semua styling aplikasi: layout, warna, animasi, responsif, modal.

**`js/app.js`** — Semua logika aplikasi: i18n, multi-user, sound engine, generator soal, level definitions, quiz flow, PWA, service worker registration.

**`sw.js`** — Service Worker. Cache-first untuk aset statis, network-first untuk HTML.

**`data/*.csv`** — Bank soal cerita. Format: `Soal (Indonesia),Question (English)` dengan placeholder `{a}`, `{b}`, `{c}`.

---

## Memasang sebagai Aplikasi (PWA)

### Android (Chrome / Edge)
1. Buka MathKu di browser
2. Tunggu badge hijau di tombol "Pasang Aplikasi"
3. Klik tombol → "Pasang"

### iPhone / iPad (Safari)
1. Buka di **Safari**
2. Tap **Share** → **"Tambah ke Layar Utama"** → **"Tambahkan"**

### Komputer (Chrome / Edge)
1. Klik ikon install di address bar, atau tombol "Pasang Aplikasi"
2. Klik **"Pasang"**

---

## Menjalankan Secara Lokal

```bash
cd mathku
python3 -m http.server 8000
```

Buka `http://localhost:8000` di browser.

> Service Worker hanya bekerja di HTTPS atau `localhost`.

---

## Mengembangkan Aplikasi

### Mengubah Kode Akses
Buka `js/app.js`, cari `var DEV_CODE =` (sekitar baris 486).

### Mengubah/Menambah Bahasa
Lihat objek `I18N` di `js/app.js`. Tambahkan blok bahasa baru (mis. `ms:` untuk Melayu).

### Mengubah Level Structure
Lihat objek `LEVEL_DEFS` di `js/app.js`. Setiap kategori punya array level definitions dengan `type: 'regular'`, `'story'`, atau `'mixed'`.

### Menambah Soal Cerita
Tambah baris baru ke file CSV di `data/`. Format: `"Teks ID dengan {a} dan {b}","English text with {a} and {b}"`.

### Regenerasi Ikon
```bash
pip install cairosvg
python3 scripts/make_icons.py
```

---

## Tentang MathKu (Info di App)

Di dalam aplikasi, klik tombol **"ℹ️ Tentang MathKu"** di bagian bawah halaman utama untuk melihat:
- ✨ **Fitur**: 9 kategori, multi-user, 300+ soal cerita, bilingual, PWA, musik
- ⚙️ **Teknologi**: HTML5, CSS3, JavaScript, Web Audio API, Service Worker
- 📜 **Lisensi**: MIT + CC0, © 2026 MathKu Team

---

## Lisensi & Kredit

### Lisensi Kode
**MIT License** — bebas digunakan, dimodifikasi, didistribusikan. Lihat file `LICENSE`.

### Lisensi Aset
- **Ikon & SVG**: CC0 (Public Domain)
- **Musik**: Melodi original via Web Audio API, CC0
- **Emoji**: Standar Unicode

### Kredit
- **Pengembang**: MathKu Team (QAF Studio)
- **Tahun**: 2026
- **Versi**: 1.2.0 (Beta)
- **Dibuat untuk**: Pendidikan anak Indonesia

---

## Changelog Lengkap

### v1.2.0 (Beta) — 3 Juli 2026

#### Fitur Baru
- **Soal cerita Kali & Bagi (xb.csv)**: 40 soal cerita dengan format `{a}*{b}/{c}`, ditambahkan di Level 4 (1-25) & Level 6 (1-50)
- **Level campuran Advance**: Advance L1 (5 penjumlahan + 5 pengurangan) & L3 (5 perkalian + 5 pembagian)
- **Modal "Tentang MathKu"**: Info versi, fitur, teknologi, lisensi dengan emoji
- **Pemisahan CSS/JS**: File dipisah ke `css/style.css` dan `js/app.js` untuk maintainability

#### Perubahan
- Kali & Bagi: 5 → 7 level (tambah L4, L6 story)
- Advance: 4 → 6 level (tambah L1, L3 mixed)
- Ujian advance sekarang menggunakan `genUjianQ` baru (include story & mixed)
- Link "Minta akses" dihapus dari welcome screen, dipertahankan di gate modal
- URL gate diperbarui ke `https://lynk.id/qafstudio/1nl20ng051gn`
- Service Worker cache version: `mathku-v1.2.0-split`
- SAVE_KEY: `mathku_v19_xbadv`

#### Perbaikan Bug
- Fix: gate link terhapus saat welcome link dihapus (sekarang hanya welcome yang dihapus)
- Fix: ujian advance menggunakan generator lama, sekarang pakai `genUjianQ` baru

### v1.1.4 (Beta) — 2 Juli 2026
- Level campuran di Jumlah & Kurang L3 dan Kali & Bagi L3
- Story levels untuk Perkalian (x.csv) & Pembagian (b.csv)
- Ujian diperbarui: soal dari SEMUA level (regular + story + mixed)
- Ikon level story: warna sama dengan level reguler
- Fix: logika pembagian quotient ≥ 2

### v1.1.3 (Beta) — 2 Juli 2026
- Level soal cerita sebagai level terpisah (bukan disisipkan)
- Bilingual live toggle: teks soal cerita berubah saat toggle bahasa
- Fix: "these are one" → "this is one"
- Hapus emoji Babi (🐷), ganti dengan Rubah (🦊)

### v1.1.2 (Beta) — 2 Juli 2026
- Pengenalan Angka: 10 slide intro di kategori Berhitung
- Soal Cerita: 180 soal dari CSV (+.csv, -.csv, +_.csv)
- Multi-User diperluas: 3 → 5 user
- Kategori "Mencacah" → "Berhitung"
- Tombol User Switch di-redesign dengan badge

### v1.0.26 (Beta) — 25 Juni 2026
- Multi-user support (awalnya 3 user)
- Gate kode akses untuk Level 2+ dan tambah user
- Perbaikan tampilan mobile kuis
- Bug fixes: saveAllUsers, renderHome null check

### v1.0.25 (Beta) — 25 Juni 2026
- PWA support (manifest, service worker, install prompt)
- Toggle musik on/off dengan Web Audio API
- Multi-bahasa (ID/EN) dengan auto-detect
- Modal panduan install PWA (Android/iOS/Desktop)
- SVG icon (favicon, header, app icon)

### v1.0.24 (Beta) — 25 Juni 2026
- Versi awal: 9 kategori, sistem bintang, mode ujian, konfeti
- Sistem penyimpanan ganda (localStorage + cookie)
- 12 melodi prosedural via Web Audio API
- Responsif mobile dengan animasi

---

## Mengunduh Aplikasi

### Download ZIP Lengkap
**📎 [mathku-app.zip](./mathku-app.zip)** (~200 KB)

Setelah diunduh:
1. Ekstrak ZIP
2. Jalankan server lokal: `python3 -m http.server 8000`
3. Buka `http://localhost:8000`

### File Individual
| File | Ukuran | Deskripsi |
|------|--------|-----------|
| [index.html](./index.html) | 9 KB | HTML utama |
| [css/style.css](./css/style.css) | 23 KB | Styling |
| [js/app.js](./js/app.js) | 181 KB | Logika aplikasi |
| [manifest.json](./manifest.json) | 1.7 KB | Konfigurasi PWA |
| [sw.js](./sw.js) | 4.6 KB | Service Worker |
| [icon.svg](./icon.svg) | 1.8 KB | Ikon SVG |
| [LICENSE](./LICENSE) | 2.5 KB | Lisensi MIT + CC0 |
| [data/](./data/) | 85 KB | 6 file CSV soal cerita |
| [icons/](./icons/) | 70 KB | 6 file PNG ikon PWA |

---

<div align="center">

**© 2026 MathKu · Dibuat dengan ❤️ untuk pendidikan anak Indonesia**

</div>
