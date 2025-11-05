import { useLanguage } from '../contexts/LanguageContext';

/**
 * RTL Helper Hook - Provides utilities for RTL layout management
 * This hook eliminates the need for manual conditional RTL logic in components
 */
export const useRTL = () => {
  const { isRTL } = useLanguage();
  
  return {
    isRTL,
    dir: isRTL ? 'rtl' : 'ltr',
    
    // Class name helpers - automatically handle RTL switching
    classes: {
      // Flex direction helpers
      flexRow: isRTL ? 'flex-row-reverse' : 'flex-row',
      flexRowReverse: isRTL ? 'flex-row' : 'flex-row-reverse',
      
      // Text alignment helpers
      textLeft: isRTL ? 'text-right' : 'text-left',
      textRight: isRTL ? 'text-left' : 'text-right',
      
      // Margin helpers
      ml: (size: string) => `ml-${size}`, // Let CSS handle RTL automatically
      mr: (size: string) => `mr-${size}`, // Let CSS handle RTL automatically
      
      // Padding helpers
      pl: (size: string) => `pl-${size}`, // Let CSS handle RTL automatically
      pr: (size: string) => `pr-${size}`, // Let CSS handle RTL automatically
      
      // Border helpers
      borderL: isRTL ? 'border-r' : 'border-l',
      borderR: isRTL ? 'border-l' : 'border-r',
      
      // Positioning helpers
      left: (size: string) => isRTL ? `right-${size}` : `left-${size}`,
      right: (size: string) => isRTL ? `left-${size}` : `right-${size}`,
      
      // Rounded corners
      roundedL: isRTL ? 'rounded-r' : 'rounded-l',
      roundedR: isRTL ? 'rounded-l' : 'rounded-r',
      roundedLLg: isRTL ? 'rounded-r-lg' : 'rounded-l-lg',
      roundedRLg: isRTL ? 'rounded-l-lg' : 'rounded-r-lg',
    },
    
    // Utility functions for common patterns
    utils: {
      // Conditional class helper
      rtlClass: (ltrClass: string, rtlClass: string) => isRTL ? rtlClass : ltrClass,
      
      // Space between items
      spaceX: (size: string) => `space-x-${size} ${isRTL ? 'space-x-reverse' : ''}`,
      
      // Flex container with auto-reverse
      flexContainer: (additionalClasses = '') => 
        `flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} ${additionalClasses}`,
      
      // Icon positioning in inputs
      iconLeft: isRTL ? 'right-3' : 'left-3',
      iconRight: isRTL ? 'left-3' : 'right-3',
      
      // Dropdown positioning
      dropdownPosition: isRTL ? 'left-0' : 'right-0',
      
      // Justify content with RTL awareness
      justifyBetween: (reverse = false) => {
        if (reverse) {
          return isRTL ? 'justify-between' : 'justify-between flex-row-reverse';
        }
        return 'justify-between';
      },
    },
    
    // Form field helpers
    form: {
      // Input text direction
      inputDir: isRTL ? 'rtl' : 'ltr',
      
      // Input padding for icons
      inputWithLeftIcon: isRTL ? 'pr-10' : 'pl-10',
      inputWithRightIcon: isRTL ? 'pl-10' : 'pr-10',
      
      // Label alignment
      labelAlign: isRTL ? 'text-right' : 'text-left',
    },
    
    // Layout helpers
    layout: {
      // Main container direction
      mainContainer: `flex ${isRTL ? 'flex-row-reverse' : 'flex-row'}`,
      
      // Sidebar positioning
      sidebarBorder: isRTL ? 'border-l' : 'border-r',
      
      // Header spacing
      headerSpacing: isRTL ? 'space-x-reverse space-x-4' : 'space-x-4',
    },
    
    // Navigation helpers
    navigation: {
      // Back button direction
      backButton: isRTL ? 'flex-row-reverse' : 'flex-row',
      
      // Menu alignment
      menuAlign: isRTL ? 'text-right' : 'text-left',
      
      // Breadcrumb direction
      breadcrumb: isRTL ? 'flex-row-reverse' : 'flex-row',
    },
    
    // Animation helpers
    animation: {
      // Slide animation direction
      slideIn: isRTL ? 'translate-x-full' : '-translate-x-full',
      slideOut: isRTL ? '-translate-x-full' : 'translate-x-full',
    },
  };
};

