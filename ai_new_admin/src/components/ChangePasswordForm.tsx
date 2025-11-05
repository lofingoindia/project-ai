import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { hashPassword, comparePassword } from '../utils/passwordUtils';

interface ChangePasswordFormProps {
  adminEmail?: string;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({ 
  adminEmail, 
  onSuccess, 
  onError 
}) => {
  const [formData, setFormData] = useState({
    email: adminEmail || '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      onError('Email is required');
      return false;
    }
    if (!formData.currentPassword) {
      onError('Current password is required');
      return false;
    }
    if (!formData.newPassword) {
      onError('New password is required');
      return false;
    }
    if (formData.newPassword.length < 6) {
      onError('New password must be at least 6 characters long');
      return false;
    }
    if (formData.newPassword !== formData.confirmNewPassword) {
      onError('New passwords do not match');
      return false;
    }
    if (formData.currentPassword === formData.newPassword) {
      onError('New password must be different from current password');
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
      // First, get the admin user and verify the current password
      const { data: adminUser, error: fetchError } = await supabase
        .from('admin_users')
        .select('id, password_hash')
        .eq('email', formData.email.toLowerCase())
        .single();

      if (fetchError || !adminUser) {
        onError('Admin user not found');
        return;
      }

      // Verify the current password using bcrypt
      const isCurrentPasswordValid = await comparePassword(formData.currentPassword, adminUser.password_hash);
      
      if (!isCurrentPasswordValid) {
        onError('Current password is incorrect');
        return;
      }

      // Hash the new password
      const newPasswordHash = await hashPassword(formData.newPassword);
      
      // Update the password
      const { error: updateError } = await supabase
        .from('admin_users')
        .update({ 
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminUser.id);

      if (updateError) {
        onError('Failed to update password: ' + updateError.message);
        return;
      }

      setFormData({
        email: adminEmail || '',
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });

      onSuccess('Password changed successfully!');
    } catch (error) {
      onError('An unexpected error occurred. Please try again.');
      console.error('Password change error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Admin Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="Enter admin email"
          required
        />
      </div>

      <div>
        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Current Password
        </label>
        <input
          type="password"
          id="currentPassword"
          name="currentPassword"
          value={formData.currentPassword}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="Enter current password"
          required
        />
      </div>

      <div>
        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          New Password
        </label>
        <input
          type="password"
          id="newPassword"
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="Enter new password"
          required
          minLength={6}
        />
      </div>

      <div>
        <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Confirm New Password
        </label>
        <input
          type="password"
          id="confirmNewPassword"
          name="confirmNewPassword"
          value={formData.confirmNewPassword}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="Confirm new password"
          required
          minLength={6}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
      >
        {isLoading ? 'Changing Password...' : 'Change Password'}
      </button>
    </form>
  );
};

export default ChangePasswordForm;