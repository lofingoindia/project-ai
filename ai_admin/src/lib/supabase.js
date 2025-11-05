import { createClient } from '@supabase/supabase-js'

// Get Supabase configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// Admin-specific functions
export const adminAuth = {
  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) throw error
    
    // For now, allow any authenticated user to access admin panel
    // Later you can uncomment the admin check below
    
    /* 
    // Check if user is an admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', data.user.id)
      .eq('is_active', true)
      .single()
    
    if (adminError || !adminUser) {
      await supabase.auth.signOut()
      throw new Error('Access denied. Admin privileges required.')
    }
    
    return { user: data.user, adminUser }
    */
    
    // Temporary: allow any authenticated user
    return { user: data.user, adminUser: { id: data.user.id, email: data.user.email, role: 'admin' } }
  },
  
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
  
  getCurrentUser: async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    
    // Temporary: allow any authenticated user
    return { user, adminUser: { id: user.id, email: user.email, role: 'admin' } }
    
    /* 
    // Later, uncomment this for proper admin checking
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', user.id)
      .eq('is_active', true)
      .single()
    
    return adminUser ? { user, adminUser } : null
    */
  }
}

// Database functions
export const db = {
  // Dashboard stats
  getDashboardStats: async () => {
    try {
      // Try to get from dashboard_stats view first
      const { data, error } = await supabase
        .from('dashboard_stats')
        .select('*')
        .single()
      
      if (!error && data) {
        return data
      }
      
      // If dashboard_stats doesn't exist, calculate manually
      console.log('⚠️  dashboard_stats view not found, calculating manually...')
      
      const [usersCount, booksCount, ordersCount, categoriesCount, bannersCount] = await Promise.all([
        supabase.from('app_users').select('*', { count: 'exact', head: true }),
        supabase.from('books').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('banners').select('*', { count: 'exact', head: true }).eq('is_active', true)
      ])
      
      // Calculate total revenue
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('payment_status', 'paid')
      
      const totalRevenue = orders?.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0) || 0
      
      return {
        total_users: usersCount.count || 0,
        total_books: booksCount.count || 0,
        total_orders: ordersCount.count || 0,
        total_revenue: totalRevenue,
        total_categories: categoriesCount.count || 0,
        active_banners: bannersCount.count || 0
      }
    } catch (error) {
      console.error('Error getting dashboard stats:', error)
      // Return zeros if everything fails
      return {
        total_users: 0,
        total_books: 0,
        total_orders: 0,
        total_revenue: 0,
        total_categories: 0,
        active_banners: 0
      }
    }
  },
  
  // Books
  getBooks: async (limit = 50, offset = 0) => {
    try {
      // First try with media columns
      const { data, error } = await supabase
        .from('books')
        .select('*, images, videos, thumbnail_image, preview_video')
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    } catch (error) {
      // If media columns don't exist, fallback to basic columns
      if (error.message.includes('column') && (error.message.includes('images') || error.message.includes('videos'))) {
        console.log('Media columns not found, falling back to basic book data')
        const { data, error: fallbackError } = await supabase
          .from('books')
          .select('*')
          .range(offset, offset + limit - 1)
          .order('created_at', { ascending: false })
        
        if (fallbackError) throw fallbackError
        
        // Add empty media fields for compatibility
        return data?.map(book => ({
          ...book,
          images: [],
          videos: [],
          thumbnail_image: book.cover_image_url || null,
          preview_video: null
        })) || []
      }
      throw error
    }
  },

  // Add/Update book
  addBook: async (bookData) => {
    try {
      const { data, error } = await supabase
        .from('books')
        .insert([bookData])
        .select()
      
      if (error) throw error
      return data[0]
    } catch (error) {
      // If media columns cause errors, try without them
      if (error.message.includes('column') && (error.message.includes('images') || error.message.includes('videos'))) {
        console.log('Trying to save without media columns...')
        const { images, videos, thumbnail_image, preview_video, ...basicData } = bookData
        
        const { data, error: retryError } = await supabase
          .from('books')
          .insert([basicData])
          .select()
        
        if (retryError) throw retryError
        return data[0]
      }
      throw error
    }
  },

  updateBook: async (id, bookData) => {
    try {
      const { data, error } = await supabase
        .from('books')
        .update(bookData)
        .eq('id', id)
        .select()
      
      if (error) throw error
      return data[0]
    } catch (error) {
      // If media columns cause errors, try without them
      if (error.message.includes('column') && (error.message.includes('images') || error.message.includes('videos'))) {
        console.log('Trying to update without media columns...')
        const { images, videos, thumbnail_image, preview_video, ...basicData } = bookData
        
        const { data, error: retryError } = await supabase
          .from('books')
          .update(basicData)
          .eq('id', id)
          .select()
        
        if (retryError) throw retryError
        return data[0]
      }
      throw error
    }
  },

  deleteBook: async (id) => {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Media upload functions
  uploadMedia: async (file, path) => {
    try {
      console.log('Attempting to upload file:', file.name, 'to path:', path)
      
      // Check current user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      console.log('Current user:', user ? user.email : 'Not authenticated')
      
      if (authError) {
        console.warn('Auth check error:', authError)
      }
      
      // Check if storage bucket exists by trying to list files
      const { data: bucketData, error: bucketError } = await supabase.storage
        .from('product-media')
        .list('', { limit: 1 })
      
      if (bucketError) {
        console.error('Bucket check error:', bucketError)
        throw new Error(`Storage bucket error: ${bucketError.message}`)
      }
      
      console.log('Bucket accessible, proceeding with upload...')
      
      const { data, error } = await supabase.storage
        .from('product-media')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) {
        console.error('Upload error details:', error)
        
        if (error.message.includes('duplicate')) {
          // If file exists, try with a different name
          const timestamp = Date.now()
          const newPath = path.replace(/(\.[^.]+)$/, `_${timestamp}$1`)
          console.log('File exists, trying with new name:', newPath)
          
          return await supabase.storage
            .from('product-media')
            .upload(newPath, file, {
              cacheControl: '3600',
              upsert: false
            })
        }
        
        // Provide more specific error messages
        if (error.message.includes('policy')) {
          throw new Error('Upload permission denied. Storage policies need to be configured in Supabase dashboard.')
        } else if (error.message.includes('authenticated')) {
          throw new Error('Authentication required. Please ensure you are logged in.')
        } else {
          throw new Error(`Upload failed: ${error.message}`)
        }
      }
      
      console.log('Upload successful:', data)
      return { data, error: null }
    } catch (error) {
      console.error('Media upload error:', error)
      throw error
    }
  },

  deleteMedia: async (path) => {
    try {
      const { error } = await supabase.storage
        .from('product-media')
        .remove([path])
      
      if (error) throw error
    } catch (error) {
      console.error('Media delete error:', error)
      throw error
    }
  },

  getMediaUrl: (path) => {
    try {
      return supabase.storage
        .from('product-media')
        .getPublicUrl(path).data.publicUrl
    } catch (error) {
      console.error('Error getting media URL:', error)
      return null
    }
  },
  
  // Categories
  getCategories: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
    
    if (error) throw error
    
    // Calculate count for each category
    const categoriesWithCount = await Promise.all(
      data?.map(async (category) => {
        // Try counting by category name first
        let { count } = await supabase
          .from('books')
          .select('*', { count: 'exact', head: true })
          .eq('category', category.name)
        
        // If no results, try by category_id if it exists
        if (!count || count === 0) {
          const { count: countById } = await supabase
            .from('books')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
          
          count = countById
        }
        
        return {
          ...category,
          count: count || 0
        }
      }) || []
    )
    
    return categoriesWithCount
  },

  addCategory: async (categoryData) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
    
    if (error) throw error
    return data[0]
  },

  updateCategory: async (id, categoryData) => {
    const { data, error } = await supabase
      .from('categories')
      .update(categoryData)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  deleteCategory: async (id) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Subcategories
  getSubcategories: async () => {
    const { data, error } = await supabase
      .from('subcategories')
      .select(`
        *,
        categories!inner(name, id)
      `)
      .order('sort_order', { ascending: true })
    
    if (error) throw error
    
    // Calculate count for each subcategory
    const subcategoriesWithCount = await Promise.all(
      data?.map(async (subcategory) => {
        // Count books in this subcategory
        const { count } = await supabase
          .from('books')
          .select('*', { count: 'exact', head: true })
          .eq('subcategory_id', subcategory.id)
        
        return {
          ...subcategory,
          count: count || 0,
          category_name: subcategory.categories?.name || 'Unknown'
        }
      }) || []
    )
    
    return subcategoriesWithCount
  },

  getSubcategoriesByCategory: async (categoryId) => {
    const { data, error } = await supabase
      .from('subcategories')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  addSubcategory: async (subcategoryData) => {
    const { data, error } = await supabase
      .from('subcategories')
      .insert([subcategoryData])
      .select()
    
    if (error) throw error
    return data[0]
  },

  updateSubcategory: async (id, subcategoryData) => {
    const { data, error } = await supabase
      .from('subcategories')
      .update(subcategoryData)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  deleteSubcategory: async (id) => {
    const { error } = await supabase
      .from('subcategories')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },
  
  // Users
  getAppUsers: async (limit = 50, offset = 0) => {
    const { data, error } = await supabase
      .from('app_users')
      .select('*')
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  addAppUser: async (userData) => {
    const { data, error } = await supabase
      .from('app_users')
      .insert([userData])
      .select()
    
    if (error) throw error
    return data[0]
  },

  updateAppUser: async (id, userData) => {
    const { data, error } = await supabase
      .from('app_users')
      .update(userData)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  deleteAppUser: async (id) => {
    const { error } = await supabase
      .from('app_users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },
  
  // Orders
  getOrders: async (limit = 50, offset = 0) => {
    try {
      console.log('🔍 Fetching orders from database...')
      console.log('📍 Range:', offset, 'to', offset + limit - 1)
      
      // First, try the simplest query to see if we can get orders at all
      const { data: simpleData, error: simpleError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      console.log('📊 Simple query result:', simpleData?.length || 0, 'orders')
      if (simpleData && simpleData.length > 0) {
        console.log('📦 Sample order:', simpleData[0])
      }
      
      // Now try with joins
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          app_users(id, full_name, email, phone),
          order_items(
            *,
            books(id, title, cover_image_url, thumbnail_image)
          )
        `)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('❌ Error with joins:', error)
        console.log('⚠️  Falling back to simple query with manual joins...')
        
        // Fallback: Get orders first, then get related data
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .range(offset, offset + limit - 1)
          .order('created_at', { ascending: false })
        
        if (ordersError) throw ordersError
        
        console.log('✅ Orders fetched (fallback):', ordersData?.length || 0)
        
        // Manually fetch related data
        if (ordersData && ordersData.length > 0) {
          const enrichedOrders = await Promise.all(
            ordersData.map(async (order) => {
              // Get user
              const { data: user } = await supabase
                .from('app_users')
                .select('id, full_name, email, phone')
                .eq('id', order.user_id)
                .single()
              
              // Get order items
              const { data: items } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', order.id)
              
              // Get books for items
              if (items && items.length > 0) {
                for (let item of items) {
                  const { data: book } = await supabase
                    .from('books')
                    .select('id, title, cover_image_url, thumbnail_image')
                    .eq('id', item.book_id)
                    .single()
                  item.books = book
                }
              }
              
              return {
                ...order,
                app_users: user,
                order_items: items || []
              }
            })
          )
          
          console.log('✅ Enriched orders:', enrichedOrders.length)
          return enrichedOrders
        }
        
        return ordersData
      }
      
      console.log('✅ Orders fetched successfully:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('📦 First order structure:', data[0])
      }
      return data
    } catch (error) {
      console.error('❌ Failed to fetch orders:', error)
      console.error('Error message:', error.message)
      console.error('Error details:', error)
      throw error
    }
  },
  
  // Banners
  getBanners: async () => {
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('priority', { ascending: false })
    
    if (error) throw error
    return data
  },

  addBanner: async (bannerData) => {
    const { data, error } = await supabase
      .from('banners')
      .insert([bannerData])
      .select()
    
    if (error) throw error
    return data[0]
  },

  updateBanner: async (id, bannerData) => {
    const { data, error } = await supabase
      .from('banners')
      .update(bannerData)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  deleteBanner: async (id) => {
    const { error } = await supabase
      .from('banners')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}
