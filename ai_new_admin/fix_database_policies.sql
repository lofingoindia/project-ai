-- Run this in your Supabase SQL editor to check and fix RLS policies

-- Check current RLS status for all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('orders', 'app_users', 'order_items', 'categories', 'books');

-- Disable RLS temporarily for admin access (if needed for debugging)
-- WARNING: Only do this for testing, re-enable RLS in production

-- For orders table
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- For app_users table  
ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;

-- For order_items table
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- For categories table
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- For books table
ALTER TABLE public.books DISABLE ROW LEVEL SECURITY;

-- OR create proper admin policies (recommended approach)
-- Create policies that allow admin access

-- Policy for orders (allow all operations for authenticated users)
CREATE POLICY "admin_orders_policy" ON public.orders
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy for app_users (allow all operations for authenticated users)
CREATE POLICY "admin_users_policy" ON public.app_users
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy for order_items (allow all operations for authenticated users)
CREATE POLICY "admin_order_items_policy" ON public.order_items
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy for categories (allow all operations for authenticated users)
CREATE POLICY "admin_categories_policy" ON public.categories
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy for books (allow all operations for authenticated users)
CREATE POLICY "admin_books_policy" ON public.books
    FOR ALL 
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Check foreign key constraints
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('orders', 'order_items')
AND tc.table_schema = 'public';