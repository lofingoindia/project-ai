-- Admin Users Table Creation and Setup
-- This script creates the admin_users table and related authentication setup

-- Create admin_users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.admin_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE
    ON public.admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS policies for admin_users table
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read admin_users
CREATE POLICY "Allow authenticated users to read admin_users" ON public.admin_users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow admins to insert new admin users
CREATE POLICY "Allow admins to insert admin_users" ON public.admin_users
    FOR INSERT WITH CHECK (true); -- You may want to restrict this further

-- Policy to allow admins to update admin_users
CREATE POLICY "Allow admins to update admin_users" ON public.admin_users
    FOR UPDATE USING (true); -- You may want to restrict this further

-- Policy to allow admins to delete admin_users
CREATE POLICY "Allow admins to delete admin_users" ON public.admin_users
    FOR DELETE USING (true); -- You may want to restrict this further