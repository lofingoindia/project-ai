-- Fix Order Items Schema - Remove total column references and ensure correct structure
-- Run this in Supabase SQL Editor to fix the checkout issue

-- First, let's check if there are any problematic triggers or functions
DO $$
DECLARE
    trigger_rec RECORD;
    function_rec RECORD;
BEGIN
    -- Check for triggers on order_items table that might reference 'total'
    FOR trigger_rec IN 
        SELECT trigger_name, event_manipulation, action_statement 
        FROM information_schema.triggers 
        WHERE event_object_table = 'order_items'
    LOOP
        RAISE NOTICE 'Found trigger on order_items: % for %', trigger_rec.trigger_name, trigger_rec.event_manipulation;
        -- Drop problematic triggers if they exist
        IF trigger_rec.trigger_name LIKE '%total%' OR trigger_rec.action_statement LIKE '%total%' THEN
            EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_rec.trigger_name || ' ON order_items CASCADE';
            RAISE NOTICE 'Dropped problematic trigger: %', trigger_rec.trigger_name;
        END IF;
    END LOOP;
    
    -- Check for functions that might reference order_items.total
    FOR function_rec IN
        SELECT routine_name, routine_definition
        FROM information_schema.routines
        WHERE routine_definition LIKE '%order_items%total%'
    LOOP
        RAISE NOTICE 'Found function referencing order_items.total: %', function_rec.routine_name;
        -- You may want to review and drop these manually
    END LOOP;
END $$;

-- Ensure the order_items table has the correct structure
-- Drop the table if it exists with wrong structure and recreate
DO $$
BEGIN
    -- Check if total column exists and remove it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'total'
    ) THEN
        ALTER TABLE order_items DROP COLUMN total CASCADE;
        RAISE NOTICE 'Removed total column from order_items table';
    END IF;
    
    -- Ensure all required columns exist with correct types
    
    -- id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'id'
    ) THEN
        ALTER TABLE order_items ADD COLUMN id UUID PRIMARY KEY DEFAULT gen_random_uuid();
    END IF;
    
    -- order_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'order_id'
    ) THEN
        ALTER TABLE order_items ADD COLUMN order_id UUID NOT NULL;
    END IF;
    
    -- book_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'book_id'
    ) THEN
        ALTER TABLE order_items ADD COLUMN book_id INTEGER NOT NULL;
    END IF;
    
    -- quantity column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'quantity'
    ) THEN
        ALTER TABLE order_items ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;
    END IF;
    
    -- unit_price column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'unit_price'
    ) THEN
        ALTER TABLE order_items ADD COLUMN unit_price DECIMAL(10, 2) NOT NULL;
    END IF;
    
    -- personalization_data column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'personalization_data'
    ) THEN
        ALTER TABLE order_items ADD COLUMN personalization_data JSONB DEFAULT '{}'::jsonb;
    END IF;
    
    -- generation_status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'generation_status'
    ) THEN
        ALTER TABLE order_items ADD COLUMN generation_status TEXT DEFAULT 'pending';
    END IF;
    
    -- pdf_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'pdf_url'
    ) THEN
        ALTER TABLE order_items ADD COLUMN pdf_url TEXT;
    END IF;
    
    -- cover_image_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'cover_image_url'
    ) THEN
        ALTER TABLE order_items ADD COLUMN cover_image_url TEXT;
    END IF;
    
    -- pdf_s3_key column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'pdf_s3_key'
    ) THEN
        ALTER TABLE order_items ADD COLUMN pdf_s3_key TEXT;
    END IF;
    
    -- cover_s3_key column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'cover_s3_key'
    ) THEN
        ALTER TABLE order_items ADD COLUMN cover_s3_key TEXT;
    END IF;
    
    -- generated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'generated_at'
    ) THEN
        ALTER TABLE order_items ADD COLUMN generated_at TIMESTAMPTZ;
    END IF;
    
    -- generation_error column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'generation_error'
    ) THEN
        ALTER TABLE order_items ADD COLUMN generation_error TEXT;
    END IF;
    
    -- created_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE order_items ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    END IF;
    
    -- updated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'order_items' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE order_items ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    
END $$;

-- Ensure proper foreign key constraints
DO $$
BEGIN
    -- Drop existing constraints if they have wrong names/references
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'order_items_order_id_fkey' 
        AND table_name = 'order_items'
    ) THEN
        ALTER TABLE order_items DROP CONSTRAINT order_items_order_id_fkey;
    END IF;
    
    -- Add proper foreign key for order_id
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        ALTER TABLE order_items 
        ADD CONSTRAINT order_items_order_id_fkey 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;
    END IF;
    
    -- Add proper foreign key for book_id if books table exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'books' 
        AND column_name = 'id' 
        AND data_type IN ('integer', 'bigint')
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'order_items_book_id_fkey' 
            AND table_name = 'order_items'
        ) THEN
            ALTER TABLE order_items DROP CONSTRAINT order_items_book_id_fkey;
        END IF;
        
        ALTER TABLE order_items 
        ADD CONSTRAINT order_items_book_id_fkey 
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create or update indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_book_id ON order_items(book_id);
CREATE INDEX IF NOT EXISTS idx_order_items_generation_status ON order_items(generation_status);
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON order_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_pdf_s3_key ON order_items(pdf_s3_key) WHERE pdf_s3_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_cover_s3_key ON order_items(cover_s3_key) WHERE cover_s3_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_cover_image_url ON order_items(cover_image_url) WHERE cover_image_url IS NOT NULL;
