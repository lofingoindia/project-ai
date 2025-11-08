-- Migration: Add S3 key columns to store permanent references
-- This allows us to generate fresh signed URLs on-demand instead of storing expiring URLs

-- Add S3 key columns
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS pdf_s3_key TEXT,
ADD COLUMN IF NOT EXISTS cover_s3_key TEXT;

-- Add comments
COMMENT ON COLUMN order_items.pdf_s3_key IS 'S3 object key for the generated PDF (permanent reference)';
COMMENT ON COLUMN order_items.cover_s3_key IS 'S3 object key for the personalized cover image (permanent reference)';

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_order_items_pdf_s3_key 
ON order_items(pdf_s3_key) 
WHERE pdf_s3_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_cover_s3_key 
ON order_items(cover_s3_key) 
WHERE cover_s3_key IS NOT NULL;

-- Note: pdf_url and cover_image_url columns will now store signed URLs with expiration
-- Use the s3_key columns to generate fresh signed URLs when needed

