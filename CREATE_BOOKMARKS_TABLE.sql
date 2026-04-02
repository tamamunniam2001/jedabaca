-- Jalankan di Supabase SQL Editor

-- 1. Buat tabel bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  novel_id UUID NOT NULL REFERENCES novels(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, novel_id, chapter_id)
);

-- 2. Index untuk query cepat
CREATE INDEX IF NOT EXISTS bookmarks_user_id_idx ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS bookmarks_novel_id_idx ON bookmarks(novel_id);

-- 3. RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User dapat melihat bookmark sendiri"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "User dapat menambah bookmark"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User dapat menghapus bookmark sendiri"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);
