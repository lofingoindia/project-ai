import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Edit2, AlertTriangle, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import AdminRegistrationModal from './AdminRegistrationModal';
import AdminEditModal from './AdminEditModal';
import { useLanguage } from '../contexts/LanguageContext';
import { useRTL } from '../hooks/useRTL';

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
  const { t, language } = useLanguage();
  const rtl = useRTL();
  
  // Fallback translations in case of loading issues
  const fallbackTexts = {
    en: {
      title: 'Admin Management',
      description: 'Manage admin users and their permissions',
      addNewAdmin: 'Add New Admin',
      noAdminUsersFound: 'No admin users found',
      createFirstAdminMessage: 'Get started by creating your first admin user',
      addFirstAdmin: 'Add First Admin',
      adminDetails: 'Admin Details',
      roleStatus: 'Role & Status',
      created: 'Created',
      actions: 'Actions',
      adminUser: 'Admin User',
      active: 'Active',
      inactive: 'Inactive',
      edit: 'Edit',
      delete: 'Delete',
      activate: 'Activate',
      deactivate: 'Deactivate',
      loadingAdminUsers: 'Loading admin users...',
      failedToFetchAdmins: 'Failed to fetch admin users',
      failedToUpdateAdminStatus: 'Failed to update admin status',
      failedToDeleteAdmin: 'Failed to delete admin',
      adminActivatedSuccess: 'Admin activated successfully',
      adminDeactivatedSuccess: 'Admin deactivated successfully',
      adminDeletedSuccess: 'Admin deleted successfully',
      confirmDelete: 'Are you sure you want to delete {name}?'
    },
    ar: {
      title: 'إدارة المديرين',
      description: 'إدارة المستخدمين المديرين وصلاحياتهم',
      addNewAdmin: 'إضافة مدير جديد',
      noAdminUsersFound: 'لم يتم العثور على مستخدمين مديرين',
      createFirstAdminMessage: 'ابدأ بإنشاء أول مستخدم مدير لك',
      addFirstAdmin: 'إضافة أول مدير',
      adminDetails: 'تفاصيل المدير',
      roleStatus: 'الدور والحالة',
      created: 'تاريخ الإنشاء',
      actions: 'الإجراءات',
      adminUser: 'مستخدم مدير',
      active: 'نشط',
      inactive: 'غير نشط',
      edit: 'تعديل',
      delete: 'حذف',
      activate: 'تفعيل',
      deactivate: 'إلغاء تفعيل',
      loadingAdminUsers: 'جاري تحميل المديرين...',
      failedToFetchAdmins: 'فشل في جلب المديرين',
      failedToUpdateAdminStatus: 'فشل في تحديث حالة المدير',
      failedToDeleteAdmin: 'فشل في حذف المدير',
      adminActivatedSuccess: 'تم تفعيل المدير بنجاح',
      adminDeactivatedSuccess: 'تم إلغاء تفعيل المدير بنجاح',
      adminDeletedSuccess: 'تم حذف المدير بنجاح',
      confirmDelete: 'هل أنت متأكد من أنك تريد حذف {name}؟'
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
  
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<Admin | null>(null);

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        onError(getText('admin.failedToFetchAdmins', 'failedToFetchAdmins') + ': ' + error.message);
        return;
      }

      setAdmins(data || []);
    } catch (error) {
      onError(getText('admin.failedToFetchAdmins', 'failedToFetchAdmins'));
      console.error('Error fetching admins:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleEdit = (admin: Admin) => {
    setSelectedAdmin(admin);
    setShowEditModal(true);
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
        onError(getText('admin.failedToUpdateAdminStatus', 'failedToUpdateAdminStatus') + ': ' + error.message);
        return;
      }

      onSuccess(getText(admin.is_active ? 'admin.adminDeactivatedSuccess' : 'admin.adminActivatedSuccess', 
                       admin.is_active ? 'adminDeactivatedSuccess' : 'adminActivatedSuccess'));
      fetchAdmins(); // Refresh the list
    } catch (error) {
      onError(getText('admin.failedToUpdateAdminStatus', 'failedToUpdateAdminStatus'));
      console.error('Error updating admin status:', error);
    }
  };

  const handleDeleteAdmin = async (admin: Admin) => {
    setAdminToDelete(admin);
    setShowDeleteConfirmModal(true);
  };

  const confirmDeleteAdmin = async () => {
    if (!adminToDelete) return;

    try {
      const { error } = await supabase
        .from('admin_users')
        .delete()
        .eq('id', adminToDelete.id);

      if (error) {
        onError(getText('admin.failedToDeleteAdmin', 'failedToDeleteAdmin') + ': ' + error.message);
        return;
      }

      onSuccess(getText('admin.adminDeletedSuccess', 'adminDeletedSuccess').replace('{name}', adminToDelete.full_name));
      fetchAdmins(); // Refresh the list
    } catch (error) {
      onError(getText('admin.failedToDeleteAdmin', 'failedToDeleteAdmin'));
      console.error('Error deleting admin:', error);
    } finally {
      setShowDeleteConfirmModal(false);
      setAdminToDelete(null);
    }
  };

  const cancelDeleteAdmin = () => {
    setShowDeleteConfirmModal(false);
    setAdminToDelete(null);
  };

  const formatDate = (dateString: string) => {
    const locale = language === 'ar' ? 'ar-SA' : 'en-US';
    return new Date(dateString).toLocaleDateString(locale, {
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
          <p className="text-gray-600 dark:text-gray-400">{getText('admin.loadingAdminUsers', 'loadingAdminUsers')}</p>
        </div>
      </div>
    );
  }

  return (
    <div dir={rtl.dir} style={{ fontFamily: rtl.isRTL ? "'Tajawal', system-ui, Arial, sans-serif" : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      {/* Header */}
      <div className={`flex items-center justify-between mb-6`}>
        {rtl.isRTL ? (
          // RTL Layout: Content first, then button on right
          <>
            <div className={`flex items-center`}>
              <Users size={24} className="text-gray-600 dark:text-gray-400" />
              <div className="mr-4" style={{ textAlign: 'right' }}>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {getText('admin.title', 'title')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getText('admin.description', 'description')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRegistrationModal(true)}
              className={`flex items-center flex-row-reverse gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200`}
            >
              <UserPlus size={20} />
              <span>{getText('admin.addNewAdmin', 'addNewAdmin')}</span>
            </button>
          </>
        ) : (
          // LTR Layout: Content first, then button
          <>
            <div className={`flex items-center`}>
              <Users size={24} className="text-gray-600 dark:text-gray-400" />
              <div className="ml-4" style={{ textAlign: 'left' }}>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {getText('admin.title', 'title')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getText('admin.description', 'description')}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowRegistrationModal(true)}
              className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200`}
            >
              <UserPlus size={20} />
              <span>{getText('admin.addNewAdmin', 'addNewAdmin')}</span>
            </button>
          </>
        )}
      </div>

      {/* Admin List */}
      {admins.length === 0 ? (
        <div className="text-center py-12">
          <Users size={48} className="text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {getText('admin.noAdminUsersFound', 'noAdminUsersFound')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {getText('admin.createFirstAdminMessage', 'createFirstAdminMessage')}
          </p>
          <button
            onClick={() => setShowRegistrationModal(true)}
            className={`flex items-center ${rtl.isRTL ? 'flex-row-reverse gap-2' : 'gap-2'} px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition duration-200 mx-auto`}
          >
            <UserPlus size={20} />
            <span>{getText('admin.addFirstAdmin', 'addFirstAdmin')}</span>
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${rtl.isRTL ? 'text-right' : 'text-left'}`}>
                    {getText('admin.adminDetails', 'adminDetails')}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${rtl.isRTL ? 'text-right' : 'text-left'}`}>
                    {getText('admin.roleStatus', 'roleStatus')}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${rtl.isRTL ? 'text-right' : 'text-left'}`}>
                    {getText('admin.created', 'created')}
                  </th>
                  <th className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${rtl.isRTL ? 'text-right' : 'text-left'}`}>
                    {getText('admin.actions', 'actions')}
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
                          {getText('common.adminUser', 'adminUser')}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          admin.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {admin.is_active ? getText('admin.active', 'active') : getText('admin.inactive', 'inactive')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(admin.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className={`flex items-center gap-3 ${rtl.isRTL ? 'justify-end' : 'justify-start'}`}>
                        {rtl.isRTL ? (
                          // RTL Order: Edit, Activate, Delete (right to left)
                          <>
                            <button
                              onClick={() => handleEdit(admin)}
                              className="flex items-center flex-row-reverse gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition duration-200"
                              title={getText('common.edit', 'edit')}
                            >
                              <Edit2 size={14} />
                              <span>{getText('common.edit', 'edit')}</span>
                            </button>
                            <button
                              onClick={() => handleToggleActive(admin)}
                              className={`px-3 py-1 rounded text-xs transition duration-200 ${
                                admin.is_active
                                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                              title={admin.is_active ? getText('admin.deactivate', 'deactivate') : getText('admin.activate', 'activate')}
                            >
                              {admin.is_active ? getText('admin.deactivate', 'deactivate') : getText('admin.activate', 'activate')}
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(admin)}
                              className="flex items-center flex-row-reverse gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition duration-200"
                              title={getText('common.delete', 'delete')}
                            >
                              <Trash2 size={14} />
                              <span>{getText('common.delete', 'delete')}</span>
                            </button>
                          </>
                        ) : (
                          // LTR Order: Edit, Activate, Delete
                          <>
                            <button
                              onClick={() => handleEdit(admin)}
                              className="flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition duration-200"
                              title={getText('common.edit', 'edit')}
                            >
                              <Edit2 size={14} />
                              <span>{getText('common.edit', 'edit')}</span>
                            </button>
                            <button
                              onClick={() => handleToggleActive(admin)}
                              className={`px-3 py-1 rounded text-xs transition duration-200 ${
                                admin.is_active
                                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                  : 'bg-green-600 hover:bg-green-700 text-white'
                              }`}
                              title={admin.is_active ? getText('admin.deactivate', 'deactivate') : getText('admin.activate', 'activate')}
                            >
                              {admin.is_active ? getText('admin.deactivate', 'deactivate') : getText('admin.activate', 'activate')}
                            </button>
                            <button
                              onClick={() => handleDeleteAdmin(admin)}
                              className="flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition duration-200"
                              title={getText('common.delete', 'delete')}
                            >
                              <Trash2 size={14} />
                              <span>{getText('common.delete', 'delete')}</span>
                            </button>
                          </>
                        )}
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

      <AdminEditModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedAdmin(null);
        }}
        onSuccess={onSuccess}
        onError={onError}
        onAdminUpdated={fetchAdmins}
        admin={selectedAdmin}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && adminToDelete && (
        <div className="fixed inset-0 backdrop-blur-md bg-black/20 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md shadow-xl">
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600`}>
              <h3 className={`text-lg font-semibold text-gray-900 dark:text-white ${rtl.isRTL ? 'text-right' : 'text-left'}`}>
                {getText('common.delete', 'delete')} {getText('common.adminUser', 'adminUser')}
              </h3>
              <button
                onClick={cancelDeleteAdmin}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div style={{ textAlign: rtl.isRTL ? 'right' : 'left' }}>
                <div className={`flex items-center mb-4 ${rtl.isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                  <AlertTriangle size={24} className={`text-red-500 ${rtl.isRTL ? 'ml-3' : 'mr-3'}`} />
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-2">
                      {getText('admin.confirmDelete', 'confirmDelete').replace('{name}', adminToDelete.full_name)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {getText('common.actionCannotBeUndone', 'actionCannotBeUndone')}
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8">
                      <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                        <span className="text-xs font-medium text-red-600 dark:text-red-400">
                          {adminToDelete.full_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className={`${rtl.isRTL ? 'mr-3' : 'ml-3'}`}>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {adminToDelete.full_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {adminToDelete.email}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`flex gap-3 ${rtl.isRTL ? 'flex-row-reverse' : ''}`}>
                  <button
                    onClick={confirmDeleteAdmin}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
                  >
                    {getText('common.delete', 'delete')}
                  </button>
                  <button
                    onClick={cancelDeleteAdmin}
                    className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors duration-200"
                  >
                    {getText('common.cancel', 'cancel')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminList;