/**
 * RTL Utility Functions - Centralized RTL logic
 * These functions can be used throughout the app for consistent RTL behavior
 */

/**
 * Get CSS class names for RTL-aware styling
 */
export const rtlClasses = {
  // Flex direction utilities
  flexRow: (isRTL: boolean) => isRTL ? 'flex-row-reverse' : 'flex-row',
  flexRowReverse: (isRTL: boolean) => isRTL ? 'flex-row' : 'flex-row-reverse',
  
  // Text alignment utilities
  textLeft: (isRTL: boolean) => isRTL ? 'text-right' : 'text-left',
  textRight: (isRTL: boolean) => isRTL ? 'text-left' : 'text-right',
  
  // Spacing utilities
  spaceX: (size: number, isRTL: boolean) => 
    `space-x-${size} ${isRTL ? 'space-x-reverse' : ''}`.trim(),
  
  // Positioning utilities
  left: (size: number, isRTL: boolean) => isRTL ? `right-${size}` : `left-${size}`,
  right: (size: number, isRTL: boolean) => isRTL ? `left-${size}` : `right-${size}`,
  
  // Border utilities
  borderLeft: (isRTL: boolean) => isRTL ? 'border-r' : 'border-l',
  borderRight: (isRTL: boolean) => isRTL ? 'border-l' : 'border-r',
  
  // Rounded corner utilities
  roundedLeft: (isRTL: boolean) => isRTL ? 'rounded-r' : 'rounded-l',
  roundedRight: (isRTL: boolean) => isRTL ? 'rounded-l' : 'rounded-r',
  
  // Dropdown positioning
  dropdownLeft: (isRTL: boolean) => isRTL ? 'right-0' : 'left-0',
  dropdownRight: (isRTL: boolean) => isRTL ? 'left-0' : 'right-0',
};

/**
 * Get direction attribute value
 */
export const getDirection = (isRTL: boolean): 'rtl' | 'ltr' => isRTL ? 'rtl' : 'ltr';

/**
 * Get language code for formatting
 */
export const getLocale = (isRTL: boolean): string => isRTL ? 'ar-SA' : 'en-US';

/**
 * Combine multiple classes with RTL awareness
 */
export const combineRTLClasses = (_isRTL: boolean, ...classArrays: (string | undefined)[]): string => {
  return classArrays.filter(Boolean).join(' ');
};

/**
 * Create conditional classes based on RTL
 */
export const conditionalClass = (
  isRTL: boolean, 
  ltrClass: string, 
  rtlClass: string
): string => isRTL ? rtlClass : ltrClass;

/**
 * Generate margin classes that work with RTL CSS
 */
export const marginClass = (side: 'left' | 'right', size: number): string => {
  return side === 'left' ? `ml-${size}` : `mr-${size}`;
};

/**
 * Generate padding classes that work with RTL CSS
 */
export const paddingClass = (side: 'left' | 'right', size: number): string => {
  return side === 'left' ? `pl-${size}` : `pr-${size}`;
};

/**
 * Icon positioning helper for inputs
 */
export const iconPosition = {
  left: (isRTL: boolean) => isRTL ? 'right-3' : 'left-3',
  right: (isRTL: boolean) => isRTL ? 'left-3' : 'right-3',
};

/**
 * Input padding for icons
 */
export const inputPadding = {
  left: (isRTL: boolean) => isRTL ? 'pr-10' : 'pl-10',
  right: (isRTL: boolean) => isRTL ? 'pl-10' : 'pr-10',
};

/**
 * Animation direction helpers
 */
export const animationDirection = {
  slideInLeft: (isRTL: boolean) => isRTL ? 'translate-x-full' : '-translate-x-full',
  slideInRight: (isRTL: boolean) => isRTL ? '-translate-x-full' : 'translate-x-full',
  slideOutLeft: (isRTL: boolean) => isRTL ? '-translate-x-full' : 'translate-x-full',
  slideOutRight: (isRTL: boolean) => isRTL ? 'translate-x-full' : '-translate-x-full',
};

/**
 * Common layout patterns
 */
export const layoutPatterns = {
  // Header layout with proper spacing
  header: (isRTL: boolean) => 
    `flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`,
  
  // Sidebar layout
  sidebar: (isRTL: boolean) => 
    `${isRTL ? 'border-l' : 'border-r'} border-gray-200 dark:border-gray-700`,
  
  // Button with icon
  buttonWithIcon: (isRTL: boolean, iconPosition: 'left' | 'right') => {
    const baseClasses = 'flex items-center';
    if (iconPosition === 'left') {
      return isRTL ? `${baseClasses} flex-row-reverse` : baseClasses;
    }
    return isRTL ? baseClasses : `${baseClasses} flex-row-reverse`;
  },
  
  // Card container
  card: () => 
    'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg',
  
  // Form field container
  formField: (isRTL: boolean) => 
    `mb-4 ${isRTL ? 'text-right' : 'text-left'}`,
  
  // Navigation menu
  navMenu: (isRTL: boolean) => 
    `space-y-2 ${isRTL ? 'text-right' : 'text-left'}`,
};

