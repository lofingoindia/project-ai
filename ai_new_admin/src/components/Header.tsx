import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Languages, Bell, Search, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { adminAuth } from '../lib/adminAuth';

interface HeaderProps {
  title: string;
  isSidebarCollapsed: boolean;
  onSidebarToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { t, toggleLanguage, language, isRTL } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userInfo, setUserInfo] = useState<{ email: string; fullName: string; role: string } | null>(null);
  
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load user info from admin auth
    const loadUserInfo = () => {
      const info = adminAuth.getUserInfo();
      setUserInfo(info);
    };
    loadUserInfo();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setShowThemeDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleThemeToggle = () => {
    toggleTheme();
    setShowThemeDropdown(false);
  };

  const handleLanguageToggle = () => {
    toggleLanguage();
    setShowLanguageDropdown(false);
  };

  const handleLogout = async () => {
    try {
      await adminAuth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const userEmail = userInfo?.email || 'admin@aiproject.com';
  const userName = userInfo?.fullName || 'Administrator';
  const userRole = userInfo?.role || 'admin';

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Left Side */}
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-4`}>
          {/* Sidebar Toggle */}
          

          {/* Title */}
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h1>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search 
              size={20} 
              className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 ${isRTL ? 'right-3' : 'left-3'}`} 
            />
            <input
              type="text"
              placeholder={t('common.search')}
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
        </div>

        {/* Right Side */}
        <div className={`flex items-center ${isRTL ? 'flex-row-reverse space-x-reverse' : ''} space-x-4`}>
          {/* Notifications */}
          <button
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 relative transition-colors duration-200"
            title="Notifications"
          >
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          {/* Language Selector */}
          <div className="relative" ref={languageDropdownRef}>
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 transition-colors duration-200"
              title={language === 'en' ? 'العربية' : 'English'}
            >
              <Languages size={20} />
            </button>
            
            {showLanguageDropdown && (
              <div className={`absolute top-full mt-2 w-32 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg z-50 ${isRTL ? 'left-0' : 'right-0'}`}>
                <button
                  onClick={handleLanguageToggle}
                  className={`w-full px-4 py-2 text-left text-sm ${isRTL ? 'text-right' : ''} transition-colors duration-200 ${
                    language === 'en' 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  } first:rounded-t-lg last:rounded-b-lg`}
                >
                  English
                </button>
                <button
                  onClick={handleLanguageToggle}
                  className={`w-full px-4 py-2 text-left text-sm ${isRTL ? 'text-right' : ''} transition-colors duration-200 ${
                    language === 'ar' 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  } first:rounded-t-lg last:rounded-b-lg`}
                >
                  العربية
                </button>
              </div>
            )}
          </div>

          {/* Theme Selector */}
          <div className="relative" ref={themeDropdownRef}>
            <button
              onClick={() => setShowThemeDropdown(!showThemeDropdown)}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 transition-colors duration-200"
              title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {showThemeDropdown && (
              <div className={`absolute top-full mt-2 w-32 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg z-50 ${isRTL ? 'left-0' : 'right-0'}`}>
                <button
                  onClick={handleThemeToggle}
                  className={`w-full px-4 py-2 text-left text-sm ${isRTL ? 'text-right' : ''} flex items-center ${isRTL ? 'flex-row-reverse' : ''} transition-colors duration-200 ${
                    !isDarkMode 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  } first:rounded-t-lg`}
                >
                  <Sun size={16} />
                  <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>Light</span>
                </button>
                <button
                  onClick={handleThemeToggle}
                  className={`w-full px-4 py-2 text-left text-sm ${isRTL ? 'text-right' : ''} flex items-center ${isRTL ? 'flex-row-reverse' : ''} transition-colors duration-200 ${
                    isDarkMode 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  } last:rounded-b-lg`}
                >
                  <Moon size={16} />
                  <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>Dark</span>
                </button>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''} space-x-3 rtl:space-x-reverse p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700`}
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className={`${isRTL ? 'text-right' : 'text-left'}`}>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {userName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {userRole}
                </p>
              </div>
            </button>

            {showUserDropdown && (
              <div className={`absolute top-full mt-2 w-48 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 ${isRTL ? 'left-0' : 'right-0'}`}>
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{userName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{userEmail}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className={`w-full px-4 py-2 text-left text-sm ${isRTL ? 'text-right' : ''} text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 rounded-b-lg flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <LogOut size={16} />
                  <span className={`${isRTL ? 'mr-2' : 'ml-2'}`}>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;