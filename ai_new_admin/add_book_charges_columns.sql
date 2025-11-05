-- SQL script to add pdf_charges and physical_shipment_charges columns to books table
-- This migration adds individual product-level charges in addition to the global pricing settings

-- Add pdf_charges and physical_shipment_charges columns to books table
DO $$ 
BEGIN
  -- Add pdf_charges column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'books' AND column_name = 'pdf_charges'
  ) THEN
    ALTER TABLE books ADD COLUMN pdf_charges DECIMAL(10, 2) DEFAULT NULL;
    COMMENT ON COLUMN books.pdf_charges IS 'Individual PDF generation charges for this book (overrides global setting if set)';
  END IF;

  -- Add physical_shipment_charges column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'books' AND column_name = 'physical_shipment_charges'
  ) THEN
    ALTER TABLE books ADD COLUMN physical_shipment_charges DECIMAL(10, 2) DEFAULT NULL;
    COMMENT ON COLUMN books.physical_shipment_charges IS 'Individual physical shipment charges for this book (overrides global setting if set)';
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_books_pdf_charges ON books(pdf_charges) WHERE pdf_charges IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_books_physical_shipment_charges ON books(physical_shipment_charges) WHERE physical_shipment_charges IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE books IS 'Books catalog with individual pricing including PDF generation and physical shipment charges';