/**
 * Table-specific RTL utilities
 */
export const tableUtils = {
  cellAlign: (isRTL: boolean) => isRTL ? 'text-right' : 'text-left',
  headerAlign: (isRTL: boolean) => isRTL ? 'text-right' : 'text-left',
  sortIcon: (isRTL: boolean) => isRTL ? 'ml-1' : 'mr-1',
};

/**
 * Form-specific RTL utilities
 */
export const formUtils = {
  labelAlign: (isRTL: boolean) => isRTL ? 'text-right' : 'text-left',
  inputDir: (isRTL: boolean) => isRTL ? 'rtl' : 'ltr' as const,
  errorAlign: (isRTL: boolean) => isRTL ? 'text-right' : 'text-left',
  helpAlign: (isRTL: boolean) => isRTL ? 'text-right' : 'text-left',
};

/**
 * Modal and overlay utilities
 */
export const modalUtils = {
  slideDirection: (isRTL: boolean, from: 'left' | 'right') => {
    if (from === 'left') {
      return isRTL ? 'translate-x-full' : '-translate-x-full';
    }
    return isRTL ? '-translate-x-full' : 'translate-x-full';
  },
  
  closeButton: (isRTL: boolean) => isRTL ? 'left-4' : 'right-4',
};

/**
 * Responsive RTL utilities for different screen sizes
 */
export const responsiveRTL = {
  // Mobile-first approach with RTL consideration
  mobile: (isRTL: boolean, classes: string) => 
    `${classes} ${isRTL ? 'rtl:' : ''}`,
  
  tablet: (isRTL: boolean, classes: string) => 
    `md:${classes} ${isRTL ? 'rtl:md:' : ''}`,
    
  desktop: (isRTL: boolean, classes: string) => 
    `lg:${classes} ${isRTL ? 'rtl:lg:' : ''}`,
};

/**
 * RTL-aware class name generator
 * Automatically applies RTL transformations to common patterns
 */
export class RTLClassGenerator {
  private isRTL: boolean;
  
  constructor(isRTL: boolean) {
    this.isRTL = isRTL;
  }
  
  // Flex utilities
  flex(direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse'): string {
    if (!direction || direction === 'row') {
      return this.isRTL ? 'flex flex-row-reverse' : 'flex flex-row';
    }
    if (direction === 'row-reverse') {
      return this.isRTL ? 'flex flex-row' : 'flex flex-row-reverse';
    }
    return `flex flex-${direction}`;
  }
  
  // Spacing utilities
  space(axis: 'x' | 'y', size: number): string {
    if (axis === 'y') return `space-y-${size}`;
    return `space-x-${size} ${this.isRTL ? 'space-x-reverse' : ''}`.trim();
  }
  
  // Margin utilities
  margin(side: 'left' | 'right' | 'top' | 'bottom' | 'x' | 'y', size: number): string {
    switch (side) {
      case 'left': return `ml-${size}`;
      case 'right': return `mr-${size}`;
      case 'top': return `mt-${size}`;
      case 'bottom': return `mb-${size}`;
      case 'x': return `mx-${size}`;
      case 'y': return `my-${size}`;
      default: return '';
    }
  }
  
  // Padding utilities
  padding(side: 'left' | 'right' | 'top' | 'bottom' | 'x' | 'y', size: number): string {
    switch (side) {
      case 'left': return `pl-${size}`;
      case 'right': return `pr-${size}`;
      case 'top': return `pt-${size}`;
      case 'bottom': return `pb-${size}`;
      case 'x': return `px-${size}`;
      case 'y': return `py-${size}`;
      default: return '';
    }
  }
  
  // Text alignment
  text(align: 'left' | 'right' | 'center'): string {
    if (align === 'center') return 'text-center';
    if (align === 'left') return this.isRTL ? 'text-right' : 'text-left';
    return this.isRTL ? 'text-left' : 'text-right';
  }
  
  // Positioning
  position(side: 'left' | 'right' | 'top' | 'bottom', size: number): string {
    switch (side) {
      case 'left': return this.isRTL ? `right-${size}` : `left-${size}`;
      case 'right': return this.isRTL ? `left-${size}` : `right-${size}`;
      case 'top': return `top-${size}`;
      case 'bottom': return `bottom-${size}`;
      default: return '';
    }
  }
  
  // Border utilities
  border(side?: 'left' | 'right' | 'top' | 'bottom'): string {
    if (!side) return 'border';
    if (side === 'left') return this.isRTL ? 'border-r' : 'border-l';
    if (side === 'right') return this.isRTL ? 'border-l' : 'border-r';
    return `border-${side}`;
  }
}