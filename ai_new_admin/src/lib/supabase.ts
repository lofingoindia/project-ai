import { createClient } from '@supabase/supabase-js';
import { queryCache } from './queryCache';
import type { Category, DashboardStats, Product } from '../types';

// Get Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '✗ Missing');
}

export const supabase = createClient(
  supabaseUrl || 'https://jspzneczpbvyclycoelb.supabase.co', 
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzcHpuZWN6cGJ2eWNseWNvZWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0ODYwMDgsImV4cCI6MjA3ODA2MjAwOH0.J3aCJEq72LqEkUB6-sa7bG2LK44RStHdxPmfUs-0ezQ',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'ai-admin-panel'
      }
    }
  }
);

// Test database connection
export const testConnection = async () => {
  try {
    console.log('🔄 Testing database connection...');
    const { error } = await supabase.from('orders').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error);
    return false;
  }
};

// Test individual table access
export const testTableAccess = async () => {
  const tables = ['orders', 'app_users', 'order_items', 'categories', 'books'];
  const results: { [key: string]: boolean } = {};
  
  for (const table of tables) {
    try {
      console.log(`🔄 Testing access to ${table}...`);
      const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.error(`❌ ${table} access failed:`, error.message);
        results[table] = false;
      } else {
        console.log(`✅ ${table} access successful`);
        results[table] = true;
      }
    } catch (error) {
      console.error(`❌ ${table} error:`, error);
      results[table] = false;
    }
  }
  
  return results;
};

// Admin-specific functions
export const adminAuth = {
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    
    return { user: data.user };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }
};

