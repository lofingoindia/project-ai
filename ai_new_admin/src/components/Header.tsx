import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Languages, Bell, Search } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useRTL } from '../hooks/useRTL';

interface HeaderProps {
  title: string;
  isSidebarCollapsed: boolean;
  onSidebarToggle: () => void;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const { t, toggleLanguage, language } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const rtl = useRTL();
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(event.target as Node)) {
        setShowLanguageDropdown(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setShowThemeDropdown(false);
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

  const userEmail = localStorage.getItem('userEmail') || 'admin@aiproject.com';

  return (
    <header 
      className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3" 
      dir={rtl.dir}
      style={{ fontFamily: rtl.isRTL ? "'Tajawal', system-ui, Arial, sans-serif" : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
    >
      <div className="flex items-center justify-between">
        {/* Left Side */}
        <div className={`flex items-center ${rtl.isRTL ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
          {/* Sidebar Toggle */}
          

          {/* Title */}
          <div>
            <h1 className={`text-xl font-semibold text-gray-900 dark:text-white`} style={{ textAlign: rtl.isRTL ? 'right' : 'left' }}>
              {title}
            </h1>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search 
              size={20} 
              className={`absolute top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 ${rtl.utils.rtlClass('left-3', 'right-3')}`} 
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
                ${rtl.utils.rtlClass('pl-10 text-left', 'pr-10 text-right')}
              `}
              dir={rtl.form.inputDir}
              style={{ textAlign: rtl.isRTL ? 'right' : 'left' }}
            />
          </div>
        </div>

        {/* Right Side */}
        <div className={`flex items-center ${rtl.isRTL ? 'flex-row-reverse' : 'flex-row'} gap-4`}>
          {/* Notifications */}
          <button
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 relative transition-colors duration-200"
            title={t('common.notifications')}
          >
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
          </button>

          {/* Language Selector - Enhanced with visible labels */}
          <div className="relative" ref={languageDropdownRef}>
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className={`flex items-center ${rtl.isRTL ? 'flex-row-reverse' : 'flex-row'} px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-200 border border-gray-200 dark:border-gray-600`}
              title={language === 'en' ? t('common.switchToArabic') : t('common.switchToEnglish')}
            >
              <Languages size={16} className={rtl.isRTL ? 'ml-2' : 'mr-2'} />
              <span className="text-sm font-medium">
                {language === 'en' ? t('common.english') : t('common.arabic')}
              </span>
            </button>
            
            {showLanguageDropdown && (
              <div className={`absolute top-full mt-2 w-36 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50 ${rtl.isRTL ? 'left-0' : 'right-0'}`}>
                <button
                  onClick={() => {
                    if (language !== 'en') {
                      handleLanguageToggle();
                    }
                    setShowLanguageDropdown(false);
                  }}
                  className={`w-full px-4 py-3 text-sm transition-colors duration-200 flex items-center ${rtl.isRTL ? 'flex-row-reverse text-right' : 'flex-row text-left'} ${
                    language === 'en' 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  } first:rounded-t-lg`}
                >
                  <span className={`w-2 h-2 rounded-full ${language === 'en' ? 'bg-blue-500' : 'bg-transparent'} ${rtl.isRTL ? 'ml-3' : 'mr-3'}`}></span>
                  {t('common.english')}
                </button>
                <button
                  onClick={() => {
                    if (language !== 'ar') {
                      handleLanguageToggle();
                    }
                    setShowLanguageDropdown(false);
                  }}
                  className={`w-full px-4 py-3 text-sm transition-colors duration-200 flex items-center ${rtl.isRTL ? 'flex-row-reverse text-right' : 'flex-row text-left'} ${
                    language === 'ar' 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                  } last:rounded-b-lg`}
                  style={{ fontFamily: 'Tajawal, system-ui, Arial, sans-serif' }}
                >
                  <span className={`w-2 h-2 rounded-full ${language === 'ar' ? 'bg-blue-500' : 'bg-transparent'} ${rtl.isRTL ? 'ml-3' : 'mr-3'}`}></span>
                  {t('common.arabic')}
                </button>
              </div>
            )}
          </div>

          {/* Theme Selector */}
          <div className="relative" ref={themeDropdownRef}>
            <button
              onClick={() => setShowThemeDropdown(!showThemeDropdown)}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 transition-colors duration-200"
              title={isDarkMode ? t('common.lightMode') : t('common.darkMode')}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            {showThemeDropdown && (
              <div className={`absolute top-full mt-2 w-32 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg z-50 ${rtl.isRTL ? 'left-0' : 'right-0'}`}>
                <button
                  onClick={handleThemeToggle}
                  className={`w-full px-4 py-2 text-sm flex items-center ${rtl.isRTL ? 'flex-row-reverse text-right' : 'flex-row text-left'} transition-colors duration-200 ${
                    !isDarkMode 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  } first:rounded-t-lg`}
                >
                  <Sun size={16} />
                  <span className={rtl.isRTL ? 'mr-2' : 'ml-2'}>{t('common.light')}</span>
                </button>
                <button
                  onClick={handleThemeToggle}
                  className={`w-full px-4 py-2 text-sm flex items-center ${rtl.isRTL ? 'flex-row-reverse text-right' : 'flex-row text-left'} transition-colors duration-200 ${
                    isDarkMode 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  } last:rounded-b-lg`}
                >
                  <Moon size={16} />
                  <span className={rtl.isRTL ? 'mr-2' : 'ml-2'}>{t('common.dark')}</span>
                </button>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className={`flex items-center ${rtl.isRTL ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {userEmail.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className={rtl.isRTL ? 'text-right' : 'text-left'}>
              <p className={`text-sm font-medium text-gray-900 dark:text-white`}>
                {t('common.welcome')}
              </p>
              <p className={`text-xs text-gray-500 dark:text-gray-400`}>
                {t('common.adminUser')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;