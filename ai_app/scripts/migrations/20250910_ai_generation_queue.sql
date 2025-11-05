-- AI Generation Queue Table and Storage Setup
-- Run this in your Supabase SQL Editor

-- Create AI generation queue table
CREATE TABLE IF NOT EXISTS public.ai_generation_queue (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    book_id text NOT NULL,
    child_name text NOT NULL,
    child_image_url text NOT NULL,
    cover_image_url text,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    generated_image_url text,
    error_message text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    UNIQUE(user_id, book_id, created_at)
);

-- Create storage bucket for generated covers
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-covers', 'generated-covers', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for ai_generation_queue
ALTER TABLE public.ai_generation_queue ENABLE ROW LEVEL SECURITY;

-- Users can insert their own generation requests
CREATE POLICY "ai_queue_insert_own" ON public.ai_generation_queue
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own generation requests
CREATE POLICY "ai_queue_select_own" ON public.ai_generation_queue
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own generation requests (for retry functionality)
CREATE POLICY "ai_queue_update_own" ON public.ai_generation_queue
    FOR UPDATE USING (auth.uid() = user_id);

-- Storage policies for generated-covers bucket
CREATE POLICY "generated_covers_select_all" ON storage.objects
    FOR SELECT USING (bucket_id = 'generated-covers');

CREATE POLICY "generated_covers_insert_authenticated" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'generated-covers' 
        AND auth.role() = 'authenticated'
    );

-- Function to clean up old generation requests (optional)
CREATE OR REPLACE FUNCTION cleanup_old_ai_generations()
RETURNS void AS $$
BEGIN
    DELETE FROM public.ai_generation_queue 
    WHERE created_at < NOW() - INTERVAL '7 days'
    AND status IN ('completed', 'failed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_ai_generation_queue_user_status 
ON public.ai_generation_queue(user_id, status, created_at DESC);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.ai_generation_queue TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_ai_generations() TO authenticated;
