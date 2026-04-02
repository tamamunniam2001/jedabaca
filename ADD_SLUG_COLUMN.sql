-- Jalankan query ini di Supabase SQL Editor

-- 1. Tambah kolom slug
ALTER TABLE novels ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Buat index unique agar slug tidak duplikat
CREATE UNIQUE INDEX IF NOT EXISTS novels_slug_idx ON novels (slug) WHERE slug IS NOT NULL;

-- 3. (Opsional) Generate slug dari judul untuk data yang sudah ada
UPDATE novels
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL;
