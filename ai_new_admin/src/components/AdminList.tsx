import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Key, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AdminRegistrationModal from './AdminRegistrationModal';
import ChangePasswordModal from './ChangePasswordModal';

interface Admin {
  id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AdminListProps {
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

const AdminList: React.FC<AdminListProps> = ({ onSuccess, onError }) => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        onError('Failed to fetch admin users: ' + error.message);
        return;
      }

      setAdmins(data || []);
    } catch (error) {
      onError('An unexpected error occurred while fetching admin users.');
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleChangePassword = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowPasswordModal(true);
  };

  const handleToggleActive = async (admin: Admin) => {
    try {
      const { error } = await supabase
        .from('admin_users')
        .update({ 
          is_active: !admin.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', admin.id);

      if (error) {
        onError('Failed to update admin status: ' + error.message);
        return;
      }

      onSuccess(`Admin ${admin.is_active ? 'deactivated' : 'activated'} successfully!`);
      fetchAdmins(); // Refresh the list
    } catch (error) {
      onError('An unexpected error occurred.');
      console.error('Error updating admin status:', error);
    }
  };

  const handleDeleteAdmin = async (admin: Admin) => {
    if (!confirm(`Are you sure you want to delete admin "${admin.full_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', admin.id);

      if (error) {
        onError('Failed to delete admin user: ' + error.message);
        return;
      }

      onSuccess(`Admin "${admin.full_name}" deleted successfully!`);
      fetchAdmins(); // Refresh the list
    } catch (error) {
      onError('An unexpected error occurred.');
      console.error('Error deleting admin:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading admin users...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Users size={24} className="text-gray-600 dark:text-gray-400" />
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Admin Users
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage admin accounts and permissions
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowRegistrationModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200"
        >
          <UserPlus size={20} />
          <span>Add New Admin</span>
        </button>
      </div>

      {/* Admin List */}
      {admins.length === 0 ? (
        <div className="text-center py-12">
          <Users size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Admin Users Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Create your first admin user to get started.
          </p>
          <button
            onClick={() => setShowRegistrationModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200 mx-auto"
          >
            <UserPlus size={20} />
            <span>Add First Admin</span>
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Admin Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Role & Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {admin.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {admin.full_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {admin.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mb-1">
                          {admin.role}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          admin.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {admin.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(admin.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleChangePassword(admin)}
                          className="flex items-center space-x-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs transition duration-200"
                          title="Change Password"
                        >
                          <Key size={14} />
                          <span>Password</span>
                        </button>
                        <button
                          onClick={() => handleToggleActive(admin)}
                          className={`px-3 py-1 rounded text-xs transition duration-200 ${
                            admin.is_active
                              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                          title={admin.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {admin.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin)}
                          className="flex items-center space-x-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition duration-200"
                          title="Delete Admin"
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <AdminRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
        onSuccess={onSuccess}
        onError={onError}
        onAdminCreated={fetchAdmins}
      />

      {selectedAdmin && (
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            setSelectedAdmin(null);
          }}
          onSuccess={onSuccess}
          onError={onError}
          adminId={selectedAdmin.id}
          adminEmail={selectedAdmin.email}
          adminName={selectedAdmin.full_name}
        />
      )}
    </div>
  );
};

export default AdminList;