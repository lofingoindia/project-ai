-- Migration: Add cover_image_url to order_items table
-- This stores the generated personalized cover image for each book order

ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN order_items.cover_image_url IS 'URL to the generated personalized cover image stored in Supabase Storage';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_order_items_cover_image_url ON order_items(cover_image_url) WHERE cover_image_url IS NOT NULL;

-- Update updated_at timestamp trigger if it exists
-- This ensures updated_at is automatically set when cover_image_url changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger for order_items
DROP TRIGGER IF EXISTS update_order_items_updated_at ON order_items;
CREATE TRIGGER update_order_items_updated_at
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

