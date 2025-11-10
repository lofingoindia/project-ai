/**
 * Master RTL Controller - Single File Controls All RTL Functionality
 * This file manages RTL behavior across the entire application
 */

import { getCurrentDocumentLanguage } from './earlyLanguageInit';

export class MasterRTLController {
  private isRTL: boolean = false;
  private cssInjected: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Get initial language from document (set by early initialization)
    // or fall back to localStorage
    try {
      const documentLanguage = getCurrentDocumentLanguage();
      this.isRTL = documentLanguage === 'ar';
    } catch (error) {
      // Fallback to localStorage if early init hasn't run
      const savedLanguage = localStorage.getItem('language');
      this.isRTL = savedLanguage === 'ar' || (!savedLanguage ? true : false);
    }
    
    this.applyGlobalRTL();
  }

  /**
   * Main method to apply RTL changes globally
   * Now works with immediate updates for instant language switching
   */
  public applyGlobalRTL() {
    // Always apply document changes (don't check conditions)
    this.applyDocumentChanges();
    
    // Inject CSS variables (will update existing ones)
    this.injectCSSVariables();
    
    // Apply automatic component updates
    this.updateExistingComponents();
    
    // Force browser repaint to ensure immediate visual update
    document.body.offsetHeight; // Trigger reflow
  }

  /**
   * Inject CSS variables for automatic RTL handling
   */
  private injectCSSVariables() {
    if (this.cssInjected) {
      // Update existing CSS variables
      const root = document.documentElement;
      root.style.setProperty('--rtl-direction', this.isRTL ? 'rtl' : 'ltr');
      root.style.setProperty('--rtl-text-align-start', this.isRTL ? 'right' : 'left');
      root.style.setProperty('--rtl-text-align-end', this.isRTL ? 'left' : 'right');
      root.style.setProperty('--rtl-flex-direction', this.isRTL ? 'row-reverse' : 'row');
      return;
    }

    const css = `
      :root {
        --rtl-direction: ${this.isRTL ? 'rtl' : 'ltr'};
        --rtl-text-align-start: ${this.isRTL ? 'right' : 'left'};
        --rtl-text-align-end: ${this.isRTL ? 'left' : 'right'};
        --rtl-flex-direction: ${this.isRTL ? 'row-reverse' : 'row'};
      }

      /* Automatic RTL classes - apply automatically without breaking existing styles */
      .rtl-auto-flex {
        flex-direction: var(--rtl-flex-direction) !important;
      }
      
      .rtl-auto-text {
        text-align: var(--rtl-text-align-start) !important;
      }
      
      .rtl-auto-text-end {
        text-align: var(--rtl-text-align-end) !important;
      }

      /* Smooth RTL transitions */
      .rtl-transition {
        transition: all 0.3s ease-in-out;
      }

      /* Auto-apply to common patterns without breaking existing design */
      [dir="rtl"] .sidebar-content {
        border-right: 1px solid rgb(229 231 235);
        border-left: none;
      }
      
      [dir="ltr"] .sidebar-content {
        border-right: 1px solid rgb(229 231 235);
        border-left: none;
      }

      /* Icon rotation for RTL */
      [dir="rtl"] .rtl-flip-icon {
        transform: scaleX(-1);
      }

      /* Dropdown positioning */
      [dir="rtl"] .dropdown-menu {
        right: 0;
        left: auto;
      }
      
      [dir="ltr"] .dropdown-menu {
        left: 0;
        right: auto;
      }
    `;

    const styleElement = document.createElement('style');
    styleElement.id = 'master-rtl-styles';
    styleElement.textContent = css;
    document.head.appendChild(styleElement);
    this.cssInjected = true;
  }

  /**
   * Update existing components automatically
   * Enhanced for immediate updates
   */
  private updateExistingComponents() {
    // Force update all RTL text elements
    const textElements = document.querySelectorAll('.rtl-text-only');
    textElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.textAlign = this.isRTL ? 'right' : 'left';
      htmlElement.style.direction = this.isRTL ? 'rtl' : 'ltr';
    });

    // Update margin utilities
    const marginStartElements = document.querySelectorAll('.rtl-text-margin-start-2');
    marginStartElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.marginRight = this.isRTL ? '0.5rem' : '0';
      htmlElement.style.marginLeft = this.isRTL ? '0' : '0.5rem';
    });

    const marginEndElements = document.querySelectorAll('.rtl-text-margin-end-2');
    marginEndElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.marginLeft = this.isRTL ? '0.5rem' : '0';
      htmlElement.style.marginRight = this.isRTL ? '0' : '0.5rem';
    });

    // Update icon spacing
    const iconSpacingElements = document.querySelectorAll('.rtl-text-icon-spacing');
    iconSpacingElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.marginRight = this.isRTL ? '0.5rem' : '0';
      htmlElement.style.marginLeft = this.isRTL ? '0' : '0.5rem';
    });

    // Update content text containers
    const contentTextElements = document.querySelectorAll('.rtl-content-text');
    contentTextElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      htmlElement.style.fontFamily = this.isRTL ? "'Tajawal', system-ui, Arial, sans-serif" : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      htmlElement.style.lineHeight = this.isRTL ? '1.6' : '1.5';
    });

    // Legacy support for older components
    const flexContainers = document.querySelectorAll('.flex');
    flexContainers.forEach(element => {
      if (element.classList.contains('justify-between') || 
          element.classList.contains('items-center')) {
        element.classList.add('rtl-auto-flex', 'rtl-transition');
      }
    });
  }

  /**
   * Toggle RTL/LTR mode
   */
  public toggleRTL() {
    this.isRTL = !this.isRTL;
    localStorage.setItem('language', this.isRTL ? 'ar' : 'en');
    this.applyGlobalRTL();
    
    // Trigger a custom event for components that need to respond
    window.dispatchEvent(new CustomEvent('rtlToggle', { 
      detail: { isRTL: this.isRTL } 
    }));
  }

  /**
   * Set RTL mode explicitly
   * Updates both controller state and document immediately
   */
  public setRTL(isRTL: boolean) {
    // Always update, even if same value, to ensure DOM is in sync
    this.isRTL = isRTL;
    
    // Update localStorage immediately
    localStorage.setItem('language', isRTL ? 'ar' : 'en');
    
    // Force immediate document updates
    this.applyDocumentChanges();
    
    // Apply global changes
    this.applyGlobalRTL();
    
    // Dispatch event for React components
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language: isRTL ? 'ar' : 'en', isRTL } 
    }));
    
    // Force re-render by triggering a DOM mutation
    document.body.style.setProperty('--rtl-force-update', Date.now().toString());
  }

  /**
   * Apply document-level changes immediately
   */
  private applyDocumentChanges() {
    const html = document.documentElement;
    const body = document.body;
    
    // Set HTML attributes immediately
    html.dir = this.isRTL ? 'rtl' : 'ltr';
    html.lang = this.isRTL ? 'ar' : 'en';
    html.setAttribute('data-language', this.isRTL ? 'ar' : 'en');
    html.setAttribute('data-direction', this.isRTL ? 'rtl' : 'ltr');
    
    // Update body classes immediately
    body.classList.remove('rtl-active', 'ltr-active');
    body.classList.add(this.isRTL ? 'rtl-active' : 'ltr-active');
    
    // Set CSS custom properties immediately
    html.style.setProperty('--language-direction', this.isRTL ? 'rtl' : 'ltr');
    html.style.setProperty('--text-align-start', this.isRTL ? 'right' : 'left');
    html.style.setProperty('--text-align-end', this.isRTL ? 'left' : 'right');
  }

  /**
   * Get current RTL state
   */
  public getIsRTL(): boolean {
    return this.isRTL;
  }

  /**
   * Get CSS class helpers for components
   */
  public getClassHelpers() {
    return {
      flexDirection: this.isRTL ? 'flex-row-reverse' : 'flex-row',
      textAlign: this.isRTL ? 'text-right' : 'text-left',
      textAlignOpposite: this.isRTL ? 'text-left' : 'text-right',
      marginStart: (size: string) => this.isRTL ? `mr-${size}` : `ml-${size}`,
      marginEnd: (size: string) => this.isRTL ? `ml-${size}` : `mr-${size}`,
      paddingStart: (size: string) => this.isRTL ? `pr-${size}` : `pl-${size}`,
      paddingEnd: (size: string) => this.isRTL ? `pl-${size}` : `pr-${size}`,
      borderStart: this.isRTL ? 'border-r' : 'border-l',
      borderEnd: this.isRTL ? 'border-l' : 'border-r',
      roundedStart: this.isRTL ? 'rounded-r' : 'rounded-l',
      roundedEnd: this.isRTL ? 'rounded-l' : 'rounded-r',
      start: (size: string) => this.isRTL ? `right-${size}` : `left-${size}`,
      end: (size: string) => this.isRTL ? `left-${size}` : `right-${size}`,
    };
  }

  /**
   * Get direction for components
   */
  public getDirection(): 'rtl' | 'ltr' {
    return this.isRTL ? 'rtl' : 'ltr';
  }

  /**
   * Get locale string
   */
  public getLocale(): string {
    return this.isRTL ? 'ar-SA' : 'en-US';
  }
}

// Create and export global instance
export const masterRTL = new MasterRTLController();

// Export for use in React components
export const useMasterRTL = () => {
  return {
    isRTL: masterRTL.getIsRTL(),
    toggle: () => masterRTL.toggleRTL(),
    setRTL: (isRTL: boolean) => masterRTL.setRTL(isRTL),
    classes: masterRTL.getClassHelpers(),
    direction: masterRTL.getDirection(),
    locale: masterRTL.getLocale(),
  };
};