-- =====================================================
-- Profile Images Storage Setup
-- =====================================================
-- This script sets up Supabase Storage for profile images
-- Run this in your Supabase SQL Editor

-- 1. Create the storage bucket for profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies if they exist (for clean setup)
DROP POLICY IF EXISTS "Users can upload their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Profile images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own profile images" ON storage.objects;

-- 3. Create policy for uploading profile images
CREATE POLICY "Users can upload their own profile images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-images' AND
  (storage.foldername(name))[1] = 'avatars'
);

-- 4. Create policy for public read access to profile images
CREATE POLICY "Profile images are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-images');

-- 5. Create policy for updating profile images
CREATE POLICY "Users can update their own profile images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-images')
WITH CHECK (bucket_id = 'profile-images');

-- 6. Create policy for deleting profile images
CREATE POLICY "Users can delete their own profile images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-images');

-- =====================================================
-- App Users Table Policies
-- =====================================================
-- Ensure users can read and update their own profile data
-- Note: app_users.id is an integer, so we match by email instead

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own profile" ON app_users;
DROP POLICY IF EXISTS "Users can update their own profile" ON app_users;

-- Create policy for reading own profile (match by email)
CREATE POLICY "Users can read their own profile"
ON app_users FOR SELECT
TO authenticated
USING (email = auth.jwt()->>'email');

-- Create policy for updating own profile (match by email)
CREATE POLICY "Users can update their own profile"
ON app_users FOR UPDATE
TO authenticated
USING (email = auth.jwt()->>'email')
WITH CHECK (email = auth.jwt()->>'email');

-- =====================================================
-- Verify Setup
-- =====================================================
-- Check if bucket was created successfully
SELECT * FROM storage.buckets WHERE id = 'profile-images';

-- Check storage policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%profile%';

-- Check app_users policies
SELECT * FROM pg_policies WHERE tablename = 'app_users';
