/**
 * Enhanced RTL Utility Functions - Works with Master RTL Controller
 * These functions provide component-level RTL support
 */

import { masterRTL } from './masterRTL';

/**
 * Modern RTL Class Generator - Uses logical properties
 */
export class RTLClassGenerator {
  private isRTL: boolean;

  constructor(isRTL: boolean) {
    this.isRTL = isRTL;
  }

  // Flex utilities using logical properties
  flexDirection = () => this.isRTL ? 'flex-row-reverse' : 'flex-row';
  flexRowReverse = () => this.isRTL ? 'flex-row' : 'flex-row-reverse';
  
  // Text alignment using logical properties
  textAlign = (align: 'start' | 'end' | 'center' = 'start') => {
    if (align === 'center') return 'text-center';
    return align === 'start' ? 'text-start' : 'text-end';
  };
  
  // Logical spacing (preferred over left/right)
  marginStart = (size: string) => `ms-${size}`;
  marginEnd = (size: string) => `me-${size}`;
  paddingStart = (size: string) => `ps-${size}`;
  paddingEnd = (size: string) => `pe-${size}`;
  
  // Logical positioning
  start = (size: string) => `start-${size}`;
  end = (size: string) => `end-${size}`;
  
  // Logical borders
  borderStart = () => 'border-s';
  borderEnd = () => 'border-e';
  
  // Legacy support (for existing code compatibility)
  spaceX = (size: number) => `space-x-${size}`;
  left = (size: number) => this.isRTL ? `right-${size}` : `left-${size}`;
  right = (size: number) => this.isRTL ? `left-${size}` : `right-${size}`;
  borderLeft = () => this.isRTL ? 'border-r' : 'border-l';
  borderRight = () => this.isRTL ? 'border-l' : 'border-r';
  roundedLeft = () => this.isRTL ? 'rounded-r' : 'rounded-l';
  roundedRight = () => this.isRTL ? 'rounded-l' : 'rounded-r';
  dropdownLeft = () => this.isRTL ? 'right-0' : 'left-0';
  dropdownRight = () => this.isRTL ? 'left-0' : 'right-0';
}

/**
 * Enhanced RTL utilities
 */
export const rtlClasses = {
  // Modern logical properties (recommended)
  flexRow: (isRTL: boolean) => isRTL ? 'flex-row-reverse' : 'flex-row',
  flexRowReverse: (isRTL: boolean) => isRTL ? 'flex-row' : 'flex-row-reverse',
  textStart: () => 'text-start',
  textEnd: () => 'text-end',
  marginStart: (size: string) => `ms-${size}`,
  marginEnd: (size: string) => `me-${size}`,
  paddingStart: (size: string) => `ps-${size}`,
  paddingEnd: (size: string) => `pe-${size}`,
  
  // Legacy support (for backward compatibility)
  textLeft: (isRTL: boolean) => isRTL ? 'text-right' : 'text-left',
  textRight: (isRTL: boolean) => isRTL ? 'text-left' : 'text-right',
  spaceX: (size: number, isRTL: boolean) => 
    `space-x-${size} ${isRTL ? 'space-x-reverse' : ''}`.trim(),
  left: (size: number, isRTL: boolean) => isRTL ? `right-${size}` : `left-${size}`,
  right: (size: number, isRTL: boolean) => isRTL ? `left-${size}` : `right-${size}`,
  borderLeft: (isRTL: boolean) => isRTL ? 'border-r' : 'border-l',
  borderRight: (isRTL: boolean) => isRTL ? 'border-l' : 'border-r',
  roundedLeft: (isRTL: boolean) => isRTL ? 'rounded-r' : 'rounded-l',
  roundedRight: (isRTL: boolean) => isRTL ? 'rounded-l' : 'rounded-r',
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
export const combineRTLClasses = (...classArrays: (string | undefined)[]): string => {
  return classArrays.filter(Boolean).join(' ');
};

/**
 * Smart class selector for RTL
 */
export const selectRTLClass = (
  ltrClass: string,
  rtlClass: string,
  isRTL: boolean
): string => {
  return isRTL ? rtlClass : ltrClass;
};

/**
 * Hook for components to use master RTL controller
 */
export const useRTLUtils = () => {
  const isRTL = masterRTL.getIsRTL();
  const classes = masterRTL.getClassHelpers();
  
  return {
    isRTL,
    classes,
    rtl: new RTLClassGenerator(isRTL),
    direction: masterRTL.getDirection(),
    locale: masterRTL.getLocale(),
  };
};

/**
 * Layout helper for main application structure
 */
export const getLayoutClasses = (isRTL: boolean) => ({
  mainContainer: 'min-h-screen bg-gray-50 dark:bg-gray-900',
  layoutFlex: `flex ${isRTL ? 'flex-row-reverse' : 'flex-row'}`,
  contentArea: 'flex-1 flex flex-col',
  pageContent: `flex-1 p-6 ${isRTL ? 'text-right' : 'text-left'}`,
});

/**
 * Icon helper for RTL
 */
export const getIconClasses = (iconType: 'arrow' | 'chevron' | 'regular', isRTL: boolean) => {
  const baseClasses = 'rtl-transition';
  
  if ((iconType === 'arrow' || iconType === 'chevron') && isRTL) {
    return `${baseClasses} rtl-flip-icon`;
  }
  
  return baseClasses;
};

/**
 * Layout patterns for common components
 */
export const layoutPatterns = {
  header: (isRTL: boolean) => 
    `flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`,
  sidebar: (isRTL: boolean) => 
    `${isRTL ? 'border-l' : 'border-r'} border-gray-200 dark:border-gray-700`,
  formField: (isRTL: boolean) => 
    `mb-4 ${isRTL ? 'text-right' : 'text-left'}`,
};