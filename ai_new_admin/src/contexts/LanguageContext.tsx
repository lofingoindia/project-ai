import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import en from '../locales/en.json';
import ar from '../locales/ar.json';
import { RTLClassGenerator } from '../utils/rtl';

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
    const saved = localStorage.getItem('language');
    return (saved === 'ar' || saved === 'en') ? saved : 'ar';
  });

  const isRTL = language === 'ar';
  const rtl = new RTLClassGenerator(isRTL);

  useEffect(() => {
    localStorage.setItem('language', language);
    
    // Update document direction and lang attribute
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Add/remove RTL class to body
    if (language === 'ar') {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }

    // Debug log
    console.log('Language changed:', language, 'Direction:', document.documentElement.dir);
  }, [language]);

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
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