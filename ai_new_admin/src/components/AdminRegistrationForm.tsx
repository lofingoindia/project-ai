import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { hashPassword } from '../utils/passwordUtils';

interface AdminRegistrationFormProps {
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

const AdminRegistrationForm: React.FC<AdminRegistrationFormProps> = ({ onSuccess, onError }) => {
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
      onError('Full name is required');
      return false;
    }
    if (!formData.email.trim()) {
      onError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      onError('Please enter a valid email address');
      return false;
    }
    if (!formData.password) {
      onError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      onError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      onError('Passwords do not match');
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
          onError('An admin with this email already exists');
        } else {
          onError('Failed to create admin user: ' + error.message);
        }
        return;
      }

      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

      onSuccess('Admin user created successfully!');
    } catch (error) {
      onError('An unexpected error occurred. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Full Name
        </label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="Enter full name"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="Enter email address"
          required
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="Enter password"
          required
          minLength={6}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          placeholder="Confirm password"
          required
          minLength={6}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
      >
        {isLoading ? 'Creating Admin...' : 'Create Admin User'}
      </button>
    </form>
  );
};

export default AdminRegistrationForm;