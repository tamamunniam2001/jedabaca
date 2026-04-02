-- Jalankan di Supabase SQL Editor

-- Function untuk increment views novel secara atomic
CREATE OR REPLACE FUNCTION increment_novel_views(novel_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE novels SET views = COALESCE(views, 0) + 1 WHERE id = novel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function untuk increment views chapter secara atomic
CREATE OR REPLACE FUNCTION increment_chapter_views(chapter_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE chapters SET views = COALESCE(views, 0) + 1 WHERE id = chapter_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
