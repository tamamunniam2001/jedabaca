-- Add INSERT policy untuk users table
-- Jalankan query ini di Supabase SQL Editor

-- Policy untuk users (user bisa insert profile mereka sendiri)
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy untuk users (user bisa update profile mereka sendiri)
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Jika policy sudah ada, gunakan DROP dulu:
-- DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
-- DROP POLICY IF EXISTS "Users can update their own profile" ON users;
-- Kemudian jalankan CREATE POLICY di atas
