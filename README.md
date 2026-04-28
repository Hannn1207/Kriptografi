# Website RSA Cipher

Aplikasi web edukasi berbasis browser untuk memahami algoritma kriptografi RSA secara interaktif. Dibuat oleh **Farhan Fadhilah**.

🔗 **Live Demo:** [https://hannn1207.github.io/Kriptografi/](https://hannn1207.github.io/Kriptografi/)

---

## Daftar Isi

- [Tentang Aplikasi](#tentang-aplikasi)
- [Fitur](#fitur)
- [Cara Menjalankan Secara Lokal](#cara-menjalankan-secara-lokal)
- [Cara Penggunaan](#cara-penggunaan)
  - [1. Pembuatan Kunci RSA](#1-pembuatan-kunci-rsa)
  - [2. Enkripsi Pesan](#2-enkripsi-pesan)
  - [3. Dekripsi Pesan](#3-dekripsi-pesan)
  - [4. Tanda Tangan Digital](#4-tanda-tangan-digital)
  - [5. Riwayat Operasi](#5-riwayat-operasi)
- [Struktur Proyek](#struktur-proyek)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Catatan Penting](#catatan-penting)

---

## Tentang Aplikasi

Website RSA Cipher adalah alat edukasi yang membantu mahasiswa memahami cara kerja algoritma kriptografi RSA. Seluruh komputasi berjalan di sisi klien (browser) tanpa memerlukan server backend.

Algoritma RSA bekerja berdasarkan dua kunci:
- **Kunci Publik (n, e)** — digunakan untuk mengenkripsi pesan
- **Kunci Privat (n, d)** — digunakan untuk mendekripsi pesan

---

## Fitur

| Fitur | Deskripsi |
|-------|-----------|
| 🔑 Pembuatan Kunci | Generate kunci RSA otomatis atau masukkan manual |
| 🔒 Enkripsi | Enkripsi teks karakter per karakter dengan `C = M^e mod n` |
| 🔓 Dekripsi | Dekripsi ciphertext dengan `M = C^d mod n` |
| ✍️ Tanda Tangan Digital | Tandatangani dan verifikasi file (semua format) |
| 📋 Riwayat | Simpan semua operasi selama sesi browser |
| 📊 Visualisasi Langkah | Tampilkan setiap langkah matematis secara detail |

---

## Cara Menjalankan Secara Lokal

Website ini menggunakan ES Modules sehingga **tidak bisa dibuka langsung** dengan double-click file HTML. Harus dijalankan melalui server lokal.

### Prasyarat

- [Node.js](https://nodejs.org/) versi 14 ke atas

### Langkah-langkah

**1. Clone repository**

```bash
git clone https://github.com/Hannn1207/Kriptografi.git
cd Kriptografi
```

**2. Jalankan server lokal**

```bash
cd website-builder
node server.js
```

**3. Buka browser**

Akses: [http://localhost:3000](http://localhost:3000)

### Menjalankan Test

```bash
cd website-builder
npx vitest run
```

---

## Cara Penggunaan

### 1. Pembuatan Kunci RSA

Tab pertama yang muncul saat membuka website.

#### Buat Kunci Otomatis

1. Klik tombol **"Buat Kunci"**
2. Sistem akan otomatis memilih dua bilangan prima acak (p dan q)
3. Nilai **p, q, n, φ(n), e, d** akan ditampilkan di bagian **Kunci Aktif**
4. Langkah-langkah matematis ditampilkan di bawahnya

#### Masukkan Kunci Manual

Berguna untuk bereksperimen dengan nilai kunci tertentu.

1. Isi kolom **Modulus n** — contoh: `3233`
2. Isi kolom **Eksponen publik e** — contoh: `17`
3. Isi kolom **Eksponen privat d** — contoh: `2753`
4. Klik **"Gunakan Kunci Manual"**

> **Contoh kunci valid:** n=3233, e=17, d=2753 (dari p=61, q=53)
>
> **Syarat kunci valid:**
> - n = p × q (p dan q harus bilangan prima)
> - gcd(e, φ(n)) = 1
> - (e × d) mod φ(n) = 1

---

### 2. Enkripsi Pesan

1. Pastikan kunci sudah dibuat di tab **Pembuatan Kunci**
2. Klik tab **"Enkripsi"**
3. Ketik teks di kolom **Teks asli (plaintext)**
4. Klik tombol **"Enkripsi"**
5. Hasil ciphertext (angka desimal dipisah spasi) muncul di **Hasil Ciphertext**
6. Langkah enkripsi per karakter ditampilkan di bawahnya

> **Catatan:** Nilai n harus lebih besar dari 127 agar bisa mengenkripsi karakter ASCII standar. Gunakan tombol "Buat Kunci" untuk mendapatkan kunci yang sesuai.

**Contoh:**
- Plaintext: `A`
- Kunci: n=3233, e=17
- Ciphertext: `2790`

---

### 3. Dekripsi Pesan

1. Pastikan kunci privat tersedia
2. Klik tab **"Dekripsi"**
3. Masukkan ciphertext (angka dipisah spasi) di kolom input
4. Klik tombol **"Dekripsi"**
5. Hasil plaintext muncul di **Hasil Plaintext**

**Contoh:**
- Ciphertext: `2790`
- Kunci: n=3233, d=2753
- Plaintext: `A`

> **Tips:** Setelah enkripsi, salin ciphertext dari tab Enkripsi lalu tempel di tab Dekripsi untuk memverifikasi round-trip.

---

### 4. Tanda Tangan Digital

Fitur ini mengimplementasikan konsep **Tanda Tangan Digital** berbasis RSA + SHA-256.

#### Konsep

```
Penandatanganan:  Dokumen → SHA-256 → hash^d mod n → Tanda Tangan
Verifikasi:       Tanda Tangan → S^e mod n → hash_recovered == hash_file?
```

#### Membuat Tanda Tangan

1. Pastikan kunci RSA sudah dibuat
2. Klik tab **"Tanda Tangan Digital"**
3. Di bagian **"1. Buat Tanda Tangan"**, klik **"Pilih File"**
4. Pilih file apa saja — mendukung semua format:
   - Dokumen: `.txt`, `.pdf`, `.docx`, `.xlsx`
   - Gambar: `.png`, `.jpg`, `.jpeg`
   - Kode: `.py`, `.js`, `.html`
   - Dan format lainnya
5. Untuk file teks, isi file akan ditampilkan sebagai preview
6. Klik tombol **"Buat Tanda Tangan"**
7. Hasil yang ditampilkan:
   - **Hash SHA-256** (64 karakter hex) dari seluruh byte file
   - **Nilai hash desimal** dan hasil mod n
   - **Tanda Tangan Digital** (nilai S = hash^d mod n)
   - Langkah-langkah matematis lengkap

#### Verifikasi Tanda Tangan

1. Di bagian **"2. Verifikasi Tanda Tangan"**, upload file yang sama
2. Nilai tanda tangan otomatis terisi dari langkah sebelumnya (atau isi manual)
3. Klik tombol **"Verifikasi"**
4. Hasil:
   - ✅ **VALID** — file identik, tanda tangan cocok
   - ❌ **TIDAK VALID** — file telah diubah atau tanda tangan salah

> **Cara membuktikan integritas:** Upload file yang sama → hasil VALID. Ubah satu karakter di file → upload lagi → hasil TIDAK VALID.

---

### 5. Riwayat Operasi

1. Klik tab **"Riwayat"**
2. Semua operasi enkripsi dan dekripsi yang berhasil tersimpan otomatis
3. Setiap entri menampilkan: jenis operasi, waktu, kunci yang digunakan, input, dan output
4. Klik **"Hapus Riwayat"** untuk menghapus semua entri

> **Catatan:** Riwayat hanya tersimpan selama sesi browser aktif. Menutup atau me-refresh halaman akan menghapus riwayat.

---

## Struktur Proyek

```
Kriptografi/
├── website-builder/
│   ├── index.html              # Halaman utama SPA
│   ├── server.js               # Server lokal untuk development
│   ├── package.json            # Konfigurasi npm
│   ├── vitest.config.js        # Konfigurasi testing
│   ├── css/
│   │   └── style.css           # Stylesheet utama
│   └── js/
│       ├── app.js              # Controller utama & event handlers
│       ├── rsa-math.js         # Fungsi matematika RSA inti
│       ├── key-generator.js    # Pembuatan & validasi kunci
│       ├── encryptor.js        # Enkripsi RSA
│       ├── decryptor.js        # Dekripsi RSA
│       ├── digital-signature.js # Tanda tangan digital
│       ├── step-visualizer.js  # Render langkah ke DOM
│       ├── history-manager.js  # Manajemen riwayat
│       └── *.test.js           # File-file unit & property test
└── README.md
```

---

## Teknologi yang Digunakan

| Teknologi | Kegunaan |
|-----------|----------|
| HTML5 / CSS3 / JavaScript | Tampilan dan logika aplikasi |
| Web Crypto API | Hashing SHA-256 untuk tanda tangan digital |
| ES Modules | Modularisasi kode JavaScript |
| Vitest | Test runner |
| fast-check | Property-based testing |

---

## Catatan Penting

### Batasan RSA Edukasi

Website ini menggunakan bilangan prima kecil (p, q < 100) untuk kemudahan pemahaman. **Ini berbeda dengan RSA produksi** yang menggunakan kunci 2048-bit atau lebih.

Konsekuensinya:
- Nilai n biasanya kecil (ratusan hingga ribuan)
- Hanya bisa mengenkripsi karakter dengan nilai ASCII < n
- Tanda tangan digital menggunakan 32-bit dari hash SHA-256 (bukan 256-bit penuh)

### Keamanan

Aplikasi ini **hanya untuk tujuan edukasi**. Jangan gunakan untuk mengenkripsi data sensitif di dunia nyata.
