-- Migration: Add book generation status fields to order_items table
-- Date: 2025-10-31
-- Description: Adds fields to track the status of personalized book generation for each order item

-- Add generation status fields to order_items table
ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS generation_status TEXT DEFAULT 'pending' CHECK (generation_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS pdf_url TEXT,
ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS generation_error TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Create an index on generation_status for faster queries
CREATE INDEX IF NOT EXISTS idx_order_items_generation_status ON order_items(generation_status);

-- Create an index on order_id and generation_status for faster order queries
CREATE INDEX IF NOT EXISTS idx_order_items_order_generation ON order_items(order_id, generation_status);

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('book_completed', 'order_update', 'system', 'promotional')),
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable Row Level Security (RLS) on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at on order_items
DROP TRIGGER IF EXISTS update_order_items_updated_at ON order_items;
CREATE TRIGGER update_order_items_updated_at
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON notifications TO authenticated;

-- Comment on columns
COMMENT ON COLUMN order_items.generation_status IS 'Status of the personalized book generation: pending, processing, completed, or failed';
COMMENT ON COLUMN order_items.pdf_url IS 'URL to the generated PDF file in storage';
COMMENT ON COLUMN order_items.generated_at IS 'Timestamp when the book generation was completed';
COMMENT ON COLUMN order_items.generation_error IS 'Error message if generation failed';
COMMENT ON COLUMN order_items.updated_at IS 'Timestamp of last update to this record';

-- Create a view for order items with generation progress
CREATE OR REPLACE VIEW order_items_with_progress AS
SELECT 
    oi.*,
    b.title as book_title,
    b.cover_image_url as book_cover,
    CASE 
        WHEN oi.generation_status = 'completed' THEN 100
        WHEN oi.generation_status = 'processing' THEN 50
        WHEN oi.generation_status = 'pending' THEN 0
        ELSE 0
    END as progress_percentage
FROM order_items oi
LEFT JOIN books b ON oi.book_id = b.id;

-- Grant access to the view
GRANT SELECT ON order_items_with_progress TO authenticated;

COMMENT ON VIEW order_items_with_progress IS 'View showing order items with their generation progress percentage';
