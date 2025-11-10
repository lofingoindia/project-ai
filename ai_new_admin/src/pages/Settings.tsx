import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import AdminList from '../components/AdminList';
import { useLanguage } from '../contexts/LanguageContext';
import { useDashboardRTL } from '../hooks/useDashboardRTL';

const Settings: React.FC = () => {
  const { t, language, isRTL } = useLanguage();
  const rtl = useDashboardRTL();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [renderKey, setRenderKey] = useState(0);

  // Force re-render when language changes
  useEffect(() => {
    console.log('🔄 Settings language changed:', language, 'isRTL:', isRTL);
    setRenderKey(prev => prev + 1);
  }, [language, isRTL]);

  const handleSuccess = (text: string) => {
    setMessage({ type: 'success', text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleError = (text: string) => {
    setMessage({ type: 'error', text });
    setTimeout(() => setMessage(null), 5000);
  };

  return (
    <div key={renderKey} className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex">
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
        />
        
        <div className="flex-1 flex flex-col">
          <Header 
            title={t('messages.settings.title')}
            isSidebarCollapsed={isSidebarCollapsed}
            onSidebarToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          />
          
          <main className="flex-1 p-6" style={{ 
            fontFamily: rtl.utils.fontFamily,
            direction: isRTL ? 'rtl' : 'ltr',
            textAlign: isRTL ? 'right' : 'left'
          }}>
            <div className="max-w-6xl mx-auto">
              {/* Message Display */}
              {message && (
                <div className={`mb-6 p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400'
                    : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400'
                }`}>
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 w-5 h-5 ${isRTL ? 'ml-3' : 'mr-3'} ${
                      message.type === 'success' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {message.type === 'success' ? (
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className={`text-sm font-medium ${isRTL ? 'text-right' : 'text-left'}`}>
                      {message.text}
                    </p>
                  </div>
                </div>
              )}

              {/* Admin Management Section */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <AdminList
                    onSuccess={handleSuccess}
                    onError={handleError}
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Settings;