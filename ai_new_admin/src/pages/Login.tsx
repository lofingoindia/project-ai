import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Languages, Sun, Moon } from 'lucide-react';
import { adminAuth } from '../lib/adminAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const Login: React.FC = () => {
  const { t, toggleLanguage, language, isRTL } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already authenticated
    const checkAuth = async () => {
      try {
        console.log('🔐 Login: Checking if already authenticated...');
        const user = await adminAuth.getCurrentUser();
        if (user) {
          console.log('🔐 Login: Already authenticated, redirecting to dashboard');
          navigate('/dashboard');
        } else {
          console.log('🔐 Login: Not authenticated, staying on login page');
        }
      } catch (error) {
        // User not authenticated, stay on login page
        console.log('🔐 Login: User not authenticated', error);
      }
    };
    checkAuth();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 Login: Attempting login for:', formData.email);
      await adminAuth.signIn(formData.email, formData.password);
      
      console.log('🔐 Login: Sign in successful, navigating to dashboard');
      // Success message and navigation
      toast.success(t('messages.success.login'));
      navigate('/dashboard');
    } catch (error: any) {
      console.error('🔐 Login: Sign in error:', error);
      const errorMessage = error.message === 'Invalid email or password' 
        ? t('login.errorInvalidCredentials')
        : t('login.errorGeneral');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} bg-white dark:bg-gray-900 transition-colors duration-200`}>
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-600 dark:bg-blue-800 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">AI</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            {t('login.title')}
          </h1>
          <p className="text-blue-100 text-lg">
            {t('login.subtitle')}
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Header Controls */}
          <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="lg:hidden">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('login.title')}
              </h2>
            </div>
            <div className="flex items-center space-x-2 rtl:space-x-reverse">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 transition-colors duration-200"
                title={language === 'en' ? 'العربية' : 'English'}
              >
                <Languages size={20} />
              </button>
              
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 transition-colors duration-200"
                title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>

          {/* Login Form */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8">
            <div className="mb-6 lg:hidden text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t('login.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t('login.subtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('login.email')}
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                  placeholder={t('login.email')}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${isRTL ? 'pl-12' : 'pr-12'}`}
                    placeholder={t('login.password')}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute top-1/2 transform -translate-y-1/2 p-2 text-gray-500 dark:text-gray-400 ${isRTL ? 'left-2' : 'right-2'}`}
                    title={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
              >
                {isLoading ? t('common.loading') : t('login.login')}
              </button>
            </form>

            {/* Admin Info */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
                Admin Access:
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Please use an admin account registered through the Settings page.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;