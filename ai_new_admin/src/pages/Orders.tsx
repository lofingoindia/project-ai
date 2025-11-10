import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Eye, 
  RefreshCw,
  User,
  Calendar,
  DollarSign,
  Package,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { useDataCache } from '../contexts/DataCacheContext';
import { useDashboardRTL } from '../hooks/useDashboardRTL';
import type { Order } from '../types';

const Orders: React.FC = () => {
  const navigate = useNavigate();
  const { t, language, isRTL } = useLanguage();
  const { state, actions } = useDataCache();
  const rtl = useDashboardRTL();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(10);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [renderKey, setRenderKey] = useState(0);

  // Force re-render when language changes
  useEffect(() => {
    console.log('🔄 Orders language changed:', language, 'isRTL:', isRTL);
    setRenderKey(prev => prev + 1);
  }, [language, rtl]);

  const statusOptions = [
    { value: 'all', label: t('orders.allOrders') },
    { value: 'pending', label: t('orders.pending') },
    { value: 'confirmed', label: t('orders.confirmed') },
    { value: 'processing', label: t('orders.processing') },
    { value: 'shipped', label: t('orders.shipped') },
    { value: 'completed', label: t('orders.completed') },
    { value: 'cancelled', label: t('orders.cancelled') }
  ];

  // Status options for the dropdown (excluding 'all')
  const editableStatusOptions = [
    { value: 'pending', label: t('orders.pending') },
    { value: 'confirmed', label: t('orders.confirmed') },
    { value: 'processing', label: t('orders.processing') },
    { value: 'shipped', label: t('orders.shipped') },
    { value: 'completed', label: t('orders.completed') },
    { value: 'cancelled', label: t('orders.cancelled') }
  ];

  // Load orders from cache on mount
  useEffect(() => {
    actions.fetchOrders();
  }, []);

  // Filter orders when data or filters change
  useEffect(() => {
    filterOrders();
  }, [state.orders, searchQuery, statusFilter]);

  const loadOrders = async () => {
    await actions.fetchOrders(true); // Force refresh
    toast.success(t('orders.ordersRefreshed'));
  };

  const filterOrders = () => {
    let filtered = state.orders;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order: Order) => order.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((order: Order) => 
        order.id.toLowerCase().includes(searchLower) ||
        (order.user?.email && order.user.email.toLowerCase().includes(searchLower)) ||
        (order.user?.full_name && order.user.full_name.toLowerCase().includes(searchLower)) ||
        (order.app_users?.email && order.app_users.email.toLowerCase().includes(searchLower)) ||
        (order.app_users?.full_name && order.app_users.full_name.toLowerCase().includes(searchLower)) ||
        (order.shipping_address?.full_name && order.shipping_address.full_name.toLowerCase().includes(searchLower))
      );
    }

    setFilteredOrders(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleRefresh = () => {
    console.log('Refreshing orders...');
    loadOrders();
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/orders/${orderId}`);
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrderToDelete(orderId);
    setShowDeleteModal(true);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    
    try {
      setDeleting(true);
      // Call API to delete order
      // await db.deleteOrder(orderToDelete);
      
      // Refresh orders data
      await actions.fetchOrders(true);
      
      toast.success(t('orders.orderDeletedSuccessfully'));
      setShowDeleteModal(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error(t('orders.failedToDeleteOrder'));
    } finally {
      setDeleting(false);
    }
  };

  const cancelDeleteOrder = () => {
    setShowDeleteModal(false);
    setOrderToDelete(null);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      setUpdatingStatus(orderId);
      await actions.updateOrderStatus(orderId, newStatus);
      toast.success(`${t('orders.orderStatusUpdatedTo')} ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(t('orders.failedToUpdateOrderStatus'));
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'processing': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'shipped': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
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
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + ordersPerPage;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Show loading only for the first time or if there's an error and no cached data
  const isInitialLoad = state.loading.orders && state.orders.length === 0;

  if (isInitialLoad) {
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
          title={t('orders.title')}
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
                {t('orders.allOrders')}
              </h2>
              <p className={rtl.text.subtitle}>
                {t('orders.showingOrdersOf').replace('{filtered}', filteredOrders.length.toString()).replace('{total}', state.orders.length.toString())}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className={`flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <RefreshCw size={16} className={rtl.spacing.iconSpacing} />
              <span>{t('orders.refresh')}</span>
            </button>
          </div>

          {/* Filters */}
          <div className={rtl.components.card + " p-6 mb-6"}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search 
                  size={20} 
                  className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} 
                />
                <input
                  type="text"
                  placeholder={t('orders.searchOrdersCustomers')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${isRTL ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'}`}
                  dir={rtl.forms.inputDir}
                  style={{ textAlign: isRTL ? 'right' : 'left' }}
                />
              </div>

              {/* Status Filter */}
              <div className="relative">
                <Filter 
                  size={20} 
                  className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none ${isRTL ? 'right-3' : 'left-3'}`} 
                />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 appearance-none cursor-pointer ${isRTL ? 'pr-10 pl-8 text-right' : 'pl-10 pr-8 text-left'}`}
                  dir={rtl.forms.inputDir}
                  style={{ textAlign: isRTL ? 'right' : 'left' }}
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {/* Custom dropdown arrow */}
                <div className={`absolute top-1/2 transform -translate-y-1/2 pointer-events-none ${isRTL ? 'left-3' : 'right-3'}`}>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <p className={rtl.text.statValue}>
                    {filteredOrders.length}
                  </p>
                  <p className={rtl.text.bodyText}>
                    {t('orders.totalOrders')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className={rtl.components.card + " overflow-hidden"}>
            {currentOrders.length === 0 ? (
              <div className="text-center py-12" style={{ textAlign: 'center' }}>
                <ShoppingCart size={64} className="mx-auto text-gray-400 mb-4" />
                <h3 className={rtl.text.sectionHeader + " mb-2"} style={{ textAlign: 'center' }}>
                  {t('orders.noOrdersFound')}
                </h3>
                <p className={rtl.text.bodyText} style={{ textAlign: 'center' }}>
                  {state.orders.length === 0 
                    ? t('orders.whenCustomersStartPlacing')
                    : t('orders.tryAdjustingSearch')
                  }
                </p>
              </div>
            ) : (
              <>
                {/* Table Header - Desktop */}
                <div className={`hidden lg:grid grid-cols-8 gap-4 p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600`}>
                  <div className={rtl.text.bodyText + " font-medium text-gray-700 dark:text-gray-300"} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {t('orders.orderNumber')}
                  </div>
                  <div className={rtl.text.bodyText + " font-medium text-gray-700 dark:text-gray-300"} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {t('orders.customer')}
                  </div>
                  <div className={rtl.text.bodyText + " font-medium text-gray-700 dark:text-gray-300"} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {t('orders.date')}
                  </div>
                  <div className={rtl.text.bodyText + " font-medium text-gray-700 dark:text-gray-300"} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {t('orders.total')}
                  </div>
                  <div className={rtl.text.bodyText + " font-medium text-gray-700 dark:text-gray-300"} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {t('orders.status')}
                  </div>
                  <div className={rtl.text.bodyText + " font-medium text-gray-700 dark:text-gray-300"} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {t('orders.items')}
                  </div>
                  <div className={rtl.text.bodyText + " font-medium text-gray-700 dark:text-gray-300"} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {t('orders.actions')}
                  </div>
                </div>

                {/* Table Header - Mobile */}
                <div className={`lg:hidden grid grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600`}>
                  <div className={rtl.text.bodyText + " font-medium text-gray-700 dark:text-gray-300"} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {t('orders.orderAndCustomer')}
                  </div>
                  <div className={rtl.text.bodyText + " font-medium text-gray-700 dark:text-gray-300"} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {t('orders.bookDetails')}
                  </div>
                  <div className={rtl.text.bodyText + " font-medium text-gray-700 dark:text-gray-300"} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {t('orders.statusAndActions')}
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                  {currentOrders.map((order) => {
                    const formattedDate = formatDate(order.created_at);
                    // Get the first book from order items for display
                    const firstBook = order.order_items?.[0]?.books || order.order_items?.[0]?.book;
                    const totalBooks = order.order_items?.length || 0;
                    
                    return (
                      <div key={order.id}>
                        {/* Desktop Layout */}
                        <div className="hidden lg:grid grid-cols-8 gap-4 p-4" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                          {/* Order Number */}
                          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                              <ShoppingCart size={16} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className={rtl.spacing.textMarginStart}>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                #{order.id.slice(0, 8)}
                              </p>
                            </div>
                          </div>

                          {/* Customer */}
                          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                              <User size={14} className="text-gray-600 dark:text-gray-400" />
                            </div>
                            <div className={`flex-1 min-w-0 ${rtl.spacing.textMarginStart}`}>
                              <p className="text-sm text-gray-900 dark:text-white truncate">
                                {order.shipping_address?.full_name || order.user?.full_name || order.app_users?.full_name || t('orders.unknown')}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {order.user?.email || order.app_users?.email || t('orders.noEmail')}
                              </p>
                            </div>
                          </div>

                          {/* Date */}
                          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Calendar size={16} className="text-gray-400 flex-shrink-0" />
                            <div className={rtl.spacing.textMarginStart}>
                              <p className="text-sm text-gray-900 dark:text-white">
                                {formattedDate.date}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formattedDate.time}
                              </p>
                            </div>
                          </div>

                          {/* Total */}
                          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <DollarSign size={16} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                            <span className={`text-sm font-medium text-gray-900 dark:text-white ${rtl.utils.margin('start', '1')}`}>
                              ${order.total_amount}
                            </span>
                          </div>

                          {/* Status */}
                          <div className="flex items-center">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              disabled={updatingStatus === order.id}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium border-0 cursor-pointer w-full transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${getStatusColor(order.status)} ${updatingStatus === order.id ? 'animate-pulse' : ''}`}
                              dir={rtl.forms.inputDir}
                              style={{ textAlign: isRTL ? 'right' : 'left' }}
                            >
                              {editableStatusOptions.map(option => (
                                <option 
                                  key={option.value} 
                                  value={option.value}
                                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Items */}
                          <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Package size={16} className="text-gray-400 flex-shrink-0" />
                            <span className={`text-sm text-gray-600 dark:text-gray-400 ${rtl.spacing.textMarginStart}`}>
                              {order.order_items?.length || 0} {t('orders.itemsCount')}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <button
                              onClick={() => handleViewOrder(order.id)}
                              className="p-2 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                              title={t('orders.viewOrderDetails')}
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-2 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                              title={t('orders.deleteOrder')}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Mobile Layout */}
                        <div className="lg:hidden grid grid-cols-3 gap-4 p-4" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                          {/* Order & Customer Info */}
                          <div className="flex flex-col space-y-2">
                            <div className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                <ShoppingCart size={12} className="text-blue-600 dark:text-blue-400" />
                              </div>
                              <div className={rtl.spacing.textMarginStart}>
                                <p className="text-xs font-medium text-gray-900 dark:text-white">
                                  #{order.id.slice(0, 8)}
                                </p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {order.shipping_address?.full_name || order.user?.full_name || order.app_users?.full_name || t('orders.unknown')}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {formattedDate.date}
                              </p>
                            </div>
                          </div>

                          {/* Book Details */}
                          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <div className="w-10 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Package size={16} className="text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              {firstBook ? (
                                <>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {firstBook.title}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    ${order.total_amount} • {totalBooks} {totalBooks !== 1 ? t('orders.itemsCount') : t('orders.itemsCount').slice(0, -1)}
                                  </p>
                                </>
                              ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {t('orders.noBooks')}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Status & Actions */}
                          <div className="flex flex-col space-y-2">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              disabled={updatingStatus === order.id}
                              className={`px-2 py-1 rounded-lg text-xs font-medium border-0 cursor-pointer appearance-none w-full transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${getStatusColor(order.status)} ${updatingStatus === order.id ? 'animate-pulse' : ''}`}
                              dir={rtl.forms.inputDir}
                              style={{ textAlign: isRTL ? 'right' : 'left' }}
                            >
                              {editableStatusOptions.map(option => (
                                <option 
                                  key={option.value} 
                                  value={option.value}
                                  className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                >
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-start' : 'justify-start'}`}>
                              <button
                                onClick={() => handleViewOrder(order.id)}
                                className="p-1.5 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                                title={t('orders.viewOrderDetails')}
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                onClick={() => handleDeleteOrder(order.id)}
                                className="p-1.5 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                                title={t('orders.deleteOrder')}
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
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
            <div className={`flex items-center justify-between mt-6`}>
              <div className={rtl.text.bodyText}>
                {t('orders.showingPagination')
                  .replace('{start}', (startIndex + 1).toString())
                  .replace('{end}', Math.min(endIndex, filteredOrders.length).toString())
                  .replace('{total}', filteredOrders.length.toString())}
              </div>
              
              <div className={`flex items-center gap-2`}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <ChevronLeft size={16} className={rtl.spacing.iconSpacing} />
                  <span>{t('common.previous')}</span>
                </button>
                
                <div className="flex gap-1">
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
                  className={`flex items-center px-3 py-2 text-sm text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <span>{t('common.next')}</span>
                  <ChevronRight size={16} className={rtl.spacing.iconSpacing} />
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
          {/* Blurred Background Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={cancelDeleteOrder}
          ></div>
          
          {/* Modal Content */}
          <div className={rtl.components.card + " p-6 w-full max-w-md mx-4 transform transition-all duration-300 ease-out relative"}>
            {/* Close Button */}
            <button
              onClick={cancelDeleteOrder}
              className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200`}
            >
              <X size={20} />
            </button>

            {/* Modal Header */}
            <div className={`flex items-center mb-4 ${isRTL ? 'flex-row-reverse' : ''}`} style={{ textAlign: isRTL ? 'right' : 'left' }}>
              <div className={`w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center ${rtl.spacing.contentSpacing}`}>
                <Trash2 size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className={rtl.text.sectionHeader}>
                  {t('orders.deleteOrderTitle')}
                </h3>
                <p className={rtl.text.bodyText}>
                  {t('orders.deleteOrderCannotBeUndone')}
                </p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="mb-6" style={{ textAlign: isRTL ? 'right' : 'left' }}>
              <p className="text-gray-700 dark:text-gray-300">
                {t('orders.deleteOrderConfirmation')}
              </p>
              {orderToDelete && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className={rtl.text.bodyText}>
                    {t('orders.orderID')} <span className="font-mono text-gray-900 dark:text-white">#{orderToDelete.slice(0, 8)}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`flex items-center gap-3 ${isRTL ? 'justify-start flex-row-reverse' : 'justify-end'}`}>
              <button
                onClick={cancelDeleteOrder}
                disabled={deleting}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmDeleteOrder}
                disabled={deleting}
                className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
              >
                {deleting ? (
                  <>
                    <RefreshCw size={16} className={`animate-spin ${rtl.spacing.iconSpacing}`} />
                    <span>{t('orders.deleting')}</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} className={rtl.spacing.iconSpacing} />
                    <span>{t('orders.deleteOrderButton')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;