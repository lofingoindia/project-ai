-- WARNING: This schema is for context or debugging only and is not meant to be executed as-is.
-- Table order and constraints may not be valid for execution. Do not run directly in production.

CREATE TABLE public.admin_users (
  id integer NOT NULL DEFAULT nextval('admin_users_id_seq'::regclass),
  email character varying NOT NULL UNIQUE,
  full_name character varying NOT NULL,
  role character varying DEFAULT 'admin'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT admin_users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.app_users (
  id integer NOT NULL DEFAULT nextval('app_users_id_seq'::regclass),
  full_name character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  role character varying DEFAULT 'user'::character varying,
  is_active boolean DEFAULT true,
  phone character varying,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT app_users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.banners (
  id integer NOT NULL DEFAULT nextval('banners_id_seq'::regclass),
  title character varying NOT NULL,
  description text,
  image_url text,
  link_url text,
  is_active boolean DEFAULT true,
  start_date date,
  end_date date,
  priority integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT banners_pkey PRIMARY KEY (id)
);
CREATE TABLE public.book_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon_url text,
  sort_order integer DEFAULT 0,
  CONSTRAINT book_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.books (
  id integer NOT NULL DEFAULT nextval('books_id_seq'::regclass),
  title character varying NOT NULL,
  description text,
  price numeric NOT NULL DEFAULT 0.00,
  category character varying NOT NULL,
  stock_quantity integer DEFAULT 0,
  is_active boolean DEFAULT true,
  thumbnail_image text,
  images jsonb DEFAULT '[]'::jsonb CHECK (validate_media_array(images)),
  videos jsonb DEFAULT '[]'::jsonb CHECK (validate_media_array(videos)),
  preview_video text,
  cover_image_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  subcategory_id bigint,
  CONSTRAINT books_pkey PRIMARY KEY (id),
  CONSTRAINT books_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.subcategories(id)
);
CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  book_id uuid NOT NULL,
  quantity integer DEFAULT 1,
  personalization_data jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.categories (
  id integer NOT NULL DEFAULT nextval('categories_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  parent_id integer,
  level integer DEFAULT 0,
  path text,
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id)
);
CREATE TABLE public.order_items (
  id integer NOT NULL DEFAULT nextval('order_items_id_seq'::regclass),
  order_id integer,
  book_id integer,
  quantity integer NOT NULL DEFAULT 1,
  price numeric NOT NULL,
  total numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.books(id),
  CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id)
);
CREATE TABLE public.orders (
  id integer NOT NULL DEFAULT nextval('orders_id_seq'::regclass),
  user_id integer,
  total_amount numeric NOT NULL DEFAULT 0.00,
  status character varying DEFAULT 'pending'::character varying,
  payment_status character varying DEFAULT 'pending'::character varying,
  shipping_address jsonb,
  billing_address jsonb,
  payment_method character varying,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.app_users(id)
);
CREATE TABLE public.profiles (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text,
  email text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.shipping_addresses (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  full_name text,
  phone text,
  street text,
  city text,
  country text,
  user_id text,
  state text,
  postal_code text,
  CONSTRAINT shipping_addresses_pkey PRIMARY KEY (id)
);
CREATE TABLE public.subcategories (
  id bigint NOT NULL DEFAULT nextval('subcategories_id_seq'::regclass),
  name character varying NOT NULL,
  description text,
  category_id bigint NOT NULL,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT subcategories_pkey PRIMARY KEY (id),
  CONSTRAINT subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL,
  category character varying NOT NULL CHECK (category::text = ANY (ARRAY['General'::character varying, 'Order'::character varying, 'Payment'::character varying, 'Other'::character varying]::text[])),
  message text NOT NULL,
  status character varying DEFAULT 'open'::character varying CHECK (status::text = ANY (ARRAY['open'::character varying, 'in_progress'::character varying, 'resolved'::character varying, 'closed'::character varying]::text[])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id)
);
CREATE TABLE public.testimonials (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_name text,
  content text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  is_featured boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT testimonials_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  full_name text,
  country text,
  currency text,
  phone text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- End of context-only schema reference.

