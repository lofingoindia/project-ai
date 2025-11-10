import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import en from '../locales/en.json';
import ar from '../locales/ar.json';
import { RTLClassGenerator } from '../utils/rtl';
import { masterRTL } from '../utils/masterRTL';
import { getCurrentDocumentLanguage, updateLanguagePreference } from '../utils/earlyLanguageInit';

interface LanguageContextType {
  language: 'en' | 'ar';
  t: (key: string) => string;
  setLanguage: (lang: 'en' | 'ar') => void;
  toggleLanguage: () => void;
  isRTL: boolean;
  rtl: RTLClassGenerator;
  getDirection: () => 'rtl' | 'ltr';
  getLocale: () => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en,
  ar
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<'en' | 'ar'>(() => {
    // Get language from document (set by early initialization)
    try {
      return getCurrentDocumentLanguage();
    } catch (error) {
      // Fallback to localStorage if early init hasn't run
      const saved = localStorage.getItem('language');
      return (saved === 'ar' || saved === 'en') ? saved : 'ar';
    }
  });

  const isRTL = language === 'ar';
  const rtl = new RTLClassGenerator(isRTL);

  useEffect(() => {
    // Listen for language changes from outside React (like early init updates)
    const handleLanguageChange = (event: CustomEvent) => {
      const { language: newLanguage } = event.detail;
      if (newLanguage !== language) {
        setLanguage(newLanguage);
      }
    };

    window.addEventListener('languageChanged', handleLanguageChange as EventListener);
    return () => window.removeEventListener('languageChanged', handleLanguageChange as EventListener);
  }, [language]);

  useEffect(() => {
    // Use master RTL controller to handle all RTL logic immediately
    masterRTL.setRTL(language === 'ar');
    
    // Force immediate DOM update
    requestAnimationFrame(() => {
      // Ensure all components are updated after render
      masterRTL.applyGlobalRTL();
    });
    
    // Debug log
    console.log('Language changed:', language, 'RTL:', language === 'ar');
  }, [language]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    // Debug logging for admin translations
    if (key.startsWith('admin.')) {
      console.log(`🌐 Translation Debug: ${key} = "${value}" (Language: ${language})`);
    }
    
    return value || key;
  };

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'ar' : 'en';
    
    console.log('🌐 Toggling language from', language, 'to', newLanguage);
    
    // Update React state immediately
    setLanguage(newLanguage);
    
    // Apply changes immediately through master RTL
    masterRTL.setRTL(newLanguage === 'ar');
    
    // Also update through early language preference
    updateLanguagePreference(newLanguage);
  };

  const getDirection = (): 'rtl' | 'ltr' => isRTL ? 'rtl' : 'ltr';
  
  const getLocale = (): string => isRTL ? 'ar-SA' : 'en-US';

  const value: LanguageContextType = {
    language,
    t,
    setLanguage,
    toggleLanguage,
    isRTL,
    rtl,
    getDirection,
    getLocale
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};