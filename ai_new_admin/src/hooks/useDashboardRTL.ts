import { useLanguage } from '../contexts/LanguageContext';
import { useMemo } from 'react';

/**
 * Enhanced RTL Hook for Dashboard Component
 * Provides immediate React-controlled classes without CSS selector dependencies
 * This eliminates the timing issue between React state and document attribute changes
 */
export const useDashboardRTL = () => {
  const { isRTL, language } = useLanguage();

  // Memoize the RTL classes to ensure they update immediately when language changes
  return useMemo(() => {
    const rtlState = language === 'ar';
    
    return {
      // Core state
      isRTL: rtlState,
      dir: rtlState ? 'rtl' : 'ltr',
      
      // Layout classes - immediate React-controlled
      layout: {
        // Main container with preserved flex direction
        mainContainer: 'flex h-screen bg-gray-50 dark:bg-gray-900 main-layout',
        
        // Content area with immediate text direction
        contentArea: `flex-1 overflow-y-auto p-6 ${rtlState ? 'font-tajawal' : ''}`,
        
        // Header section
        headerSection: `flex items-center justify-between mb-6`,
        
        // Statistics grid
        statsGrid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8',
        
        // Content grid
        contentGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8',
        
        // Quick stats grid
        quickStatsGrid: 'grid grid-cols-1 lg:grid-cols-3 gap-6',
      },

      // Text alignment classes - immediate updates
      text: {
        // Header text
        title: `text-2xl font-bold text-gray-900 dark:text-white ${rtlState ? 'text-right' : 'text-left'}`,
        subtitle: `text-gray-600 dark:text-gray-400 mt-1 ${rtlState ? 'text-right' : 'text-left'}`,
        
        // Section headers
        sectionHeader: `text-lg font-semibold text-gray-900 dark:text-white ${rtlState ? 'text-right' : 'text-left'}`,
        
        // Body text
        bodyText: `text-sm text-gray-600 dark:text-gray-400 ${rtlState ? 'text-right' : 'text-left'}`,
        
        // Stats text
        statValue: `text-2xl font-bold text-gray-900 dark:text-white ${rtlState ? 'text-right' : 'text-left'}`,
        statLabel: `text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 ${rtlState ? 'text-right' : 'text-left'}`,
        
        // Button text
        buttonText: `${rtlState ? 'text-right' : 'text-left'}`,
        
        // Link text
        linkText: `text-blue-600 dark:text-blue-400 font-medium text-sm ${rtlState ? 'text-right' : 'text-left'}`,
      },

      // Spacing and margins - immediate updates
      spacing: {
        // Icon spacing
        iconSpacing: rtlState ? 'mr-2' : 'ml-2',
        iconSpacingLarge: rtlState ? 'mr-3' : 'ml-3',
        
        // Text margins
        textMarginStart: rtlState ? 'mr-2' : 'ml-2',
        textMarginEnd: rtlState ? 'ml-2' : 'mr-2',
        
        // Content spacing
        contentSpacing: rtlState ? 'mr-4' : 'ml-4',
      },

      // Flex containers - immediate updates
      flex: {
        // Row container
        row: `flex ${rtlState ? 'flex-row-reverse' : 'flex-row'}`,
        
        // Items center with spacing
        itemsCenter: `flex items-center`,
        
        // Justify between
        justifyBetween: `flex items-center justify-between`,
        
        // Space between items
        spaceBetween: `flex items-center space-x-3 ${rtlState ? 'space-x-reverse' : ''}`,
        
        // Card header
        cardHeader: `flex items-center justify-between`,
        
        // Stat card content
        statCardContent: `flex items-center justify-between`,
      },

      // Card and component classes
      components: {
        // Standard card
        card: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg',
        
        // Stat card
        statCard: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6',
        
        // Section card
        sectionCard: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg',
        
        // Card header
        cardHeader: 'p-6 border-b border-gray-200 dark:border-gray-700',
        
        // Card content
        cardContent: 'p-6',
        
        // Button
        button: 'flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200',
        
        // Status badge
        statusBadge: 'px-2 py-1 rounded text-xs font-medium',
      },

      // List and item classes
      lists: {
        // Item row
        itemRow: `flex items-center justify-between`,
        
        // Item content
        itemContent: `flex items-center space-x-3 ${rtlState ? 'space-x-reverse' : ''}`,
        
        // Item text
        itemTextContainer: rtlState ? 'text-right' : 'text-left',
        
        // Item actions
        itemActions: `flex items-center space-x-3 ${rtlState ? 'space-x-reverse' : ''}`,
      },

      // Input and form classes
      forms: {
        // Input direction
        inputDir: rtlState ? 'rtl' : 'ltr',
        
        // Input alignment
        inputAlign: rtlState ? 'text-right' : 'text-left',
      },

      // Utility functions for dynamic classes
      utils: {
        // Combine classes with proper spacing
        combineClasses: (...classes: (string | undefined)[]): string => {
          return classes.filter(Boolean).join(' ');
        },
        
        // Conditional class
        conditionalClass: (condition: boolean, trueClass: string, falseClass: string = ''): string => {
          return condition ? trueClass : falseClass;
        },
        
        // RTL-aware margin
        margin: (side: 'start' | 'end', size: '1' | '2' | '3' | '4' | '6'): string => {
          if (side === 'start') {
            return rtlState ? `mr-${size}` : `ml-${size}`;
          }
          return rtlState ? `ml-${size}` : `mr-${size}`;
        },
        
        // RTL-aware padding
        padding: (side: 'start' | 'end', size: '1' | '2' | '3' | '4' | '6'): string => {
          if (side === 'start') {
            return rtlState ? `pr-${size}` : `pl-${size}`;
          }
          return rtlState ? `pl-${size}` : `pr-${size}`;
        },

        // Font family for RTL
        fontFamily: rtlState ? "'Tajawal', system-ui, Arial, sans-serif" : "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      },
    };
  }, [language, isRTL]); // Re-memoize when language or isRTL changes
};