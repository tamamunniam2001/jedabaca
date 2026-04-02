-- Disable RLS pada users table sementara untuk debugging
-- Jalankan di Supabase SQL Editor

-- Disable RLS
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Atau jika ingin drop semua policies dan buat ulang:
-- DROP POLICY IF EXISTS "Users are viewable by everyone" ON users;
-- DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
-- DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Kemudian enable RLS lagi dengan policy yang lebih permisif:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Anyone can read users" ON users
--   FOR SELECT USING (true);

-- CREATE POLICY "Anyone can insert users" ON users
--   FOR INSERT WITH CHECK (true);

-- CREATE POLICY "Users can update their own profile" ON users
--   FOR UPDATE USING (auth.uid() = id);
