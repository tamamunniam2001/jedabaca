# Jeda Renung

Platform berbagi dan membaca novel online.

## Setup Lokal

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables di `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Jalankan development server:
```bash
npm run dev
```

Buka http://localhost:3000

## Setup Database Supabase

Buat tabel `novels` dengan struktur:
- `id` (UUID, primary key)
- `title` (text)
- `author` (text)
- `content` (text)
- `created_at` (timestamp)

## Deploy ke Vercel

1. Push ke GitHub
2. Buka https://vercel.com
3. Import project dari GitHub
4. Tambahkan environment variables
5. Deploy

## Struktur Folder

```
src/
├── app/
│   ├── layout.js
│   ├── page.js
│   ├── globals.css
│   └── novel/
│       └── [id]/
│           └── page.js
├── lib/
│   └── supabase.js
└── components/
```
