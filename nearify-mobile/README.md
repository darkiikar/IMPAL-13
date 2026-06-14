# Nearify - Super App Mahasiswa Purwokerto

Aplikasi mobile (web-ready) berbasis **React Native + Expo** dengan backend **FastAPI + PostgreSQL** yang menyediakan layanan terpadu untuk mahasiswa di Purwokerto: pesan makanan, laundry, cari kost, baca Al-Quran, dan pencarian cerdas.

---

## Fitur Utama

| Fitur | Deskripsi |
|---|---|
| 🍔 Food Delivery | Browse restoran lokal, tambah ke cart, buat pesanan |
| 👕 Laundry | Cari laundry shop, pilih layanan, jadwalkan pickup |
| 🏠 Kost | Cari kost berdasarkan gender, harga, dan lokasi |
| 📖 Al-Quran | Baca Al-Quran digital (proxy dari equran.id) |
| 🔍 Smart Search | Pencarian teks di semua kategori sekaligus |
| 🔐 Auth | Register/Login email + Google OAuth |

---

## Struktur Project

```
nearify/
├── backend/                  # Python FastAPI server
│   ├── server.py             # API utama (auth, CRUD, search, payments)
│   ├── seed_real.py          # Seeder data asli dari user_data/
│   └── requirements.txt      # Python dependencies
├── frontend/                 # React Native / Expo app
│   ├── app/                  # Halaman (file-based routing Expo Router)
│   │   ├── (app)/            # Tab utama setelah login
│   │   ├── food/             # Halaman food delivery
│   │   ├── kost/             # Halaman pencarian kost
│   │   └── laundry/          # Halaman laundry
│   ├── src/
│   │   ├── api.ts            # API client & token storage
│   │   └── ...               # Context, hooks, utilities
│   ├── assets/               # Gambar & font statis
│   ├── app.json              # Konfigurasi Expo
│   └── metro.config.js       # Metro bundler config
├── user_data/                # Data asli: gambar restoran, kost, laundry
│   ├── makanan-minuman-dessert/
│   ├── kost/
│   └── laundry/
└── design_guidelines.json    # Panduan desain UI/UX
```

---

## Tech Stack

**Frontend**
- React Native 0.81 + Expo SDK 54
- Expo Router (file-based navigation)
- TypeScript

**Backend**
- Python 3.12 + FastAPI 0.110
- PostgreSQL (via asyncpg)
- JWT Authentication
- Stripe (opsional, untuk pembayaran kartu)

---

## Cara Menjalankan (Development)

### Prasyarat

- Python 3.12+
- Node.js 20+
- PostgreSQL database (URL tersedia di env `DATABASE_URL`)
- Yarn atau npm

---

### 1. Clone & Masuk ke Folder

```bash
git clone <repo-url>
cd nearify
```

---

### 2. Setup Backend

```bash
cd backend

# Install dependencies Python
pip install -r requirements.txt

# Jalankan server (port 8000)
uvicorn server:app --host localhost --port 8000 --reload
```

Backend akan otomatis:
- Membuat semua tabel PostgreSQL saat pertama kali jalan
- Mengisi data seed default (restoran, laundry, kost dengan gambar Unsplash)

> **Catatan:** Pastikan environment variable `DATABASE_URL` sudah di-set sebelum menjalankan.

---

### 3. Load Data Asli dari user_data/ (Opsional tapi Direkomendasikan)

Untuk mengisi database dengan data dan gambar **asli** dari folder `user_data/`:

```bash
cd backend
python seed_real.py
```

Script ini akan:
- Membaca semua gambar dari `user_data/makanan-minuman-dessert/`, `user_data/laundry/`, `user_data/kost/`
- Mengkonversi gambar ke format base64
- Menghapus data lama dan mengisi dengan data asli

> ⚠️ Proses ini membutuhkan waktu beberapa menit karena mengkonversi ~145MB gambar.

---

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies Node.js
npm install
# atau: yarn install

# Jalankan untuk web (port 5000)
npx expo start --web --port 5000
```

Buka browser ke: `http://localhost:5000`

---

### 5. Konfigurasi URL Backend (Jika Berbeda Host)

