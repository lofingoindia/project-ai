import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { hashPassword } from '../utils/passwordUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { useRTL } from '../hooks/useRTL';

interface AdminRegistrationFormProps {
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

const AdminRegistrationForm: React.FC<AdminRegistrationFormProps> = ({ onSuccess, onError }) => {
  const { t, language } = useLanguage();
  const rtl = useRTL();

  // Fallback translations in case of loading issues  
  const fallbackTexts = {
    en: {
      fullName: 'Full Name',
      emailAddress: 'Email Address', 
      password: 'Password',
      confirmPassword: 'Confirm Password',
      enterFullName: 'Enter full name',
      enterEmail: 'Enter email address',
      enterPassword: 'Enter password',
      confirmPasswordPlaceholder: 'Confirm password',
      creating: 'Creating Admin...',
      createAdmin: 'Create Admin User',
      // Validation messages
      fullNameRequired: 'Full name is required',
      emailRequired: 'Email is required',
      invalidEmail: 'Please enter a valid email address',
      passwordRequired: 'Password is required',
      passwordLength: 'Password must be at least 6 characters long',
      passwordMismatch: 'Passwords do not match',
      emailExists: 'An admin with this email already exists',
      createFailed: 'Failed to create admin user',
      unexpectedError: 'An unexpected error occurred. Please try again.',
      successMessage: 'Admin user created successfully!'
    },
    ar: {
      fullName: 'الاسم الكامل',
      emailAddress: 'عنوان البريد الإلكتروني',
      password: 'كلمة المرور',
      confirmPassword: 'تأكيد كلمة المرور',
      enterFullName: 'أدخل الاسم الكامل',
      enterEmail: 'أدخل عنوان البريد الإلكتروني',
      enterPassword: 'أدخل كلمة المرور',
      confirmPasswordPlaceholder: 'تأكيد كلمة المرور',
      creating: 'جاري إنشاء المدير...',
      createAdmin: 'إنشاء مستخدم مدير',
      // Validation messages
      fullNameRequired: 'الاسم الكامل مطلوب',
      emailRequired: 'البريد الإلكتروني مطلوب',
      invalidEmail: 'يرجى إدخال عنوان بريد إلكتروني صالح',
      passwordRequired: 'كلمة المرور مطلوبة',
      passwordLength: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
      passwordMismatch: 'كلمات المرور غير متطابقة',
      emailExists: 'يوجد مدير بهذا البريد الإلكتروني بالفعل',
      createFailed: 'فشل في إنشاء مستخدم المدير',
      unexpectedError: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
      successMessage: 'تم إنشاء مستخدم المدير بنجاح!'
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
      onError(getText('admin.registration.validation.fullNameRequired', 'fullNameRequired'));
      return false;
    }
    if (!formData.email.trim()) {
      onError(getText('admin.registration.validation.emailRequired', 'emailRequired'));
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      onError(getText('admin.registration.validation.invalidEmail', 'invalidEmail'));
      return false;
    }
    if (!formData.password) {
      onError(getText('admin.registration.validation.passwordRequired', 'passwordRequired'));
      return false;
    }
    if (formData.password.length < 6) {
      onError(getText('admin.registration.validation.passwordLength', 'passwordLength'));
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      onError(getText('admin.registration.validation.passwordMismatch', 'passwordMismatch'));
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
      
      // Insert the admin user into the database
      const { error } = await supabase
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
        if (error.code === '23505') { // Unique constraint violation
          onError(getText('admin.registration.validation.emailExists', 'emailExists'));
        } else {
          onError(getText('admin.registration.validation.createFailed', 'createFailed') + ': ' + error.message);
        }
        return;
      }

      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

      onSuccess(getText('admin.registration.successMessage', 'successMessage'));
    } catch (error) {
      onError(getText('admin.registration.validation.unexpectedError', 'unexpectedError'));
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir={rtl.dir} style={{ fontFamily: rtl.isRTL ? "'Tajawal', system-ui, Arial, sans-serif" : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <form onSubmit={handleSubmit} className="space-y-6">
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
          minLength={6}
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

      <button
        type="submit"
        disabled={isLoading}
        className={`w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200 ${rtl.isRTL ? 'text-right' : 'text-left'}`}
        dir={rtl.form.inputDir}
      >
        {isLoading ? getText('admin.registration.creating', 'creating') : getText('admin.registration.createAdmin', 'createAdmin')}
      </button>
      </form>
    </div>
  );
};

export default AdminRegistrationForm;