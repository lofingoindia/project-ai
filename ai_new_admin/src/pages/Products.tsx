import { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Eye, 
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Grid3X3,
  List,
  DollarSign,
  Calendar,
  Star,
  X,
  Image as ImageIcon,
  AlertCircle,
  Upload,
  FileText
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { useDataCache } from '../contexts/DataCacheContext';
import { useDashboardRTL } from '../hooks/useDashboardRTL';
import { db, supabase } from '../lib/supabase';
import type { Product, Category } from '../types';

const Products = () => {
  const { t, isRTL, language } = useLanguage();
  const { state, actions } = useDataCache();
  const rtl = useDashboardRTL();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [renderKey, setRenderKey] = useState(0);
  
  // Form states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'edit' | 'view'>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [_uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  // Note: uploadProgress is set but not currently displayed in UI
  
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    price: string;
    category_id: string;
    image_url: string;
    cover_image_url: string;
    images: string[];
    videos: string[];
    pdf_url: string; // Add PDF URL field
    status: 'active' | 'inactive' | 'out_of_stock';
    featured: boolean;
    // New metadata fields
    ideal_for: string;
    age_range: string;
    characters: string[];
    genre: string;
    // Individual product charges
    pdf_charges: string;
    physical_shipment_charges: string;
  }>({
    title: '',
    description: '',
    price: '',
    category_id: '',
    image_url: '',
    cover_image_url: '',
    images: [],
    videos: [],
    pdf_url: '', // Initialize PDF URL
    status: 'active',
    featured: false,
    // Initialize new fields
    ideal_for: '',
    age_range: '',
    characters: [],
    genre: '',
    // Initialize charge fields
    pdf_charges: '',
    physical_shipment_charges: ''
  });

  const statusOptions = [
    { value: 'all', label: t('products.allProducts') },
    { value: 'active', label: t('products.active') },
    { value: 'inactive', label: t('products.inactive') }
  ];

  // Force re-render when language changes
  useEffect(() => {
    console.log('🔄 Products language changed:', language, 'isRTL:', isRTL);
    console.log('🔄 RTL hook values:', {
      title: rtl.text.title,
      isRTL: rtl.isRTL,
      dir: rtl.dir
    });
    setRenderKey(prev => prev + 1);
  }, [language, rtl]);

  useEffect(() => {
    loadProductsFromCache();
    loadCategoriesFromCache();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [state.products, state.categories, searchQuery, statusFilter, categoryFilter]);

  // Debug useEffect to check data consistency
  useEffect(() => {
    if (state.products.length > 0 && state.categories.length > 0) {
      console.log('Categories loaded:', state.categories.map(c => ({ id: c.id, name: c.name })));
      console.log('Products with category_ids:', state.products.map(p => ({ 
        title: p.title, 
        category_id: p.category_id,
        category_name: getCategoryName(p.category_id || '')
      })));
    }
  }, [state.products, state.categories]);

  const loadProductsFromCache = async () => {
    try {
      setLoading(true);
      // Use cache system instead of direct DB calls
      await actions.fetchProducts();
      console.log('Products loaded from cache:', state.products.length);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error(t('messages.error.loadProducts'));
    } finally {
      setLoading(false);
    }
  };

  const loadCategoriesFromCache = async () => {
    try {
      // Use cache system
      await actions.fetchCategories();
      console.log('Categories loaded from cache:', state.categories.length);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const filterProducts = () => {
    let filtered = state.products;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((product: Product) => product.status === statusFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter((product: Product) => product.category_id === categoryFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((product: Product) =>
        product.title.toLowerCase().includes(searchLower) ||
        (product.description && product.description.toLowerCase().includes(searchLower))
      );
    }

    setFilteredProducts(filtered);
  };  // Upload file to Supabase Storage
  const uploadFile = async (file: File, folder: string): Promise<string> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `products/${folder}/${fileName}`;

      const { error } = await supabase.storage
        .from('product-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        // If storage bucket doesn't exist, show helpful error
        if (error.message.includes('not found') || error.message.includes('does not exist')) {
          throw new Error('Storage bucket "product-media" not found. Please create it in Supabase Dashboard.');
        }
        
        // Handle duplicate file names by retrying with timestamp
        if (error.message.includes('duplicate')) {
          const timestamp = Date.now();
          const newFileName = `${Math.random().toString(36).substring(2)}-${timestamp}.${fileExt}`;
          const newFilePath = `products/${folder}/${newFileName}`;
          
          const { error: retryError } = await supabase.storage
            .from('product-media')
            .upload(newFilePath, file, {
              cacheControl: '3600',
              upsert: false
            });
            
          if (retryError) throw retryError;
          
          // Get public URL for retry upload
          const { data: { publicUrl } } = supabase.storage
            .from('product-media')
            .getPublicUrl(newFilePath);
          
          return publicUrl;
        }
        
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-media')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  // Handle single file upload
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: 'cover_image_url'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('messages.error.selectImageFile'));
      return;
    }

    // Validate file size (max 10MB for images)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`${t('messages.error.fileTooLarge').replace('{size}', '10MB')}`);
      return;
    }

    try {
      setUploading(true);
      setUploadProgress({ [fieldName]: 0 });
      
      console.log(`Starting upload for ${fieldName}:`, {
        fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        fileType: file.type
      });
      
      toast.info(t('messages.info.uploadingFile'));
      const url = await uploadFile(file, 'images');
      
      console.log(`Upload successful for ${fieldName}:`, url);
      
      setFormData({ ...formData, [fieldName]: url });
      setUploadProgress({ [fieldName]: 100 });
      toast.success(t('messages.success.fileUploaded'));
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('bucket')) {
          toast.error(t('messages.error.storageConfig'));
        } else if (error.message.includes('policy') || error.message.includes('permission')) {
          toast.error(t('messages.error.uploadPermission'));
        } else if (error.message.includes('authenticated')) {
          toast.error(t('messages.error.authRequired'));
        } else {
          toast.error(`${t('messages.error.uploadFailed')}: ${error.message}`);
        }
      } else {
        toast.error(t('messages.error.uploadFailed'));
      }
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress({}), 2000);
    }
  };

  // Handle multiple files upload (for images and videos arrays)
  const handleMultipleFilesUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: 'images' | 'videos'
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const isVideo = fieldName === 'videos';
    const maxFileSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for videos, 10MB for images
    
    // Validate file types and sizes
    for (const file of files) {
      if (isVideo && !file.type.startsWith('video/')) {
        toast.error(t('messages.error.selectOnlyVideos'));
        return;
      }
      if (!isVideo && !file.type.startsWith('image/')) {
        toast.error(t('messages.error.selectOnlyImages'));
        return;
      }
      if (file.size > maxFileSize) {
        toast.error(`${t('messages.error.fileTooBig').replace('{filename}', file.name).replace('{size}', isVideo ? '50MB' : '10MB')}`);
        return;
      }
    }

    try {
      setUploading(true);
      
      console.log(`Starting batch upload for ${fieldName}:`, {
        fileCount: files.length,
        totalSize: `${(files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)}MB`,
        fileTypes: files.map(f => f.type)
      });
      
      toast.info(`${t('messages.info.uploadingFiles').replace('{count}', files.length.toString())}`);
      
      const folder = isVideo ? 'videos' : 'images';
      const uploadPromises = files.map((file, index) => {
        console.log(`Uploading file ${index + 1}/${files.length}: ${file.name}`);
        return uploadFile(file, folder);
      });
      
      const urls = await Promise.all(uploadPromises);
      
      console.log(`Batch upload successful for ${fieldName}:`, urls);
      
      setFormData({ 
        ...formData, 
        [fieldName]: [...formData[fieldName], ...urls]
      });
      
      toast.success(`${files.length} ${t('messages.success.fileUploaded')}`);
    } catch (error) {
      console.error('Error uploading files:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('bucket')) {
          toast.error(t('messages.error.storageConfig'));
        } else if (error.message.includes('policy') || error.message.includes('permission')) {
          toast.error(t('messages.error.uploadPermission'));
        } else {
          toast.error(`${t('messages.error.uploadFailed')}: ${error.message}`);
        }
      } else {
        toast.error(t('messages.error.uploadFailedSome'));
      }
    } finally {
      setUploading(false);
    }
  };

  // Handle PDF upload to Node.js backend
  const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast.error('Please select a PDF file');
      return;
    }

    // Validate file size (max 50MB for PDFs)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      toast.error('PDF file size must be less than 50MB');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress({ pdf: 0 });

      console.log('Starting PDF upload:', {
        fileName: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        fileType: file.type
      });

      toast.info('Uploading PDF file...');

      // Create FormData for PDF upload
      const pdfFormData = new FormData();
      pdfFormData.append('pdf', file);

      // Upload to backend - replace with your actual backend URL
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002';
      const response = await fetch(`${backendUrl}/api/upload-pdf`, {
        method: 'POST',
        body: pdfFormData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload PDF');
      }

      const result = await response.json();

      if (result.success && result.data?.pdf_url) {
        console.log('PDF upload successful:', result.data);
        
        setFormData({ ...formData, pdf_url: result.data.pdf_url });
        setUploadProgress({ pdf: 100 });
        toast.success('PDF uploaded successfully');
      } else {
        throw new Error('Invalid response from server');
      }

    } catch (error) {
      console.error('Error uploading PDF:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          toast.error('Cannot connect to server. Please check if the backend is running.');
        } else if (error.message.includes('File size')) {
          toast.error('PDF file is too large. Maximum size is 50MB.');
        } else if (error.message.includes('PDF files')) {
          toast.error('Only PDF files are allowed.');
        } else {
          toast.error(`PDF upload failed: ${error.message}`);
        }
      } else {
        toast.error('PDF upload failed. Please try again.');
      }
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress({}), 2000);
    }
  };

  // Clear PDF file
  const clearPDFFile = () => {
    setFormData({ ...formData, pdf_url: '' });
    toast.success('PDF file removed');
  };

  // Remove uploaded file
  const removeFile = (fieldName: 'images' | 'videos', index: number) => {
    const newFiles = [...formData[fieldName]];
    newFiles.splice(index, 1);
    setFormData({ ...formData, [fieldName]: newFiles });
    toast.success(t('messages.success.fileRemoved'));
  };

  // Clear single file
  const clearSingleFile = (fieldName: 'cover_image_url') => {
    setFormData({ ...formData, [fieldName]: '' });
    toast.success(t('messages.success.fileRemoved'));
  };

  const handleRefresh = () => {
    loadProductsFromCache();
    toast.success(t('messages.success.productsRefreshed'));
  };

  const openModal = (type: 'add' | 'edit' | 'view' | 'delete', product?: Product) => {
    if (type === 'delete') {
      setSelectedProduct(product || null);
      setShowDeleteModal(true);
      return;
    }

    setCurrentView(type);
    setSelectedProduct(product || null);
    
    if (type === 'add') {
      setFormData({
        title: '',
        description: '',
        price: '',
        category_id: '',
        image_url: '',
        cover_image_url: '',
        images: [],
        videos: [],
        pdf_url: '', // Initialize PDF URL for add
        status: 'active',
        featured: false,
        // Initialize new fields for add
        ideal_for: '',
        age_range: '',
        characters: [],
        genre: '',
        // Initialize charge fields for add
        pdf_charges: '',
        physical_shipment_charges: ''
      });
    } else if (product && (type === 'edit' || type === 'view')) {
      setFormData({
        title: product.title,
        description: product.description || '',
        price: product.price.toString(),
        category_id: product.category_id || '',
        image_url: product.image_url || '',
        cover_image_url: product.cover_image_url || '',
        images: product.images || [],
        videos: product.videos || [],
        pdf_url: product.pdf_url || '', // Initialize PDF URL for edit/view
        status: product.status,
        featured: product.featured || false,
        // Initialize new fields for edit/view
        ideal_for: product.ideal_for || '',
        age_range: product.age_range || '',
        characters: product.characters || [],
        genre: product.genre || '',
        // Initialize charge fields for edit/view
        pdf_charges: product.pdf_charges?.toString() || '',
        physical_shipment_charges: product.physical_shipment_charges?.toString() || ''
      });
    }
  };

  const closeModal = () => {
    setCurrentView('list');
    setSelectedProduct(null);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error(t('messages.error.productTitleRequired'));
      return;
    }

    if (!formData.price || isNaN(Number(formData.price))) {
      toast.error(t('messages.error.validPriceRequired'));
      return;
    }

    try {
      const productData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        price: Number(formData.price),
        category_id: formData.category_id || undefined,
        image_url: formData.image_url.trim() || undefined,
        cover_image_url: formData.cover_image_url || undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
        videos: formData.videos.length > 0 ? formData.videos : undefined,
        pdf_url: formData.pdf_url.trim() || undefined, // Include PDF URL
        status: formData.status,
        featured: formData.featured,
        // Include new metadata fields
        ideal_for: formData.ideal_for.trim() || undefined,
        age_range: formData.age_range || undefined,
        characters: formData.characters.length > 0 ? formData.characters : undefined,
        genre: formData.genre.trim() || undefined,
        // Include new charge fields
        pdf_charges: formData.pdf_charges && !isNaN(Number(formData.pdf_charges)) ? Number(formData.pdf_charges) : undefined,
        physical_shipment_charges: formData.physical_shipment_charges && !isNaN(Number(formData.physical_shipment_charges)) ? Number(formData.physical_shipment_charges) : undefined,
        updated_at: new Date().toISOString()
      };

      if (currentView === 'add') {
        await db.createProduct({
          ...productData,
          created_at: new Date().toISOString()
        });
        toast.success(t('messages.success.productCreated'));
      } else if (currentView === 'edit' && selectedProduct) {
        await db.updateProduct(selectedProduct.id, productData);
        toast.success(t('messages.success.productUpdated'));
      }
      
      await actions.fetchProducts(true); // Force refresh the cache
      closeModal();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(t('messages.error.failedToSaveProduct').replace('{action}', currentView === 'add' ? t('common.add') : t('common.save')));
    }
  };

  const handleDelete = async () => {
    if (!selectedProduct) return;

    try {
      await db.deleteProduct(selectedProduct.id);
      toast.success(t('messages.success.productDeleted'));
      await actions.fetchProducts(true); // Force refresh the cache
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(t('messages.error.failedToDeleteProduct'));
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(isRTL ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'SYP',
      minimumFractionDigits: 2
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCategoryName = (categoryId: string) => {
    if (!categoryId) {
      return t('products.uncategorized');
    }
    
    // Try to find category by ID (handle both string and number IDs)
    const category = state.categories.find((c: Category) => 
      c.id === categoryId || 
      c.id === String(categoryId) || 
      String(c.id) === categoryId
    );
    
    if (category) {
      return isRTL && category.name_ar ? category.name_ar : category.name;
    }
    
    // If no category found, show a more user-friendly message
    return t('products.uncategorized');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className={`text-center ${rtl.text.bodyText}`}>
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div key={renderKey} className={rtl.layout.mainContainer} dir={isRTL ? 'rtl' : 'ltr'}>
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={t('products.title')}
          isSidebarCollapsed={isSidebarCollapsed}
          onSidebarToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        <main className={rtl.layout.contentArea} style={{ 
          fontFamily: rtl.utils.fontFamily,
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: isRTL ? 'right' : 'left'
        }}>
          {currentView === 'list' ? (
            <>
              {/* Header Actions */}
              <div className={`flex items-center mb-6 ${isRTL ? 'justify-between' : 'justify-between'}`}>
                <div style={{ textAlign: isRTL ? 'right' : 'left' }} className={isRTL ? 'order-1 flex-shrink-0' : 'order-1'}>
                  <h2 className={`text-2xl font-bold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('products.allProducts')}
                  </h2>
                  <p className={`text-gray-600 dark:text-gray-400 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                    {t('products.showingProducts').replace('{filtered}', filteredProducts.length.toString()).replace('{total}', state.products.length.toString())}
                  </p>
                </div>
                <div className={`flex items-center gap-3 flex-shrink-0 ${isRTL ? 'order-2' : 'order-2'}`}>
                  <button
                    onClick={() => openModal('add')}
                    className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <Plus size={16} className={`${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('products.addProduct')}
                  </button>
                  <button
                    onClick={handleRefresh}
                    className={`flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <RefreshCw size={16} className={`${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('products.refresh')}
                  </button>
                  
                </div>
              </div>

              {/* Filters and View Controls */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
                <div className={`flex flex-col lg:flex-row lg:items-center gap-4 ${isRTL ? 'lg:justify-end lg:flex-row' : 'lg:justify-between'}`}>
                  {/* Filters Section */}
                  <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-4 ${isRTL ? 'sm:flex-row sm:justify-end sm:ml-auto' : 'sm:justify-start flex-1'}`}>
                    {/* Search */}
                    <div className="relative flex-1 min-w-0 sm:max-w-xs">
                      <Search 
                        size={20} 
                        className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} 
                      />
                      <input
                        type="text"
                        placeholder={t('products.searchProducts')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`
                          w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                          placeholder-gray-500 dark:placeholder-gray-400
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                          transition-colors duration-200
                          ${isRTL ? 'pr-10 text-right' : 'pl-10'}
                        `}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>

                    {/* Status Filter */}
                    <div className="relative flex-shrink-0">
                      <Filter 
                        size={20} 
                        className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none ${isRTL ? 'right-3' : 'left-3'}`} 
                      />
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className={`
                          min-w-[140px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                          transition-colors duration-200 appearance-none
                          ${isRTL ? 'pr-10 text-right' : 'pl-10 pr-8'}
                        `}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      >
                        {statusOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Category Filter */}
                    <div className="relative flex-shrink-0">
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className={`
                          min-w-[140px] px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                          bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                          focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                          transition-colors duration-200 appearance-none
                          ${isRTL ? 'text-right' : ''}
                        `}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      >
                        <option value="all">{t('products.allCategories')}</option>
                        {state.categories.map((category: Category) => (
                          <option key={category.id} value={category.id}>
                            {isRTL && category.name_ar ? category.name_ar : category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* View Mode Toggle */}
                  <div className={`flex items-center gap-2 flex-shrink-0 ${isRTL ? 'lg:order-last lg:mr-auto' : 'lg:order-last'}`}>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-lg transition-colors duration-200 ${
                        viewMode === 'grid'
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      <Grid3X3 size={20} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors duration-200 ${
                        viewMode === 'list'
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      <List size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Products Display */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-center py-12">
                    <Package size={64} className="mx-auto text-gray-400 mb-4" />
                    <h3 className={`text-lg font-medium text-gray-900 dark:text-white mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {state.products.length === 0 ? t('products.noProductsYet') : t('products.noProductsFound')}
                    </h3>
                    <p className={`text-gray-600 dark:text-gray-400 mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                      {state.products.length === 0 
                        ? t('products.createFirstProduct')
                        : t('products.adjustSearchFilter')
                      }
                    </p>
                    {state.products.length === 0 && (
                      <button
                        onClick={() => openModal('add')}
                        className={`inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
                      >
                        <Plus size={16} className={`${isRTL ? 'ml-2' : 'mr-2'}`} />
                        {t('products.addProduct')}
                      </button>
                    )}
                  </div>
                </div>
              ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {/* Product Image */}
                  <div className="relative h-48 bg-gray-100 dark:bg-gray-700">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={48} className="text-gray-400" />
                      </div>
                    )}
                    
                    {/* Featured Badge */}
                    {product.featured && (
                      <div className="absolute top-2 left-2">
                        <div className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full flex items-center">
                          <Star size={12} className="mr-1" />
                          {t('products.featured')}
                        </div>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className="absolute top-2 right-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {product.status === 'active' ? t('products.statusActive') : 
                         product.status === 'inactive' ? t('products.statusInactive') : 
                         product.status === 'out_of_stock' ? t('products.statusOutOfStock') : 
                         product.status}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className={`${isRTL ? 'text-right' : ''}`}>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                        {product.title}
                      </h3>
                      {product.title_ar && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {product.title_ar}
                        </p>
                      )}
                      
                      <div className={`flex items-center justify-between mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {formatPrice(product.price)}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {getCategoryName(product.category_id || '')}
                        </div>
                      </div>

                      {/* Charge Information */}
                      {(product.pdf_charges !== undefined && product.pdf_charges !== null) || 
                       (product.physical_shipment_charges !== undefined && product.physical_shipment_charges !== null) ? (
                        <div className="mb-3">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {product.pdf_charges !== undefined && product.pdf_charges !== null && (
                              <div className="flex items-center">
                                <span className="text-gray-500 dark:text-gray-400">{t('products.pdfCharges')}:</span>
                                <span className="text-blue-600 dark:text-blue-400 ml-1 font-medium">
                                  {product.pdf_charges.toFixed(2)} SYP
                                </span>
                              </div>
                            )}
                            {product.physical_shipment_charges !== undefined && product.physical_shipment_charges !== null && (
                              <div className="flex items-center">
                                <span className="text-gray-500 dark:text-gray-400">{t('products.ship')}:</span>
                                <span className="text-green-600 dark:text-green-400 ml-1 font-medium">
                                  {product.physical_shipment_charges.toFixed(2)} SYP
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                      
                      <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="flex items-center">
                          <Calendar size={16} className="text-gray-400" />
                          <span className={`text-sm text-gray-600 dark:text-gray-400 ${isRTL ? 'mr-2' : 'ml-2'}`}>
                            {formatDate(product.created_at)}
                          </span>
                        </div>
                      </div>
                      
                      <div className={`flex items-center ${isRTL ? 'justify-between' : 'justify-between'}`}>
                        <div className={`flex gap-2 ${isRTL ? 'order-2' : 'order-2'}`}>
                          <button
                            onClick={() => openModal('view', product)}
                            className="p-2 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors duration-200"
                            title={t('products.viewProductAction')}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => openModal('edit', product)}
                            className="p-2 text-gray-600 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors duration-200"
                            title={t('products.editProductAction')}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => openModal('delete', product)}
                            className="p-2 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 transition-colors duration-200"
                            title={t('products.deleteProductTooltip')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <span className={`text-xs text-gray-500 dark:text-gray-400 ${isRTL ? 'order-1' : 'order-1'}`}>
                          {t('products.id')}: #{typeof product.id === 'string' ? product.id.slice(0, 8) : product.id}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              {/* Table Header */}
              <div className={`grid grid-cols-6 gap-4 p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 ${isRTL ? 'text-right' : ''}`}>
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  {t('products.tableProduct')}
                </div>
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  {t('products.tablePrice')}
                </div>
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  {t('products.tableCategory')}
                </div>
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  {t('products.tableStatus')}
                </div>
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  {t('products.tableCreated')}
                </div>
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  {t('products.tableActions')}
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                {filteredProducts.map((product) => (
                  <div key={product.id} className={`grid grid-cols-6 gap-4 p-4 ${isRTL ? 'text-right' : ''}`}>
                    {/* Product */}
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        {product.image_url ? (
                          <img 
                            src={product.image_url} 
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon size={20} className="text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
                        <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                          {product.title}
                          {product.featured && (
                            <Star size={12} className="inline ml-1 text-yellow-500" />
                          )}
                        </p>
                        {product.title_ar && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {product.title_ar}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t('products.id')}: #{typeof product.id === 'string' ? product.id.slice(0, 8) : product.id}
                        </p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="flex items-center">
                      <DollarSign size={16} className="text-gray-400" />
                      <span className={`text-sm font-medium text-gray-900 dark:text-white ${isRTL ? 'mr-1' : 'ml-1'}`}>
                        {formatPrice(product.price)}
                      </span>
                    </div>

                    {/* Category */}
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {getCategoryName(product.category_id || '')}
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {product.status === 'active' ? t('products.statusActive') : 
                         product.status === 'inactive' ? t('products.statusInactive') : 
                         product.status === 'out_of_stock' ? t('products.statusOutOfStock') : 
                         product.status}
                      </span>
                    </div>

                    {/* Created Date */}
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-400" />
                      <span className={`text-sm text-gray-600 dark:text-gray-400 ${isRTL ? 'mr-2' : 'ml-2'}`}>
                        {formatDate(product.created_at)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className={`flex gap-2 ${isRTL ? 'justify-end' : 'justify-start'}`}>
                      <button
                        onClick={() => openModal('view', product)}
                        className="p-2 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors duration-200"
                        title={t('products.viewProductTooltip')}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => openModal('edit', product)}
                        className="p-2 text-gray-600 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors duration-200"
                        title={t('products.editProductTooltip')}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => openModal('delete', product)}
                        className="p-2 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 transition-colors duration-200"
                        title={t('products.deleteProductTooltip')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
            </>
          ) : (
            /* Form Views */
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              {/* Form Header */}
              <div className={`flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600`}>
                <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                  {currentView === 'add' && t('products.addProduct')}
                  {currentView === 'edit' && t('products.editProduct')}
                  {currentView === 'view' && t('products.viewProduct')}
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6">
                {currentView === 'view' ? (
                  <div className={`space-y-6`} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {/* Product Image */}
                    {selectedProduct?.image_url && (
                      <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img 
                          src={selectedProduct.image_url} 
                          alt={selectedProduct.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.productTitle')}
                        </label>
                        <p className="text-gray-900 dark:text-white">{selectedProduct?.title}</p>
                      </div>
                      
                      {selectedProduct?.title_ar && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('products.productTitleAr')}
                          </label>
                          <p className="text-gray-900 dark:text-white">{selectedProduct.title_ar}</p>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.price')}
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {selectedProduct && formatPrice(selectedProduct.price)}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.category')}
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {getCategoryName(selectedProduct?.category_id || '')}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.status')}
                        </label>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          selectedProduct?.status === 'active'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                        }`}>
                          {selectedProduct?.status === 'active' ? t('products.statusActive') : 
                           selectedProduct?.status === 'inactive' ? t('products.statusInactive') : 
                           selectedProduct?.status === 'out_of_stock' ? t('products.statusOutOfStock') : 
                           selectedProduct?.status}
                        </span>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.featured')}
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {selectedProduct?.featured ? t('products.yes') : t('products.no')}
                        </p>
                      </div>

                      {/* New metadata fields in view mode */}
                      {selectedProduct?.ideal_for && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('products.idealFor')}
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {selectedProduct.ideal_for}
                          </p>
                        </div>
                      )}

                      {selectedProduct?.age_range && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('products.ageRange')}
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {selectedProduct.age_range}
                          </p>
                        </div>
                      )}

                      {selectedProduct?.characters && selectedProduct.characters.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('products.characters')}
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {Array.isArray(selectedProduct.characters) ? selectedProduct.characters.join(', ') : selectedProduct.characters}
                          </p>
                        </div>
                      )}

                      {selectedProduct?.genre && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('products.genre')}
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {selectedProduct.genre}
                          </p>
                        </div>
                      )}

                      {selectedProduct?.pdf_charges !== undefined && selectedProduct?.pdf_charges !== null && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('products.pdfChargesLabel')}
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {selectedProduct.pdf_charges.toFixed(2)}
                          </p>
                        </div>
                      )}

                      {selectedProduct?.physical_shipment_charges !== undefined && selectedProduct?.physical_shipment_charges !== null && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            {t('products.physicalShipmentChargesLabel')}
                          </label>
                          <p className="text-gray-900 dark:text-white">
                            {selectedProduct.physical_shipment_charges.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* PDF File Information */}
                    {selectedProduct?.pdf_url && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Product PDF File
                        </label>
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <a
                            href={selectedProduct.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            View PDF File
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {selectedProduct?.description && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.description')}
                        </label>
                        <p className="text-gray-900 dark:text-white">
                          {selectedProduct.description}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className={`space-y-4`} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Product Title and Description in same line */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.productTitle')} *
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                          placeholder={t('products.enterProductTitle')}
                          required
                          dir={isRTL ? 'rtl' : 'ltr'}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.description')}
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                          placeholder={t('products.enterProductDescriptionPlaceholder')}
                          dir={isRTL ? 'rtl' : 'ltr'}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.priceSAR')} *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                          placeholder={t('products.pricePlaceholder')}
                          required
                        />
                      </div>

                      {/* PDF Charges */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.pdfChargesLabel')}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.pdf_charges}
                          onChange={(e) => setFormData({ ...formData, pdf_charges: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                          placeholder={t('products.pdfChargesPlaceholder')}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t('products.pdfChargesHelp')}
                        </p>
                      </div>

                      {/* Physical Shipment Charges */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.physicalShipmentChargesLabel')}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.physical_shipment_charges}
                          onChange={(e) => setFormData({ ...formData, physical_shipment_charges: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                          placeholder={t('products.physicalShipmentChargesPlaceholder')}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t('products.physicalShipmentChargesHelp')}
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.category')}
                        </label>
                        <select
                          value={formData.category_id}
                          onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                          dir={isRTL ? 'rtl' : 'ltr'}
                        >
                          <option value="">{t('products.selectCategory')}</option>
                          {state.categories.map((category: Category) => (
                            <option key={category.id} value={category.id}>
                              {isRTL && category.name_ar ? category.name_ar : category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Cover Image and Additional Images in the same horizontal line */}
                      <div className="md:col-span-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Cover Image */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('products.coverImageLabel')}
                          </label>
                          {formData.cover_image_url ? (
                            <div className="relative group">
                              <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 shadow-sm">
                                <img 
                                  src={formData.cover_image_url} 
                                  alt={t('products.coverPreview')}
                                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => clearSingleFile('cover_image_url')}
                                className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg"
                              >
                                <X size={16} />
                              </button>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-3 rounded-b-lg">
                                <p className="text-white text-sm font-medium">{t('products.coverImage')}</p>
                              </div>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 group">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-10 h-10 mb-3 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                                  <span className="font-semibold">{t('products.clickToUpload')}</span><br />
                                  <span className="text-xs">{t('products.orDragDrop')}</span>
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{t('products.imageFormats')}</p>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, 'cover_image_url')}
                              />
                            </label>
                          )}
                        </div>

                        {/* Additional Images Upload (Gallery) */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t('products.additionalImagesLabel')}
                          </label>
                          <div className="space-y-3">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 group">
                              <div className="flex flex-col items-center justify-center pt-3 pb-3">
                                <ImageIcon className="w-8 h-8 mb-2 text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                                  <span className="font-semibold">{t('products.clickToUploadText')}</span><br />
                                  <span className="text-xs">{t('products.multipleImagesUploadText')}</span>
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{t('products.selectMultipleFilesText')}</p>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={(e) => handleMultipleFilesUpload(e, 'images')}
                              />
                            </label>
                            
                            {formData.images.length > 0 && (
                              <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                  {formData.images.map((img, index) => (
                                    <div key={index} className="relative group">
                                      <div className="w-full h-16 bg-white dark:bg-gray-600 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-500 shadow-sm">
                                        <img
                                          src={img}
                                          alt={`${t('products.gallery')} ${index + 1}`}
                                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                                        />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => removeFile('images', index)}
                                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-600 shadow-lg"
                                      >
                                        <X size={12} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Additional Videos Upload */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('products.additionalVideos')}
                        </label>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">{t('products.uploadMultipleVideos')}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('products.selectMultipleFilesText')} {t('products.maxSize50MBEach')}</p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept="video/*"
                            multiple
                            onChange={(e) => handleMultipleFilesUpload(e, 'videos')}
                          />
                        </label>
                        {formData.videos.length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {formData.videos.map((video, index) => (
                              <div key={index} className="relative">
                                <video
                                  src={video}
                                  className="h-24 w-full object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                                  controls
                                />
                                <button
                                  type="button"
                                  onClick={() => removeFile('videos', index)}
                                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* PDF Upload */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Product PDF File
                        </label>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Click to upload PDF file
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              PDF files only, max 50MB
                            </p>
                          </div>
                          <input
                            type="file"
                            className="hidden"
                            accept=".pdf,application/pdf"
                            onChange={handlePDFUpload}
                          />
                        </label>
                        {formData.pdf_url && (
                          <div className="mt-3 flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
                              <div>
                                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                                  PDF uploaded successfully
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-400">
                                  File is ready for use
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => window.open(formData.pdf_url, '_blank')}
                                className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                                title="View PDF"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={clearPDFFile}
                                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
                                title="Remove PDF"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>


                      {/* New metadata fields */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.idealForLabel')}
                        </label>
                        <input
                          type="text"
                          value={formData.ideal_for || ''}
                          onChange={(e) => setFormData({ ...formData, ideal_for: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                          placeholder={t('products.idealForPlaceholder')}
                          dir={isRTL ? 'rtl' : 'ltr'}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.ageRangeLabel')}
                        </label>
                        <select
                          value={formData.age_range || ''}
                          onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                        >
                          <option value="">{t('products.selectAgeRangeOption')}</option>
                          <option value="0-2 years old">{t('products.ageOption0to2')}</option>
                          <option value="3-5 years old">{t('products.ageOption3to5')}</option>
                          <option value="6-8 years old">{t('products.ageOption6to8')}</option>
                          <option value="9-12 years old">{t('products.ageOption9to12')}</option>
                          <option value="13-17 years old">{t('products.ageOption13to17')}</option>
                          <option value="18+ years old">{t('products.ageOption18Plus')}</option>
                          <option value="All ages">{t('products.ageOptionAllAges')}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.charactersLabel')}
                        </label>
                        <input
                          type="text"
                          value={Array.isArray(formData.characters) ? formData.characters.join(', ') : ''}
                          onChange={(e) => {
                            const chars = e.target.value.split(',').map(c => c.trim()).filter(c => c);
                            setFormData({ ...formData, characters: chars });
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                          placeholder={t('products.charactersPlaceholder')}
                          dir={isRTL ? 'rtl' : 'ltr'}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {t('products.genreLabel')}
                        </label>
                        <input
                          type="text"
                          value={formData.genre || ''}
                          onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                          placeholder={t('products.genrePlaceholder')}
                          dir={isRTL ? 'rtl' : 'ltr'}
                        />
                      </div>
                    </div>
                    
                    {/* Upload Progress Indicator */}
                    {uploading && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <div className="flex items-center">
                          <RefreshCw className={`animate-spin h-5 w-5 text-blue-600 dark:text-blue-400 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                          <span className="text-sm text-blue-700 dark:text-blue-300">
                            {t('products.uploadingFiles')}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className={`flex gap-3 pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <button
                        type="submit"
                        disabled={uploading}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {currentView === 'add' ? t('common.add') : t('common.save')}
                      </button>
                      <button
                        type="button"
                        onClick={closeModal}
                        disabled={uploading}
                        className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t('common.cancel')}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete Modal with Blurred Background */}
      {showDeleteModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600`}>
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>
                {t('products.deleteProductTitle')}
              </h3>
              <button
                onClick={closeDeleteModal}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                <div className={`flex items-center mb-4 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                  <AlertCircle size={24} className={`text-red-500 ${isRTL ? 'ml-3' : 'mr-3'}`} />
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('products.deleteProductConfirm')}
                  </p>
                </div>
                <p className={`text-lg font-medium text-gray-900 dark:text-white mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {selectedProduct?.title}
                </p>
                <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
                  >
                    {t('common.delete')}
                  </button>
                  <button
                    onClick={closeDeleteModal}
                    className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200"
                  >
                    {t('common.cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;