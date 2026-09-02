# Dokumentasi Standar Operasional Git dan Alur Kerja Monorepo

Dokumen ini merupakan panduan resmi dan standar operasional (*Standard Operating Procedure*) untuk penggunaan Git di dalam tim pengembang. Mengingat proyek ini dikembangkan secara kolaboratif, seluruh anggota tim diwajibkan untuk membaca, memahami, dan mematuhi aturan yang tertulis di bawah ini agar proses integrasi kode berjalan lancar dan meminimalisasi kendala teknis.

---

## 1. Arsitektur Repositori (Monorepo)

Proyek ini menggunakan pendekatan **Monorepo**. Artinya, seluruh komponen aplikasi (baik antarmuka pengguna/Frontend maupun logika server/Backend) disimpan di dalam satu repositori Git yang sama. Pendekatan ini memudahkan pengelolaan versi dan pembagian kode antar-modul.

Struktur direktori proyek kita adalah sebagai berikut:

```txt
renjana-project/
├── apps/
│   ├── frontend/        <-- Direktori kerja tim Frontend (Next.js → Vercel)
│   └── backend/         <-- Direktori kerja tim Backend (NestJS → Railway)
├── packages/
│   └── types/           <-- Definisi tipe data (TypeScript) yang digunakan bersama
├── docs/                <-- Tempat penyimpanan dokumentasi teknis dan panduan
│   └── GIT_WORKFLOW.md
├── .gitignore           <-- Daftar berkas yang diabaikan oleh Git
├── .prettierrc          <-- Konfigurasi standar format kode
├── .env.example         <-- Contoh variabel lingkungan (tanpa kredensial asli)
├── LICENSE
├── package.json         <-- Konfigurasi utama dependensi proyek
└── README.md            <-- Informasi umum proyek
```

## 2. Hierarki dan Aturan Dasar Branch

Untuk menjaga stabilitas aplikasi yang digunakan oleh pengguna akhir, kita menerapkan pemisahan *branch* (cabang kerja) yang ketat.

**Terdapat tiga *branch* utama dalam proyek ini:**

1. **`main` (Kritis/Produksi):** Ini adalah *branch* utama yang terhubung langsung dengan server langsung ( *live server* ). **Dilarang keras melakukan penambahan kode ( *push* ) secara langsung ke *branch* ini.** Kode hanya boleh masuk ke sini melalui persetujuan ( *approval* ).
2. **`frontend` (Area Kerja Frontend):** Ini adalah *branch* tempat berkumpulnya seluruh pekerjaan dari tim Frontend.
3. **`backend` (Area Kerja Backend):** Ini adalah *branch* tempat berkumpulnya seluruh pekerjaan dari tim Backend.

## 3. Standar Penulisan Pesan Commit

Setiap kali Anda menyimpan perubahan kode ( *commit* ), Anda harus menuliskan pesan yang mendeskripsikan apa yang Anda ubah. Kita menggunakan standar **Conventional Commits** agar riwayat perubahan mudah dilacak.

**Format penulisan:**

```txt
<type>(<scope>): <deskripsi singkat maksimal 50 karakter>
```

* **`scope` yang tersedia:** `(frontend)`, `(backend)`, `(docs)`, `(root)`

### Jenis `type` & Contoh

| **Type** | **Kapan Digunakan?** | **Contoh Pesan Commit** |
| ---------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| **`feat`** | Menambah fitur baru. | `git commit -m "feat(frontend): tambah halaman dashboard"` |
| **`fix`** | Memperbaiki bug/error. | `git commit -m "fix(backend): atasi error koneksi database"` |
| **`docs`** | Mengubah/menambah dokumen. | `git commit -m "docs(docs): update aturan commit monorepo"` |
| **`style`** | Mengubah CSS/tampilan tanpa ubah logika. | `git commit -m "style(frontend): perbaiki margin tombol"` |
| **`refactor`** | Mengoptimalkan kode tanpa ubah fungsi. | `git commit -m "refactor(backend): sederhanakan fungsi auth"` |
| **`chore`** | Update package/konfigurasi. | `git commit -m "chore(root): install linter"` |
| **`ci`** | Ubah konfigurasi deployment/CI-CD. | `git commit -m "ci(root): update config vercel"` |

## 4. Alur Kerja Harian Developer (Langkah demi Langkah)

Bagian ini menjelaskan siklus kerja yang harus Anda lakukan setiap kali diberikan tugas pemrograman. Silakan ikuti urutan berikut secara saksama.

### Langkah 1: Persiapan dan Sinkronisasi Branch

Sebelum Anda mulai menulis kode, pastikan Anda berada di *branch* divisi Anda dan kodenya sinkron dengan pekerjaan teman-teman setim Anda.

