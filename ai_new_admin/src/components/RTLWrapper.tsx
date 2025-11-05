import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface RTLWrapperProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  autoDirection?: boolean;
  [key: string]: any;
}

/**
 * RTL Wrapper Component - Automatically handles RTL layout
 * This component eliminates the need to manually add dir attributes
 */
const RTLWrapper: React.FC<RTLWrapperProps> = ({ 
  children, 
  className = '', 
  as: Component = 'div',
  autoDirection = true,
  ...props 
}) => {
  const { isRTL } = useLanguage();
  
  const direction = autoDirection ? (isRTL ? 'rtl' : 'ltr') : undefined;
  const rtlClass = isRTL ? 'rtl' : 'ltr';
  
  return (
    <Component 
      dir={direction}
      className={`${className} ${rtlClass}`}
      {...props}
    >
      {children}
    </Component>
  );
};

export default RTLWrapper;

/**
 * Specialized RTL Components for common use cases
 */

// RTL Container for main layouts
export const RTLContainer: React.FC<RTLWrapperProps> = ({ children, className = '', ...props }) => (
  <RTLWrapper 
    className={`main-layout ${className}`} 
    {...props}
  >
    {children}
  </RTLWrapper>
);

// RTL Flex container with automatic direction
export const RTLFlex: React.FC<RTLWrapperProps & { direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse' }> = ({ 
  children, 
  className = '', 
  direction = 'row',
  ...props 
}) => {
  const { isRTL } = useLanguage();
  
  const getFlexDirection = () => {
    if (direction === 'col' || direction === 'col-reverse') {
      return `flex-${direction}`;
    }
    
    if (direction === 'row') {
      return isRTL ? 'flex-row-reverse' : 'flex-row';
    }
    
    if (direction === 'row-reverse') {
      return isRTL ? 'flex-row' : 'flex-row-reverse';
    }
    
    return 'flex-row';
  };
  
  return (
    <RTLWrapper 
      className={`flex ${getFlexDirection()} ${className}`} 
      {...props}
    >
      {children}
    </RTLWrapper>
  );
};

// RTL Text container with automatic alignment
export const RTLText: React.FC<RTLWrapperProps & { align?: 'left' | 'right' | 'center' }> = ({ 
  children, 
  className = '', 
  align = 'left',
  as = 'div',
  ...props 
}) => {
  const { isRTL } = useLanguage();
  
  const getTextAlign = () => {
    if (align === 'center') return 'text-center';
    if (align === 'left') return isRTL ? 'text-right' : 'text-left';
    if (align === 'right') return isRTL ? 'text-left' : 'text-right';
    return 'text-left';
  };
  
  return (
    <RTLWrapper 
      as={as}
      className={`${getTextAlign()} ${className}`} 
      {...props}
    >
      {children}
    </RTLWrapper>
  );
};

// RTL Input wrapper for form fields
export const RTLInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { 
  hasLeftIcon?: boolean;
  hasRightIcon?: boolean;
}> = ({ 
  className = '', 
  hasLeftIcon = false,
  hasRightIcon = false,
  ...props 
}) => {
  const { isRTL } = useLanguage();
  
  const getInputClasses = () => {
    let classes = className;
    
    if (hasLeftIcon) {
      classes += isRTL ? ' pr-10' : ' pl-10';
    }
    
    if (hasRightIcon) {
      classes += isRTL ? ' pl-10' : ' pr-10';
    }
    
    return classes;
  };
  
  return (
    <input 
      dir={isRTL ? 'rtl' : 'ltr'}
      className={getInputClasses()}
      {...props}
    />
  );
};

// RTL Button with icon positioning
export const RTLButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & {
  iconPosition?: 'left' | 'right';
  icon?: React.ReactNode;
}> = ({ 
  children,
  className = '', 
  iconPosition = 'left',
  icon,
  ...props 
}) => {
  const { isRTL } = useLanguage();
  
  const shouldReverse = (iconPosition === 'left' && isRTL) || (iconPosition === 'right' && !isRTL);
  
  return (
    <button 
      className={`flex items-center ${shouldReverse ? 'flex-row-reverse' : 'flex-row'} ${className}`}
      {...props}
    >
      {icon && (
        <span className={iconPosition === 'left' ? (isRTL ? 'ml-2' : 'mr-2') : (isRTL ? 'mr-2' : 'ml-2')}>
          {icon}
        </span>
      )}
      {children}
    </button>
  );
};

// RTL Card with proper spacing
export const RTLCard: React.FC<RTLWrapperProps> = ({ children, className = '', ...props }) => (
  <RTLWrapper 
    className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${className}`} 
    {...props}
  >
    {children}
  </RTLWrapper>
);

// RTL Dropdown with proper positioning
export const RTLDropdown: React.FC<RTLWrapperProps & { position?: 'left' | 'right' }> = ({ 
  children, 
  className = '', 
  position = 'right',
  ...props 
}) => {
  const { isRTL } = useLanguage();
  
  const getPositionClass = () => {
    if (position === 'right') {
      return isRTL ? 'left-0' : 'right-0';
    }
    return isRTL ? 'right-0' : 'left-0';
  };
  
  return (
    <RTLWrapper 
      className={`absolute top-full mt-2 ${getPositionClass()} ${className}`} 
      {...props}
    >
      {children}
    </RTLWrapper>
  );
};