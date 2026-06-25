# MathKu — Belajar Berhitung Jadi Menyenangkan

<div align="center">

![MathKu](icon.svg)

**Aplikasi edukasi matematika untuk anak Indonesia**

Belajar berhitung dengan cara yang menyenangkan — penjumlahan, pengurangan, perkalian, pembagian, kombinasi, soal advance, dan mode ujian. Progres otomatis tersimpan, bisa dipasang sebagai aplikasi (PWA), dan berfungsi offline.

![Versi](https://img.shields.io/badge/versi-1.0.25_%28Beta%29%20%C2%B7%20PWA%20%C2%B7%20i18n-FF7043?style=flat-square)
![Lisensi](https://img.shields.io/badge/lisensi-MIT%20%2B%20CC0-4CAF50?style=flat-square)
![Bahasa](https://img.shields.io/badge/bahasa-Indonesia%20%2F%20English-42A5F5?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Web%20%2F%20Android%20%2F%20iOS%20%2F%20Desktop-AB47BC?style=flat-square)

</div>

---

## Daftar Isi

1. [Tentang MathKu](#tentang-mathku)
2. [Fitur Utama](#fitur-utama)
3. [Cara Menggunakan](#cara-menggunakan)
4. [Kode Akses](#kode-akses)
5. [Bahasa (i18n)](#bahasa-i18n)
6. [Struktur File](#struktur-file)
7. [Memasang sebagai Aplikasi (PWA)](#memasang-sebagai-aplikasi-pwa)
8. [Menjalankan Secara Lokal](#menjalankan-secara-lokal)
9. [Mengembangkan Aplikasi](#mengembangkan-aplikasi)
10. [Lisensi & Kredit](#lisensi--kredit)
11. [Mengunduh Aplikasi](#mengunduh-aplikasi)

---

## Tentang MathKu

MathKu adalah aplikasi web edukatif yang dirancang khusus untuk membantu anak-anak Indonesia belajar berhitung dengan cara yang interaktif dan menyenangkan. Aplikasi ini dikembangkan dengan fokus pada pengalaman pengguna yang ramah anak: warna-warna cerah, animasi yang lembut, rewards visual (bintang & confetti), serta musik prosedural yang dihasilkan langsung oleh browser tanpa perlu file audio eksternal.

Aplikasi ini mendukung sembilan kategori pembelajaran, mulai dari menghitung benda (mencacah) hingga soal kombinasi operasi yang menantang. Setiap kategori memiliki beberapa level yang harus dibuka berurutan dengan mengumpulkan tiga bintang — siswa harus mencapai skor di atas 70% untuk mendapatkan satu bintang. Mode Ujian menguji pemahaman menyeluruh dengan batas waktu per kategori, meniru pengalaman ujian sesungguhnya.

Aplikasi juga sudah dikonfigurasi sebagai **Progressive Web App (PWA)** — dapat dipasang langsung dari browser ke layar utama perangkat, berjalan layar penuh tanpa address bar, dan tetap dapat digunakan tanpa koneksi internet.

---

## Fitur Utama

### Pembelajaran Terstruktur
- **9 Kategori Matematika** — Mencacah, Penjumlahan, Pengurangan, Jumlah & Kurang, Perkalian, Pembagian, Kali & Bagi, Advance, dan Ujian
- **Sistem Level Bertahap** — Setiap kategori memiliki 2-9 level dengan tingkat kesulitan meningkat
- **Sistem Bintang** — Kumpulkan 3 bintang di setiap level untuk membuka level berikutnya
- **Mode Ujian** — 7 sesi ujian dengan batas waktu berbeda (10-20 menit), 10 soal per sesi
- **Soal Visual** — Level dasar menggunakan emoji buah & hewan agar mudah dipahami anak

### Pengalaman Pengguna
- **Desain Ramah Anak** — Warna pastel, ikon intuitif, animasi konfeti saat berhasil
- **Penyimpanan Otomatis** — Progres tersimpan di `localStorage` dengan fallback `cookie` (365 hari)
- **Musik Prosedural** — 12 melodi original via Web Audio API (selamat datang, jawaban benar/salah, level terbuka, dll)
- **Tombol Toggle Musik** — Pengaturan on/off di pojok kanan atas, preferensi tersimpan
- **Animasi Mikro** — Pulse, pop, shake, dan konfeti untuk feedback visual yang menyenangkan
- **Responsif** — Tampil optimal di HP, tablet, dan desktop

### PWA (Progressive Web App)
- **Dapat Dipasang** — Tombol "Pasang Aplikasi" memicu prompt install native dari browser
- **Berfungsi Offline** — Service Worker meng-cache app shell, aplikasi tetap jalan tanpa internet
- **App Shortcuts** — Long-press ikon app untuk akses cepat ke Penjumlahan & Ujian
- **Splash Screen** — Otomatis menggunakan icon & warna tema saat dibuka dari home screen
- **Indikator Install Ready** — Badge hijau berkedip pada tombol saat browser siap install

### Multi-Bahasa (i18n)
- **Dua Bahasa** — Indonesia (default) & English
- **Toggle Real-time** — Tombol ID/EN di pojok kanan atas, perubahan langsung diterapkan
- **Auto-Deteksi** — Mendeteksi bahasa browser saat pertama dibuka
- **Persisten** — Pilihan bahasa tersimpan di localStorage & cookie
- **Lengkap** — Semua teks UI diterjemahkan: akses, home, kuis, hasil, perayaan, modal install, pesan motivasi

### Akses & Keamanan
- **Kode Akses** — Aplikasi terkunci hingga pengguna memasukkan kode akses yang valid
- **Penyambutan Personal** — Nama pengguna diminta saat login pertama, digunakan dalam pesan motivasi
- **Reset Progress** — Tombol reset di footer halaman utama (dengan konfirmasi)

---

## Cara Menggunakan

1. **Buka aplikasi** di browser modern (Chrome, Edge, Firefox, atau Safari)
2. **Masukkan Nama** Anda pada kolom yang tersedia
3. **Masukkan Kode Akses** (lihat bagian [Kode Akses](#kode-akses) di bawah)
4. **Klik "Buka Aplikasi"** — selamat datang di MathKu!
5. **Pilih kategori** dari halaman utama (Penjumlahan, Pengurangan, dst)
6. **Pilih level** — mulai dari level 1 yang sudah terbuka
7. **Kerjakan 10 soal** — skor di atas 70% memberi 1 bintang
8. **Kumpulkan 3 bintang** untuk membuka level berikutnya
9. **Coba mode Ujian** setelah menguasai kategori-kategori dasar

Untuk pengalaman terbaik di HP Android, klik tombol **"Pasang Aplikasi"** di bawah judul agar MathKu tersimpan di layar utama seperti aplikasi biasa.

---

## Kode Akses

> Aplikasi memerlukan kode akses 6 digit untuk dibuka. Kode ini bertindak sebagai pintu masuk sederhana dan mencegah akses tidak sah dari pengguna acak.

| Konfigurasi | Nilai |
|-------------|-------|
| Nama variabel di kode | `DEV_CODE` |
| Format | 6 digit angka |
| Lokasi di file | `index.html`, pada bagian konfigurasi global |

### Cara Mendapatkan Kode Akses

Kode akses sengaja **tidak ditampilkan secara terbuka** di README ini untuk menjaga keamanan dasar. Berikut cara memperolehnya:

- **Untuk pengguna akhir**: Klik link kecil **"Minta akses"** di halaman awal aplikasi — akan mengarahkan ke [lynk.id/qafstudio](https://lynk.id/qafstudio) untuk request akses
- **Atau hubungi langsung** pengembang / guru / pihak yang membagikan aplikasi ini kepada Anda
- **Untuk pengembang / admin**: Buka file `index.html`, cari deklarasi `var DEV_CODE =` di bagian atas script (sekitar baris 486). Nilai string yang diapit tanda kutip adalah kode aksesnya
- **Untuk mengganti kode**: Edit nilai `DEV_CODE` di `index.html`. Perubahan langsung berlaku, tidak perlu build step

### Tips Keamanan

- Kode akses disimpan dalam plain-text di JavaScript — **ini bukan mekanisme keamanan kuat**, hanya filter sederhana untuk pengguna acak
- Siapa pun yang bisa melihat source code bisa menemukan kodenya
- Untuk keperluan produksi yang lebih aman, pertimbangkan autentikasi server-side
- Jika ingin mengubah kode, gunakan kombinasi yang tidak mudah ditebak namun mudah diingat oleh target pengguna (anak-anak)

---

## Bahasa (i18n)

MathKu mendukung dua bahasa: **Bahasa Indonesia** (default) dan **English**.

### Cara Mengganti Bahasa

1. Klik tombol **ID/EN** di pojok kanan atas aplikasi (di sebelah tombol speaker)
2. Seluruh teks UI akan langsung berubah ke bahasa yang dipilih
3. Pilihan tersimpan otomatis di browser — saat aplikasi dibuka kembali, bahasa terakhir tetap digunakan

### Deteksi Otomatis

Saat pertama kali dibuka, MathKu akan mendeteksi bahasa browser:
- Jika browser dalam bahasa Inggris (`en-*`) → aplikasi menggunakan English
- Untuk bahasa lain (termasuk `id-*`) → aplikasi menggunakan Bahasa Indonesia

### Yang Diterjemahkan

| Bagian | Status |
|--------|--------|
| Layar Akses (login) | ✓ |
| Halaman Utama (home) | ✓ |
| Daftar Level & Ujian | ✓ |
| Soal Kuis (question, feedback) | ✓ |
| Halaman Hasil & Perayaan | ✓ |
| Modal Panduan Install PWA | ✓ |
| Pesan Motivasi (12+ pesan) | ✓ |
| Toast & Pesan Sistem | ✓ |
| Nama Kategori (9 kategori) | ✓ |

### Mengubah / Menambah Bahasa

Lihat objek `I18N` di `index.html` (sekitar baris 504). Strukturnya:

```javascript
var I18N = {
  id: { /* Bahasa Indonesia */ },
  en: { /* English */ }
  // Tambahkan bahasa baru di sini, misalnya:
  //, ms: { /* Malay */ }
};
```

Untuk menambah bahasa baru, salin blok `id` dan terjemahkan nilainya, lalu update logika toggle di `langBtn` listener agar mendukung kode bahasa baru.

---

## Struktur File

```
mathku/
├── index.html                  # Aplikasi utama (HTML + CSS + JS dalam satu file)
├── manifest.json               # Konfigurasi PWA (nama, icon, theme, shortcuts)
├── sw.js                       # Service Worker (caching & offline support)
├── icon.svg                    # Ikon SVG master (512x512, gradien oranye-pink-ungu)
├── README.md                   # Dokumentasi ini
├── LICENSE                     # Lisensi MIT + CC0
├── preview-lang-id-home.png    # Screenshot home dalam Bahasa Indonesia
├── preview-lang-en-home.png    # Screenshot home dalam English
└── icons/                      # Ikon PNG untuk berbagai ukuran
    ├── favicon-32x32.png            # Favicon browser tab
    ├── apple-touch-icon-180x180.png # Ikon iOS Home Screen
    ├── icon-192x192.png             # PWA wajib (Android)
    ├── icon-256x256.png             # PWA medium
    ├── icon-384x384.png             # PWA large
    └── icon-512x512.png             # PWA wajib (splash screen)
```

### Penjelasan File Kunci

**`index.html`** — File utama yang berisi seluruh aplikasi (HTML, CSS, dan JavaScript) dalam satu file. Tidak memerlukan build step. Struktur internal:
- Baris 1-296: HTML & CSS (styling, layout, animasi)
- Baris 297-360: Markup HTML body (screens, modal, sound toggle)
- Baris 361-460: Sistem penyimpanan (localStorage + cookie) & konfigurasi
- Baris 475-475: **Kode Akses** (`DEV_CODE`)
- Baris 477-680: Sound Engine (Web Audio API, 12 melodi prosedural)
- Baris 681-870: Generator soal matematika (8 kategori + ujian)
- Baris 870-1110: Logika UI (home, levels, quiz, result, celebration)
- Baris 1115-1200: Modal panduan install & sound toggle init
- Baris 1205-1275: PWA setup (beforeinstallprompt, appinstalled, SW registration)

**`manifest.json`** — Konfigurasi PWA. Mendefinisikan nama aplikasi, ikon, warna tema (`#FF7043`), mode tampilan (`standalone`), dan shortcuts (Penjumlahan & Ujian).

**`sw.js`** — Service Worker. Strategi caching:
- **App Shell** di-cache saat install (index.html, manifest, ikon)
- **Network-first** untuk halaman HTML (mendapat update terbaru)
- **Cache-first** untuk aset statis (gambar, font) dengan stale-while-revalidate

**`icon.svg`** — Ikon master berbentuk SVG dengan gradien oranye-pink-ungu dan teks "1+2". Semua ikon PNG dihasilkan dari file ini.

---

## Memasang sebagai Aplikasi (PWA)

MathKu dapat dipasang sebagai aplikasi native di HP, tablet, maupun komputer Anda. Setelah terpasang, aplikasi akan:
- Muncul di layar utama / desktop dengan ikon khusus
- Terbuka layar penuh tanpa address bar browser
- Bekerja tanpa koneksi internet

### Android (Chrome / Edge)

1. Buka aplikasi MathKu di browser
2. Tunggu hingga **badge hijau berkedip** muncul di tombol "Pasang Aplikasi" (artinya browser siap install)
3. Klik tombol "Pasang Aplikasi"
4. Tekan **"Pasang"** pada dialog konfirmasi
5. Selesai — MathKu kini ada di layar utama HP Anda

> Jika badge tidak muncul, gunakan menu browser (tiga titik) → "Tambahkan ke Layar Utama" / "Pasang aplikasi".

### iPhone / iPad (Safari)

iOS tidak mendukung prompt install otomatis. Gunakan langkah manual:

1. Buka MathKu di **Safari** (bukan Chrome/Firefox iOS)
2. Tap tombol **Share** (ikon kotak dengan panah ke atas) di bilah bawah
3. Pilih **"Tambah ke Layar Utama"**
4. Tekan **"Tambahkan"**
5. Selesai

### Komputer (Chrome / Edge)

1. Buka MathKu di browser Chrome atau Edge
2. Klik ikon install di sisi kanan address bar, atau klik tombol "Pasang Aplikasi"
3. Klik **"Pasang"** pada dialog
4. MathKu terbuka di jendela terpisah, ikon tersedia di desktop / taskbar

---

## Menjalankan Secara Lokal

Karena menggunakan Service Worker, aplikasi perlu diakses via HTTP (bukan `file://`). Untuk menjalankan di komputer Anda:

### Opsi 1: Python (paling mudah, biasanya sudah terinstall)

```bash
cd mathku
python3 -m http.server 8000
```

Buka browser ke `http://localhost:8000`

### Opsi 2: Node.js

```bash
cd mathku
npx serve
# atau
npx http-server -p 8000
```

### Opsi 3: VS Code Live Server

Install extension "Live Server" → klik kanan `index.html` → "Open with Live Server"

### Opsi 4: PHP

```bash
cd mathku
php -S localhost:8000
```

> **Catatan**: Service Worker hanya bekerja di HTTPS atau `localhost`. Untuk testing PWA di HP melalui jaringan lokal, gunakan tools seperti `ngrok` untuk mendapat URL HTTPS sementara.

---

## Mengembangkan Aplikasi

### Mengubah Kode Akses

Buka `index.html`, cari baris berikut (sekitar baris 475):

```javascript
var DEV_CODE = "xxxxxx";  // ← ganti dengan kode Anda
```

### Mengubah Pesan Motivasi

Cari array `MSG_LU`, `MSG_CD`, `MSG_G`, `MSG_TA` di `index.html`. Setiap pesan menggunakan placeholder `{nama}` yang akan otomatis diganti dengan nama pengguna.

### Menambah / Mengubah Melodi

Sound Engine berada di `index.html` pada bagian `MELODIES` object. Setiap melodi mendefinisikan tempo, tipe waveform (`sine`, `triangle`, `square`, `sawtooth`), dan array nada. Nada menggunakan notasi standar (`C4`, `D5`, `Eb4`, `F#5`, dll).

### Mengubah Warna Tema

Edit CSS variables di bagian `:root`:

```css
:root{
  --bg:#FEF9EF;          /* Background utama */
  --bg-alt:#FFF5E4;      /* Background alternatif */
  --accent:#FF7043;      /* Warna aksen utama (oranye) */
  --accent-hover:#E64A19;
  --success:#4CAF50;     /* Hijau untuk jawaban benar */
  --danger:#EF5350;      /* Merah untuk jawaban salah */
  ...
}
```

Jangan lupa update `theme_color` di `manifest.json` dan `<meta name="theme-color">` di `index.html` agar konsisten.

### Regenerasi Ikon dari SVG

Jika ingin mengubah ikon, edit `icon.svg` lalu regenerasi semua PNG:

```bash
# Membutuhkan Python dengan cairosvg
pip install cairosvg
python3 scripts/make_icons.py
```

### Update Versi Cache Service Worker

Setiap kali Anda mengubah `index.html` atau aset lain, update versi cache di `sw.js` agar browser tahu untuk mengambil versi terbaru:

```javascript
var CACHE_VERSION = 'mathku-v1.0.25-pwa';  // ← ganti versi
```

### Build Tidak Diperlukan

Aplikasi ini tidak menggunakan framework, tidak memerlukan npm install, tidak ada build step. Edit file langsung, refresh browser, selesai.

---

## Lisensi & Kredit

### Lisensi Kode

Kode aplikasi dirilis di bawah lisensi **MIT** — bebas digunakan, dimodifikasi, dan didistribusikan ulang untuk tujuan apa pun, termasuk komersial, dengan atribusi yang sesuai. Lihat file `LICENSE` untuk teks lengkap.

### Lisensi Aset

- **Ikon & SVG**: CC0 (Public Domain) — bebas digunakan tanpa atribusi
- **Musik**: Semua melodi dikomposisikan secara prosedural menggunakan Web Audio API dan tidak menggunakan file audio eksternal apa pun. Bebas digunakan tanpa batasan lisensi
- **Emoji**: Menggunakan set emoji standar Unicode yang tersedia di sistem operasi pengguna

### Kredit

- **Pengembang**: MathKu Team
- **Tahun**: 2026
- **Versi**: 1.0.25 (Beta) · PWA Edition · i18n
- **Dibuat untuk**: Pendidikan anak Indonesia

---

## Mengunduh Aplikasi

### Opsi 1: Unduh File ZIP Lengkap (paling mudah)

Semua file aplikasi sudah dikemas dalam satu file ZIP siap unduh:

**📎 [mathku-app.zip](./mathku-app.zip)** (~120 KB)

Setelah diunduh:
1. Ekstrak ZIP di komputer Anda
2. Buka folder hasil ekstrak
3. Jalankan server lokal (lihat [Menjalankan Secara Lokal](#menjalankan-secara-lokal))
4. Buka `http://localhost:8000` di browser

### Opsi 2: Unduh File README saja

**📎 [README.md](./README.md)** (~17 KB)

File README berisi dokumentasi lengkap. Anda dapat mengunduhnya secara terpisah untuk referensi atau sebagai template dokumentasi proyek Anda sendiri.

### Opsi 3: Unduh File LICENSE saja

**📎 [LICENSE](./LICENSE)** (~3 KB)

File lisensi MIT + CC0. Sertakan file ini di fork atau redistribusi Anda untuk mematuhi syarat lisensi.

### Opsi 4: Unduh Per File

Daftar file individual yang tersedia untuk diunduh:

| File | Ukuran | Deskripsi |
|------|--------|-----------|
| [index.html](./index.html) | ~92 KB | Aplikasi utama |
| [manifest.json](./manifest.json) | ~1.7 KB | Konfigurasi PWA |
| [sw.js](./sw.js) | ~4.7 KB | Service Worker |
| [icon.svg](./icon.svg) | ~1.8 KB | Ikon SVG master |
| [LICENSE](./LICENSE) | ~3 KB | Lisensi MIT + CC0 |
| [README.md](./README.md) | ~17 KB | Dokumentasi ini |
| [icons/](./icons/) | ~70 KB total | 6 file PNG ikon |

---

## Bantuan & Dukungan

Jika menemui masalah atau memiliki pertanyaan:

1. Pastikan browser Anda mendukung PWA (Chrome 76+, Edge 79+, Firefox 84+, Safari 15.4+)
2. Pastikan aplikasi diakses via HTTP/HTTPS (bukan `file://`)
3. Untuk masalah musik tidak muncul: klik tombol speaker di pojok kanan atas untuk memastikan musik aktif, lalu lakukan satu interaksi (klik mana saja) untuk mengaktifkan AudioContext (kebijakan autoplay browser)
4. Untuk masalah install prompt tidak muncul: pastikan sudah berinteraksi dengan halaman selama minimal 30 detik dan sudah klik setidaknya satu elemen

---

<div align="center">

**© 2026 MathKu · Dibuat dengan ❤️ untuk pendidikan anak Indonesia**

</div>
