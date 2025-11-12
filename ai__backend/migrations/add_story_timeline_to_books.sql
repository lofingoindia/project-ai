-- Migration: Add story_timeline column to books table
-- This stores the story analysis/timeline so it can be reused for future orders
-- Instead of re-analyzing the book, we can just replace images using stored timeline

-- Add story_timeline column (JSONB to store complete analysis)
ALTER TABLE books
ADD COLUMN IF NOT EXISTS story_timeline JSONB DEFAULT NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_books_story_timeline ON books(id) WHERE story_timeline IS NOT NULL;

-- Add comment explaining the column
COMMENT ON COLUMN books.story_timeline IS 'Stores complete story analysis/timeline including page analysis, character mapping, and scene details. Used to skip re-analysis on subsequent orders and just replace images.';