// Database functions
export const db = {
  // Dashboard stats
  getDashboardStats: async (): Promise<DashboardStats> => {
    const cacheKey = 'dashboard-stats';
    
    // Check cache first
    const cached = queryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      console.log('📊 Fetching dashboard stats with optimized queries...');
      
      // Use RPC functions or optimized queries with aggregation
      const [usersResult, ordersResult, categoriesResult, booksResult, revenueResult] = await Promise.all([
        // Count queries - only fetch counts, not data
        supabase.from('app_users').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('books').select('*', { count: 'exact', head: true }),
        // Optimized revenue calculation using Supabase aggregation
        supabase
          .from('orders')
          .select('total_amount.sum()')
          .eq('status', 'delivered')
          .single()
      ]);

      // Handle potential errors in individual queries
      const totalUsers = usersResult.error ? 0 : (usersResult.count || 0);
      const totalOrders = ordersResult.error ? 0 : (ordersResult.count || 0);
      const totalCategories = categoriesResult.error ? 0 : (categoriesResult.count || 0);
      const totalBooks = booksResult.error ? 0 : (booksResult.count || 0);
      
      // Handle revenue calculation
      let totalRevenue = 0;
      if (!revenueResult.error && revenueResult.data) {
        // If aggregation worked, use it
        totalRevenue = revenueResult.data.sum || 0;
      } else {
        // Fallback: fetch delivered orders and calculate manually (limited to recent orders)
        console.log('⚠️ Aggregation failed, using fallback revenue calculation');
        const { data: deliveredOrders } = await supabase
          .from('orders')
          .select('total_amount')
          .eq('status', 'delivered')
          .limit(1000) // Limit to prevent massive data transfer
          .order('created_at', { ascending: false });
        
        totalRevenue = (deliveredOrders || []).reduce((sum, order) => sum + (order.total_amount || 0), 0);
      }

      const stats = {
        total_users: totalUsers,
        total_books: totalBooks,
        total_orders: totalOrders,
        total_revenue: totalRevenue,
        total_categories: totalCategories
      };

      console.log('✅ Dashboard stats calculated:', stats);

      // Cache for 5 minutes (dashboard stats change less frequently)
      queryCache.set(cacheKey, stats, 5 * 60 * 1000);
      return stats;
    } catch (error) {
      console.error('❌ Error fetching dashboard stats:', error);
      // Return zero stats instead of throwing to prevent dashboard crash
      return {
        total_users: 0,
        total_books: 0,
        total_orders: 0,
        total_revenue: 0,
        total_categories: 0
      };
    }
  },

  // Users
  getUsers: async () => {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Orders - Optimized with smart query strategy and efficient fallbacks
  getOrders: async (page = 1, limit = 10, status = 'all', search = '') => {
    const cacheKey = `orders-${page}-${limit}-${status}-${search}`;
    
    // Check cache first for quick repeated requests
    const cached = queryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      console.log('📦 Fetching orders from database...');
      
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      // Strategy 1: Try simplified join first (most likely to work)
      let ordersQuery = supabase
        .from('orders')
        .select(`
          id,
          user_id,
          status,
          total_amount,
          shipping_address,
          payment_method,
          payment_status,
          created_at,
          updated_at,
          app_users!inner(id, email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (status !== 'all') {
        ordersQuery = ordersQuery.eq('status', status);
      }

      if (search) {
        ordersQuery = ordersQuery.or(`id.ilike.%${search}%,app_users.email.ilike.%${search}%,app_users.full_name.ilike.%${search}%`);
      }

      const { data: ordersData, error: ordersError, count } = await ordersQuery.range(from, to);
      
      if (ordersError) {
        console.log('⚠️ Simplified join failed, using basic query:', ordersError.message);
        
        // Strategy 2: Basic orders query with efficient batch joins
        let basicQuery = supabase
          .from('orders')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false });

        if (status !== 'all') {
          basicQuery = basicQuery.eq('status', status);
        }

        const { data: basicOrders, error: basicError, count: totalCount } = await basicQuery.range(from, to);
        
        if (basicError) {
          console.error('❌ Basic orders query failed:', basicError);
          throw basicError;
        }
        
        if (!basicOrders || basicOrders.length === 0) {
          return { data: [], count: 0 };
        }

        console.log('✅ Basic orders fetched:', basicOrders.length);
        
        // Batch fetch users and items efficiently
        const userIds = [...new Set(basicOrders.map(o => o.user_id).filter(Boolean))];
        const orderIds = basicOrders.map(o => o.id);
        
        // Fetch users in batch
        const { data: users } = await supabase
          .from('app_users')
          .select('id, full_name, email, phone')
          .in('id', userIds);
        
        // Fetch order items in batch  
        const { data: allItems } = await supabase
          .from('order_items')
          .select('order_id, id, book_id, quantity, unit_price')
          .in('order_id', orderIds);
        
        // Create lookup maps for efficient joining
        const usersMap = new Map((users || []).map(u => [u.id, u]));
        const itemsMap = new Map();
        (allItems || []).forEach(item => {
          if (!itemsMap.has(item.order_id)) {
            itemsMap.set(item.order_id, []);
          }
          itemsMap.get(item.order_id).push(item);
        });
        
        // Apply search filter on enriched data if needed
        let filteredOrders = basicOrders;
        if (search) {
          const searchLower = search.toLowerCase();
          filteredOrders = basicOrders.filter(order => {
            const user = usersMap.get(order.user_id);
            return order.id.toLowerCase().includes(searchLower) ||
                   (user?.email?.toLowerCase().includes(searchLower)) ||
                   (user?.full_name?.toLowerCase().includes(searchLower));
          });
        }
        
        // Enrich orders with user and items data
        const enrichedOrders = filteredOrders.map(order => ({
          ...order,
          user: usersMap.get(order.user_id) || {
            id: order.user_id || 'unknown',
            email: 'Unknown',
            full_name: 'Unknown User'
          },
          app_users: usersMap.get(order.user_id), // For backward compatibility
          items: itemsMap.get(order.id) || [],
          order_items: itemsMap.get(order.id) || [] // For backward compatibility
        }));

        const result = { data: enrichedOrders, count: totalCount || 0 };
        queryCache.set(cacheKey, result, 60 * 1000); // Cache for 1 minute
        return result;
      }
      
      console.log('✅ Orders fetched with simplified joins:', ordersData?.length || 0);
      
      if (!ordersData || ordersData.length === 0) {
        return { data: [], count: 0 };
      }
      
      // Get order items separately for the fetched orders
      const orderIds = ordersData.map(o => o.id);
      const { data: allItems } = await supabase
        .from('order_items')
        .select('order_id, id, book_id, quantity, unit_price')
        .in('order_id', orderIds);
      
      const itemsMap = new Map();
      (allItems || []).forEach(item => {
        if (!itemsMap.has(item.order_id)) {
          itemsMap.set(item.order_id, []);
        }
        itemsMap.get(item.order_id).push(item);
      });
      
      // Transform data to match expected format
      const enrichedOrders = ordersData.map(order => ({
        ...order,
        user: order.app_users || {
          id: order.user_id || 'unknown',
          email: 'Unknown',
          full_name: 'Unknown User'
        },
        items: itemsMap.get(order.id) || [],
        order_items: itemsMap.get(order.id) || [] // For backward compatibility
      }));

      const result = { data: enrichedOrders, count: count || 0 };
      queryCache.set(cacheKey, result, 60 * 1000); // Cache for 1 minute
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Critical error in getOrders:', error);
      throw new Error(`Failed to fetch orders: ${errorMessage}`);
    }
  },

  // Categories
  getCategories: async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Return categories with a basic subcategory count of 0 if subcategory table doesn't exist
      return (data || []).map(category => ({
        ...category,
        subcategory_count: 0 // Simple fallback - you can enhance this later
      }));

    } catch (error) {
      console.error('Error in getCategories:', error);
      // Return empty array instead of throwing to prevent app crashes
      return [];
    }
  },

  createCategory: async (category: Partial<Category>) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  updateCategory: async (id: string, category: Partial<Category>) => {
    const { data, error } = await supabase
      .from('categories')
      .update(category)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  deleteCategory: async (id: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Subcategories
  getSubcategories: async () => {
    try {
      // First try with a join
      const { data, error } = await supabase
        .from('subcategories')
        .select(`
          *,
          category:categories(id, name, name_ar)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('⚠️  Join failed for subcategories, trying simple query:', error.message);
        
        // Fallback to simple query
        const { data: simpleData, error: simpleError } = await supabase
          .from('subcategories')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (simpleError) throw simpleError;
        
        // Get categories separately if needed
        const { data: categories } = await supabase
          .from('categories')
          .select('id, name, name_ar');
          
        const categoriesMap = new Map((categories || []).map(cat => [cat.id, cat]));
        
        return (simpleData || []).map(sub => ({
          ...sub,
          category: categoriesMap.get(sub.category_id) || null
        }));
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getSubcategories:', error);
      return [];
    }
  },

  // Products (using books table) - Optimized with limits
  getProducts: async () => {
    const cacheKey = 'products-list';
    const cached = queryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const { data, error } = await supabase
      .from('books')
      .select(`
        id,
        title,
        description,
        price,
        category,
        subcategory_id,
        thumbnail_image,
        cover_image_url,
        preview_video,
        images,
        videos,
        is_active,
        stock_quantity,
        ideal_for,
        age_range,
        characters,
        genre,
        pdf_charges,
        physical_shipment_charges,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })
      .limit(200); // Limit to prevent large data loads
    
    if (error) throw error;
    
    // Map books data to Product interface
    const products = data?.map(book => ({
      id: book.id,
      title: book.title,
      description: book.description,
      price: book.price,
      category: book.category,
      category_id: book.category, // Map category to category_id for frontend
      subcategory_id: book.subcategory_id,
      image_url: book.thumbnail_image || book.cover_image_url,
      thumbnail_image: book.thumbnail_image,
      cover_image_url: book.cover_image_url,
      preview_video: book.preview_video,
      images: book.images || [],
      videos: book.videos || [],
      status: book.is_active ? 'active' : 'inactive',
      is_active: book.is_active,
      stock: book.stock_quantity,
      stock_quantity: book.stock_quantity,
      // Include new metadata fields
      ideal_for: book.ideal_for,
      age_range: book.age_range,
      characters: book.characters || [],
      genre: book.genre,
      // Include new charge fields
      pdf_charges: book.pdf_charges,
      physical_shipment_charges: book.physical_shipment_charges,
      created_at: book.created_at,
      updated_at: book.updated_at
    })) || [];

    // Cache for 5 minutes
    queryCache.set(cacheKey, products, 5 * 60 * 1000);
    return products;
  },

  createProduct: async (product: Partial<Product>) => {
    // Map product fields to books table structure (only existing columns)
    const bookData: any = {
      title: product.title,
      description: product.description || null,
      price: product.price,
      category: product.category_id || product.category || 'General',
      stock_quantity: product.stock || product.stock_quantity || 0,
      is_active: product.status === 'active' || product.is_active !== false,
      thumbnail_image: product.image_url || product.thumbnail_image || null,
      cover_image_url: product.cover_image_url || null,
      preview_video: product.preview_video || null,
      images: product.images || [],
      videos: product.videos || [],
      // Include new metadata fields
      ideal_for: product.ideal_for || null,
      age_range: product.age_range || null,
      characters: product.characters || [],
      genre: product.genre || null,
      // Include new charge fields
      pdf_charges: product.pdf_charges || null,
      physical_shipment_charges: product.physical_shipment_charges || null
    };

    // Only include subcategory_id if it exists
    if (product.subcategory_id) {
      bookData.subcategory_id = product.subcategory_id;
    }

    const { data, error } = await supabase
      .from('books')
      .insert([bookData])
      .select()
      .single();
    
    if (error) throw error;
    
    // Invalidate products cache
    queryCache.invalidate('products-');
    
    // Map response back to Product interface
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      price: data.price,
      category: data.category,
      category_id: data.category,
      subcategory_id: data.subcategory_id,
      image_url: data.thumbnail_image,
      status: data.is_active ? 'active' : 'inactive',
      stock: data.stock_quantity,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  updateProduct: async (id: string, product: Partial<Product>) => {
    // Map product fields to books table structure (only existing columns)
    const bookData: any = {};
    
    if (product.title !== undefined) bookData.title = product.title;
    if (product.description !== undefined) bookData.description = product.description;
    if (product.price !== undefined) bookData.price = product.price;
    if (product.category_id !== undefined || product.category !== undefined) {
      bookData.category = product.category_id || product.category;
    }
    if (product.subcategory_id !== undefined) bookData.subcategory_id = product.subcategory_id;
    if (product.stock !== undefined || product.stock_quantity !== undefined) {
      bookData.stock_quantity = product.stock || product.stock_quantity;
    }
    if (product.status !== undefined || product.is_active !== undefined) {
      bookData.is_active = product.status === 'active' || product.is_active !== false;
    }
    if (product.image_url !== undefined || product.thumbnail_image !== undefined) {
      bookData.thumbnail_image = product.image_url || product.thumbnail_image;
    }
    if (product.cover_image_url !== undefined) bookData.cover_image_url = product.cover_image_url;
    if (product.preview_video !== undefined) bookData.preview_video = product.preview_video;
    if (product.images !== undefined) bookData.images = product.images;
    if (product.videos !== undefined) bookData.videos = product.videos;
    // Handle new metadata fields
    if (product.ideal_for !== undefined) bookData.ideal_for = product.ideal_for;
    if (product.age_range !== undefined) bookData.age_range = product.age_range;
    if (product.characters !== undefined) bookData.characters = product.characters;
    if (product.genre !== undefined) bookData.genre = product.genre;
    // Handle new charge fields
    if (product.pdf_charges !== undefined) bookData.pdf_charges = product.pdf_charges;
    if (product.physical_shipment_charges !== undefined) bookData.physical_shipment_charges = product.physical_shipment_charges;
    
    bookData.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('books')
      .update(bookData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Invalidate products cache
    queryCache.invalidate('products-');
    
    // Map response back to Product interface
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      price: data.price,
      category: data.category,
      category_id: data.category,
      subcategory_id: data.subcategory_id,
      image_url: data.thumbnail_image,
      status: data.is_active ? 'active' : 'inactive',
      stock: data.stock_quantity,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  },

  deleteProduct: async (id: string) => {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    // Invalidate products cache
    queryCache.invalidate('products-');
  },

  // Customers - Optimized with caching
  getCustomers: async (page = 1, limit = 10, search = '') => {
    const cacheKey = `customers-${page}-${limit}-${search}`;
    
    // Check cache first
    const cached = queryCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      let query = supabase
        .from('app_users')
        .select(`
          id,
          email,
          full_name,
          phone,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;

      // Return customers with a basic order count of 0 for now
      const customersWithOrderCount = (data || []).map(customer => ({
        ...customer,
        order_count: 0 // Simple fallback - can be enhanced with actual order counts
      }));

      const result = { data: customersWithOrderCount, count: count || customersWithOrderCount.length };
      
      // Cache for 1 minute
      queryCache.set(cacheKey, result, 60 * 1000);
      return result;
    } catch (error) {
      console.error('Error in getCustomers:', error);
      // Return empty data instead of throwing to prevent app crashes
      return { data: [], count: 0 };
    }
  },

  // Delete customer
  deleteCustomer: async (customerId: string) => {
    try {
      const { error } = await supabase
        .from('app_users')
        .delete()
        .eq('id', customerId);

      if (error) throw error;
      
      // Invalidate customers cache
      queryCache.invalidate('customers');
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting customer:', error);
      throw error;
    }
  },

  // Get single order by ID with all related data
  getOrderById: async (orderId: string) => {
    try {
      console.log('📦 Fetching order details for ID:', orderId);
      
      // First try with automatic joins
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          app_users(id, email, full_name, phone),
          order_items(
            *,
            books(id, title, thumbnail_image, cover_image_url, category, price)
          )
        `)
        .eq('id', orderId)
        .single();
      
      if (orderError) {
        console.error('❌ Error with automatic joins:', orderError);
        console.log('⚠️ Falling back to manual joins...');
        
        // Fallback: Get order first, then manually join related data
        const { data: simpleOrder, error: simpleError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .single();
        
        if (simpleError) {
          console.error('❌ Failed to fetch order (fallback):', simpleError);
          throw simpleError;
        }
        
        if (!simpleOrder) {
          throw new Error('Order not found');
        }
        
        console.log('✅ Order fetched (fallback):', simpleOrder.id);
        
        // Get user data
        const { data: user } = await supabase
          .from('app_users')
          .select('id, full_name, email, phone')
          .eq('id', simpleOrder.user_id)
          .single();
        
        // Get order items with book information
        const { data: items } = await supabase
          .from('order_items')
          .select(`
            *,
            books(id, title, thumbnail_image, cover_image_url, category, price)
          `)
          .eq('order_id', simpleOrder.id);
        
        return {
          ...simpleOrder,
          user: user || {
            id: simpleOrder.user_id || 'unknown',
            email: 'Unknown',
            full_name: 'Unknown User'
          },
          items: items || [],
          app_users: user, // For backward compatibility
          order_items: items || [] // For backward compatibility
        };
      }
      
      console.log('✅ Order fetched with automatic joins:', orderData?.id);
      
      if (!orderData) {
        throw new Error('Order not found');
      }
      
      // Transform data to match expected format
      const enrichedOrder = {
        ...orderData,
        user: orderData.app_users || {
          id: orderData.user_id || 'unknown',
          email: 'Unknown',
          full_name: 'Unknown User'
        },
        items: orderData.order_items || []
      };

      return enrichedOrder;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Critical error in getOrderById:', error);
      throw new Error(`Failed to fetch order: ${errorMessage}`);
    }
  },

  // Update order status
  updateOrderStatus: async (orderId: string, newStatus: string) => {
    try {
      console.log('📝 Updating order status:', orderId, 'to', newStatus);
      
      // Validate status
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status: ${newStatus}. Must be one of: ${validStatuses.join(', ')}`);
      }
      
      const { data, error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error updating order status:', error);
        throw error;
      }
      
      console.log('✅ Order status updated successfully:', data?.id);
      
      // Invalidate orders cache to refresh the data
      queryCache.invalidate('orders');
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Critical error in updateOrderStatus:', error);
      throw new Error(`Failed to update order status: ${errorMessage}`);
    }
  },

  // AI Generation Queue
  getAiGenerationByBookIds: async (bookIds: string[]) => {
    try {
      console.log('🎨 Fetching AI generation data for book IDs:', bookIds);
      
      if (!bookIds || bookIds.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('ai_generation_queue')
        .select('*')
        .in('book_id', bookIds)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching AI generation data:', error);
        throw error;
      }
      
      console.log('✅ AI generation data fetched:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Critical error in getAiGenerationByBookIds:', error);
      throw new Error(`Failed to fetch AI generation data: ${errorMessage}`);
    }
  },

  // Cache management utilities
  clearCache: () => {
    queryCache.invalidate();
  },

  invalidateCache: (pattern: string) => {
    queryCache.invalidate(pattern);
  },

  // Pricing Settings operations
  getPricingSettings: async () => {
    const cacheKey = 'pricing-settings';
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;

    try {
      console.log('🔄 Fetching pricing settings...');
      const { data, error } = await supabase
        .from('pricing_settings')
        .select('*')
        .eq('is_active', true)
        .order('setting_type', { ascending: true });
      
      if (error) {
        console.error('❌ Error fetching pricing settings:', error.message);
        throw error;
      }
      
      console.log('✅ Pricing settings fetched successfully:', data?.length || 0, 'settings');
      queryCache.set(cacheKey, data || [], 300000); // 5 minutes cache
      return data || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Critical error in getPricingSettings:', error);
      throw new Error(`Failed to fetch pricing settings: ${errorMessage}`);
    }
  },

  updatePricingSetting: async (settingKey: string, settingValue: number, settingType: 'pdf_charge' | 'physical_shipment', description?: string) => {
    try {
      console.log('🔄 Updating pricing setting:', settingKey);
      
      // First check if setting exists
      const { data: existingData } = await supabase
        .from('pricing_settings')
        .select('id')
        .eq('setting_key', settingKey)
        .single();

      let result;
      if (existingData) {
        // Update existing setting
        result = await supabase
          .from('pricing_settings')
          .update({
            setting_value: settingValue,
            description: description,
            updated_at: new Date().toISOString(),
            updated_by: 'admin'
          })
          .eq('setting_key', settingKey)
          .select()
          .single();
      } else {
        // Insert new setting
        result = await supabase
          .from('pricing_settings')
          .insert({
            setting_key: settingKey,
            setting_value: settingValue,
            setting_type: settingType,
            description: description,
            currency: 'SYP',
            is_active: true,
            created_by: 'admin',
            updated_by: 'admin'
          })
          .select()
          .single();
      }

      if (result.error) {
        console.error('❌ Error updating pricing setting:', result.error.message);
        throw result.error;
      }

      console.log('✅ Pricing setting updated successfully:', result.data);
      
      // Invalidate cache
      queryCache.invalidate('pricing-settings');
      
      return result.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Critical error in updatePricingSetting:', error);
      throw new Error(`Failed to update pricing setting: ${errorMessage}`);
    }
  },

  createPricingSetting: async (settingKey: string, settingValue: number, settingType: 'pdf_charge' | 'physical_shipment', description?: string) => {
    try {
      console.log('🔄 Creating pricing setting:', settingKey);
      const { data, error } = await supabase
        .from('pricing_settings')
        .insert({
          setting_key: settingKey,
          setting_value: settingValue,
          setting_type: settingType,
          description: description,
          currency: 'SYP',
          is_active: true,
          created_by: 'admin',
          updated_by: 'admin'
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating pricing setting:', error.message);
        throw error;
      }

      console.log('✅ Pricing setting created successfully:', data);
      
      // Invalidate cache
      queryCache.invalidate('pricing-settings');
      
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Critical error in createPricingSetting:', error);
      throw new Error(`Failed to create pricing setting: ${errorMessage}`);
    }
  }
};

export default supabase;