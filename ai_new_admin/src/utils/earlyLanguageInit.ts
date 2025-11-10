/**
 * Early Language Initialization
 * This script runs before React renders to set language attributes early
 * and prevent any flicker or layout shifts during initial load.
 */

/**
 * Detect browser language preference
 * Returns 'ar' if Arabic is preferred, 'en' otherwise
 */
function detectBrowserLanguage(): 'ar' | 'en' {
  // Check navigator language preferences
  const languages = navigator.languages || [navigator.language];
  
  // Check if any preferred language is Arabic
  for (const lang of languages) {
    const langCode = lang.toLowerCase().split('-')[0];
    if (langCode === 'ar') {
      return 'ar';
    }
  }
  
  // Default to Arabic
  return 'ar';
}

/**
 * Get language preference with smart fallback
 */
function getLanguagePreference(): 'ar' | 'en' {
  try {
    // First check localStorage for saved preference
    const saved = localStorage.getItem('language');
    if (saved === 'ar' || saved === 'en') {
      return saved;
    }
    
    // If no saved preference, detect from browser
    const detected = detectBrowserLanguage();
    
    // Save the detected preference for future use
    localStorage.setItem('language', detected);
    
    return detected;
  } catch (error) {
    // Fallback if localStorage is not available
    console.warn('localStorage not available, using Arabic as default');
    return 'ar';
  }
}

/**
 * Apply language settings to document immediately
 */
function applyLanguageToDocument(language: 'ar' | 'en') {
  const html = document.documentElement;
  const body = document.body;
  
  // Set HTML attributes
  html.lang = language === 'ar' ? 'ar' : 'en';
  html.dir = language === 'ar' ? 'rtl' : 'ltr';
  
  // Set data attributes for CSS targeting
  html.setAttribute('data-language', language);
  html.setAttribute('data-direction', language === 'ar' ? 'rtl' : 'ltr');
  
  // Add body classes for immediate styling
  body.classList.remove('rtl-active', 'ltr-active');
  body.classList.add(language === 'ar' ? 'rtl-active' : 'ltr-active');
  
  // Set CSS custom properties for immediate use
  html.style.setProperty('--language-direction', language === 'ar' ? 'rtl' : 'ltr');
  html.style.setProperty('--text-align-start', language === 'ar' ? 'right' : 'left');
  html.style.setProperty('--text-align-end', language === 'ar' ? 'left' : 'right');
}

/**
 * Initialize language settings early
 * Call this immediately when the page loads
 */
export function initializeLanguageEarly(): 'ar' | 'en' {
  try {
    const language = getLanguagePreference();
    applyLanguageToDocument(language);
    
    console.log('🌐 Early language initialization completed:', language);
    return language;
  } catch (error) {
    console.error('Early language initialization failed:', error);
    // Fallback to Arabic
    applyLanguageToDocument('ar');
    return 'ar';
  }
}

/**
 * Get current language from document
 */
export function getCurrentDocumentLanguage(): 'ar' | 'en' {
  const dir = document.documentElement.dir;
  return dir === 'rtl' ? 'ar' : 'en';
}

/**
 * Update language preference and save to storage
 */
export function updateLanguagePreference(language: 'ar' | 'en') {
  try {
    localStorage.setItem('language', language);
    applyLanguageToDocument(language);
    
    // Dispatch custom event for components that need to respond
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language, isRTL: language === 'ar' } 
    }));
    
    console.log('🔄 Language preference updated:', language);
  } catch (error) {
    console.error('Failed to update language preference:', error);
  }
}

// Auto-initialize if this script is loaded
// This ensures language is set as early as possible
if (typeof document !== 'undefined' && document.readyState !== 'loading') {
  // DOM is already loaded
  initializeLanguageEarly();
} else if (typeof document !== 'undefined') {
  // DOM is still loading
  document.addEventListener('DOMContentLoaded', initializeLanguageEarly);
}