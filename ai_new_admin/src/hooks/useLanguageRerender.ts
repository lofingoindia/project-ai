import { useEffect, useState } from 'react';

/**
 * Custom hook that forces component re-render when language changes
 * This ensures immediate visual updates without page reload
 */
export const useLanguageRerender = () => {
  const [, setForceUpdate] = useState(0);

  useEffect(() => {
    const handleLanguageChange = () => {
      // Force re-render by updating state
      setForceUpdate(prev => prev + 1);
    };

    // Listen for language changes
    window.addEventListener('languageChanged', handleLanguageChange);

    // Also listen for RTL toggle events
    window.addEventListener('rtlToggle', handleLanguageChange);

    // Listen for storage changes (for cross-tab sync)
    window.addEventListener('storage', (e) => {
      if (e.key === 'language') {
        handleLanguageChange();
      }
    });

    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
      window.removeEventListener('rtlToggle', handleLanguageChange);
      window.removeEventListener('storage', handleLanguageChange);
    };
  }, []);

  return null; // This hook doesn't return anything, just forces re-render
};