import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  ShoppingCart, 
  Users, 
  Folder, 
  Package, 
  User,
  LogOut,
  Settings
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { adminAuth } from '../lib/adminAuth';
import { toast } from 'react-toastify';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      id: 'dashboard',
      label: t('nav.dashboard'),
      icon: BarChart3,
      path: '/dashboard'
    },
    {
      id: 'orders',
      label: t('nav.orders'),
      icon: ShoppingCart,
      path: '/orders'
    },
    {
      id: 'customers',
      label: t('nav.customers'),
      icon: Users,
      path: '/customers'
    },
    {
      id: 'categories',
      label: t('nav.categories'),
      icon: Folder,
      path: '/categories'
    },
    {
      id: 'products',
      label: t('nav.products'),
      icon: Package,
      path: '/products'
    },
    {
      id: 'settings',
      label: t('nav.settings'),
      icon: Settings,
      path: '/settings'
    }
  ];

  const handleLogout = async () => {
    try {
      await adminAuth.signOut();
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userEmail');
      toast.success(t('messages.success.logout'));
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error(t('messages.error.logout'));
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside 
      className={`
        ${isCollapsed ? 'w-16' : 'w-64'} 
        h-screen bg-white dark:bg-gray-800 
        border-gray-200 dark:border-gray-700 sidebar-rtl
        flex flex-col transition-all duration-300 ease-in-out
      `}
    >
      {/* Logo */}
      <div className={`p-4 border-b border-gray-200 dark:border-gray-700 ${isCollapsed ? 'px-2' : ''}`}>
        <div className={`flex items-center justify-center ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">AI</span>
          </div>
          {!isCollapsed && (
            <div className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {t('login.title')}
              </h1>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {/* Overview Section */}
          {!isCollapsed && (
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('dashboard.overview')}
              </p>
            </div>
          )}
          
          {menuItems.slice(0, 3).map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`
                w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                ${isActive(item.path)
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300'
                }
                ${isCollapsed ? 'justify-center' : isRTL ? 'flex-row-reverse' : ''}
              `}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon size={20} />
              {!isCollapsed && (
                <span className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
                  {item.label}
                </span>
              )}
              {!isCollapsed && isActive(item.path) && (
                <div className={`${isRTL ? 'mr-auto' : 'ml-auto'} w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full`} />
              )}
            </button>
          ))}

          {/* Catalog Section */}
          {!isCollapsed && (
            <div className="px-3 py-2 mt-6">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('common.catalog')}
              </p>
            </div>
          )}
          
          {menuItems.slice(3, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`
                w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                ${isActive(item.path)
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300'
                }
                ${isCollapsed ? 'justify-center' : isRTL ? 'flex-row-reverse' : ''}
              `}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon size={20} />
              {!isCollapsed && (
                <span className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
                  {item.label}
                </span>
              )}
              {!isCollapsed && isActive(item.path) && (
                <div className={`${isRTL ? 'mr-auto' : 'ml-auto'} w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full`} />
              )}
            </button>
          ))}

          {/* Settings Section */}
          {!isCollapsed && (
            <div className="px-3 py-2 mt-6">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('nav.settings')}
              </p>
            </div>
          )}
          
          {menuItems.slice(5).map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`
                w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                ${isActive(item.path)
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300'
                }
                ${isCollapsed ? 'justify-center' : isRTL ? 'flex-row-reverse' : ''}
              `}
              title={isCollapsed ? item.label : ''}
            >
              <item.icon size={20} />
              {!isCollapsed && (
                <span className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
                  {item.label}
                </span>
              )}
              {!isCollapsed && isActive(item.path) && (
                <div className={`${isRTL ? 'mr-auto' : 'ml-auto'} w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full`} />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* User Profile & Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className={`flex items-center mb-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className={`${isRTL ? 'mr-3' : 'ml-3'} flex-1 min-w-0`}>
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {t('common.adminUser')}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {localStorage.getItem('userEmail') || 'admin@aiproject.com'}
              </p>
            </div>
          </div>
        )}
        
        <button
          onClick={handleLogout}
          className={`
            w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400
            transition-colors duration-200
            ${isCollapsed ? 'justify-center' : isRTL ? 'flex-row-reverse' : ''}
          `}
          title={isCollapsed ? t('common.logout') : ''}
        >
          <LogOut size={20} />
          {!isCollapsed && (
            <span className={`${isRTL ? 'mr-3' : 'ml-3'}`}>
              {t('common.logout')}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;