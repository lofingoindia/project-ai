-- Add pdf_url column to books table
-- This should be run in Supabase SQL Editor

ALTER TABLE books ADD COLUMN IF NOT EXISTS pdf_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN books.pdf_url IS 'URL to the PDF file stored on backend server';

-- Create index for better query performance if needed
-- CREATE INDEX IF NOT EXISTS idx_books_pdf_url ON books(pdf_url) WHERE pdf_url IS NOT NULL;