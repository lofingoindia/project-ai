import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  User, 
  CreditCard,
  Truck,
  AlertCircle,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/supabase';
import type { Order, AiGenerationQueue } from '../types';

const OrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiGenerationData, setAiGenerationData] = useState<AiGenerationQueue[]>([]);

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId]);

  const loadOrderDetails = async () => {
    if (!orderId) return;
    
    try {
      setLoading(true);
      setError(null);
      const orderData = await db.getOrderById(orderId);
      setOrder(orderData);

      // Fetch AI generation data for all books in this order
      if (orderData?.order_items && orderData.order_items.length > 0) {
        const bookIds = orderData.order_items.map((item: any) => String(item.book_id));
        try {
          const aiData = await db.getAiGenerationByBookIds(bookIds);
          setAiGenerationData(aiData);
        } catch (aiError) {
          console.error('Error fetching AI generation data:', aiError);
          // Don't fail the whole page if AI data fails to load
          setAiGenerationData([]);
        }
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError(error instanceof Error ? error.message : t('orders.failedToFetchOrderDetails'));
      toast.error(t('orders.failedToLoadOrderDetails'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'processing': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'shipped': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'refunded': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusTranslation = (status: string) => {
    switch (status) {
      case 'pending': return t('orders.statusPending');
      case 'confirmed': return t('orders.statusConfirmed');
      case 'processing': return t('orders.statusProcessing');
      case 'shipped': return t('orders.statusShipped');
      case 'delivered': return t('orders.statusDelivered');
      case 'cancelled': return t('orders.statusCancelled');
      case 'completed': return t('orders.statusCompleted');
      default: return status;
    }
  };

  const getPaymentStatusTranslation = (status: string) => {
    switch (status) {
      case 'paid': return t('orders.paymentPaid');
      case 'pending': return t('orders.paymentPending');
      case 'failed': return t('orders.paymentFailed');
      case 'refunded': return t('orders.paymentRefunded');
      default: return status;
    }
  };

  const getAiStatusTranslation = (status: string) => {
    switch (status) {
      case 'completed': return t('orders.aiStatusCompleted');
      case 'processing': return t('orders.aiStatusProcessing');
      case 'failed': return t('orders.aiStatusFailed');
      case 'pending': return t('orders.aiStatusPending');
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      }),
      time: date.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    };
  };

  const calculateTotals = () => {
    if (!order?.order_items) return { subtotal: 0, total: order?.total_amount || 0 };
    
    const subtotal = order.order_items.reduce((sum, item) => {
      const price = item.unit_price || item.price || 0;
      return sum + (price * item.quantity);
    }, 0);
    
    return {
      subtotal,
      shipping: order.shipping_cost || 0,
      discount: order.discount_amount || 0,
      total: order.total_amount || subtotal
    };
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

  if (error || !order) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900" dir={isRTL ? 'rtl' : 'ltr'}>
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header 
            title={t('orders.orderDetails')}
            isSidebarCollapsed={isSidebarCollapsed}
            onSidebarToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
          
          <main className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {error || t('orders.orderNotFound')}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {t('orders.orderNotFoundDescription')}
                </p>
                <button
                  onClick={() => navigate('/orders')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  <ArrowLeft size={16} className={`${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('orders.backToOrders')}
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const formattedDate = formatDate(order.created_at);
  const totals = calculateTotals();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 main-layout" dir={isRTL ? 'rtl' : 'ltr'}>
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={`Order #${order.id.slice(0, 8)}`}
          isSidebarCollapsed={isSidebarCollapsed}
          onSidebarToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header with Back Button */}
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={() => navigate('/orders')}
                className="inline-flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <ArrowLeft size={16} className={`${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('orders.backToOrders')}
              </button>
              
              <div className={`flex items-center space-x-3 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
                <button
                  onClick={loadOrderDetails}
                  className="inline-flex items-center px-4 py-2 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-200"
                >
                  <RefreshCw size={16} className={`${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('orders.refresh')}
                </button>
              </div>
            </div>

            {/* Order Overview Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Order #{order.id.slice(0, 8)}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {formattedDate.date} {t('orders.at')} {formattedDate.time}
                  </p>
                </div>
                
                <div className={`flex items-center space-x-4 rtl:space-x-reverse ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {getStatusTranslation(order.status)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(order.payment_status || 'pending')}`}>
                    {getPaymentStatusTranslation(order.payment_status || 'pending')}
                  </span>
                </div>
              </div>

              {/* Order Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center">
                    <Package size={20} className="text-blue-600 dark:text-blue-400" />
                    <div className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('orders.items')}</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {order.order_items?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center">
                    <DollarSign size={20} className="text-green-600 dark:text-green-400" />
                    <div className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('orders.total')}</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        ${order.total_amount}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center">
                    <CreditCard size={20} className="text-purple-600 dark:text-purple-400" />
                    <div className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('orders.payment')}</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {order.payment_method || t('orders.notSpecified')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center">
                    <Truck size={20} className="text-orange-600 dark:text-orange-400" />
                    <div className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('orders.shipping')}</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {order.shipping_method || t('orders.standard')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Order Management */}
              <div className="lg:col-span-2 space-y-6">
                {/* Order Items */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('orders.orderItems')} ({order.order_items?.length || 0})
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {order.order_items?.map((item, index) => {
                      const book = item.books || item.book;
                      return (
                        <div key={item.id || index} className="flex items-center space-x-4 rtl:space-x-reverse p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                          {/* Book Image */}
                          <div className="w-16 h-20 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden flex-shrink-0">
                            {book && (book.thumbnail_image || book.cover_image_url) ? (
                              <img
                                src={book.thumbnail_image || book.cover_image_url}
                                alt={book.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div 
                              className="w-full h-full flex items-center justify-center" 
                              style={{ display: (book && (book.thumbnail_image || book.cover_image_url)) ? 'none' : 'flex' }}
                            >
                              <Package size={24} className="text-gray-400" />
                            </div>
                          </div>

                          {/* Book Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {book?.title || t('orders.unknownBook')}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t('orders.category')}: {book?.category || 'N/A'}
                            </p>
                            {item.generation_status && (
                              <div className="mt-1">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  item.generation_status === 'completed' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    : item.generation_status === 'processing'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                }`}>
                                  {getAiStatusTranslation(item.generation_status)}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Quantity and Price */}
                          <div className={`text-right ${isRTL ? 'text-left' : ''}`}>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {t('orders.qty')}: {item.quantity}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ${item.unit_price || item.price || 0} {t('orders.each')}
                            </p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                              ${((item.unit_price || item.price || 0) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {(!order.order_items || order.order_items.length === 0) && (
                      <div className="text-center py-8">
                        <Package size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">{t('orders.noItemsFoundInOrder')}</p>
                      </div>
                    )}
                  </div>

                  {/* Order Totals */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                    <div className="space-y-2">
                      <div className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="text-gray-600 dark:text-gray-400">{t('orders.subtotal')}:</span>
                        <span className="text-gray-900 dark:text-white">${totals.subtotal.toFixed(2)}</span>
                      </div>
                      {(totals.shipping || 0) > 0 && (
                        <div className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className="text-gray-600 dark:text-gray-400">{t('orders.shipping')}:</span>
                          <span className="text-gray-900 dark:text-white">${(totals.shipping || 0).toFixed(2)}</span>
                        </div>
                      )}
                      {(totals.discount || 0) > 0 && (
                        <div className={`flex justify-between text-sm ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span className="text-gray-600 dark:text-gray-400">{t('orders.discount')}:</span>
                          <span className="text-green-600 dark:text-green-400">-${(totals.discount || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className={`flex justify-between text-lg font-semibold pt-2 border-t border-gray-200 dark:border-gray-600 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="text-gray-900 dark:text-white">{t('orders.total')}:</span>
                        <span className="text-gray-900 dark:text-white">${totals.total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Generation Information */}
              {aiGenerationData && aiGenerationData.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className={`flex items-center mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Package size={20} className="text-purple-600 dark:text-purple-400" />
                    <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${isRTL ? 'mr-2' : 'ml-2'}`}>
                      {t('orders.aiGenerationDetails')} ({aiGenerationData.length})
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {aiGenerationData.map((aiData) => {
                      const matchingBook = order.order_items?.find(item => String(item.book_id) === aiData.book_id);
                      const book = matchingBook?.books || matchingBook?.book;
                      
                      return (
                        <div key={aiData.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="flex items-start space-x-4 rtl:space-x-reverse">
                            {/* Book Info */}
                            <div className="flex-shrink-0">
                              <div className="w-16 h-20 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden">
                                {book && (book.thumbnail_image || book.cover_image_url) ? (
                                  <img
                                    src={book.thumbnail_image || book.cover_image_url}
                                    alt={book.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      target.style.display = 'none';
                                      const fallback = target.nextElementSibling as HTMLElement;
                                      if (fallback) fallback.style.display = 'flex';
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className="w-full h-full flex items-center justify-center" 
                                  style={{ display: (book && (book.thumbnail_image || book.cover_image_url)) ? 'none' : 'flex' }}
                                >
                                  <Package size={16} className="text-gray-400" />
                                </div>
                              </div>
                            </div>

                            {/* AI Generation Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                  {book?.title || `${t('orders.bookId')}: ${aiData.book_id}`}
                                </h4>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  aiData.status === 'completed' 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                    : aiData.status === 'processing'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                                    : aiData.status === 'failed'
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                }`}>
                                  {getAiStatusTranslation(aiData.status)}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Child Information */}
                                <div className="space-y-2">
                                  <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('orders.childInformation')}</h5>
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {aiData.child_name}
                                  </p>
                                  {aiData.child_image_url && (
                                    <div className="mt-2">
                                      <img
                                        src={aiData.child_image_url}
                                        alt={`${aiData.child_name}'s photo`}
                                        className="w-20 h-20 rounded-lg object-cover border-2 border-gray-300 dark:border-gray-500"
                                        onError={(e) => {
                                          const target = e.currentTarget;
                                          target.style.display = 'none';
                                        }}
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Generated Image */}
                                {aiData.generated_image_url && (
                                  <div className="space-y-2">
                                    <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('orders.generatedCover')}</h5>
                                    <div className="mt-2">
                                      <img
                                        src={aiData.generated_image_url}
                                        alt="AI Generated Cover"
                                        className="w-20 h-20 rounded-lg object-cover border-2 border-purple-300 dark:border-purple-500"
                                        onError={(e) => {
                                          const target = e.currentTarget;
                                          target.style.display = 'none';
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Timestamps */}
                                <div className="space-y-2">
                                  <h5 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">{t('orders.timeline')}</h5>
                                  <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                    <p>
                                      <span className="font-medium">{t('orders.created')}:</span> {new Date(aiData.created_at).toLocaleDateString()}
                                    </p>
                                    {aiData.started_at && (
                                      <p>
                                        <span className="font-medium">{t('orders.started')}:</span> {new Date(aiData.started_at).toLocaleDateString()}
                                      </p>
                                    )}
                                    {aiData.completed_at && (
                                      <p>
                                        <span className="font-medium">{t('orders.completed')}:</span> {new Date(aiData.completed_at).toLocaleDateString()}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Error Message */}
                              {aiData.error_message && (
                                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                  <div className="flex items-start">
                                    <AlertCircle size={16} className="text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                                    <div className={`${isRTL ? 'mr-2' : 'ml-2'}`}>
                                      <h6 className="text-sm font-medium text-red-800 dark:text-red-300">{t('orders.generationError')}</h6>
                                      <p className="text-sm text-red-700 dark:text-red-400 mt-1">{aiData.error_message}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {aiGenerationData.length === 0 && (
                    <div className="text-center py-8">
                      <Package size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">{t('orders.noAiGenerationData')}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Customer Information */}
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <div className={`flex items-center mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <User size={20} className="text-blue-600 dark:text-blue-400" />
                    <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${isRTL ? 'mr-2' : 'ml-2'}`}>
                      {t('orders.customerInformation')}
                    </h3>
                  </div>

                  <div className="space-y-4">
                    {/* Basic Customer Info */}
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('orders.customerName')}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.shipping_address?.full_name || order.app_users?.full_name || order.user?.full_name || t('orders.unknownCustomer')}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{t('orders.phone')}</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {order.shipping_address?.phone || order.app_users?.phone || order.user?.phone || t('orders.noPhoneProvided')}
                      </p>
                    </div>

                    {/* Complete Address Information */}
                    {order.shipping_address && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">{t('orders.completeAddressDetails')}</h5>
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                          {order.shipping_address.street && (
                            <div>
                              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('orders.streetAddress')}</span>
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {order.shipping_address.street}
                              </p>
                            </div>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4">
                            {order.shipping_address.city && (
                              <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('orders.city')}</span>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {order.shipping_address.city}
                                </p>
                              </div>
                            )}
                            
                            {order.shipping_address.state && (
                              <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('orders.stateProvince')}</span>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {order.shipping_address.state}
                                </p>
                              </div>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            {order.shipping_address.postal_code && (
                              <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('orders.postalCode')}</span>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {order.shipping_address.postal_code}
                                </p>
                              </div>
                            )}
                            
                            {order.shipping_address.country && (
                              <div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('orders.country')}</span>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {order.shipping_address.country}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderDetails;