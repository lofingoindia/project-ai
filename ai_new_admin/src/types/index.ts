export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  total_amount: number;
  subtotal?: number;
  shipping_cost?: number;
  discount_amount?: number;
  currency?: string;
  payment_method?: string;
  shipping_method?: string;
  shipping_address?: {
    full_name?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  applied_coupon?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  user?: AppUser;
  app_users?: AppUser; // For backward compatibility
  items?: OrderItem[];
  order_items?: OrderItem[]; // For backward compatibility
}

export interface AppUser {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  book_id: number;
  quantity: number;
  unit_price: number;
  price?: number; // For backward compatibility
  total?: number;
  personalization_data?: any;
  generation_status?: string;
  pdf_url?: string;
  generated_at?: string;
  generation_error?: string;
  created_at?: string;
  book?: Product;
  books?: Product; // For backward compatibility
}

export interface AiGenerationQueue {
  id: string;
  user_id: string;
  book_id: string;
  child_name: string;
  child_image_url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  generated_image_url?: string;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface Category {
  id: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  image_url?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  name_ar?: string;
  description?: string;
  description_ar?: string;
  image_url?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  category?: Category;
  products?: Product[];
}

export interface Product {
  id: string;
  category?: string; // books table uses category as string
  category_id?: string; // for frontend compatibility
  subcategory_id?: string;
  title: string;
  title_ar?: string;
  description?: string;
  description_ar?: string;
  author?: string;
  author_ar?: string;
  price: number;
  discount_price?: number;
  image_url?: string;
  images?: string[];
  videos?: string[];
  cover_image_url?: string; // books table field
  pdf_url?: string; // PDF file URL for this product
  status: 'active' | 'inactive' | 'out_of_stock';
  is_active?: boolean; // books table field
  featured?: boolean;
  tags?: string[];
  // New metadata fields
  ideal_for?: string; // Target audience (e.g., "Boys", "Girls", "Kids", "Everyone")
  age_range?: string; // Age range (e.g., "3-5 years old", "6-8 years old")
  characters?: string[]; // Array of character names
  genre?: string; // Book genre (e.g., "Adventure", "Fantasy", "Educational")
  // Individual product charges (override global settings if set)
  pdf_charges?: number; // PDF generation charges for this specific product
  physical_shipment_charges?: number; // Physical shipment charges for this specific product
  created_at: string;
  updated_at: string;
  category_ref?: Category; // renamed to avoid conflict
  subcategory?: Subcategory;
}

export interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  total_orders: number;
  total_spent: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_users: number;
  total_books: number;
  total_orders: number;
  total_revenue: number;
  total_categories: number;
}

export interface Language {
  code: 'en' | 'ar';
  name: string;
  direction: 'ltr' | 'rtl';
}

export interface Theme {
  mode: 'light' | 'dark';
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'file' | 'number';
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  validation?: (value: any) => string | null;
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
}

export interface PricingSettings {
  id: number;
  setting_key: string;
  setting_value: number;
  setting_type: 'pdf_charge' | 'physical_shipment';
  description?: string;
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface PricingSettingsUpdate {
  setting_key: string;
  setting_value: number;
  setting_type: 'pdf_charge' | 'physical_shipment';
  description?: string;
  currency?: string;
  updated_by?: string;
}