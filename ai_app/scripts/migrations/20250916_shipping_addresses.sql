-- Migration: create shipping_addresses table
-- Apply this in Supabase SQL editor

-- Drop existing table if it has issues
DROP TABLE IF EXISTS public.shipping_addresses;

-- Create the shipping_addresses table with correct schema
CREATE TABLE public.shipping_addresses (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  full_name TEXT,
  phone TEXT,
  street TEXT,
  city TEXT,
  country TEXT,
  user_id TEXT,
  state TEXT,
  postal_code TEXT
);

-- Enable Row Level Security
ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own shipping addresses" 
ON public.shipping_addresses
FOR SELECT 
TO authenticated 
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own shipping addresses" 
ON public.shipping_addresses
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own shipping addresses" 
ON public.shipping_addresses
FOR UPDATE 
TO authenticated 
USING (auth.uid()::text = user_id)
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own shipping addresses" 
ON public.shipping_addresses
FOR DELETE 
TO authenticated 
USING (auth.uid()::text = user_id);

-- Create an index for faster lookups
CREATE INDEX idx_shipping_addresses_user_id ON public.shipping_addresses(user_id);