```bash
# 1. Pindah ke branch divisi Anda (ganti 'frontend' dengan 'backend' jika Anda tim backend)
git checkout frontend

# 2. Ambil perubahan kode terbaru dari server pusat (GitHub) ke komputer Anda
git pull origin frontend
```

*Tujuan `git pull`: Memastikan Anda tidak mengedit kode versi lama yang sudah usang.*

### Langkah 2: Proses Penulisan Kode

Silakan buka teks editor (VS Code) dan kerjakan tugas Anda di dalam direktori `apps/frontend` atau `apps/backend`. Jika Anda ingin melihat berkas apa saja yang telah Anda ubah, gunakan perintah berikut:

```bash
git status
```

### Langkah 3: Penyimpanan Perubahan (Commit)

Setelah fitur selesai atau *bug* diperbaiki, Anda harus mendaftarkan dan menyimpan perubahan tersebut di Git lokal Anda.

```bash
# 1. Daftarkan seluruh berkas yang Anda ubah (tanda titik artinya 'semua berkas')
git add .

# 2. Simpan dengan pesan yang mengikuti format standar
git commit -m "feat(frontend): tambah fitur penyortiran tabel"
```

### Langkah 4: Sinkronisasi Ulang dan Pengiriman (Push)

Sebelum mengirimkan kode Anda ke GitHub, sangat disarankan untuk melakukan pengecekan terakhir agar tidak berbenturan ( *conflict* ) dengan kode yang mungkin baru saja dikirim oleh rekan setim Anda di waktu yang bersamaan.

```bash
# 1. Ambil pembaruan terbaru (berjaga-jaga jika ada teman yang baru mengirim kode)
git pull origin frontend

# 2. Jika aman (tidak ada conflict), kirim kode Anda ke GitHub
git push origin frontend
```

### Langkah 5: Pengajuan Penggabungan (Pull Request)

Tahap ini dilakukan jika seluruh tugas Anda di *branch* modul sudah rampung dan siap diluncurkan ke server utama ( *main* ).

1. Buka halaman repositori proyek kita di  **GitHub** .
2. Klik tombol hijau bertuliskan  **"Compare & pull request"** .
3. Pastikan konfigurasi penggabungan sudah benar:
   * **Base branch (Tujuan):** `main`
   * **Compare branch (Sumber):** `frontend` (atau `backend`)
4. Isi kotak deskripsi mengenai perubahan apa saja yang telah Anda buat.
5. Klik  **"Create Pull Request"** . Tugas Anda selesai hingga titik ini.

### Langkah 6: Tinjauan Kode (Code Review) dan Deployment

* Tim DevOps atau Lead Engineer akan memeriksa pengajuan ( *Pull Request* ) Anda.
* Jika kode dinilai sudah memenuhi standar dan aman dari potensi kerusakan, DevOps akan menyetujui ( *Approve* ) dan menggabungkannya ke *branch* `main`.
* Sistem akan secara otomatis mendeteksi perubahan pada `main` dan memperbarui aplikasi yang ada di server Vercel (Frontend) dan Railway (Backend).

## 5. Perintah Git yang Sering Digunakan

Sebagai panduan cepat, berikut adalah daftar perintah Git yang akan sering Anda operasikan sehari-hari:

```bash
# Memindahkan area kerja ke branch tertentu
git checkout nama_branch

# Mengambil perubahan kode terbaru dari server ke komputer lokal
git pull origin nama_branch

# Mengirimkan kode lokal Anda ke server GitHub
git push origin nama_branch

# Memeriksa status dan daftar berkas yang dimodifikasi
git status

# Melihat riwayat penyimpanan (commit) sebelumnya secara ringkas
git log --oneline -10

# Membatalkan commit terakhir HANYA JIKA kode belum dikirim (push) ke GitHub
git reset --soft HEAD~1
```

## 6. Praktik Terbaik (Best Practices)

Untuk menjaga kualitas kolaborasi tim, mohon perhatikan hal-hal berikut:

**Himbauan Utama:**

* Lakukan penarikan kode (`git pull`) secara rutin setiap kali Anda akan mulai bekerja di pagi hari atau setelah istirahat.
* Lakukan *commit* secara berkala untuk setiap perubahan kecil yang fungsional. Hindari membuat satu *commit* masif yang berisi ratusan perubahan berkas.
* Lakukan pengujian lokal di komputer Anda ( *run project* ) sebelum melakukan pengiriman kode ( *push* ).

**Larangan Keras:**

* Dilarang keras melakukan manipulasi *branch* `main` secara langsung tanpa melalui prosedur  *Pull Request* .
* Dilarang menggunakan pesan *commit* yang tidak informatif seperti `update`, `fix bug`, atau `perbaikan`.
* Hindari mengunggah data kredensial, kata sandi, atau *API Key* asli ke dalam kode (pastikan hanya berada di *environment variables* yang terlindungi).
