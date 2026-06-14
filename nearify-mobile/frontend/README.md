# Nearify Frontend

Aplikasi React Native + Expo untuk Nearify — Super App Mahasiswa Purwokerto.

## Menjalankan

```bash
# Install dependencies
npm install

# Web (port 5000)
npx expo start --web --port 5000

# Android
npx expo start --android

# iOS
npx expo start --ios
```

## Struktur Folder

```
app/
├── (app)/          # Tab utama: Home, Pesanan, Profil
├── food/           # Detail restoran & menu
├── kost/           # Detail kost
├── laundry/        # Detail laundry shop
└── ...             # Auth screens, search, dll

src/
├── api.ts          # Fetch wrapper + token storage
├── CartContext.tsx  # Global cart state
└── ...

assets/             # Gambar & font
```

## Konfigurasi Backend

Set environment variable sebelum start jika backend di host berbeda:

```bash
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000 npx expo start --web --port 5000
```

Atau buat file `.env`:
```
EXPO_PUBLIC_BACKEND_URL=http://localhost:8000
```

Lihat `README.md` di root project untuk panduan lengkap.
