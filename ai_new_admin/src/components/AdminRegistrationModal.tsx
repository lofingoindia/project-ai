import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { hashPassword } from '../utils/passwordUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { useRTL } from '../hooks/useRTL';

interface AdminRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
  onAdminCreated: () => void; // Callback to refresh admin list
}

const AdminRegistrationModal: React.FC<AdminRegistrationModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onError,
  onAdminCreated 
}) => {
  const { t, language } = useLanguage();
  const rtl = useRTL();
  
  // Fallback translations in case of loading issues  
  const fallbackTexts = {
    en: {
      title: 'Register New Admin',
      fullName: 'Full Name',
      emailAddress: 'Email Address', 
      password: 'Password',
      confirmPassword: 'Confirm Password',
      enterFullName: 'Enter full name',
      enterEmail: 'Enter email address',
      enterPassword: 'Enter password',
      confirmPasswordPlaceholder: 'Confirm password',
      creating: 'Creating...',
      createAdmin: 'Create Admin',
      cancel: 'Cancel'
    },
    ar: {
      title: 'تسجيل مدير جديد',
      fullName: 'الاسم الكامل',
      emailAddress: 'عنوان البريد الإلكتروني',
      password: 'كلمة المرور',
      confirmPassword: 'تأكيد كلمة المرور',
      enterFullName: 'أدخل الاسم الكامل',
      enterEmail: 'أدخل عنوان البريد الإلكتروني',
      enterPassword: 'أدخل كلمة المرور',
      confirmPasswordPlaceholder: 'تأكيد كلمة المرور',
      creating: 'جاري الإنشاء...',
      createAdmin: 'إنشاء مدير',
      cancel: 'إلغاء'
    }
  };
  
  // Helper function to get text with fallback
  const getText = (key: string, fallbackKey?: string) => {
    const translation = t(key);
    if (translation !== key) return translation; // Translation found
    
    // Fallback to our local translations
    const currentLang = language as 'en' | 'ar';
    const fallbackText = fallbackKey ? fallbackTexts[currentLang][fallbackKey as keyof typeof fallbackTexts.en] : null;
    return fallbackText || translation;
  };
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      onError(t('admin.registration.fullNameRequired'));
      return false;
    }
    if (!formData.email.trim()) {
      onError(t('admin.registration.emailRequired'));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      onError(t('admin.registration.validEmailRequired'));
      return false;
    }
    if (!formData.password) {
      onError(t('admin.registration.passwordRequired'));
      return false;
    }
    if (formData.password.length < 6) {
      onError(t('admin.registration.passwordMinLength'));
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      onError(t('admin.registration.passwordsDoNotMatch'));
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Hash the password using bcrypt
      const passwordHash = await hashPassword(formData.password);
      
      // Debug: Test if admin_users table exists
      console.log('🔄 Testing admin_users table access...');
      const { error: testError } = await supabase
        .from('admin_users')
        .select('count', { count: 'exact', head: true });
      
      if (testError) {
        console.error('❌ admin_users table test failed:', testError);
        onError(t('admin.registration.tableNotFound'));
        return;
      }
      
      console.log('✅ admin_users table exists, proceeding with insert...');
      
      // Insert the admin user into the database
      const { data, error } = await supabase
        .from('admin_users')
        .insert([
          {
            full_name: formData.fullName,
            email: formData.email.toLowerCase(),
            password_hash: passwordHash,
            role: 'admin',
            is_active: true
          }
        ])
        .select();

      if (error) {
        console.error('❌ Insert error:', error);
        if (error.code === '23505') { // Unique constraint violation
          onError(t('admin.registration.emailAlreadyExists'));
        } else {
          onError(t('admin.registration.failedToCreate') + ': ' + error.message + ' (Code: ' + error.code + ')');
        }
        return;
      }

      console.log('✅ Admin user created successfully:', data);

      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

      onSuccess(t('admin.registration.adminCreatedSuccess'));
      onAdminCreated(); // Refresh the admin list
      onClose();
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      onError(t('admin.registration.unexpectedError') + ': ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4" 
        dir={rtl.dir}
        style={{ fontFamily: rtl.isRTL ? "'Tajawal', system-ui, Arial, sans-serif" : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      >
        <div className={`flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 ${rtl.isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {getText('admin.registration.title', 'title')}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${rtl.isRTL ? 'text-right' : 'text-left'}`}>
                {getText('admin.registration.fullName', 'fullName')}
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${rtl.isRTL ? 'text-right' : 'text-left'}`}
                placeholder={getText('admin.registration.enterFullName', 'enterFullName')}
                dir={rtl.form.inputDir}
                required
              />
            </div>

            <div>
              <label htmlFor="email" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${rtl.isRTL ? 'text-right' : 'text-left'}`}>
                {getText('admin.registration.emailAddress', 'emailAddress')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${rtl.isRTL ? 'text-right' : 'text-left'}`}
                placeholder={getText('admin.registration.enterEmail', 'enterEmail')}
                dir={rtl.form.inputDir}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${rtl.isRTL ? 'text-right' : 'text-left'}`}>
                {getText('admin.registration.password', 'password')}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${rtl.isRTL ? 'text-right' : 'text-left'}`}
                placeholder={getText('admin.registration.enterPassword', 'enterPassword')}
                dir={rtl.form.inputDir}
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${rtl.isRTL ? 'text-right' : 'text-left'}`}>
                {getText('admin.registration.confirmPassword', 'confirmPassword')}
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${rtl.isRTL ? 'text-right' : 'text-left'}`}
                placeholder={getText('admin.registration.confirmPasswordPlaceholder', 'confirmPasswordPlaceholder')}
                dir={rtl.form.inputDir}
                required
                minLength={6}
              />
            </div>
          </div>

          <div className={`flex justify-end ${rtl.isRTL ? 'flex-row-reverse space-x-reverse' : 'flex-row'} space-x-3 mt-6`}>
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              {getText('common.cancel', 'cancel')}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg"
            >
              {isLoading ? getText('admin.registration.creating', 'creating') : getText('admin.registration.createAdmin', 'createAdmin')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminRegistrationModal;