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
import { useDashboardRTL } from '../hooks/useDashboardRTL';
import { db } from '../lib/supabase';
import type { Category } from '../types';

const Categories: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const rtl = useDashboardRTL();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [renderKey, setRenderKey] = useState(0);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit' | 'view' | 'delete'>('add');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
  }>({
    name: '',
    description: ''
  });

  // Force re-render when language changes
  useEffect(() => {
    console.log('🔄 Categories language changed:', language, 'isRTL:', isRTL);
    setRenderKey(prev => prev + 1);
  }, [language, rtl]);

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
      toast.error(t('categories.failedToLoadCategories'));
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
        (category.description && category.description.toLowerCase().includes(searchLower))
      );
    }

    setFilteredCategories(filtered);
  };

  const handleRefresh = () => {
    loadCategories();
    toast.success(t('categories.categoriesRefreshed'));
  };

  const openModal = (type: 'add' | 'edit' | 'view' | 'delete', category?: Category) => {
    setModalType(type);
    setSelectedCategory(category || null);
    
    if (type === 'add') {
      setFormData({
        name: '',
        description: ''
      });
    } else if (category && (type === 'edit' || type === 'view')) {
      setFormData({
        name: category.name,
        description: category.description || ''
      });
    }
    
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCategory(null);
    setFormData({
      name: '',
      description: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error(t('categories.categoryNameRequired'));
      return;
    }

    try {
      if (modalType === 'add') {
        await db.createCategory({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          is_active: true, // Use is_active (boolean) column that exists in database
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any); // Cast to any to bypass TypeScript interface mismatch
        toast.success(t('categories.categoryCreatedSuccessfully'));
      } else if (modalType === 'edit' && selectedCategory) {
        await db.updateCategory(selectedCategory.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          updated_at: new Date().toISOString()
        } as any); // Cast to any to bypass TypeScript interface mismatch
        toast.success(t('categories.categoryUpdatedSuccessfully'));
      }
      
      await loadCategories();
      closeModal();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(t(`categories.failedTo${modalType === 'add' ? 'Create' : 'Update'}Category`));
    }
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      await db.deleteCategory(selectedCategory.id);
      toast.success(t('categories.categoryDeletedSuccessfully'));
      await loadCategories();
      closeModal();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(t('categories.failedToDeleteCategory'));
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
        <div className={rtl.text.bodyText}>
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
          title={t('categories.title')}
          isSidebarCollapsed={isSidebarCollapsed}
          onSidebarToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        <main className={rtl.layout.contentArea} style={{ 
          fontFamily: rtl.utils.fontFamily,
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: isRTL ? 'right' : 'left'
        }}>
          {/* Header Actions */}
          <div className={rtl.layout.headerSection}>
            <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
              <h2 className={rtl.text.title}>
                {t('categories.allCategories')}
              </h2>
              <p className={rtl.text.subtitle}>
                {`${t('common.showing')} ${filteredCategories.length} ${t('common.of')} ${categories.length} ${t('categories.allCategories').toLowerCase()}`}
              </p>
            </div>
            <div className={rtl.flex.spaceBetween}>
              <button
                onClick={() => openModal('add')}
                className={`${rtl.components.button} ${rtl.flex.row}`}
              >
                <Plus size={16} className={rtl.spacing.iconSpacing} />
                {t('categories.addCategory')}
              </button>
              <button
                onClick={handleRefresh}
                className={`${rtl.components.button} ${rtl.flex.row} bg-gray-600`}
              >
                <RefreshCw size={16} className={rtl.spacing.iconSpacing} />
                {t('categories.refresh')}
              </button>
            </div>
          </div>

          {/* Filters and View Controls */}
          <div className={`${rtl.components.card} p-6 mb-6`}>
            <div className={rtl.flex.justifyBetween}>
              <div className={rtl.flex.spaceBetween}>
                {/* Search */}
                <div className="relative">
                  <Search 
                    size={20} 
                    className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} 
                  />
                  <input
                    type="text"
                    placeholder={t('categories.searchCategories')}
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
                    dir={rtl.forms.inputDir}
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
                    dir={rtl.forms.inputDir}
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
            <div className={rtl.components.card}>
              <div className="text-center py-12">
                <Folder size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className={`text-lg font-medium text-gray-900 dark:text-white mb-2 ${rtl.text.sectionHeader}`}>
                  {categories.length === 0 ? t('categories.noCategoriesYet') : t('categories.noCategoriesFound')}
                </h3>
                <p className={`${rtl.text.bodyText} mb-6`}>
                  {categories.length === 0 
                    ? t('categories.createFirstCategory')
                    : t('categories.tryAdjustingSearch')
                  }
                </p>
                {categories.length === 0 && (
                  <button
                    onClick={() => openModal('add')}
                    className={`${rtl.components.button} ${rtl.flex.row}`}
                  >
                    <Plus size={16} className={rtl.spacing.iconSpacing} />
                    {t('categories.addCategory')}
                  </button>
                )}
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCategories.map((category) => (
                <div key={category.id} className={rtl.components.statCard}>
                  <div className={rtl.flex.justifyBetween}>
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                      <Folder size={24} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      category.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                    }`}>
                      {category.status === 'active' ? t('categories.active') : t('categories.inactive')}
                    </span>
                  </div>
                  
                  <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    <h3 className={`text-lg font-semibold text-gray-900 dark:text-white mb-2 ${rtl.text.sectionHeader}`}>
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className={`${rtl.text.bodyText} mb-4 line-clamp-2`}>
                        {category.description}
                      </p>
                    )}
                    
                    <div className={rtl.flex.justifyBetween + ' mb-4'}>
                      <div className={rtl.flex.itemsCenter}>
                        <Package size={16} className="text-gray-400" />
                        <span className={`${rtl.text.bodyText} ${rtl.spacing.textMarginStart}`}>
                          {(category.subcategories?.length || 0)} {t('categories.subcategories')}
                        </span>
                      </div>
                      <div className={rtl.flex.itemsCenter}>
                        <Calendar size={16} className="text-gray-400" />
                        <span className={`${rtl.text.bodyText} ${rtl.spacing.textMarginStart}`}>
                          {formatDate(category.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    <div className={rtl.flex.justifyBetween}>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ID: #{typeof category.id === 'string' ? category.id.slice(0, 8) : category.id}
                      </span>
                      <div className={rtl.lists.itemActions}>
                        <button
                          onClick={() => openModal('view', category)}
                          className="p-2 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors duration-200"
                          title={t('categories.viewCategoryAction')}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openModal('edit', category)}
                          className="p-2 text-gray-600 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors duration-200"
                          title={t('categories.editCategoryAction')}
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => openModal('delete', category)}
                          className="p-2 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 transition-colors duration-200"
                          title={t('categories.deleteCategoryAction')}
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
            <div className={rtl.components.sectionCard + ' overflow-hidden'}>
              {/* Table Header */}
              <div className={`grid grid-cols-6 gap-4 p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600`} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                <div className={`font-medium text-gray-700 dark:text-gray-300 ${rtl.text.sectionHeader}`}>
                  {t('categories.category')}
                </div>
                <div className={`font-medium text-gray-700 dark:text-gray-300 ${rtl.text.sectionHeader}`}>
                  {t('categories.description')}
                </div>
                <div className={`font-medium text-gray-700 dark:text-gray-300 ${rtl.text.sectionHeader}`}>
                  {t('categories.subcategoriesCount')}
                </div>
                <div className={`font-medium text-gray-700 dark:text-gray-300 ${rtl.text.sectionHeader}`}>
                  {t('categories.status')}
                </div>
                <div className={`font-medium text-gray-700 dark:text-gray-300 ${rtl.text.sectionHeader}`}>
                  {t('categories.created')}
                </div>
                <div className={`font-medium text-gray-700 dark:text-gray-300 ${rtl.text.sectionHeader}`}>
                  {t('categories.actions')}
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200 dark:divide-gray-600">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="grid grid-cols-6 gap-4 p-4" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {/* Category Name */}
                    <div className={rtl.flex.itemsCenter}>
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Folder size={20} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className={rtl.spacing.contentSpacing} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                        <p className={`text-sm font-medium text-gray-900 dark:text-white ${rtl.text.sectionHeader}`}>
                          {category.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: #{typeof category.id === 'string' ? category.id.slice(0, 8) : category.id}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <p className={`${rtl.text.bodyText} line-clamp-2`}>
                        {category.description || t('categories.noDescription')}
                      </p>
                    </div>

                    {/* Subcategories */}
                    <div className={rtl.flex.itemsCenter}>
                      <Package size={16} className="text-gray-400" />
                      <span className={`${rtl.text.bodyText} ${rtl.spacing.textMarginStart}`}>
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
                        {category.status === 'active' ? t('categories.active') : t('categories.inactive')}
                      </span>
                    </div>

                    {/* Created Date */}
                    <div className={rtl.flex.itemsCenter}>
                      <Calendar size={16} className="text-gray-400" />
                      <span className={`${rtl.text.bodyText} ${rtl.spacing.textMarginStart}`}>
                        {formatDate(category.created_at)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className={rtl.lists.itemActions}>
                      <button
                        onClick={() => openModal('view', category)}
                        className="p-2 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors duration-200"
                        title={t('categories.viewCategoryAction')}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => openModal('edit', category)}
                        className="p-2 text-gray-600 dark:text-gray-400 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors duration-200"
                        title={t('categories.editCategoryAction')}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => openModal('delete', category)}
                        className="p-2 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 transition-colors duration-200"
                        title={t('categories.deleteCategoryAction')}
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
                {modalType === 'view' && t('categories.viewCategory')}
                {modalType === 'delete' && t('categories.deleteCategory')}
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
                    {t('categories.areYouSureDelete')}
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('categories.description')}
                    </label>
                    <p className="text-gray-900 dark:text-white">
                      {selectedCategory?.description || t('categories.noDescription')}
                    </p>
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
                      placeholder={t('categories.enterCategoryName')}
                      required
                      dir={isRTL ? 'rtl' : 'ltr'}
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
                      placeholder={t('categories.enterCategoryDescription')}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
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