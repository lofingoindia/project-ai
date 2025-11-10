import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { hashPassword, comparePassword } from '../utils/passwordUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { useRTL } from '../hooks/useRTL';

interface Admin {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
}

interface AdminEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
  onAdminUpdated: () => void;
  admin: Admin | null;
}

const AdminEditModal: React.FC<AdminEditModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  onError,
  onAdminUpdated,
  admin
}) => {
  const { t, language } = useLanguage();
  const rtl = useRTL();
  
  // Fallback translations in case of loading issues
  const fallbackTexts = {
    en: {
      title: 'Edit Admin User',
      fullName: 'Full Name',
      emailAddress: 'Email Address',
      currentPassword: 'Current Password',
      newPassword: 'New Password', 
      confirmNewPassword: 'Confirm New Password',
      enterFullName: 'Enter full name',
      enterEmail: 'Enter email address',
      enterCurrentPassword: 'Enter current password',
      enterNewPassword: 'Enter new password (min 6 characters)',
      confirmNewPasswordPlaceholder: 'Confirm new password',
      changePassword: 'Change Password (Optional)',
      passwordNote: 'Leave password fields empty if you don\'t want to change the password.',
      updating: 'Updating...',
      updateAdmin: 'Update Admin',
      cancel: 'Cancel',
      note: 'Note'
    },
    ar: {
      title: 'تحرير مستخدم الإدارة',
      fullName: 'الاسم الكامل', 
      emailAddress: 'عنوان البريد الإلكتروني',
      currentPassword: 'كلمة المرور الحالية',
      newPassword: 'كلمة المرور الجديدة',
      confirmNewPassword: 'تأكيد كلمة المرور الجديدة',
      enterFullName: 'أدخل الاسم الكامل',
      enterEmail: 'أدخل عنوان البريد الإلكتروني',
      enterCurrentPassword: 'أدخل كلمة المرور الحالية',
      enterNewPassword: 'أدخل كلمة المرور الجديدة (6 أحرف كحد أدنى)',
      confirmNewPasswordPlaceholder: 'تأكيد كلمة المرور الجديدة',
      changePassword: 'تغيير كلمة المرور (اختياري)',
      passwordNote: 'اترك حقول كلمة المرور فارغة إذا كنت لا تريد تغيير كلمة المرور.',
      updating: 'جاري التحديث...',
      updateAdmin: 'تحديث المدير',
      cancel: 'إلغاء',
      note: 'ملاحظة'
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
    fullName: admin?.full_name || '',
    email: admin?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Update form data when admin prop changes
  React.useEffect(() => {
    if (admin) {
      setFormData({
        fullName: admin.full_name,
        email: admin.email,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    }
  }, [admin]);

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

    // Password validation - only if changing password
    if (formData.newPassword || formData.confirmNewPassword) {
      if (!formData.currentPassword) {
        onError(t('admin.edit.currentPasswordRequired'));
        return false;
      }
      if (!formData.newPassword) {
        onError(t('admin.edit.newPasswordRequired'));
        return false;
      }
      if (formData.newPassword.length < 6) {
        onError(t('admin.edit.newPasswordMinLength'));
        return false;
      }
      if (formData.newPassword !== formData.confirmNewPassword) {
        onError(t('admin.edit.newPasswordsDoNotMatch'));
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !admin) {
      return;
    }

    setIsLoading(true);

    try {
      // If changing password, verify current password first
      if (formData.newPassword) {
        // Get current admin data to verify password
        const { data: currentAdmin, error: fetchError } = await supabase
          .from('admin_users')
          .select('password_hash')
          .eq('id', admin.id)
          .single();

        if (fetchError) {
          onError(t('admin.edit.failedToVerifyPassword') + ': ' + fetchError.message);
          return;
        }

        // Verify current password
        const isPasswordValid = await comparePassword(formData.currentPassword, currentAdmin.password_hash);
        if (!isPasswordValid) {
          onError(t('admin.edit.currentPasswordIncorrect'));
          return;
        }
      }

      // Prepare update data
      const updateData: any = {
        full_name: formData.fullName,
        email: formData.email.toLowerCase(),
        updated_at: new Date().toISOString()
      };

      // Add password hash if changing password
      if (formData.newPassword) {
        const passwordHash = await hashPassword(formData.newPassword);
        updateData.password_hash = passwordHash;
      }

      const { error } = await supabase
        .from('admin_users')
        .update(updateData)
        .eq('id', admin.id);

      if (error) {
        console.error('❌ Update error:', error);
        if (error.code === '23505') { // Unique constraint violation
          onError(t('admin.registration.emailAlreadyExists'));
        } else {
          onError(t('admin.edit.failedToUpdate') + ': ' + error.message);
        }
        return;
      }

      console.log('✅ Admin user updated successfully');

      const successMessage = formData.newPassword 
        ? t('admin.edit.adminAndPasswordUpdatedSuccess')
        : t('admin.edit.adminUpdatedSuccess');
      
      onSuccess(successMessage);
      onAdminUpdated(); // Refresh the admin list
      onClose();
    } catch (error) {
      console.error('❌ Unexpected error:', error);
      onError(t('admin.registration.unexpectedError') + ': ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (admin) {
      setFormData({
        fullName: admin.full_name,
        email: admin.email,
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });
    }
    onClose();
  };

  if (!isOpen || !admin) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" 
        dir={rtl.dir}
        style={{ fontFamily: rtl.isRTL ? "'Tajawal', system-ui, Arial, sans-serif" : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      >
        <div className={`flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 ${rtl.isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            {getText('admin.edit.title', 'title')}
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

            {/* Password Section */}
            <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
              <h4 className={`text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 ${rtl.isRTL ? 'text-right' : 'text-left'}`}>
                {getText('admin.edit.changePassword', 'changePassword')}
              </h4>
              
              <div className="space-y-3">
                <div>
                  <label htmlFor="currentPassword" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${rtl.isRTL ? 'text-right' : 'text-left'}`}>
                    {getText('admin.edit.currentPassword', 'currentPassword')}
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${rtl.isRTL ? 'text-right' : 'text-left'}`}
                    placeholder={getText('admin.edit.enterCurrentPassword', 'enterCurrentPassword')}
                    dir={rtl.form.inputDir}
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${rtl.isRTL ? 'text-right' : 'text-left'}`}>
                    {getText('admin.edit.newPassword', 'newPassword')}
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${rtl.isRTL ? 'text-right' : 'text-left'}`}
                    placeholder={getText('admin.edit.enterNewPassword', 'enterNewPassword')}
                    dir={rtl.form.inputDir}
                    minLength={6}
                  />
                </div>

                <div>
                  <label htmlFor="confirmNewPassword" className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${rtl.isRTL ? 'text-right' : 'text-left'}`}>
                    {getText('admin.edit.confirmNewPassword', 'confirmNewPassword')}
                  </label>
                  <input
                    type="password"
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    value={formData.confirmNewPassword}
                    onChange={handleChange}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${rtl.isRTL ? 'text-right' : 'text-left'}`}
                    placeholder={getText('admin.edit.confirmNewPasswordPlaceholder', 'confirmNewPasswordPlaceholder')}
                    dir={rtl.form.inputDir}
                    minLength={6}
                  />
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className={`text-xs text-yellow-800 dark:text-yellow-200 ${rtl.isRTL ? 'text-right' : 'text-left'}`}>
                    <strong>{getText('common.note', 'note')}:</strong> {getText('admin.edit.passwordNote', 'passwordNote')}
                  </p>
                </div>
              </div>
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
              {isLoading ? getText('admin.edit.updating', 'updating') : getText('admin.edit.updateAdmin', 'updateAdmin')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminEditModal;