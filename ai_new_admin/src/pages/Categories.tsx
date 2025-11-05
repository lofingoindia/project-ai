import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  Search, 
  Filter, 
  Eye, 
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Grid3X3,
  List,
  Package,
  Calendar,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/supabase';
import type { Category } from '../types';

const Categories: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view' | 'delete'>('add');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    name_ar: string;
    description: string;
    description_ar: string;
    status: 'active' | 'inactive';
  }>({
    name: '',
    name_ar: '',
    description: '',
    description_ar: '',
    status: 'active'
  });

  const statusOptions = [
    { value: 'all', label: t('categories.allCategories') },
    { value: 'active', label: t('categories.active') },
    { value: 'inactive', label: t('categories.inactive') }
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    filterCategories();
  }, [categories, searchQuery, statusFilter]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await db.getCategories();
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = () => {
    let filtered = categories;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(category => category.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(category => 
        category.name.toLowerCase().includes(searchLower) ||
        (category.name_ar && category.name_ar.toLowerCase().includes(searchLower)) ||
        (category.description && category.description.toLowerCase().includes(searchLower)) ||
        (category.description_ar && category.description_ar.toLowerCase().includes(searchLower))
      );
    }

    setFilteredCategories(filtered);
  };

  const handleRefresh = () => {
    loadCategories();
    toast.success('Categories refreshed');
  };

  const openModal = (type: 'add' | 'edit' | 'view' | 'delete', category?: Category) => {
    setModalType(type);
    setSelectedCategory(category || null);
    
    if (type === 'add') {
      setFormData({
        name: '',
        name_ar: '',
        description: '',
        description_ar: '',
        status: 'active'
      });
    } else if (category && (type === 'edit' || type === 'view')) {
      setFormData({
        name: category.name,
        name_ar: category.name_ar || '',
        description: category.description || '',
        description_ar: category.description_ar || '',
        status: category.status
      });
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
    setFormData({
      name: '',
      name_ar: '',
      description: '',
      description_ar: '',
      status: 'active'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      if (modalType === 'add') {
        await db.createCategory({
          name: formData.name.trim(),
          name_ar: formData.name_ar.trim() || undefined,
          description: formData.description.trim() || undefined,
          description_ar: formData.description_ar.trim() || undefined,
          status: formData.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        toast.success('Category created successfully');
      } else if (modalType === 'edit' && selectedCategory) {
        await db.updateCategory(selectedCategory.id, {
          name: formData.name.trim(),
          name_ar: formData.name_ar.trim() || undefined,
          description: formData.description.trim() || undefined,
          description_ar: formData.description_ar.trim() || undefined,
          status: formData.status,
          updated_at: new Date().toISOString()
        });
        toast.success('Category updated successfully');
      }
      
      await loadCategories();
      closeModal();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(`Failed to ${modalType} category`);
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      await db.deleteCategory(selectedCategory.id);
      toast.success('Category deleted successfully');
      await loadCategories();
      closeModal();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <RefreshCw className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 main-layout" dir={isRTL ? 'rtl' : 'ltr'}>
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={t('categories.title')}
          isSidebarCollapsed={isSidebarCollapsed}
          onSidebarToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header Actions */}
          <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('categories.allCategories')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Showing {filteredCategories.length} of {categories.length} categories
              </p>
            </div>
            <div className={`flex items-center space-x-3 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={() => openModal('add')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200"
              >
                <Plus size={16} className={`${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('categories.addCategory')}
              </button>
              <button
                onClick={handleRefresh}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg font-medium transition-colors duration-200"
              >
                <RefreshCw size={16} className={`${isRTL ? 'ml-2' : 'mr-2'}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Filters and View Controls */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-6">
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center space-x-4 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
                {/* Search */}
                <div className="relative">
                  <Search 
                    size={20} 
                    className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} 
                  />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`
                      w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
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
                <div className="relative">
                  <Filter 
                    size={20} 
                    className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} 
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className={`
                      px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                      bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                      transition-colors duration-200
                      ${isRTL ? 'pr-10 text-right' : 'pl-10'}
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
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
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

          {/* Categories Display */}
          {filteredCategories.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-center py-12">
                <Folder size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {categories.length === 0 ? 'No categories yet' : 'No categories found'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {categories.length === 0 
                    ? 'Create your first category to organize your products'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
                {categories.length === 0 && (
                  <button
                    onClick={() => openModal('add')}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    <Plus size={16} className={`${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('categories.addCategory')}
                  </button>
                )}
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCategories.map((category) => (
                <div key={category.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <Folder size={24} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      category.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {category.status}
                    </span>
                  </div>
                  
                  <div className={`${isRTL ? 'text-right' : ''}`}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {category.name}
                    </h3>
                    {category.name_ar && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {category.name_ar}
                      </p>
                    )}
                    {category.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    
                    <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="flex items-center">
                        <Package size={16} className="text-gray-400" />
                        <span className={`text-sm text-gray-600 dark:text-gray-400 ${isRTL ? 'mr-2' : 'ml-2'}`}>
                          {(category.subcategories?.length || 0)} subcategories
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Calendar size={16} className="text-gray-400" />
                        <span className={`text-sm text-gray-600 dark:text-gray-400 ${isRTL ? 'mr-2' : 'ml-2'}`}>
                          {formatDate(category.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ID: #{typeof category.id === 'string' ? category.id.slice(0, 8) : category.id}
                      </span>
                      <div className={`flex space-x-2 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <button
                          onClick={() => openModal('view', category)}
                          className="p-2 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors duration-200"
                          title="View category"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openModal('edit', category)}
                          className="p-2 text-gray-600 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors duration-200"
                          title="Edit category"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => openModal('delete', category)}
                          className="p-2 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 transition-colors duration-200"
                          title="Delete category"
                        >
                          <Trash2 size={16} />
                        </button>
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
                  Category
                </div>
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  Description
                </div>
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  Subcategories
                </div>
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  Status
                </div>
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  Created
                </div>
                <div className="font-medium text-gray-700 dark:text-gray-300">
                  Actions
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                {filteredCategories.map((category) => (
                  <div key={category.id} className={`grid grid-cols-6 gap-4 p-4 ${isRTL ? 'text-right' : ''}`}>
                    {/* Category Name */}
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Folder size={20} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </p>
                        {category.name_ar && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {category.name_ar}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: #{typeof category.id === 'string' ? category.id.slice(0, 8) : category.id}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {category.description || 'No description'}
                      </p>
                      {category.description_ar && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {category.description_ar}
                        </p>
                      )}
                    </div>

                    {/* Subcategories */}
                    <div className="flex items-center">
                      <Package size={16} className="text-gray-400" />
                      <span className={`text-sm text-gray-600 dark:text-gray-400 ${isRTL ? 'mr-2' : 'ml-2'}`}>
                        {(category.subcategories?.length || 0)}
                      </span>
                    </div>

                    {/* Status */}
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        category.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {category.status}
                      </span>
                    </div>

                    {/* Created Date */}
                    <div className="flex items-center">
                      <Calendar size={16} className="text-gray-400" />
                      <span className={`text-sm text-gray-600 dark:text-gray-400 ${isRTL ? 'mr-2' : 'ml-2'}`}>
                        {formatDate(category.created_at)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className={`flex space-x-2 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <button
                        onClick={() => openModal('view', category)}
                        className="p-2 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors duration-200"
                        title="View category"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => openModal('edit', category)}
                        className="p-2 text-gray-600 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors duration-200"
                        title="Edit category"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => openModal('delete', category)}
                        className="p-2 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 transition-colors duration-200"
                        title="Delete category"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {modalType === 'add' && t('categories.addCategory')}
                {modalType === 'edit' && t('categories.editCategory')}
                {modalType === 'view' && 'View Category'}
                {modalType === 'delete' && 'Delete Category'}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 dark:text-gray-500 transition-colors duration-200"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {modalType === 'delete' ? (
                <div className={`${isRTL ? 'text-right' : ''}`}>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Are you sure you want to delete this category?
                  </p>
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                    {selectedCategory?.name}
                  </p>
                  <div className={`flex space-x-3 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <button
                      onClick={handleDelete}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                      {t('common.delete')}
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors duration-200"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : modalType === 'view' ? (
                <div className={`space-y-4 ${isRTL ? 'text-right' : ''}`}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('categories.categoryName')}
                    </label>
                    <p className="text-gray-900 dark:text-white">{selectedCategory?.name}</p>
                  </div>
                  {selectedCategory?.name_ar && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('categories.categoryNameAr')}
                      </label>
                      <p className="text-gray-900 dark:text-white">{selectedCategory.name_ar}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('categories.description')}
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedCategory?.description || 'No description'}
                    </p>
                  </div>
                  {selectedCategory?.description_ar && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t('categories.descriptionAr')}
                      </label>
                      <p className="text-gray-900 dark:text-white">{selectedCategory.description_ar}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('categories.status')}
                    </label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedCategory?.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {selectedCategory?.status}
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className={`space-y-4 ${isRTL ? 'text-right' : ''}`}>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('categories.categoryName')} *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      placeholder="Enter category name"
                      required
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('categories.categoryNameAr')}
                    </label>
                    <input
                      type="text"
                      value={formData.name_ar}
                      onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      placeholder="أدخل اسم الفئة بالعربية"
                      dir="rtl"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('categories.description')}
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      placeholder="Enter category description"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('categories.descriptionAr')}
                    </label>
                    <textarea
                      value={formData.description_ar}
                      onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      placeholder="أدخل وصف الفئة بالعربية"
                      dir="rtl"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('categories.status')}
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    >
                      <option value="active">{t('categories.active')}</option>
                      <option value="inactive">{t('categories.inactive')}</option>
                    </select>
                  </div>
                  
                  <div className={`flex space-x-3 rtl:space-x-reverse pt-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200"
                    >
                      {modalType === 'add' ? t('common.add') : t('common.save')}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors duration-200"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;