Secara default, frontend menggunakan URL relatif (`/api/...`) — artinya frontend dan backend harus diakses dari host yang sama.

Jika backend dan frontend berjalan di host yang berbeda (misal backend di server lain), set environment variable sebelum menjalankan frontend:

```bash
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000 npx expo start --web --port 5000
```

Atau buat file `.env` di folder `frontend/`:

```
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

### 6. Menjalankan di Replit

Di Replit, kedua service berjalan otomatis via **Workflows**:

| Workflow | Command | Port |
|---|---|---|
| `Start Backend` | `cd backend && uvicorn server:app --host localhost --port 8000 --reload` | 8000 |
| `Start application` | `cd frontend && npx expo start --web --port 5000` | 5000 |

Klik tombol **Run** di Replit untuk menjalankan keduanya.

---

## Environment Variables

| Variable | Wajib | Deskripsi |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ❌ | Secret key JWT (default: dev key) |
| `STRIPE_API_KEY` | ❌ | Stripe secret key untuk pembayaran kartu |
| `EXPO_PUBLIC_BACKEND_URL` | ❌ | URL backend (default: relatif `/`) |

---

## API Endpoints

### Auth
| Method | Endpoint | Deskripsi |
|---|---|---|
| POST | `/api/auth/register` | Daftar akun baru |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/google` | Login dengan Google |
| GET | `/api/auth/me` | Info user yang login |

### Food
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/restaurants` | Daftar restoran (filter: `category`, `q`) |
| GET | `/api/restaurants/{id}` | Detail restoran |
| GET | `/api/restaurants/{id}/menu` | Menu restoran |
| POST | `/api/food-orders` | Buat pesanan makanan |
| GET | `/api/food-orders` | Riwayat pesanan user |

### Laundry
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/laundry-services` | Daftar jenis layanan laundry |
| GET | `/api/laundry-shops` | Daftar laundry shop (filter: `q`, `location`) |
| GET | `/api/laundry-shops/{id}` | Detail laundry shop |
| POST | `/api/laundry-orders` | Buat pesanan laundry |
| GET | `/api/laundry-orders` | Riwayat pesanan laundry user |

### Kost
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/kost` | Daftar kost (filter: `gender`, `max_price`, `location`, `q`) |
| GET | `/api/kost/{id}` | Detail kost |

### Lainnya
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/quran/surahs` | Daftar surah Al-Quran |
| GET | `/api/quran/surah/{nomor}` | Isi surah |
| POST | `/api/ai/search` | Pencarian cerdas lintas kategori |
| POST | `/api/payments/checkout` | Buat sesi pembayaran Stripe |
| GET | `/api/payments/status/{id}` | Cek status pembayaran |

> Dokumentasi lengkap tersedia di: `http://localhost:8000/docs` (Swagger UI otomatis dari FastAPI)

---

## Data Asli

Folder `user_data/` berisi gambar dan informasi nyata dari bisnis di Purwokerto:

**Restoran (10):** Mie Gacoan, Burger Bangor, Dikichi, Donlight, Hola Jus MOI Fresh, Kopi Kenangan, Seindonesia, Pak Doel Ahlinya Kremesan, Spesial Geprek Mbah Kakung, Wizze Mie

**Laundry (10):** Az-Zahrah, Bella Vista, Debby, K Wash Express, Laundry Express, MegaClin, Nona Clean, Washing Well, Wuz Laundry, Yuk Laundry

**Kost (5):** Ndalem AYYA, Kost Aluna Berkoh Residence, Indah Kos, Kos Dini 1, Kos Budi Kasih

---

## Build untuk Production

```bash
# Build frontend ke static files
cd frontend
npx expo export --platform web --output-dir dist

# Jalankan backend di production mode
cd backend
uvicorn server:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## Troubleshooting

**Backend gagal start — `KeyError: DATABASE_URL`**
→ Pastikan environment variable `DATABASE_URL` sudah di-set.

**Frontend tidak bisa connect ke backend**
→ Set `EXPO_PUBLIC_BACKEND_URL` ke URL backend yang benar.

**Seed data tidak muncul**
→ Jalankan `python backend/seed_real.py` dari root folder project.

**Port sudah dipakai**
→ Ganti port dengan flag `--port` di command masing-masing service.
