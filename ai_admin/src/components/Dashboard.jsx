import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { db, supabase } from '../lib/supabase'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageSelector from './LanguageSelector'
import { 
  BarChart3, 
  Folder, 
  FolderOpen, 
  Package, 
  Users, 
  Megaphone, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Sun, 
  Moon,
  Clipboard,
  User,
  Settings,
  ShoppingCart,
  TrendingUp,
  Palette,
  Search,
  Filter,
  Grid3X3,
  List,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail
} from 'lucide-react'
import './Dashboard.css'

const Dashboard = () => {
  const { t } = useLanguage()
  const [userEmail, setUserEmail] = useState('')
  const [activeSection, setActiveSection] = useState('dashboard')
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showThemeDropdown, setShowThemeDropdown] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('') // 'add', 'edit', 'view', 'delete'
  const [selectedItem, setSelectedItem] = useState(null)
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(true)
  
  const themeDropdownRef = useRef(null)
  const [error, setError] = useState(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [schemaWarning, setSchemaWarning] = useState(false)
  
  // Real data from Supabase
  const [dashboardStats, setDashboardStats] = useState({
    total_users: 0,
    total_books: 0,
    total_orders: 0,
    total_revenue: 0,
    total_categories: 0,
    active_banners: 0
  })
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [products, setProducts] = useState([])
  const [users, setUsers] = useState([])
  const [banners, setBanners] = useState([])
  const [orders, setOrders] = useState([])
  const [orderPage, setOrderPage] = useState(1)
  const [ordersPerPage] = useState(10)
  const [orderStatusFilter, setOrderStatusFilter] = useState('all')
  const [orderSearchQuery, setOrderSearchQuery] = useState('')
  const [loadingOrders, setLoadingOrders] = useState(false)

  const [customers, setCustomers] = useState([])
  const [customerPage, setCustomerPage] = useState(1)
  const [customersPerPage] = useState(10)
  const [customerStatusFilter, setCustomerStatusFilter] = useState('all')
  const [customerSearchQuery, setCustomerSearchQuery] = useState('')
  const [loadingCustomers, setLoadingCustomers] = useState(false)

  // Products filter and view states
  const [productSearchQuery, setProductSearchQuery] = useState('')
  const [productCategoryFilter, setProductCategoryFilter] = useState('all')
  const [productStatusFilter, setProductStatusFilter] = useState('all')
  const [productsViewMode, setProductsViewMode] = useState('grid') // 'grid' or 'list'

  // Categories filter and view states
  const [categorySearchQuery, setCategorySearchQuery] = useState('')
  const [categoryStatusFilter, setCategoryStatusFilter] = useState('all')
  const [categoriesViewMode, setCategoriesViewMode] = useState('grid') // 'grid' or 'list'
  const [categoryPage, setCategoryPage] = useState(1)
  const [categoriesPerPage] = useState(12)

  // Subcategories filter and view states
  const [subcategorySearchQuery, setSubcategorySearchQuery] = useState('')
  const [subcategoryCategoryFilter, setSubcategoryCategoryFilter] = useState('all')
  const [subcategoriesViewMode, setSubcategoriesViewMode] = useState('grid') // 'grid' or 'list'
  const [subcategoryPage, setSubcategoryPage] = useState(1)
  const [subcategoriesPerPage] = useState(12)

  const navigate = useNavigate()

  useEffect(() => {
    // Check if user is authenticated
    const isAuthenticated = localStorage.getItem('isAuthenticated')
    const email = localStorage.getItem('userEmail')
    
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    
    setUserEmail(email)

    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.body.classList.add('dark-mode')
    }

    // Load data from Supabase
    loadData()
  }, [navigate])

  // Effect hooks for orders and customers
  useEffect(() => {
    loadOrders()
  }, [orderPage, orderStatusFilter, orderSearchQuery])

  useEffect(() => {
    loadCustomers()
  }, [customerPage, customerStatusFilter, customerSearchQuery])

  // Click outside detection for theme dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target)) {
        setShowThemeDropdown(false)
      }
    }

    if (showThemeDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showThemeDropdown])

  const loadOrders = async () => {
    try {
      setLoadingOrders(true)
      
      console.log('🔍 Loading orders...')
      
      // Use the db.getOrders() function which has the correct query
      const data = await db.getOrders(ordersPerPage, (orderPage - 1) * ordersPerPage)
      
      console.log('📦 Raw orders data:', data)
      console.log('📊 Total orders found:', data?.length || 0)
      
      // Apply filters on the client side
      let filteredOrders = data || []
      
      if (orderStatusFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => order.status === orderStatusFilter)
      }

      if (orderSearchQuery) {
        const searchLower = orderSearchQuery.toLowerCase()
        filteredOrders = filteredOrders.filter(order => 
          order.order_number?.toLowerCase().includes(searchLower) ||
          order.app_users?.full_name?.toLowerCase().includes(searchLower) ||
          order.app_users?.email?.toLowerCase().includes(searchLower)
        )
      }
      
      console.log('✅ Filtered orders:', filteredOrders?.length || 0)
      setOrders(filteredOrders)
    } catch (error) {
      console.error('❌ Error loading orders:', error)
      console.error('Error details:', error.message)
      toast.error(`Failed to load orders: ${error.message}`)
      setOrders([])
    } finally {
      setLoadingOrders(false)
    }
  }

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true)
      
      // Use app_users table instead of customers
      let query = supabase
        .from('app_users')
        .select('*')
        .range((customerPage - 1) * customersPerPage, customerPage * customersPerPage - 1)
        .order('created_at', { ascending: false })

      if (customerStatusFilter !== 'all') {
        const isActive = customerStatusFilter === 'active'
        query = query.eq('is_active', isActive)
      }

      if (customerSearchQuery) {
        query = query.or(`full_name.ilike.%${customerSearchQuery}%,email.ilike.%${customerSearchQuery}%`)
      }

      const { data, error } = await query
      
      if (error) throw error
      
      // Map to customer format
      setCustomers((data || []).map(user => ({
        id: user.id,
        first_name: user.full_name?.split(' ')[0] || '',
        last_name: user.full_name?.split(' ').slice(1).join(' ') || '',
        email: user.email,
        status: user.is_active ? 'active' : 'inactive',
        created_at: user.created_at
      })))
    } catch (error) {
      console.error('Error loading customers:', error)
      toast.error('Failed to load customers')
      setCustomers([])
    } finally {
      setLoadingCustomers(false)
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Load dashboard stats
      try {
        const stats = await db.getDashboardStats()
        setDashboardStats(stats)
      } catch (err) {
        console.log('Dashboard stats not available yet:', err.message)
      }

      // Load categories
      try {
        const categoriesData = await db.getCategories()
        setCategories(categoriesData?.map(category => ({
          ...category,
          count: category.count || 0 // Fallback if count is not available
        })) || [])
      } catch (err) {
        console.log('Categories not available yet:', err.message)
      }

      // Load subcategories
      try {
        const subcategoriesData = await db.getSubcategories()
        setSubcategories(subcategoriesData?.map(subcategory => ({
          ...subcategory,
          count: subcategory.count || 0 // Fallback if count is not available
        })) || [])
      } catch (err) {
        console.log('Subcategories not available yet:', err.message)
      }

      // Load books/products
      try {
        const booksData = await db.getBooks()
        setProducts(booksData?.map(book => ({
          id: book.id,
          name: book.title,
          description: book.description || '',
          price: book.price,
          category: book.category,
          status: book.is_active ? 'active' : 'inactive',
          stock: book.stock_quantity || 0,
          thumbnail_image: book.thumbnail_image || '',
          images: book.images || [],
          videos: book.videos || [],
          preview_video: book.preview_video || '',
          ideal_for: book.ideal_for || '',
          age_range: book.age_range || '',
          characters: book.characters || [],
          genre: book.genre || ''
        })) || [])
      } catch (err) {
        console.log('Books not available yet:', err.message)
        // If error is about missing columns, show helpful message
        if (err.message.includes('column') && err.message.includes('does not exist')) {
          setSchemaWarning(true)
          setError('Database schema needs to be updated. Please run the database migration script in Supabase.')
        }
      }

      // Load app users
      try {
        const usersData = await db.getAppUsers()
        setUsers(usersData?.map(user => ({
          id: user.id,
          name: user.full_name || 'N/A',
          email: user.email,
          role: 'user',
          status: user.is_active ? 'active' : 'inactive',
          joinDate: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : 'N/A'
        })) || [])
      } catch (err) {
        console.log('Users not available yet:', err.message)
      }

      // Load banners
      try {
        const bannersData = await db.getBanners()
        setBanners(bannersData?.map(banner => ({
          id: banner.id,
          title: banner.title,
          description: banner.description,
          status: banner.is_active ? 'active' : 'inactive',
          startDate: banner.start_date ? new Date(banner.start_date).toISOString().split('T')[0] : 'N/A',
          endDate: banner.end_date ? new Date(banner.end_date).toISOString().split('T')[0] : 'N/A'
        })) || [])
      } catch (err) {
        console.log('Banners not available yet:', err.message)
      }

      // Load initial orders
      try {
        await loadOrders()
      } catch (err) {
        console.log('Orders not available yet:', err.message)
      }

      // Load initial customers
      try {
        await loadCustomers()
      } catch (err) {
        console.log('Customers not available yet:', err.message)
      }

    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data. Please check your Supabase configuration.')
    } finally {
      setLoading(false)
    }
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    if (!isDarkMode) {
      document.body.classList.add('dark-mode')
      localStorage.setItem('theme', 'dark')
    } else {
      document.body.classList.remove('dark-mode')
      localStorage.setItem('theme', 'light')
    }
    setShowThemeDropdown(false)
  }

  const handleThemeSelect = (theme) => {
    if (theme === 'light') {
      setIsDarkMode(false)
      document.body.classList.remove('dark-mode')
      localStorage.setItem('theme', 'light')
    } else {
      setIsDarkMode(true)
      document.body.classList.add('dark-mode')
      localStorage.setItem('theme', 'dark')
    }
    setShowThemeDropdown(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated')
    localStorage.removeItem('userEmail')
    navigate('/login')
  }

  // Navigation functions for order and customer details
  const navigateToOrderDetails = (orderId) => {
    navigate(`/orders/${orderId}`)
  }

  const navigateToCustomerDetails = (customerId) => {
    // For now, we'll just show an alert since we don't have separate detail pages
    // In a real application, you would navigate to a detailed customer page
    alert(`Navigating to customer details for Customer ID: ${customerId}`)
    // navigate(`/customers/${customerId}`)
  }

  const sidebarItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: BarChart3 },
    { id: 'orders', label: t('nav.orders'), icon: ShoppingCart },
    { id: 'customers', label: t('nav.customers'), icon: Users },
    { id: 'categories', label: t('nav.categories'), icon: Folder },
    { id: 'subcategories', label: t('nav.subcategories'), icon: FolderOpen },
    { id: 'products', label: t('nav.products'), icon: Package },
    { id: 'users', label: t('nav.users'), icon: Users },
    { id: 'banners', label: t('nav.banners'), icon: Megaphone }
  ]

  const openModal = (type, item = null) => {
    setModalType(type)
    setSelectedItem(item)
    
    // Initialize form data based on modal type and item
    if (type === 'add') {
      setFormData({})
    } else if (type === 'edit' && item) {
      // Pre-populate form data for editing
      if (item.type === 'category') {
        setFormData({
          name: item.name || '',
          description: item.description || ''
        })
      } else if (item.type === 'subcategory') {
        setFormData({
          name: item.name || '',
          description: item.description || '',
          category_id: item.category_id || '',
          category_name: item.category_name || ''
        })
      } else if (item.type === 'product') {
        setFormData({
          name: item.name || '',
          description: item.description || '',
          price: item.price || '',
          category: item.category || '',
          subcategory_id: item.subcategory_id || '',
          stock: item.stock || '',
          status: item.status || 'active',
          thumbnail_image: item.thumbnail_image || '',
          images: item.images || [],
          videos: item.videos || [],
          preview_video: item.preview_video || '',
          ideal_for: item.ideal_for || '',
          age_range: item.age_range || '',
          characters: item.characters || [],
          genre: item.genre || ''
        })
      } else if (item.type === 'user') {
        setFormData({
          name: item.name || '',
          email: item.email || '',
          role: item.role || 'user',
          status: item.status || 'active'
        })
      } else if (item.type === 'banner') {
        setFormData({
          title: item.title || '',
          description: item.description || '',
          startDate: item.startDate || '',
          endDate: item.endDate || '',
          status: item.status || 'active'
        })
      }
    }
    
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setModalType('')
    setSelectedItem(null)
    setFormData({})
  }

  const handleDelete = async (type, id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        if (type === 'category') {
          await db.deleteCategory(id)
          setCategories(categories.filter(cat => cat.id !== id))
        } else if (type === 'subcategory') {
          await db.deleteSubcategory(id)
          setSubcategories(subcategories.filter(subcat => subcat.id !== id))
        } else if (type === 'product') {
          await db.deleteBook(id)
          setProducts(products.filter(prod => prod.id !== id))
        } else if (type === 'user') {
          await db.deleteAppUser(id)
          setUsers(users.filter(user => user.id !== id))
        } else if (type === 'banner') {
          await db.deleteBanner(id)
          setBanners(banners.filter(banner => banner.id !== id))
        }
        closeModal()
        // Reload data to ensure consistency
        await loadData()
      } catch (error) {
        console.error('Delete failed:', error)
        alert('Failed to delete item. Please try again.')
      }
    }
  }

  // Form input handler
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Media handling functions
  const handleFileUpload = async (event, mediaType) => {
    const files = Array.from(event.target.files)
    if (!files.length) return

    setUploadingMedia(true)
    try {
      const uploadedUrls = []
      
      for (const file of files) {
        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 50MB.`)
          continue
        }

        // Validate file type
        const isImage = file.type.startsWith('image/')
        const isVideo = file.type.startsWith('video/')
        
        if (mediaType.includes('image') && !isImage) {
          alert(`File ${file.name} is not a valid image format.`)
          continue
        }
        
        if (mediaType.includes('video') && !isVideo) {
          alert(`File ${file.name} is not a valid video format.`)
          continue
        }
        
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
        const filePath = `products/${selectedItem?.id || 'new'}/${fileName}`
        
        try {
          const { data, error } = await db.uploadMedia(file, filePath)
          if (error) throw error
          
          const publicUrl = db.getMediaUrl(data.path)
          uploadedUrls.push(publicUrl)
        } catch (uploadError) {
          console.error('Upload error for file:', file.name, uploadError)
          
          // Handle specific upload errors
          if (uploadError.message.includes('storage bucket')) {
            alert('Storage bucket not found. Please ensure the "product-media" bucket exists in Supabase Storage.')
          } else if (uploadError.message.includes('policy')) {
            alert('Upload permission denied. Please check Supabase storage policies.')
          } else {
            alert(`Failed to upload ${file.name}. Error: ${uploadError.message}`)
          }
          continue
        }
      }

      if (uploadedUrls.length === 0) {
        setUploadingMedia(false)
        return
      }

      // Update formData based on media type
      if (mediaType === 'thumbnail_image' || mediaType === 'preview_video') {
        handleInputChange(mediaType, uploadedUrls[0])
      } else {
        // For images and videos arrays
        const currentMedia = formData[mediaType] || []
        handleInputChange(mediaType, [...currentMedia, ...uploadedUrls])
      }
      
      if (uploadedUrls.length > 0) {
        alert(`Successfully uploaded ${uploadedUrls.length} file(s)`)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      
      // Provide specific error messages
      if (error.message.includes('bucket')) {
        alert('Storage bucket configuration error. Please ensure the "product-media" bucket exists and is properly configured in Supabase.')
      } else if (error.message.includes('authentication')) {
        alert('Authentication error. Please login again.')
      } else {
        alert(`Failed to upload media. Error: ${error.message}`)
      }
    } finally {
      setUploadingMedia(false)
    }
  }

  const removeMedia = (mediaType, index) => {
    if (formData[mediaType] && Array.isArray(formData[mediaType])) {
      const updatedMedia = formData[mediaType].filter((_, i) => i !== index)
      handleInputChange(mediaType, updatedMedia)
    }
  }

  // Save functions for different types
  const handleSave = async () => {
    try {
      if (!selectedItem?.type) return
      
      const { type } = selectedItem
      
      // Show loading state
      setUploadingMedia(true)
      
      if (modalType === 'add') {
        if (type === 'category') {
          if (!formData.name?.trim()) {
            alert('Please enter a category name')
            setUploadingMedia(false)
            return
          }
          await db.addCategory({
            name: formData.name.trim(),
            description: formData.description?.trim() || '',
            is_active: true,
            sort_order: categories.length + 1
          })
        } else if (type === 'subcategory') {
          if (!formData.name?.trim() || !formData.category_id) {
            alert('Please enter subcategory name and select a category')
            setUploadingMedia(false)
            return
          }
          await db.addSubcategory({
            name: formData.name.trim(),
            description: formData.description?.trim() || '',
            category_id: parseInt(formData.category_id),
            is_active: true,
            sort_order: subcategories.filter(s => s.category_id === parseInt(formData.category_id)).length + 1
          })
        } else if (type === 'product') {
          if (!formData.name?.trim() || !formData.price || !formData.category) {
            alert('Please fill in all required fields (name, price, category)')
            setUploadingMedia(false)
            return
          }
          
          // Find the category ID from the category name
          const selectedCategory = categories.find(cat => cat.name === formData.category)
          
          // Prepare book data with fallback for missing schema columns
          const bookData = {
            title: formData.name.trim(),
            description: formData.description?.trim() || '',
            price: parseFloat(formData.price) || 0,
            category: formData.category,
            category_id: selectedCategory?.id || null,
            subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : null,
            stock_quantity: parseInt(formData.stock) || 0,
            is_active: formData.status === 'active',
            ideal_for: formData.ideal_for?.trim() || null,
            age_range: formData.age_range?.trim() || null,
            characters: formData.characters || [],
            genre: formData.genre?.trim() || null
          }
          
          // Only add media fields if they exist (to handle schema migration)
          try {
            bookData.thumbnail_image = formData.thumbnail_image || null
            bookData.images = formData.images || []
            bookData.videos = formData.videos || []
            bookData.preview_video = formData.preview_video || null
          } catch (e) {
            console.log('Media fields not available in schema yet')
          }
          
          await db.addBook(bookData)
        } else if (type === 'user') {
          if (!formData.name?.trim() || !formData.email?.trim()) {
            alert('Please enter both name and email')
            setUploadingMedia(false)
            return
          }
          await db.addAppUser({
            full_name: formData.name.trim(),
            email: formData.email.trim(),
            role: formData.role || 'user',
            is_active: formData.status === 'active'
          })
        } else if (type === 'banner') {
          if (!formData.title?.trim()) {
            alert('Please enter a banner title')
            setUploadingMedia(false)
            return
          }
          await db.addBanner({
            title: formData.title.trim(),
            description: formData.description?.trim() || '',
            start_date: formData.startDate || null,
            end_date: formData.endDate || null,
            is_active: formData.status === 'active',
            priority: banners.length + 1
          })
        }
      } else if (modalType === 'edit') {
        if (type === 'category') {
          if (!formData.name?.trim()) {
            alert('Please enter a category name')
            setUploadingMedia(false)
            return
          }
          await db.updateCategory(selectedItem.id, {
            name: formData.name.trim(),
            description: formData.description?.trim() || ''
          })
        } else if (type === 'subcategory') {
          if (!formData.name?.trim()) {
            alert('Please enter a subcategory name')
            setUploadingMedia(false)
            return
          }
          await db.updateSubcategory(selectedItem.id, {
            name: formData.name.trim(),
            description: formData.description?.trim() || ''
          })
        } else if (type === 'product') {
          if (!formData.name?.trim() || !formData.price || !formData.category) {
            alert('Please fill in all required fields (name, price, category)')
            setUploadingMedia(false)
            return
          }
          
          // Find the category ID from the category name
          const selectedCategory = categories.find(cat => cat.name === formData.category)
          
          // Prepare book data with fallback for missing schema columns
          const bookData = {
            title: formData.name.trim(),
            description: formData.description?.trim() || '',
            price: parseFloat(formData.price) || 0,
            category: formData.category,
            category_id: selectedCategory?.id || null,
            subcategory_id: formData.subcategory_id ? parseInt(formData.subcategory_id) : null,
            stock_quantity: parseInt(formData.stock) || 0,
            is_active: formData.status === 'active',
            ideal_for: formData.ideal_for?.trim() || null,
            age_range: formData.age_range?.trim() || null,
            characters: formData.characters || [],
            genre: formData.genre?.trim() || null
          }
          
          // Only add media fields if they exist (to handle schema migration)
          try {
            bookData.thumbnail_image = formData.thumbnail_image || null
            bookData.images = formData.images || []
            bookData.videos = formData.videos || []
            bookData.preview_video = formData.preview_video || null
          } catch (e) {
            console.log('Media fields not available in schema yet')
          }
          
          await db.updateBook(selectedItem.id, bookData)
        } else if (type === 'user') {
          if (!formData.name?.trim() || !formData.email?.trim()) {
            alert('Please enter both name and email')
            setUploadingMedia(false)
            return
          }
          await db.updateAppUser(selectedItem.id, {
            full_name: formData.name.trim(),
            email: formData.email.trim(),
            role: formData.role || 'user',
            is_active: formData.status === 'active'
          })
        } else if (type === 'banner') {
          if (!formData.title?.trim()) {
            alert('Please enter a banner title')
            setUploadingMedia(false)
            return
          }
          await db.updateBanner(selectedItem.id, {
            title: formData.title.trim(),
            description: formData.description?.trim() || '',
            start_date: formData.startDate || null,
            end_date: formData.endDate || null,
            is_active: formData.status === 'active'
          })
        }
      }
      
      // Reload data after successful save
      await loadData()
      closeModal()
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} ${modalType === 'add' ? 'added' : 'updated'} successfully!`)
    } catch (error) {
      console.error('Save failed:', error)
      
      // Provide specific error messages based on error type
      let errorMessage = `Failed to ${modalType} ${selectedItem?.type}.`
      
      if (error.message.includes('column') && (error.message.includes('images') || error.message.includes('videos'))) {
        errorMessage = 'Database schema needs to be updated with media columns. Please run the database migration script in Supabase SQL editor. For now, the product was saved without media fields.'
      } else if (error.message.includes('schema cache')) {
        errorMessage = 'Database schema is outdated. Please run the database migration script in Supabase to add media support.'
      } else if (error.message.includes('foreign key')) {
        errorMessage = 'Invalid category selected. Please choose a valid category.'
      } else if (error.message.includes('duplicate')) {
        errorMessage = 'A record with this name already exists. Please use a different name.'
      } else if (error.message.includes('permission')) {
        errorMessage = 'Permission denied. Please check your access rights.'
      } else {
        errorMessage += ` Error: ${error.message}`
      }
      
      alert(errorMessage)
    } finally {
      setUploadingMedia(false)
    }
  }

  // Filter products based on current filter states
  const getFilteredProducts = () => {
    return products.filter(product => {
      // Search filter
      const matchesSearch = productSearchQuery === '' || 
        product.name.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(productSearchQuery.toLowerCase()))

      // Category filter
      const matchesCategory = productCategoryFilter === 'all' || 
        product.category === productCategoryFilter

      // Status filter
      const matchesStatus = productStatusFilter === 'all' || 
        product.status === productStatusFilter

      return matchesSearch && matchesCategory && matchesStatus
    })
  }

  const getFilteredCategories = () => {
    return categories.filter(category => {
      // Search filter
      const matchesSearch = categorySearchQuery === '' || 
        category.name.toLowerCase().includes(categorySearchQuery.toLowerCase()) ||
        (category.description && category.description.toLowerCase().includes(categorySearchQuery.toLowerCase()))

      // Status filter (you can add status to categories if needed)
      const matchesStatus = categoryStatusFilter === 'all' || 
        (category.status && category.status === categoryStatusFilter)

      return matchesSearch && matchesStatus
    })
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'orders':
        return (
          <div className="orders-page">
            {/* Orders Control Bar */}
            <div className="orders-control-bar">
              <div className="orders-controls-left">
                <div className="orders-search-container">
                  <div className="search-input-wrapper">
                    <Search size={18} className="search-input-icon" />
                    <input
                      type="text"
                      placeholder="Search orders by number, customer name, or email..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="orders-search-input"
                    />
                  </div>
                </div>
                
                <div className="orders-filter-container">
                  <select 
                    value={orderStatusFilter} 
                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                    className="orders-filter-select"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="orders-controls-right">
                <div className="orders-view-options">
                  <button className="orders-view-btn active">
                    <List size={16} />
                    <span>List View</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Orders Content */}
            <div className="orders-content">
              {loadingOrders ? (
                <div className="orders-loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="orders-empty-state">
                  <div className="empty-state-illustration">
                    <ShoppingCart size={64} />
                  </div>
                  <h3 className="empty-state-title">No orders found</h3>
                  <p className="empty-state-description">
                    When customers start placing orders, they'll appear here
                  </p>
                </div>
              ) : (
                <>
                  {/* Orders List */}
                  <div className="orders-list">
                    <div className="orders-list-header">
                      <div className="order-column order-column-number">Order</div>
                      <div className="order-column order-column-customer">Customer</div>
                      <div className="order-column order-column-date">Date</div>
                      <div className="order-column order-column-amount">Total</div>
                      <div className="order-column order-column-status">Status</div>
                      <div className="order-column order-column-payment">Payment</div>
                      <div className="order-column order-column-actions">Actions</div>
                    </div>

                    <div className="orders-list-body">
                      {orders.map((order) => (
                        <div key={order.id} className="order-row">
                          <div className="order-cell order-cell-number">
                            <div className="order-number-wrapper">
                              <span className="order-number-hash">#</span>
                              <span className="order-number">{order.order_number}</span>
                            </div>
                          </div>

                          <div className="order-cell order-cell-customer">
                            <div className="customer-profile">
                              <div className="customer-avatar">
                                <span className="customer-initials">
                                  {(order.app_users?.full_name?.[0] || 'U')}
                                </span>
                              </div>
                              <div className="customer-details">
                                <div className="customer-name">
                                  {order.app_users?.full_name || 'Unknown User'}
                                </div>
                                <div className="customer-email">
                                  {order.app_users?.email || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="order-cell order-cell-date">
                            <div className="order-date-wrapper">
                              <div className="order-date">
                                {new Date(order.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="order-time">
                                {new Date(order.created_at).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="order-cell order-cell-amount">
                            <div className="order-amount">
                              <span className="amount-currency">$</span>
                              <span className="amount-value">{order.total_amount}</span>
                            </div>
                          </div>

                          <div className="order-cell order-cell-status">
                            <div className={`order-status-badge status-${order.status}`}>
                              <div className={`status-indicator status-indicator-${order.status}`}></div>
                              <span className="status-text">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                            </div>
                          </div>

                          <div className="order-cell order-cell-payment">
                            <div className={`payment-status-badge payment-${order.payment_status}`}>
                              <span className="payment-text">{order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}</span>
                            </div>
                          </div>

                          <div className="order-cell order-cell-actions">
                            <div className="order-actions">
                              <button
                                className="order-action-btn order-action-view"
                                onClick={() => navigateToOrderDetails(order.id)}
                                title="View order details"
                              >
                                <Eye size={16} />
                                <span>View</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Orders Pagination */}
                  <div className="orders-pagination">
                    <div className="pagination-info">
                      <span className="pagination-text">
                        Showing {orders.length} of {orders.length} orders
                      </span>
                    </div>
                    
                    <div className="pagination-controls">
                      <button 
                        className="pagination-btn pagination-prev"
                        onClick={() => setOrderPage(prev => Math.max(1, prev - 1))}
                        disabled={orderPage === 1}
                      >
                        <ChevronLeft size={16} />
                        <span>Previous</span>
                      </button>
                      
                      <div className="pagination-pages">
                        <button className="pagination-page active">
                          {orderPage}
                        </button>
                      </div>
                      
                      <button 
                        className="pagination-btn pagination-next"
                        onClick={() => setOrderPage(prev => prev + 1)}
                        disabled={orders.length < ordersPerPage}
                      >
                        <span>Next</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )

      case 'customers':
        return (
          <div className="customers-page">
            {/* Customers Control Bar */}
            <div className="customers-control-bar">
              <div className="customers-controls-left">
                <div className="customers-search-container">
                  <div className="search-input-wrapper">
                    <Search size={18} className="search-input-icon" />
                    <input
                      type="text"
                      placeholder="Search customers by name, email, or phone..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="customers-search-input"
                    />
                  </div>
                </div>
                
                <div className="customers-filter-container">
                  <select 
                    value={customerStatusFilter} 
                    onChange={(e) => setCustomerStatusFilter(e.target.value)}
                    className="customers-filter-select"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="blocked">Blocked</option>
                  </select>
                </div>
              </div>

              <div className="customers-controls-right">
                <div className="customers-view-options">
                  <button className="customers-view-btn active">
                    <List size={16} />
                    <span>List View</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Customers Content */}
            <div className="customers-content">
              {loadingCustomers ? (
                <div className="customers-loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading customers...</p>
                </div>
              ) : customers.length === 0 ? (
                <div className="customers-empty-state">
                  <div className="empty-state-illustration">
                    <Users size={64} />
                  </div>
                  <h3 className="empty-state-title">No customers found</h3>
                  <p className="empty-state-description">
                    When users register and start shopping, they'll appear here
                  </p>
                </div>
              ) : (
                <>
                  {/* Customers List */}
                  <div className="customers-list">
                    <div className="customers-list-header">
                      <div className="customer-column customer-column-info">Customer</div>
                      <div className="customer-column customer-column-contact">Contact Info</div>
                      <div className="customer-column customer-column-joined">Joined Date</div>
                      <div className="customer-column customer-column-orders">Orders</div>
                      <div className="customer-column customer-column-spent">Total Spent</div>
                      <div className="customer-column customer-column-status">Status</div>
                      <div className="customer-column customer-column-actions">Actions</div>
                    </div>

                    <div className="customers-list-body">
                      {customers.map((customer) => (
                        <div key={customer.id} className="customer-row">
                          <div className="customer-cell customer-cell-info">
                            <div className="customer-profile">
                              <div className="customer-avatar">
                                <span className="customer-initials">
                                  {(customer.first_name?.[0] || '') + (customer.last_name?.[0] || '')}
                                </span>
                              </div>
                              <div className="customer-details">
                                <div className="customer-name">
                                  {customer.first_name} {customer.last_name}
                                </div>
                                <div className="customer-email">
                                  {customer.email}
                                </div>
                                <div className="customer-id">
                                  ID: #{customer.id}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="customer-cell customer-cell-contact">
                            <div className="contact-info">
                              <div className="contact-phone">
                                <Phone size={14} />
                                <span>{customer.phone || 'No phone'}</span>
                              </div>
                              <div className="contact-email">
                                <Mail size={14} />
                                <span>{customer.email}</span>
                              </div>
                            </div>
                          </div>

                          <div className="customer-cell customer-cell-joined">
                            <div className="joined-info">
                              <div className="joined-date">
                                {new Date(customer.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="joined-time">
                                {new Date(customer.created_at).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>

                          <div className="customer-cell customer-cell-orders">
                            <div className="orders-summary">
                              <div className="orders-count">
                                <ShoppingCart size={14} />
                                <span className="orders-number">{customer.total_orders || 0}</span>
                              </div>
                              <div className="orders-label">
                                {customer.total_orders === 1 ? 'Order' : 'Orders'}
                              </div>
                            </div>
                          </div>

                          <div className="customer-cell customer-cell-spent">
                            <div className="spent-amount">
                              <span className="currency-symbol">$</span>
                              <span className="amount-value">{customer.total_spent || '0.00'}</span>
                            </div>
                          </div>

                          <div className="customer-cell customer-cell-status">
                            <div className={`customer-status-badge status-${customer.status || 'active'}`}>
                              <div className={`status-indicator status-indicator-${customer.status || 'active'}`}></div>
                              <span className="status-text">
                                {(customer.status || 'active').charAt(0).toUpperCase() + (customer.status || 'active').slice(1)}
                              </span>
                            </div>
                          </div>

                          <div className="customer-cell customer-cell-actions">
                            <div className="customer-actions">
                              <button
                                className="customer-action-btn customer-action-view"
                                onClick={() => navigateToCustomerDetails(customer.id)}
                                title="View customer details"
                              >
                                <Eye size={16} />
                                <span>View Details</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customers Pagination */}
                  <div className="customers-pagination">
                    <div className="pagination-info">
                      <span className="pagination-text">
                        Showing {customers.length} of {customers.length} customers
                      </span>
                    </div>
                    
                    <div className="pagination-controls">
                      <button 
                        className="pagination-btn pagination-prev"
                        onClick={() => setCustomerPage(prev => Math.max(1, prev - 1))}
                        disabled={customerPage === 1}
                      >
                        <ChevronLeft size={16} />
                        <span>Previous</span>
                      </button>
                      
                      <div className="pagination-pages">
                        <button className="pagination-page active">
                          {customerPage}
                        </button>
                      </div>
                      
                      <button 
                        className="pagination-btn pagination-next"
                        onClick={() => setCustomerPage(prev => prev + 1)}
                        disabled={customers.length < customersPerPage}
                      >
                        <span>Next</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )

      case 'categories':
        const filteredCategories = getFilteredCategories()
        
        return (
          <div className="section-content">
            {/* Categories Content Container */}
            <div className="categories-content-container">
              {/* Categories Toolbar */}
              <div className="categories-toolbar">
                <div className="categories-toolbar-left">
                  <div className="categories-search-wrapper">
                    <Search size={18} className="categories-search-icon" />
                    <input
                      type="text"
                      placeholder="Search categories by name or description..."
                      className="categories-search-input"
                      value={categorySearchQuery}
                      onChange={(e) => setCategorySearchQuery(e.target.value)}
                    />
                  </div>
                  <select 
                    className="categories-filter-select"
                    value={categoryStatusFilter}
                    onChange={(e) => setCategoryStatusFilter(e.target.value)}
                  >
                    <option value="all">All Categories</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="categories-toolbar-right">
                  <button 
                    className="categories-add-btn"
                    onClick={() => openModal('add', { type: 'category' })}
                  >
                    <Plus size={18} />
                    Add Category
                  </button>
                  <div className="subcategories-view-options">
                    <button 
                      className={`subcategories-view-btn ${categoriesViewMode === 'grid' ? 'active' : ''}`}
                      onClick={() => setCategoriesViewMode('grid')}
                    >
                      <Grid3X3 size={16} />
                      <span>Grid View</span>
                    </button>
                    <button 
                      className={`subcategories-view-btn ${categoriesViewMode === 'list' ? 'active' : ''}`}
                      onClick={() => setCategoriesViewMode('list')}
                    >
                      <List size={16} />
                      <span>List View</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Categories Content */}
              {filteredCategories.length === 0 ? (
                <div className="categories-empty-state">
                  <div className="categories-empty-icon">
                    <Folder size={48} />
                  </div>
                  <h3 className="categories-empty-title">
                    {categories.length === 0 ? 'No Categories Yet' : 'No Categories Found'}
                  </h3>
                  <p className="categories-empty-description">
                    {categories.length === 0 
                      ? 'Create your first category to start organizing your products. Categories help customers navigate your store more easily.'
                      : 'Try adjusting your search criteria or filters to find categories.'
                    }
                  </p>
                  {categories.length === 0 ? (
                    <button 
                      className="categories-empty-action"
                      onClick={() => openModal('add', { type: 'category' })}
                    >
                      <Plus size={18} />
                      Create First Category
                    </button>
                  ) : (
                    <button 
                      className="categories-empty-action"
                      onClick={() => {
                        setCategorySearchQuery('')
                        setCategoryStatusFilter('all')
                      }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : categoriesViewMode === 'grid' ? (
                /* Grid View */
                <div className="categories-grid-container">
                  <div className="categories-grid">
                    {filteredCategories.map((category) => (
                      <div key={category.id} className="category-grid-card">
                        <div className="category-card-header">
                          <div className="category-icon-wrapper">
                            <Folder size={24} />
                          </div>
                          <button className="category-card-menu">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              <div style={{ width: '4px', height: '4px', backgroundColor: 'currentColor', borderRadius: '50%' }}></div>
                              <div style={{ width: '4px', height: '4px', backgroundColor: 'currentColor', borderRadius: '50%' }}></div>
                              <div style={{ width: '4px', height: '4px', backgroundColor: 'currentColor', borderRadius: '50%' }}></div>
                            </div>
                          </button>
                        </div>

                        <div className="category-card-content">
                          <h3 className="category-card-name">{category.name}</h3>
                          {category.description && (
                            <p className="category-card-description">{category.description}</p>
                          )}
                          
                          <div className="category-card-stats">
                            <div className="category-stat-item">
                              <Package size={14} />
                              <span>{category.count || 0} Products</span>
                            </div>
                            <div className="category-stat-item">
                              <User size={14} />
                              <span>ID: #{category.id}</span>
                            </div>
                          </div>
                        </div>

                        <div className="category-card-actions">
                          <button 
                            className="category-action-btn primary"
                            onClick={() => openModal('view', { ...category, type: 'category' })}
                          >
                            <Eye size={14} />
                            View
                          </button>
                          <button 
                            className="category-action-btn"
                            onClick={() => openModal('edit', { ...category, type: 'category' })}
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                          <button 
                            className="category-action-btn danger"
                            onClick={() => openModal('delete', { ...category, type: 'category' })}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* List View */
                <div className="categories-list-container">
                  <div className="categories-list-header">
                    <div className="list-header-column">Category</div>
                    <div className="list-header-column">Description</div>
                    <div className="list-header-column">Products</div>
                    <div className="list-header-column">Created</div>
                    <div className="list-header-column">Actions</div>
                  </div>

                  <div className="categories-list-body">
                    {filteredCategories.map((category) => (
                      <div key={category.id} className="category-list-row">
                        <div className="category-list-info">
                          <div className="category-list-icon">
                            <Folder size={20} />
                          </div>
                          <div className="category-list-details">
                            <h4 className="category-list-name">{category.name}</h4>
                            <p className="category-list-id">ID: #{category.id}</p>
                          </div>
                        </div>

                        <div className="category-list-description">
                          {category.description || 'No description provided'}
                        </div>

                        <div className="category-list-count">
                          <Package size={16} />
                          <span>{category.count || 0} items</span>
                        </div>

                        <div className="category-list-date">
                          <div>
                            {category.created_at 
                              ? new Date(category.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : 'Unknown'
                            }
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                            {category.created_at 
                              ? new Date(category.created_at).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : ''
                            }
                          </div>
                        </div>

                        <div className="category-list-actions">
                          <button 
                            className="category-list-action-btn primary"
                            onClick={() => openModal('view', { ...category, type: 'category' })}
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            className="category-list-action-btn edit"
                            onClick={() => openModal('edit', { ...category, type: 'category' })}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="category-list-action-btn delete"
                            onClick={() => openModal('delete', { ...category, type: 'category' })}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories Pagination */}
              {filteredCategories.length > 0 && (
                <div className="categories-pagination">
                  <div className="categories-pagination-info">
                    <span>
                      Showing {filteredCategories.length} of {categories.length} categories
                      {filteredCategories.length !== categories.length && ' (filtered)'}
                    </span>
                  </div>
                  
                  <div className="categories-pagination-controls">
                    <button 
                      className="categories-pagination-btn"
                      onClick={() => setCategoryPage(prev => Math.max(1, prev - 1))}
                      disabled={categoryPage === 1}
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                    
                    <div className="categories-pagination-pages">
                      <button className="categories-pagination-page active">
                        {categoryPage}
                      </button>
                    </div>
                    
                    <button 
                      className="categories-pagination-btn"
                      onClick={() => setCategoryPage(prev => prev + 1)}
                      disabled={filteredCategories.length < categoriesPerPage}
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      case 'subcategories':
        const filteredSubcategories = subcategories.filter(subcategory => {
          const matchesSearch = subcategorySearchQuery === '' || 
            subcategory.name.toLowerCase().includes(subcategorySearchQuery.toLowerCase()) ||
            subcategory.description?.toLowerCase().includes(subcategorySearchQuery.toLowerCase()) ||
            subcategory.category_name?.toLowerCase().includes(subcategorySearchQuery.toLowerCase())
          
          const matchesCategory = subcategoryCategoryFilter === 'all' || 
            subcategory.category_name === subcategoryCategoryFilter
          
          return matchesSearch && matchesCategory
        })

        return (
          <div className="subcategories-section">
            {/* Subcategories Control Bar */}
            <div className="subcategories-control-bar">
              <div className="subcategories-controls-left">
                <div className="subcategories-search-container">
                  <div className="search-input-wrapper">
                    <Search size={18} className="search-input-icon" />
                    <input
                      type="text"
                      placeholder="Search subcategories by name, description, or category..."
                      value={subcategorySearchQuery}
                      onChange={(e) => setSubcategorySearchQuery(e.target.value)}
                      className="subcategories-search-input"
                    />
                  </div>
                </div>
                
                <div className="subcategories-filter-container">
                  <select 
                    value={subcategoryCategoryFilter} 
                    onChange={(e) => setSubcategoryCategoryFilter(e.target.value)}
                    className="subcategories-filter-select"
                  >
                    <option value="all">All Categories</option>
                    {[...new Set(subcategories.map(sub => sub.category_name))].map(categoryName => (
                      <option key={categoryName} value={categoryName}>{categoryName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="subcategories-controls-right">
                <button 
                  className="subcategories-add-btn"
                  onClick={() => openModal('add', { type: 'subcategory' })}
                >
                  <Plus size={18} />
                  Add Subcategory
                </button>
                <div className="subcategories-view-options">
                  <button 
                    className={`subcategories-view-btn ${subcategoriesViewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setSubcategoriesViewMode('grid')}
                  >
                    <Grid3X3 size={16} />
                    <span>Grid View</span>
                  </button>
                  <button 
                    className={`subcategories-view-btn ${subcategoriesViewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setSubcategoriesViewMode('list')}
                  >
                    <List size={16} />
                    <span>List View</span>
                  </button>
                </div>
                
                <div className="subcategories-results-info">
                  <span className="results-count">
                    {filteredSubcategories.length} of {subcategories.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Subcategories Content */}
            <div className="subcategories-content">
              {filteredSubcategories.length === 0 ? (
                <div className="subcategories-empty-state">
                  <div className="empty-state-illustration">
                    <FolderOpen size={64} />
                  </div>
                  <h3 className="empty-state-title">
                    {subcategories.length === 0 ? 'No Subcategories Yet' : 'No Subcategories Found'}
                  </h3>
                  <p className="empty-state-description">
                    {subcategories.length === 0 
                      ? 'Create your first subcategory to organize products within categories. Subcategories help create more detailed product navigation.'
                      : 'Try adjusting your search criteria or category filter to find subcategories.'
                    }
                  </p>
                  {subcategories.length === 0 ? (
                    <button 
                      className="empty-state-action"
                      onClick={() => openModal('add', { type: 'subcategory' })}
                    >
                      <Plus size={18} />
                      Create First Subcategory
                    </button>
                  ) : (
                    <button 
                      className="empty-state-action"
                      onClick={() => {
                        setSubcategorySearchQuery('')
                        setSubcategoryCategoryFilter('all')
                      }}
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : subcategoriesViewMode === 'grid' ? (
                /* Grid View */
                <div className="subcategories-grid-container">
                  <div className="subcategories-grid">
                    {filteredSubcategories.map((subcategory) => (
                      <div key={subcategory.id} className="subcategory-grid-card">
                        <div className="subcategory-card-header">
                          <div className="subcategory-icon-wrapper">
                            <FolderOpen size={24} />
                          </div>
                          <div className="subcategory-category-tag">
                            {subcategory.category_name}
                          </div>
                        </div>

                        <div className="subcategory-card-content">
                          <h3 className="subcategory-card-name">{subcategory.name}</h3>
                          {subcategory.description && (
                            <p className="subcategory-card-description">{subcategory.description}</p>
                          )}
                          
                          <div className="subcategory-card-details">
                            <div className="subcategory-detail-item">
                              <Package size={14} />
                              <span className="detail-value">{subcategory.count || 0}</span>
                              <span className="detail-label">Products</span>
                            </div>
                            <div className="subcategory-detail-item">
                              <span className="detail-id">ID: #{subcategory.id}</span>
                            </div>
                          </div>
                        </div>

                        <div className="subcategory-card-actions">
                          <button 
                            className="subcategory-action-btn primary"
                            onClick={() => openModal('view', { ...subcategory, type: 'subcategory' })}
                          >
                            <Eye size={14} />
                            View
                          </button>
                          <button 
                            className="subcategory-action-btn secondary"
                            onClick={() => openModal('edit', { ...subcategory, type: 'subcategory' })}
                          >
                            <Edit size={14} />
                            Edit
                          </button>
                          <button 
                            className="subcategory-action-btn danger"
                            onClick={() => openModal('delete', { ...subcategory, type: 'subcategory' })}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* List View */
                <div className="subcategories-list-container">
                  <div className="subcategories-list-header">
                    <div className="subcategory-list-column subcategory-column-name">Subcategory</div>
                    <div className="subcategory-list-column subcategory-column-category">Parent Category</div>
                    <div className="subcategory-list-column subcategory-column-description">Description</div>
                    <div className="subcategory-list-column subcategory-column-products">Products</div>
                    <div className="subcategory-list-column subcategory-column-created">Created</div>
                    <div className="subcategory-list-column subcategory-column-actions">Actions</div>
                  </div>

                  <div className="subcategories-list-body">
                    {filteredSubcategories.map((subcategory) => (
                      <div key={subcategory.id} className="subcategory-list-row">
                        <div className="subcategory-list-cell subcategory-cell-name">
                          <div className="subcategory-info">
                            <div className="subcategory-icon">
                              <FolderOpen size={20} />
                            </div>
                            <div className="subcategory-details">
                              <h4 className="subcategory-name">{subcategory.name}</h4>
                              <p className="subcategory-id">ID: #{subcategory.id}</p>
                            </div>
                          </div>
                        </div>

                        <div className="subcategory-list-cell subcategory-cell-category">
                          <div className="parent-category-info">
                            <Folder size={16} />
                            <span className="parent-category-name">{subcategory.category_name}</span>
                          </div>
                        </div>

                        <div className="subcategory-list-cell subcategory-cell-description">
                          <div className="subcategory-description">
                            {subcategory.description || 'No description provided'}
                          </div>
                        </div>

                        <div className="subcategory-list-cell subcategory-cell-products">
                          <div className="products-count">
                            <Package size={16} />
                            <span className="count-number">{subcategory.count || 0}</span>
                            <span className="count-label">items</span>
                          </div>
                        </div>

                        <div className="subcategory-list-cell subcategory-cell-created">
                          <div className="created-info">
                            <div className="created-date">
                              {subcategory.created_at 
                                ? new Date(subcategory.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                                : 'Unknown'
                              }
                            </div>
                            <div className="created-time">
                              {subcategory.created_at 
                                ? new Date(subcategory.created_at).toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : ''
                              }
                            </div>
                          </div>
                        </div>

                        <div className="subcategory-list-cell subcategory-cell-actions">
                          <div className="subcategory-actions">
                            <button 
                              className="subcategory-list-action-btn primary"
                              onClick={() => openModal('view', { ...subcategory, type: 'subcategory' })}
                              title="View subcategory details"
                            >
                              <Eye size={14} />
                            </button>
                            <button 
                              className="subcategory-list-action-btn edit"
                              onClick={() => openModal('edit', { ...subcategory, type: 'subcategory' })}
                              title="Edit subcategory"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              className="subcategory-list-action-btn delete"
                              onClick={() => openModal('delete', { ...subcategory, type: 'subcategory' })}
                              title="Delete subcategory"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Subcategories Pagination */}
              {filteredSubcategories.length > 0 && (
                <div className="subcategories-pagination">
                  <div className="subcategories-pagination-info">
                    <span className="pagination-text">
                      Showing {filteredSubcategories.length} of {subcategories.length} subcategories
                      {filteredSubcategories.length !== subcategories.length && ' (filtered)'}
                    </span>
                  </div>
                  
                  <div className="subcategories-pagination-controls">
                    <button 
                      className="pagination-btn pagination-prev"
                      onClick={() => setSubcategoryPage(prev => Math.max(1, prev - 1))}
                      disabled={subcategoryPage === 1}
                    >
                      <ChevronLeft size={16} />
                      <span>Previous</span>
                    </button>
                    
                    <div className="pagination-pages">
                      <button className="pagination-page active">
                        {subcategoryPage}
                      </button>
                    </div>
                    
                    <button 
                      className="pagination-btn pagination-next"
                      onClick={() => setSubcategoryPage(prev => prev + 1)}
                      disabled={filteredSubcategories.length < subcategoriesPerPage}
                    >
                      <span>Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      case 'products':
        const filteredProducts = getFilteredProducts()
        
        return (
          <div className="products-section">
            {/* Filter and Search Section */}
            <div className="products-filters">
              <div className="filter-left">
                <div className="search-container">
                  <Search size={18} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search products by name, category..."
                    className="search-input"
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                  />
                </div>
                <select 
                  className="filter-select"
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
                <select 
                  className="filter-select"
                  value={productStatusFilter}
                  onChange={(e) => setProductStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="filter-right">
                <button 
                  className="add-product-btn"
                  onClick={() => openModal('add', { type: 'product' })}
                >
                  <Plus size={20} />
                  Add New Product
                </button>
                <div className="subcategories-view-options">
                  <button 
                    className={`subcategories-view-btn ${productsViewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setProductsViewMode('grid')}
                  >
                    <Grid3X3 size={16} />
                    <span>Grid View</span>
                  </button>
                  <button 
                    className={`subcategories-view-btn ${productsViewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setProductsViewMode('list')}
                  >
                    <List size={16} />
                    <span>List View</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Products Display */}
            {productsViewMode === 'grid' ? (
              /* Grid View */
              <div className="products-grid">
                {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-image">
                      {product.thumbnail_image ? (
                        <img src={product.thumbnail_image} alt={product.name} />
                      ) : (
                        <div className="product-image-placeholder">
                          <Package size={32} />
                        </div>
                      )}
                      <div className="product-status-badge">
                        <span className={`status-dot ${product.status}`}></span>
                        {product.status}
                      </div>
                    </div>
                    
                    <div className="product-content">
                      <div className="product-header">
                        <h3 className="product-name">{product.name}</h3>
                        <div className="product-price">${product.price}</div>
                      </div>
                      
                      <div className="product-details">
                        <div className="product-meta">
                          <span className="product-category">{product.category}</span>
                          <span className="product-stock">
                            Stock: {product.stock}
                            {product.stock <= 10 && <span className="low-stock-warning">Low</span>}
                          </span>
                        </div>
                        
                        {product.description && (
                          <p className="product-description">{product.description.substring(0, 80)}...</p>
                        )}
                      </div>
                      
                      <div className="product-actions">
                        <button 
                          className="product-action-btn primary"
                          onClick={() => openModal('view', { ...product, type: 'product' })}
                        >
                          <Eye size={16} />
                          View
                        </button>
                        <button 
                          className="product-action-btn secondary"
                          onClick={() => openModal('edit', { ...product, type: 'product' })}
                        >
                          <Edit size={16} />
                          Edit
                        </button>
                        <button 
                          className="product-action-btn danger"
                          onClick={() => openModal('delete', { ...product, type: 'product' })}
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="products-empty-state">
                    <div className="empty-state-icon">
                      <Package size={64} />
                    </div>
                    <h3 className="empty-state-title">
                      {products.length === 0 ? 'No Products Yet' : 'No Products Found'}
                    </h3>
                    <p className="empty-state-description">
                      {products.length === 0 
                        ? 'Get started by adding your first product to the catalog'
                        : 'Try adjusting your search criteria or filters to find products'
                      }
                    </p>
                    {products.length === 0 && (
                      <button 
                        className="empty-state-action"
                        onClick={() => openModal('add', { type: 'product' })}
                      >
                        <Plus size={18} />
                        Add Your First Product
                      </button>
                    )}
                    {products.length > 0 && (
                      <button 
                        className="empty-state-action"
                        onClick={() => {
                          setProductSearchQuery('')
                          setProductCategoryFilter('all')
                          setProductStatusFilter('all')
                        }}
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* List View */
              <div className="products-list-view">
                <div className="products-list-header">
                  <div className="list-header-item">Product</div>
                  <div className="list-header-item">Category</div>
                  <div className="list-header-item">Price</div>
                  <div className="list-header-item">Stock</div>
                  <div className="list-header-item">Status</div>
                  <div className="list-header-item">Actions</div>
                </div>
                <div className="products-list-body">
                  {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                    <div key={product.id} className="product-list-item">
                      <div className="list-item-product">
                        <div className="product-thumbnail">
                          {product.thumbnail_image ? (
                            <img src={product.thumbnail_image} alt={product.name} />
                          ) : (
                            <div className="product-thumbnail-placeholder">
                              <Package size={20} />
                            </div>
                          )}
                        </div>
                        <div className="product-info">
                          <span className="product-name">{product.name}</span>
                          {product.description && (
                            <span className="product-description">{product.description.substring(0, 60)}...</span>
                          )}
                        </div>
                      </div>
                      <div className="list-item-category">
                        <span className="category-tag">{product.category}</span>
                      </div>
                      <div className="list-item-price">
                        <span className="price-value">${product.price}</span>
                      </div>
                      <div className="list-item-stock">
                        <span className={`stock-value ${product.stock <= 10 ? 'low-stock' : ''}`}>
                          {product.stock}
                          {product.stock <= 10 && <span className="low-indicator">Low</span>}
                        </span>
                      </div>
                      <div className="list-item-status">
                        <span className={`status-badge ${product.status}`}>
                          <span className={`status-dot ${product.status}`}></span>
                          {product.status}
                        </span>
                      </div>
                      <div className="list-item-actions">
                        <button 
                          className="subcategory-list-action-btn primary"
                          onClick={() => openModal('view', { ...product, type: 'product' })}
                          title="View Product"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          className="subcategory-list-action-btn edit"
                          onClick={() => openModal('edit', { ...product, type: 'product' })}
                          title="Edit Product"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          className="subcategory-list-action-btn delete"
                          onClick={() => openModal('delete', { ...product, type: 'product' })}
                          title="Delete Product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="products-list-empty">
                      <div className="empty-state-icon">
                        <Package size={48} />
                      </div>
                      <h3 className="empty-state-title">
                        {products.length === 0 ? 'No Products Yet' : 'No Products Found'}
                      </h3>
                      <p className="empty-state-description">
                        {products.length === 0 
                          ? 'Get started by adding your first product to the catalog'
                          : 'Try adjusting your search criteria or filters to find products'
                        }
                      </p>
                      {products.length === 0 && (
                        <button 
                          className="empty-state-action"
                          onClick={() => openModal('add', { type: 'product' })}
                        >
                          <Plus size={16} />
                          Add Your First Product
                        </button>
                      )}
                      {products.length > 0 && (
                        <button 
                          className="empty-state-action"
                          onClick={() => {
                            setProductSearchQuery('')
                            setProductCategoryFilter('all')
                            setProductStatusFilter('all')
                          }}
                        >
                          Clear Filters
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Results Summary and Pagination */}
            {filteredProducts.length > 0 && (
              <div className="products-pagination">
                <div className="pagination-info">
                  {filteredProducts.length === products.length 
                    ? `Showing ${filteredProducts.length} of ${products.length} products`
                    : `Showing ${filteredProducts.length} of ${products.length} products (filtered)`
                  }
                </div>
                <div className="pagination-controls">
                  <button className="pagination-btn" disabled>
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <div className="pagination-pages">
                    <button className="pagination-page active">1</button>
                  </div>
                  <button className="pagination-btn" disabled>
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      case 'users':
        return (
          <div className="section-content">
            <div className="content-grid">
              <div className="content-card full-width">
                <div className="card-header">
                  <div className="header-title-with-icon">
                    <User size={20} />
                    <h3>All Users ({users.length})</h3>
                  </div>
                  <button 
                    className="header-button"
                    onClick={() => openModal('add', { type: 'user' })}
                  >
                    <Plus size={16} />
                    Add User
                  </button>
                </div>
                <div className="items-list">
                  {users.map((user) => (
                    <div key={user.id} className="list-item">
                      <div className="item-info">
                        <div className="item-main">
                          <span className="item-name">{user.name}</span>
                          <span className="item-description">{user.email}</span>
                        </div>
                        <div className="item-meta">
                          <span className={`item-role ${user.role}`}>{user.role}</span>
                          <span className={`item-status ${user.status}`}>{user.status}</span>
                          <span className="item-date">Joined: {user.joinDate}</span>
                        </div>
                      </div>
                      <div className="item-actions">
                        <button 
                          className="action-btn view"
                          onClick={() => openModal('view', { ...user, type: 'user' })}
                        >
                          <Eye size={16} /> View
                        </button>
                        <button 
                          className="action-btn edit"
                          onClick={() => openModal('edit', { ...user, type: 'user' })}
                        >
                          <Edit size={16} /> Edit
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => openModal('delete', { ...user, type: 'user' })}
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )

      case 'customers':
        return (
          <div className="section-content">
            <div className="content-grid">
              <div className="content-card full-width">
                <div className="card-header">
                  <div className="filter-section">
                    <select 
                      value={customerStatusFilter} 
                      onChange={(e) => setCustomerStatusFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="blocked">Blocked</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Search by name or email"
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="search-input"
                    />
                  </div>
                </div>
                <div className="customers-table-container">
                  <table className="customers-table">
                    <thead>
                      <tr>
                        <th>Customer</th>
                        <th>Contact</th>
                        <th>Joined</th>
                        <th>Orders</th>
                        <th>Total Spent</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customers.map((customer) => (
                        <tr key={customer.id}>
                          <td>
                            <div className="customer-info">
                              <span>{customer.first_name} {customer.last_name}</span>
                              <small>{customer.email}</small>
                            </div>
                          </td>
                          <td>{customer.phone || 'N/A'}</td>
                          <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                          <td>{customer.total_orders}</td>
                          <td>${customer.total_spent}</td>
                          <td>
                            <select
                              value={customer.status}
                              onChange={(e) => updateCustomerStatus(customer.id, e.target.value)}
                              className={`status-select ${customer.status}`}
                            >
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                              <option value="blocked">Blocked</option>
                            </select>
                          </td>
                          <td>
                            <button
                              className="action-btn view"
                              onClick={() => navigateToCustomerDetails(customer.id)}
                            >
                              <Eye size={16} /> View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="pagination">
                  <button 
                    onClick={() => setCustomerPage(prev => Math.max(1, prev - 1))}
                    disabled={customerPage === 1}
                  >
                    Previous
                  </button>
                  <span>Page {customerPage}</span>
                  <button 
                    onClick={() => setCustomerPage(prev => prev + 1)}
                    disabled={customers.length < customersPerPage}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )

      case 'banners':
        return (
          <div className="banners-page">
            {/* Content Area */}
            <div className="banners-content">
              {/* Banners Toolbar - Always visible */}
              <div className="banners-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div className="banners-toolbar-left">
                  <span className="banners-count">{banners.length} Banners</span>
                </div>
                <div className="banners-toolbar-right" style={{ marginLeft: 'auto' }}>
                  <button 
                    className="banner-primary-btn"
                    onClick={() => openModal('add', { type: 'banner' })}
                  >
                    <Plus size={18} />
                    <span>Create Banner</span>
                  </button>
                </div>
              </div>

              {banners.length === 0 ? (
                <div className="banners-empty-state">
                  <div className="empty-state-icon">
                    <Megaphone size={48} />
                  </div>
                  <div className="empty-state-content">
                    <h3>No banners created yet</h3>
                    <p>Start by creating your first promotional banner to engage customers</p>
                  </div>
                </div>
              ) : (
                <div className="banners-grid">
                  {banners.map((banner) => (
                    <div key={banner.id} className="banner-card">
                      <div className="banner-card-header">
                        <div className="banner-status-section">
                          <span className={`banner-status-badge ${banner.status}`}>
                            {banner.status}
                          </span>
                          <div className="banner-id">ID: {banner.id}</div>
                        </div>
                      </div>
                      
                      <div className="banner-card-content">
                        <h3 className="banner-card-title">{banner.title}</h3>
                        <p className="banner-card-description">{banner.description}</p>
                        
                        <div className="banner-dates-section">
                          <div className="banner-date-item">
                            <span className="date-label">Start Date</span>
                            <span className="date-value">{banner.startDate}</span>
                          </div>
                          <div className="banner-date-item">
                            <span className="date-label">End Date</span>
                            <span className="date-value">{banner.endDate}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="banner-card-actions">
                        <button 
                          className="banner-action-btn banner-view-btn"
                          onClick={() => openModal('view', { ...banner, type: 'banner' })}
                        >
                          <Eye size={16} />
                          <span>View</span>
                        </button>
                        <button 
                          className="banner-action-btn banner-edit-btn"
                          onClick={() => openModal('edit', { ...banner, type: 'banner' })}
                        >
                          <Edit size={16} />
                          <span>Edit</span>
                        </button>
                        <button 
                          className="banner-action-btn banner-delete-btn"
                          onClick={() => openModal('delete', { ...banner, type: 'banner' })}
                        >
                          <Trash2 size={16} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      default:
        const recentActivities = getRecentActivities()
        
        return (
          <div className="section-content">
            {error && (
              <div className="error-message">
                <p>{error}</p>
                <button onClick={loadData} className="retry-button">Retry</button>
              </div>
            )}
            
            {/* Dynamic Stats Grid */}
            <div className="stats-grid">
              {stats.map((stat, index) => (
                <div key={index} className="stat-card">
                  <div className="stat-icon" style={{ backgroundColor: stat.color }}>
                    <stat.icon size={24} color="white" />
                  </div>
                  <div className="stat-content">
                    <h3>{stat.value}</h3>
                    <p>{stat.title}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="dashboard-grid">
              {/* Recent Activities based on actual data */}
              <div className="dashboard-card">
                <h2>Recent Activities</h2>
                <div className="activities-list">
                  {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
                    <div key={index} className="activity-item">
                      <div className={`activity-icon activity-${activity.type}`}>
                        {activity.type === 'user' && <User size={16} />}
                        {activity.type === 'product' && <Package size={16} />}
                        {activity.type === 'order' && <ShoppingCart size={16} />}
                      </div>
                      <div className="activity-content">
                        <p>{activity.action}</p>
                        <span>{activity.time}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="empty-state">
                      <p>No recent activities</p>
                      <small>Activities will appear as you add data</small>
                    </div>
                  )}
                </div>
              </div>

              {/* Categories Overview */}
              <div className="dashboard-card">
                <h2>Categories Overview</h2>
                <div className="categories-overview">
                  {categories.length > 0 ? categories.slice(0, 5).map((category, index) => (
                    <div key={index} className="category-item">
                      <div className="category-info">
                        <span className="category-name">{category.name}</span>
                        <span className="category-count">{category.count || 0} products</span>
                      </div>
                    </div>
                  )) : (
                    <div className="empty-state">
                      <Folder size={32} color="#ccc" />
                      <p>No categories yet</p>
                      <small>Create categories to organize your products</small>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Orders */}
              <div className="dashboard-card">
                <h2>Recent Orders</h2>
                <div className="recent-orders">
                  {orders.length > 0 ? orders.slice(0, 3).map((order, index) => (
                    <div key={index} className="order-item">
                      <div className="order-info">
                        <span className="order-number">#{order.order_number}</span>
                        <span className="order-amount">${order.total_amount}</span>
                        <span className={`order-status ${order.status}`}>{order.status}</span>
                      </div>
                      <span className="order-date">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                  )) : (
                    <div className="empty-state">
                      <ShoppingCart size={32} color="#ccc" />
                      <p>No orders yet</p>
                      <small>Orders will appear here as customers make purchases</small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Second row with remaining cards */}
            <div className="dashboard-grid">
              {/* System Status - Based on actual data availability */}
              <div className="dashboard-card">
                <h2>System Status</h2>
                <div className="system-status">
                  <div className="status-item">
                    <div className={`status-indicator ${categories.length > 0 ? 'online' : 'offline'}`}></div>
                    <span>Categories</span>
                    <span className="status-text">{categories.length > 0 ? 'Active' : 'No Data'}</span>
                  </div>
                  <div className="status-item">
                    <div className={`status-indicator ${products.length > 0 ? 'online' : 'offline'}`}></div>
                    <span>Products</span>
                    <span className="status-text">{products.length > 0 ? 'Active' : 'No Data'}</span>
                  </div>
                  <div className="status-item">
                    <div className={`status-indicator ${users.length > 0 ? 'online' : 'offline'}`}></div>
                    <span>Users</span>
                    <span className="status-text">{users.length > 0 ? 'Active' : 'No Data'}</span>
                  </div>
                  <div className="status-item">
                    <div className={`status-indicator ${orders.length > 0 ? 'online' : 'warning'}`}></div>
                    <span>Orders</span>
                    <span className="status-text">{orders.length > 0 ? 'Active' : 'No Orders'}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions - Dynamic based on available actions */}
              <div className="dashboard-card">
                <h2>Quick Actions</h2>
                <div className="quick-actions">
                  <button 
                    className="action-button primary"
                    onClick={() => openModal('add', { type: 'category' })}
                  >
                    <Plus size={16} />
                    Add Category
                  </button>
                  <button 
                    className="action-button secondary"
                    onClick={() => openModal('add', { type: 'product' })}
                    disabled={categories.length === 0}
                  >
                    <Package size={16} />
                    Add Product
                  </button>
                  <button 
                    className="action-button tertiary"
                    onClick={() => setActiveSection('users')}
                  >
                    <Users size={16} />
                    View Users
                  </button>
                  <button 
                    className="action-button quaternary"
                    onClick={() => setActiveSection('orders')}
                  >
                    <ShoppingCart size={16} />
                    View Orders
                  </button>
                </div>
                {categories.length === 0 && (
                  <small style={{ color: '#666', fontSize: '12px', marginTop: '10px', display: 'block' }}>
                    Create categories first to add products
                  </small>
                )}
              </div>

              {/* Top Products */}
              <div className="dashboard-card">
                <h2>Products Overview</h2>
                <div className="products-overview">
                  {products.length > 0 ? products.slice(0, 4).map((product, index) => (
                    <div key={index} className="product-item">
                      <div className="product-info">
                        <span className="product-name">{product.name}</span>
                        <span className="product-price">${product.price}</span>
                        <span className={`product-status ${product.status}`}>{product.status}</span>
                      </div>
                    </div>
                  )) : (
                    <div className="empty-state">
                      <Package size={32} color="#ccc" />
                      <p>No products yet</p>
                      <small>Add products to start selling</small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
    }
  }

  const renderModal = () => {
    if (!showModal || !selectedItem) return null

    const { type } = selectedItem

    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              {modalType === 'add' && `Add New ${type.charAt(0).toUpperCase() + type.slice(1)}`}
              {modalType === 'edit' && `Edit ${type.charAt(0).toUpperCase() + type.slice(1)}`}
              {modalType === 'view' && `View ${type.charAt(0).toUpperCase() + type.slice(1)}`}
              {modalType === 'delete' && `Delete ${type.charAt(0).toUpperCase() + type.slice(1)}`}
            </h3>
            <button className="modal-close" onClick={closeModal}>✕</button>
          </div>
          
          <div className="modal-body">
            {modalType === 'delete' ? (
              <div className="delete-confirmation">
                <p>Are you sure you want to delete this {type}?</p>
                <p><strong>{selectedItem.name}</strong></p>
                <div className="delete-actions">
                  <button className="btn btn-danger" onClick={() => handleDelete(type, selectedItem.id)}>
                    Delete
                  </button>
                  <button className="btn btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : modalType === 'view' ? (
              <div className="view-details">
                {type === 'category' && (
                  <>
                    <div className="detail-item">
                      <label>Name:</label>
                      <span>{selectedItem.name}</span>
                    </div>
                    <div className="detail-item">
                      <label>Description:</label>
                      <span>{selectedItem.description}</span>
                    </div>
                    <div className="detail-item">
                      <label>Product Count:</label>
                      <span>{selectedItem.count} products</span>
                    </div>
                  </>
                )}
                {type === 'subcategory' && (
                  <>
                    <div className="detail-item">
                      <label>Name:</label>
                      <span>{selectedItem.name}</span>
                    </div>
                    <div className="detail-item">
                      <label>Description:</label>
                      <span>{selectedItem.description}</span>
                    </div>
                    <div className="detail-item">
                      <label>Category:</label>
                      <span>{selectedItem.category_name}</span>
                    </div>
                    <div className="detail-item">
                      <label>Product Count:</label>
                      <span>{selectedItem.count} products</span>
                    </div>
                  </>
                )}
                {type === 'product' && (
                  <>
                    <div className="detail-item">
                      <label>Name:</label>
                      <span>{selectedItem.name}</span>
                    </div>
                    <div className="detail-item">
                      <label>Description:</label>
                      <span>{selectedItem.description}</span>
                    </div>
                    <div className="detail-item">
                      <label>Price:</label>
                      <span>${selectedItem.price}</span>
                    </div>
                    <div className="detail-item">
                      <label>Category:</label>
                      <span>{selectedItem.category}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      <span className={`status-badge ${selectedItem.status}`}>
                        {selectedItem.status}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Stock:</label>
                      <span>{selectedItem.stock} units</span>
                    </div>
                    
                    {/* New Metadata Fields */}
                    {selectedItem.ideal_for && (
                      <div className="detail-item">
                        <label>Ideal For:</label>
                        <span>{selectedItem.ideal_for}</span>
                      </div>
                    )}
                    
                    {selectedItem.age_range && (
                      <div className="detail-item">
                        <label>Age Range:</label>
                        <span>{selectedItem.age_range}</span>
                      </div>
                    )}
                    
                    {selectedItem.characters && selectedItem.characters.length > 0 && (
                      <div className="detail-item">
                        <label>Characters:</label>
                        <span>{selectedItem.characters.join(', ')}</span>
                      </div>
                    )}
                    
                    {selectedItem.genre && (
                      <div className="detail-item">
                        <label>Genre:</label>
                        <span>{selectedItem.genre}</span>
                      </div>
                    )}
                    
                    {/* Media Display */}
                    {selectedItem.thumbnail_image && (
                      <div className="detail-item">
                        <label>Thumbnail:</label>
                        <div className="media-display">
                          <img src={selectedItem.thumbnail_image} alt="Thumbnail" style={{width: '150px', height: '150px', objectFit: 'cover'}} />
                        </div>
                      </div>
                    )}
                    
                    {selectedItem.images && selectedItem.images.length > 0 && (
                      <div className="detail-item">
                        <label>Images ({selectedItem.images.length}):</label>
                        <div className="media-gallery">
                          {selectedItem.images.map((img, index) => (
                            <img key={index} src={img} alt={`Product ${index + 1}`} style={{width: '100px', height: '100px', objectFit: 'cover', margin: '5px'}} />
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedItem.videos && selectedItem.videos.length > 0 && (
                      <div className="detail-item">
                        <label>Videos ({selectedItem.videos.length}):</label>
                        <div className="media-gallery">
                          {selectedItem.videos.map((video, index) => (
                            <video key={index} width="120" height="80" controls style={{margin: '5px'}}>
                              <source src={video} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedItem.preview_video && (
                      <div className="detail-item">
                        <label>Preview Video:</label>
                        <div className="media-display">
                          <video width="250" height="150" controls>
                            <source src={selectedItem.preview_video} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {type === 'user' && (
                  <>
                    <div className="detail-item">
                      <label>Name:</label>
                      <span>{selectedItem.name}</span>
                    </div>
                    <div className="detail-item">
                      <label>Email:</label>
                      <span>{selectedItem.email}</span>
                    </div>
                    <div className="detail-item">
                      <label>Role:</label>
                      <span className={`role-badge ${selectedItem.role}`}>
                        {selectedItem.role}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      <span className={`status-badge ${selectedItem.status}`}>
                        {selectedItem.status}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Join Date:</label>
                      <span>{selectedItem.joinDate}</span>
                    </div>
                  </>
                )}
                {type === 'banner' && (
                  <>
                    <div className="detail-item">
                      <label>Title:</label>
                      <span>{selectedItem.title}</span>
                    </div>
                    <div className="detail-item">
                      <label>Description:</label>
                      <span>{selectedItem.description}</span>
                    </div>
                    <div className="detail-item">
                      <label>Status:</label>
                      <span className={`status-badge ${selectedItem.status}`}>
                        {selectedItem.status}
                      </span>
                    </div>
                    <div className="detail-item">
                      <label>Start Date:</label>
                      <span>{selectedItem.startDate}</span>
                    </div>
                    <div className="detail-item">
                      <label>End Date:</label>
                      <span>{selectedItem.endDate}</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <form className="modal-form" onSubmit={(e) => e.preventDefault()}>
                {type === 'category' && (
                  <>
                    <div className="form-group">
                      <label>Category Name</label>
                      <input 
                        type="text" 
                        value={formData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter category name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea 
                        value={formData.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Enter category description"
                        rows="3"
                      />
                    </div>
                  </>
                )}
                {type === 'subcategory' && (
                  <>
                    <div className="form-group">
                      <label>Subcategory Name</label>
                      <input 
                        type="text" 
                        value={formData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter subcategory name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea 
                        value={formData.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Enter subcategory description"
                        rows="3"
                      />
                    </div>
                    {modalType === 'add' && (
                      <div className="form-group">
                        <label>Category</label>
                        <select 
                          value={formData.category_id || ''}
                          onChange={(e) => handleInputChange('category_id', e.target.value)}
                          required
                        >
                          <option value="">Select category</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {modalType === 'edit' && (
                      <div className="form-group">
                        <label>Category</label>
                        <input 
                          type="text" 
                          value={formData.category_name || ''}
                          disabled
                          style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                        />
                        <small style={{ color: '#666', fontSize: '12px' }}>
                          Category cannot be changed when editing
                        </small>
                      </div>
                    )}
                  </>
                )}
                {type === 'product' && (
                  <>
                    <div className="form-group">
                      <label>Product Name</label>
                      <input 
                        type="text" 
                        value={formData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter product name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea 
                        value={formData.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Enter product description"
                        rows="3"
                      />
                    </div>
                    <div className="form-group">
                      <label>Price</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={formData.price || ''}
                        onChange={(e) => handleInputChange('price', e.target.value)}
                        placeholder="Enter price"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Category</label>
                      <select 
                        value={formData.category || ''}
                        onChange={(e) => {
                          handleInputChange('category', e.target.value)
                          // Reset subcategory when category changes
                          handleInputChange('subcategory_id', '')
                        }}
                        required
                      >
                        <option value="">Select category</option>
                        {categories.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Subcategory (Optional)</label>
                      <select 
                        value={formData.subcategory_id || ''}
                        onChange={(e) => handleInputChange('subcategory_id', e.target.value)}
                        disabled={!formData.category}
                      >
                        <option value="">Select subcategory</option>
                        {formData.category && subcategories
                          .filter(subcat => {
                            const selectedCategory = categories.find(cat => cat.name === formData.category)
                            return selectedCategory && subcat.category_id === selectedCategory.id
                          })
                          .map(subcat => (
                            <option key={subcat.id} value={subcat.id}>{subcat.name}</option>
                          ))
                        }
                      </select>
                      {!formData.category && (
                        <small style={{ color: '#666', fontSize: '12px' }}>
                          Please select a category first
                        </small>
                      )}
                    </div>
                    <div className="form-group">
                      <label>Stock</label>
                      <input 
                        type="number" 
                        value={formData.stock || ''}
                        onChange={(e) => handleInputChange('stock', e.target.value)}
                        placeholder="Enter stock quantity"
                      />
                    </div>
                    
                    {/* New Product Metadata Fields */}
                    <div className="form-group">
                      <label>Ideal For</label>
                      <input 
                        type="text" 
                        value={formData.ideal_for || ''}
                        onChange={(e) => handleInputChange('ideal_for', e.target.value)}
                        placeholder="e.g., Boys, Girls, Kids, Toddlers, Teens, Everyone"
                      />
                      <small style={{ color: '#666', fontSize: '12px' }}>
                        Enter target audience (e.g., Boys, Girls, Kids, Everyone)
                      </small>
                    </div>
                    
                    <div className="form-group">
                      <label>Age Range</label>
                      <select 
                        value={formData.age_range || ''}
                        onChange={(e) => handleInputChange('age_range', e.target.value)}
                      >
                        <option value="">Select age range</option>
                        <option value="0-2 years old">0-2 years old</option>
                        <option value="3-5 years old">3-5 years old</option>
                        <option value="6-8 years old">6-8 years old</option>
                        <option value="9-12 years old">9-12 years old</option>
                        <option value="13+ years old">13+ years old</option>
                        <option value="All ages">All ages</option>
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Characters (comma-separated)</label>
                      <input 
                        type="text" 
                        value={Array.isArray(formData.characters) ? formData.characters.join(', ') : ''}
                        onChange={(e) => {
                          const chars = e.target.value.split(',').map(c => c.trim()).filter(c => c)
                          handleInputChange('characters', chars)
                        }}
                        placeholder="e.g., Hero, Villain, Sidekick"
                      />
                      <small style={{ color: '#666', fontSize: '12px' }}>
                        Enter character names separated by commas
                      </small>
                    </div>
                    
                    <div className="form-group">
                      <label>Genre</label>
                      <input 
                        type="text" 
                        value={formData.genre || ''}
                        onChange={(e) => handleInputChange('genre', e.target.value)}
                        placeholder="e.g., Adventure, Fantasy, Educational, Mystery"
                      />
                      <small style={{ color: '#666', fontSize: '12px' }}>
                        Enter book genre (e.g., Adventure & Exploration, Fantasy, Educational)
                      </small>
                    </div>
                    
                    {/* Media Upload Section */}
                    <div className="media-section">
                      <h4>Product Media</h4>
                      
                      <div className="form-group">
                        <label>Thumbnail Image</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'thumbnail_image')}
                        />
                        {formData.thumbnail_image && (
                          <div className="media-preview">
                            <img src={formData.thumbnail_image} alt="Thumbnail" style={{width: '100px', height: '100px', objectFit: 'cover'}} />
                            <button 
                              type="button" 
                              className="remove-media-btn"
                              onClick={() => handleInputChange('thumbnail_image', '')}
                            >
                              ❌
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="form-group">
                        <label>Product Images</label>
                        <input 
                          type="file" 
                          accept="image/*"
                          multiple
                          onChange={(e) => handleFileUpload(e, 'images')}
                        />
                        {formData.images && formData.images.length > 0 && (
                          <div className="media-preview">
                            {formData.images.map((img, index) => (
                              <div key={index} className="image-preview-item">
                                <img src={img} alt={`Product ${index + 1}`} style={{width: '80px', height: '80px', objectFit: 'cover', margin: '5px'}} />
                                <button 
                                  type="button" 
                                  className="remove-media-btn"
                                  onClick={() => removeMedia('images', index)}
                                >
                                  ❌
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="form-group">
                        <label>Product Videos</label>
                        <input 
                          type="file" 
                          accept="video/*"
                          multiple
                          onChange={(e) => handleFileUpload(e, 'videos')}
                        />
                        {formData.videos && formData.videos.length > 0 && (
                          <div className="media-preview">
                            {formData.videos.map((video, index) => (
                              <div key={index} className="video-preview-item">
                                <video width="120" height="80" controls>
                                  <source src={video} type="video/mp4" />
                                  Your browser does not support the video tag.
                                </video>
                                <button 
                                  type="button" 
                                  className="remove-media-btn"
                                  onClick={() => removeMedia('videos', index)}
                                >
                                  ❌
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="form-group">
                        <label>Preview Video (Main)</label>
                        <input 
                          type="file" 
                          accept="video/*"
                          onChange={(e) => handleFileUpload(e, 'preview_video')}
                        />
                        {formData.preview_video && (
                          <div className="media-preview">
                            <video width="200" height="120" controls>
                              <source src={formData.preview_video} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                            <button 
                              type="button" 
                              className="remove-media-btn"
                              onClick={() => handleInputChange('preview_video', '')}
                            >
                              ❌
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label>Status</label>
                      <select 
                        value={formData.status || 'active'}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </>
                )}
                {type === 'user' && (
                  <>
                    <div className="form-group">
                      <label>Full Name</label>
                      <input 
                        type="text" 
                        value={formData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter full name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input 
                        type="email" 
                        value={formData.email || ''}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Role</label>
                      <select 
                        value={formData.role || 'user'}
                        onChange={(e) => handleInputChange('role', e.target.value)}
                      >
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select 
                        value={formData.status || 'active'}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </>
                )}
                {type === 'banner' && (
                  <>
                    <div className="form-group">
                      <label>Banner Title</label>
                      <input 
                        type="text" 
                        value={formData.title || ''}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="Enter banner title"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <textarea 
                        value={formData.description || ''}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        placeholder="Enter banner description"
                        rows="3"
                      />
                    </div>
                    <div className="form-group">
                      <label>Start Date</label>
                      <input 
                        type="date" 
                        value={formData.startDate || ''}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>End Date</label>
                      <input 
                        type="date" 
                        value={formData.endDate || ''}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select 
                        value={formData.status || 'active'}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </>
                )}
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleSave}
                  >
                    {modalType === 'add' ? 'Add' : 'Save Changes'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={closeModal}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Generate dynamic stats based on actual data
  const stats = [
    { 
      title: t('dashboard.totalUsers'), 
      value: users?.length?.toString() || '0', 
      icon: Users,
      color: '#4f46e5' 
    },
    { 
      title: t('dashboard.totalBooks'), 
      value: products?.length?.toString() || '0', 
      icon: Package,
      color: '#059669' 
    },
    { 
      title: t('dashboard.totalOrders'), 
      value: orders?.length?.toString() || '0', 
      icon: ShoppingCart,
      color: '#dc2626' 
    },
    { 
      title: 'Categories', 
      value: categories?.length?.toString() || '0', 
      icon: Folder,
      color: '#7c3aed' 
    },
    { 
      title: 'Active Banners', 
      value: banners?.filter(b => b.status === 'active')?.length?.toString() || '0', 
      icon: Megaphone,
      color: '#f59e0b' 
    },
    
  ]

  // Generate recent activities from actual data
  const getRecentActivities = () => {
    const activities = []
    
    // Recent orders
    if (orders && orders.length > 0) {
      const recentOrders = orders.slice(0, 2)
      recentOrders.forEach(order => {
        activities.push({
          action: `New order #${order.order_number} - $${order.total_amount}`,
          time: new Date(order.created_at).toLocaleDateString(),
          type: 'order'
        })
      })
    }
    
    // Recent users
    if (users && users.length > 0) {
      const recentUsers = users.slice(0, 2)
      recentUsers.forEach(user => {
        activities.push({
          action: `User ${user.name} joined`,
          time: user.joinDate,
          type: 'user'
        })
      })
    }
    
    // Recent products
    if (products && products.length > 0) {
      const recentProducts = products.slice(0, 1)
      recentProducts.forEach(product => {
        activities.push({
          action: `Product "${product.name}" added`,
          time: 'Recently',
          type: 'product'
        })
      })
    }
    
    return activities.slice(0, 5) // Show only 5 recent activities
  }

  return (
    <div className="dashboard-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-container">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10 13,2"/>
              </svg>
            </div>
            <h2 className="logo-text">AI Project</h2>
          </div>
          <div className="sidebar-divider"></div>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Main</div>
            {sidebarItems.slice(0, 3).map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <span className="nav-icon">
                  <item.icon size={20} strokeWidth={1.5} />
                </span>
                <span className="nav-label">{item.label}</span>
                {activeSection === item.id && <div className="nav-indicator"></div>}
              </button>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Catalog</div>
            {sidebarItems.slice(3, 6).map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <span className="nav-icon">
                  <item.icon size={20} strokeWidth={1.5} />
                </span>
                <span className="nav-label">{item.label}</span>
                {activeSection === item.id && <div className="nav-indicator"></div>}
              </button>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Management</div>
            {sidebarItems.slice(6).map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <span className="nav-icon">
                  <item.icon size={20} strokeWidth={1.5} />
                </span>
                <span className="nav-label">{item.label}</span>
                {activeSection === item.id && <div className="nav-indicator"></div>}
              </button>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-sidebar">
            <div className="user-avatar-sidebar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="user-info-sidebar">
              <div className="user-name-sidebar">Admin</div>
              <div className="user-role-sidebar">Administrator</div>
            </div>
          </div>
          
          <div className="sidebar-divider"></div>
          
          <button onClick={handleLogout} className="logout-btn">
            <div className="logout-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </div>
            <span className="logout-text">{t('common.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="dashboard-header">
          <div className="header-content">
            <h1>
              {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}
            </h1>
            <div className="header-actions">
              {/* Language and Theme controls */}
              <div className="header-controls">
                <LanguageSelector iconOnly={true} />
                <div className="theme-selector-wrapper" ref={themeDropdownRef}>
                  <button 
                    className="header-icon-btn theme-toggle-btn"
                    onClick={() => setShowThemeDropdown(!showThemeDropdown)}
                    title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  >
                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                  </button>
                  {showThemeDropdown && (
                    <div className="theme-dropdown">
                      <div 
                        className={`dropdown-item ${!isDarkMode ? 'active' : ''}`}
                        onClick={() => handleThemeSelect('light')}
                      >
                        <Sun size={16} />
                        <span>Light</span>
                      </div>
                      <div 
                        className={`dropdown-item ${isDarkMode ? 'active' : ''}`}
                        onClick={() => handleThemeSelect('dark')}
                      >
                        <Moon size={16} />
                        <span>Dark</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="user-profile">
                <div className="user-avatar">
                  {userEmail.charAt(0).toUpperCase()}
                </div>
                <div className="user-details">
                  <span className="user-name">{t('common.welcome')}</span>
                  <span className="user-email">{userEmail}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-main">
          {schemaWarning && (
            <div className="schema-warning-banner" style={{
              background: 'linear-gradient(90deg, #f59e0b, #f97316)',
              color: 'white',
              padding: '12px 20px',
              margin: '0 0 20px 0',
              borderRadius: '8px',
              fontWeight: '500',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <Clipboard size={16} style={{ display: 'inline', marginRight: '8px' }} />
              <strong>Database Update Required:</strong> To use media features (images/videos), please run the database migration script in your Supabase SQL editor. 
              <a 
                href="#" 
                onClick={() => setSchemaWarning(false)}
                style={{ 
                  color: 'white', 
                  textDecoration: 'underline', 
                  marginLeft: '10px',
                  fontSize: '14px'
                }}
              >
                Dismiss
              </a>
            </div>
          )}
          {renderContent()}
        </main>
      </div>

      {/* Modal */}
      {renderModal()}
    </div>
  )
}

export default Dashboard
