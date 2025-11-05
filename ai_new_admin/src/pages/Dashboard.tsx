import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShoppingCart, 
  Package, 
  Folder, 
  TrendingUp,
  ArrowUp,
  ArrowDown,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useLanguage } from '../contexts/LanguageContext';
import { useDataCache } from '../contexts/DataCacheContext';

const Dashboard: React.FC = () => {
  const { t, isRTL } = useLanguage();
  const { state, actions } = useDataCache();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Smart loading strategy: Load essential data first, then enhance progressively
      console.log('🎯 Loading dashboard with smart strategy...');
      
      // Priority 1: Dashboard stats (fast and essential for display)
      await actions.fetchDashboardStats();
      
      // Priority 2: Categories (small data, needed for filtering)
      await actions.fetchCategories();
      
      // Priority 3: Load orders and customers in parallel (heavier data)
      // Don't await - let them load in background while user sees initial content
      Promise.allSettled([
        actions.fetchOrders(),
        actions.fetchCustomers(),
      ]).then(() => {
        console.log('✅ Background data loading completed');
      });
      
      // Products load on-demand only when needed
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    }
  };

  const handleRefresh = async () => {
    try {
      await actions.refreshAll();
      toast.success('Dashboard refreshed');
    } catch (error) {
      toast.error('Failed to refresh dashboard');
    }
  };

  // Calculate derived data from cached state
  const stats = state.dashboardStats;
  const recentOrders = state.orders.slice(0, 5);
  const recentUsers = state.customers.slice(0, 5);
  const categories = state.categories;
  const products = state.products;

  // Show loading only for initial load when no cached data exists
  const isInitialLoad = (
    state.loading.dashboard && 
    stats.total_users === 0 && 
    stats.total_orders === 0 && 
    stats.total_revenue === 0
  );

  const statCards = [
    {
      id: 'users',
      title: t('dashboard.totalUsers'),
      value: stats.total_users,
      icon: Users,
      color: 'blue',
      change: '+12%',
      isPositive: true
    },
    {
      id: 'orders',
      title: t('dashboard.totalOrders'),
      value: stats.total_orders,
      icon: ShoppingCart,
      color: 'green',
      change: '+8%',
      isPositive: true
    },
    {
      id: 'revenue',
      title: t('dashboard.totalRevenue'),
      value: `$${stats.total_revenue.toFixed(2)}`,
      icon: TrendingUp,
      color: 'purple',
      change: '+15%',
      isPositive: true
    },
    {
      id: 'products',
      title: t('dashboard.totalProducts'),
      value: stats.total_books,
      icon: Package,
      color: 'orange',
      change: '+3%',
      isPositive: true
    },
    {
      id: 'categories',
      title: t('dashboard.totalCategories'),
      value: stats.total_categories,
      icon: Folder,
      color: 'indigo',
      change: '0%',
      isPositive: true
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'processing': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'shipped': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'green': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'purple': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20';
      case 'orange': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'indigo': return 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20';
      case 'pink': return 'text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

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
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 main-layout" dir={isRTL ? 'rtl' : 'ltr'}>
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title={t('dashboard.title')}
          isSidebarCollapsed={isSidebarCollapsed}
          onSidebarToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {/* Header Actions */}
          <div className={`flex items-center justify-between mb-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('dashboard.overview')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {t('dashboard.welcomeMessage')}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200"
            >
              <RefreshCw size={16} className={`${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('dashboard.refresh')}
            </button>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {statCards.map((card) => (
              <div
                key={card.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6"
              >
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      {card.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {card.value}
                    </p>
                    <div className={`flex items-center mt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      {card.isPositive ? (
                        <ArrowUp size={16} className="text-green-500" />
                      ) : (
                        <ArrowDown size={16} className="text-red-500" />
                      )}
                      <span className={`text-sm font-medium ${isRTL ? 'mr-1' : 'ml-1'} ${
                        card.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {card.change}
                      </span>
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getColorClasses(card.color)}`}>
                    <card.icon size={24} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Recent Orders */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('dashboard.recentOrders')}
                  </h3>
                  <button className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                    {t('dashboard.viewAll')}
                  </button>
                </div>
              </div>
              <div className="p-6">
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">{t('dashboard.noRecentOrders')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentOrders.map((order) => (
                      <div key={order.id} className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-3`}>
                          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                            <ShoppingCart size={16} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className={`${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {t('dashboard.orderNumber')}{order.id.slice(0, 8)}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-3`}>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            ${order.total_amount}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Users */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t('dashboard.recentUsers')}
                  </h3>
                  <button className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                    {t('dashboard.viewAll')}
                  </button>
                </div>
              </div>
              <div className="p-6">
                {recentUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">{t('dashboard.noRecentUsers')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentUsers.map((user) => (
                      <div key={user.id} className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-3`}>
                          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {user.email?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className={`${isRTL ? 'text-right' : ''}`}>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.name || t('dashboard.unknownUser')}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(user.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Categories Summary */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('dashboard.categories')}
                </h3>
                <Folder className="text-gray-400" size={20} />
              </div>
              <div className="space-y-3">
                <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.totalCategoriesCount')}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{categories.length}</span>
                </div>
                <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.active')}</span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {categories.filter(c => c.status === 'active').length}
                  </span>
                </div>
                <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.inactive')}</span>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    {categories.filter(c => c.status === 'inactive').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Products Summary */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('dashboard.products')}
                </h3>
                <Package className="text-gray-400" size={20} />
              </div>
              <div className="space-y-3">
                <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.totalProductsCount')}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{products.length}</span>
                </div>
                <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.inStock')}</span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    {products.filter(p => p.status === 'active').length}
                  </span>
                </div>
                <div className={`flex justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.outOfStock')}</span>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">
                    {products.filter(p => p.status === 'out_of_stock').length}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;