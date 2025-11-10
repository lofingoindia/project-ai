import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  RefreshCw,
  Mail,
  Phone,
  Calendar,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { useDataCache } from '../contexts/DataCacheContext';
import { useDashboardRTL } from '../hooks/useDashboardRTL';
import { db } from '../lib/supabase';
import type { Customer } from '../types';

const Customers: React.FC = () => {
  const { t, isRTL, language } = useLanguage();
  const { state, actions } = useDataCache();
  const rtl = useDashboardRTL();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [customersPerPage] = useState(10);
  const [renderKey, setRenderKey] = useState(0);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    customer: Customer | null;
  }>({ isOpen: false, customer: null });

  const statusOptions = [
    { value: 'all', label: t('customers.allCustomers') },
    { value: 'active', label: t('customers.active') },
    { value: 'inactive', label: t('customers.inactive') }
  ];

  // Load customers from cache on mount
  useEffect(() => {
    actions.fetchCustomers();
  }, []);

  // Force re-render when language changes
  useEffect(() => {
    console.log('🔄 Customers language changed:', language, 'isRTL:', isRTL);
    console.log('🔄 RTL hook values:', {
      isRTL: rtl.isRTL,
      dir: rtl.dir
    });
    setRenderKey(prev => prev + 1);
  }, [language, rtl]);

  // Filter customers when data or filters change
  useEffect(() => {
    filterCustomers();
  }, [state.customers, searchQuery, statusFilter]);

  const loadCustomers = async () => {
    await actions.fetchCustomers(true); // Force refresh
    toast.success(t('customers.refreshed'));
  };

  const filterCustomers = () => {
    let filtered = state.customers;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((customer: Customer) => customer.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((customer: Customer) => 
        (customer.name && customer.name.toLowerCase().includes(searchLower)) ||
        customer.email.toLowerCase().includes(searchLower) ||
        (customer.phone && customer.phone.toLowerCase().includes(searchLower))
      );
    }

    setFilteredCustomers(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleRefresh = () => {
    loadCustomers();
  };

  const handleDeleteClick = (customer: Customer) => {
    setDeleteConfirmation({ isOpen: true, customer });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation.customer) return;
    
    try {
      // Call the actual delete API
      await db.deleteCustomer(deleteConfirmation.customer.id);
      
      // Refresh customers data
      await actions.fetchCustomers(true);
      toast.success(t('customers.deleteSuccess'));
      setDeleteConfirmation({ isOpen: false, customer: null });
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error(t('customers.deleteError'));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ isOpen: false, customer: null });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / customersPerPage);
  const startIndex = (currentPage - 1) * customersPerPage;
  const endIndex = startIndex + customersPerPage;
  const currentCustomers = filteredCustomers.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Show loading only for the first time or if there's an error and no cached data
  const isInitialLoad = state.loading.customers && state.customers.length === 0;

  if (isInitialLoad) {
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
    <div key={renderKey} className={rtl.layout.mainContainer} dir={isRTL ? 'rtl' : 'ltr'}>
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={t('customers.title')}
          isSidebarCollapsed={isSidebarCollapsed}
          onSidebarToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        <main className={rtl.layout.contentArea} style={{ 
          fontFamily: rtl.utils.fontFamily,
          direction: isRTL ? 'rtl' : 'ltr',
          textAlign: isRTL ? 'right' : 'left'
        }}>
          {/* Header Actions */}
          <div className={`flex items-center justify-between mb-6`}>
            <div style={{ textAlign: isRTL ? 'right' : 'left' }}>
              <h2 className={rtl.text.title}>
                {t('customers.allCustomers')}
              </h2>
              <p className={rtl.text.subtitle}>
                {t('customers.showing')} {filteredCustomers.length} {t('customers.of')} {state.customers.length} {t('customers.customers')}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <RefreshCw size={16} className={rtl.spacing.iconSpacing} />
              <span>{t('common.refresh')}</span>
            </button>
          </div>

          {/* Filters */}
          <div className={rtl.components.card + " p-6 mb-6"}>
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-4`}>
              {/* Search */}
              <div className="relative">
                <Search 
                  size={20} 
                  className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} 
                />
                <input
                  type="text"
                  placeholder={t('customers.searchPlaceholder')}
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
                  dir={rtl.forms.inputDir}
                  style={{ textAlign: isRTL ? 'right' : 'left' }}
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
                    w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                    transition-colors duration-200
                    ${isRTL ? 'pr-10 text-right' : 'pl-10'}
                  `}
                  dir={rtl.forms.inputDir}
                  style={{ textAlign: isRTL ? 'right' : 'left' }}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <p className={rtl.text.statValue}>
                    {filteredCustomers.length}
                  </p>
                  <p className={rtl.text.bodyText}>
                    {t('customers.totalCustomers')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customers Table */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            {currentCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Users size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {t('customers.noCustomersFound')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {state.customers.length === 0 
                    ? t('customers.noCustomersMessage')
                    : t('customers.adjustFiltersMessage')
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className={`grid grid-cols-6 gap-4 p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 ${isRTL ? 'text-right' : ''}`}>
                  <div className="font-medium text-gray-700 dark:text-gray-300">
                    {t('customers.customerName')}
                  </div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">
                    {t('customers.contactInfo')}
                  </div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">
                    {t('customers.joinDate')}
                  </div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">
                    {t('customers.totalOrders')}
                  </div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">
                    {t('customers.status')}
                  </div>
                  <div className="font-medium text-gray-700 dark:text-gray-300">
                    {t('customers.actions')}
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                  {currentCustomers.map((customer) => {
                    const formattedDate = formatDate(customer.created_at);
                    return (
                      <div key={customer.id} className={`grid grid-cols-6 gap-4 p-4 ${isRTL ? 'text-right' : ''}`}>
                        {/* Customer Name */}
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {(customer.name || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {customer.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              ID: #{String(customer.id).slice(0, 8)}
                            </p>
                          </div>
                        </div>

                        {/* Contact Info */}
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <Mail size={14} className="text-gray-400" />
                            <span className={`text-xs text-gray-600 dark:text-gray-400 ${isRTL ? 'mr-2' : 'ml-2'}`}>
                              {customer.email}
                            </span>
                          </div>
                          {customer.phone && (
                            <div className="flex items-center">
                              <Phone size={14} className="text-gray-400" />
                              <span className={`text-xs text-gray-600 dark:text-gray-400 ${isRTL ? 'mr-2' : 'ml-2'}`}>
                                {customer.phone}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Join Date */}
                        <div className="flex items-center">
                          <Calendar size={16} className="text-gray-400" />
                          <div className={`${isRTL ? 'mr-2' : 'ml-2'}`}>
                            <p className="text-sm text-gray-900 dark:text-white">
                              {formattedDate.date}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formattedDate.time}
                            </p>
                          </div>
                        </div>

                        {/* Total Orders */}
                        <div className="flex items-center">
                          <ShoppingCart size={16} className="text-blue-600 dark:text-blue-400" />
                          <div className={`${isRTL ? 'mr-2' : 'ml-2'}`}>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {customer.total_orders}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                            {customer.total_orders === 1 ? t('customers.order') : t('customers.orders')}
                          </p>
                          </div>
                        </div>

                        {/* Status */}
                        <div className="flex items-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            customer.status === 'active' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                          }`}>
                            {t(`customers.${customer.status}`)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <button
                            onClick={() => handleDeleteClick(customer)}
                            className="p-2 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 transition-colors duration-200 hover:bg-red-50 dark:hover:bg-red-900/20"
                            title={t('customers.deleteCustomer')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`flex items-center justify-between mt-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {t('customers.showing')} {startIndex + 1} {t('customers.to')} {Math.min(endIndex, filteredCustomers.length)} {t('customers.of')} {filteredCustomers.length} {t('customers.customers')}
              </div>
              
              <div className={`flex items-center space-x-2 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <ChevronLeft size={16} className={`${isRTL ? 'ml-1' : 'mr-1'}`} />
                  {t('common.previous')}
                </button>
                
                <div className="flex space-x-1 rtl:space-x-reverse">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors duration-200 ${
                          currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {t('common.next')}
                  <ChevronRight size={16} className={`${isRTL ? 'mr-1' : 'ml-1'}`} />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Popup */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Blurred Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleDeleteCancel}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              {/* Warning Icon */}
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
                <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              
              {/* Title */}
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {t('customers.deleteCustomerTitle')}
              </h3>
              
              {/* Message */}
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {t('customers.deleteConfirmMessage')} <span className="font-medium text-gray-900 dark:text-white">
                  {deleteConfirmation.customer?.name}
                </span>? {t('customers.deleteWarning')}
              </p>
              
              {/* Action Buttons */}
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;