// Standalone utility functions that can be used without the hook
export const rtlUtils = {
  // Get direction attribute
  getDirection: (isRTL: boolean) => isRTL ? 'rtl' : 'ltr',
  
  // Get text alignment
  getTextAlign: (isRTL: boolean, align: 'left' | 'right' | 'center') => {
    if (align === 'center') return 'text-center';
    if (align === 'left') return isRTL ? 'text-right' : 'text-left';
    if (align === 'right') return isRTL ? 'text-left' : 'text-right';
    return 'text-left';
  },
  
  // Get margin class
  getMargin: (_isRTL: boolean, side: 'left' | 'right', size: string) => {
    if (side === 'left') return `ml-${size}`;
    if (side === 'right') return `mr-${size}`;
    return '';
  },
  
  // Get padding class
  getPadding: (_isRTL: boolean, side: 'left' | 'right', size: string) => {
    if (side === 'left') return `pl-${size}`;
    if (side === 'right') return `pr-${size}`;
    return '';
  },
  
  // Get flex direction
  getFlexDirection: (isRTL: boolean, reverse = false) => {
    if (reverse) {
      return isRTL ? 'flex-row' : 'flex-row-reverse';
    }
    return isRTL ? 'flex-row-reverse' : 'flex-row';
  },
  
  // Get position class
  getPosition: (isRTL: boolean, side: 'left' | 'right', size: string) => {
    if (side === 'left') return isRTL ? `right-${size}` : `left-${size}`;
    if (side === 'right') return isRTL ? `left-${size}` : `right-${size}`;
    return '';
  },
};

/**
 * HOC for automatic RTL class application
 * Usage: withRTL('flex justify-between', { rtl: 'flex-row-reverse' })
 */
export const withRTL = (baseClasses: string, rtlOverrides: { rtl?: string; ltr?: string } = {}) => {
  return (isRTL: boolean) => {
    let classes = baseClasses;
    
    if (isRTL && rtlOverrides.rtl) {
      classes += ` ${rtlOverrides.rtl}`;
    } else if (!isRTL && rtlOverrides.ltr) {
      classes += ` ${rtlOverrides.ltr}`;
    }
    
    return classes;
  };
};

/**
 * CSS-in-JS style object helper for RTL
 */
export const rtlStyles = {
  flexDirection: (isRTL: boolean, reverse = false) => ({
    flexDirection: reverse 
      ? (isRTL ? 'row' : 'row-reverse')
      : (isRTL ? 'row-reverse' : 'row') as 'row' | 'row-reverse'
  }),
  
  textAlign: (isRTL: boolean, align: 'left' | 'right' | 'center') => ({
    textAlign: align === 'center' 
      ? 'center' 
      : (align === 'left' 
          ? (isRTL ? 'right' : 'left')
          : (isRTL ? 'left' : 'right')
        ) as 'left' | 'right' | 'center'
  }),
  
  marginLeft: (isRTL: boolean, value: string | number) => 
    isRTL ? { marginRight: value } : { marginLeft: value },
    
  marginRight: (isRTL: boolean, value: string | number) => 
    isRTL ? { marginLeft: value } : { marginRight: value },
    
  paddingLeft: (isRTL: boolean, value: string | number) => 
    isRTL ? { paddingRight: value } : { paddingLeft: value },
    
  paddingRight: (isRTL: boolean, value: string | number) => 
    isRTL ? { paddingLeft: value } : { paddingRight: value },
    
  left: (isRTL: boolean, value: string | number) => 
    isRTL ? { right: value, left: 'auto' } : { left: value },
    
  right: (isRTL: boolean, value: string | number) => 
    isRTL ? { left: value, right: 'auto' } : { right: value },
};