# Setup Autentikasi Supabase

## 1. Setup Supabase Auth

### A. Enable Email/Password Authentication
1. Buka dashboard Supabase project Anda
2. Pergi ke **Authentication** → **Providers**
3. Cari **Email** dan pastikan sudah **Enabled**
4. Konfigurasi email settings jika diperlukan

## 2. Setup Redirect URL

### Di Supabase
1. Pergi ke **Authentication** → **URL Configuration**
2. Di **Redirect URLs**, tambahkan:
   ```
   http://localhost:3000/auth/callback
   https://yourdomain.com/auth/callback
   ```

## 3. Update Environment Variables

Di file `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Ganti `[your-project]` dengan nama project Supabase Anda, dan `your-anon-key` dengan anon key dari Supabase.

## 4. Testing

### Test Email/Password Login
1. Jalankan `npm run dev`
2. Buka http://localhost:3000/auth
3. Klik **Daftar** dan isi form dengan:
   - Nama Lengkap
   - Email
   - Password (minimal 6 karakter)
   - Konfirmasi Password
4. Klik **Daftar**
5. Verifikasi email jika diperlukan
6. Login dengan email dan password

### Test Logout
1. Setelah login, klik avatar di navbar
2. Klik **Keluar**
3. Anda akan diarahkan ke halaman login

## 5. Database Setup

Pastikan tabel `users` sudah ada dengan struktur:
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url VARCHAR(500),
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 6. Fitur yang Sudah Diimplementasikan

✅ **Login dengan Email/Password**
- Form validasi
- Error handling
- Session management
- Redirect ke home setelah login

✅ **Daftar dengan Email/Password**
- Validasi password (minimal 6 karakter)
- Konfirmasi password
- Auto-create user profile
- Success message

✅ **User Profile**
- Dropdown menu di navbar
- Tampilkan nama dan email user
- Link ke profil dan koleksi
- Logout functionality

✅ **Session Management**
- Auto-detect user session
- Real-time auth state changes
- Persistent login

## 7. Struktur Halaman Autentikasi

### `/auth` - Login/Daftar
- Toggle antara mode login dan daftar
- Form dengan validasi
- Error dan success messages
- Responsive design

### `/auth/callback` - OAuth Callback
- Handle redirect setelah login
- Auto-create user profile
- Redirect ke home

## 8. Navbar Features

### Untuk User yang Belum Login
- Tombol "Masuk" di navbar kanan

### Untuk User yang Sudah Login
- Avatar user di navbar kanan
- Dropdown menu dengan:
  - Nama dan email user
  - Link ke Profil Saya
  - Link ke Koleksi Saya
  - Tombol Keluar

## 9. Troubleshooting

### Error: "Invalid email or password"
- Pastikan email dan password sudah benar
- Cek apakah user sudah terdaftar

### Error: "User already exists"
- Email sudah terdaftar
- Gunakan email berbeda atau reset password

### Session tidak tersimpan
- Pastikan browser mengizinkan cookies
- Cek console untuk error messages
- Restart dev server

### Redirect URL error
- Pastikan redirect URL di Supabase sudah benar
- Format: `http://localhost:3000/auth/callback` untuk development
- Format: `https://yourdomain.com/auth/callback` untuk production

## 10. Next Steps

1. Implementasi protected routes dengan middleware
2. Tambah fitur "Lupa Password"
3. Implementasi email verification
4. Setup email notifications
5. Tambah role-based access control (admin, author, reader)
