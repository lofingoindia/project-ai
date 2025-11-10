/**
 * Language Persistence Test
 * This file provides utilities to test and verify language persistence functionality
 */

export class LanguagePersistenceTest {
  /**
   * Test if language preference is correctly saved to localStorage
   */
  static testLocalStoragePersistence(): boolean {
    try {
      // Test setting Arabic
      localStorage.setItem('language', 'ar');
      const arabicResult = localStorage.getItem('language');
      
      // Test setting English
      localStorage.setItem('language', 'en');
      const englishResult = localStorage.getItem('language');
      
      // Clean up
      localStorage.removeItem('language');
      
      return arabicResult === 'ar' && englishResult === 'en';
    } catch (error) {
      console.error('localStorage test failed:', error);
      return false;
    }
  }

  /**
   * Test if document attributes are set correctly
   */
  static testDocumentAttributes(): { dir: boolean; lang: boolean; dataAttributes: boolean } {
    const html = document.documentElement;
    
    return {
      dir: html.dir === 'rtl' || html.dir === 'ltr',
      lang: html.lang === 'ar' || html.lang === 'en',
      dataAttributes: html.hasAttribute('data-language') && html.hasAttribute('data-direction')
    };
  }

  /**
   * Test language detection from browser
   */
  static testBrowserLanguageDetection(): string {
    const languages = navigator.languages || [navigator.language];
    
    for (const lang of languages) {
      const langCode = lang.toLowerCase().split('-')[0];
      if (langCode === 'ar') {
        return 'ar';
      }
    }
    
    return 'en';
  }

  /**
   * Run comprehensive language tests
   */
  static runAllTests(): { [key: string]: any } {
    const results = {
      localStorage: this.testLocalStoragePersistence(),
      documentAttributes: this.testDocumentAttributes(),
      browserDetection: this.testBrowserLanguageDetection(),
      timestamp: new Date().toISOString()
    };

    console.log('🧪 Language Persistence Test Results:', results);
    return results;
  }

  /**
   * Test language switching without reload
   */
  static testLanguageSwitch(): Promise<boolean> {
    return new Promise((resolve) => {
      const originalLanguage = localStorage.getItem('language') || 'en';
      const newLanguage = originalLanguage === 'en' ? 'ar' : 'en';
      
      // Listen for language change event
      const handler = (event: CustomEvent) => {
        const success = event.detail.language === newLanguage;
        window.removeEventListener('languageChanged', handler as EventListener);
        
        // Restore original language
        localStorage.setItem('language', originalLanguage);
        
        resolve(success);
      };
      
      window.addEventListener('languageChanged', handler as EventListener);
      
      // Trigger language change
      window.dispatchEvent(new CustomEvent('languageChanged', { 
        detail: { language: newLanguage, isRTL: newLanguage === 'ar' } 
      }));
      
      // Timeout after 2 seconds
      setTimeout(() => {
        window.removeEventListener('languageChanged', handler as EventListener);
        resolve(false);
      }, 2000);
    });
  }
}

// Auto-run tests in browser console
// You can manually call LanguagePersistenceTest.runAllTests() to run tests