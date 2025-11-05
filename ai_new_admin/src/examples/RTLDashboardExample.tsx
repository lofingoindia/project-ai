// Example: How your existing Dashboard component works with the new RTL system
// NO CHANGES needed to your Dashboard.tsx - it works automatically!

import { useLanguage } from '../contexts/LanguageContext';

// Example of what your existing code looks like
const ExistingDashboardExample = () => {
  const { isRTL } = useLanguage();
  
  return (
    // Your existing conditional logic still works
    <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
      <div className={`flex items-center space-x-3 ${isRTL ? 'space-x-reverse' : ''}`}>
        <span className={`${isRTL ? 'ml-2' : 'mr-2'}`}>Icon</span>
        <span>Text</span>
      </div>
    </div>
  );
};

// NEW: How you can write cleaner components using the RTL system
const NewCleanDashboard = () => {
  return (
    // Much cleaner - CSS handles RTL automatically
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <span className="mr-2">Icon</span>  {/* CSS auto-swaps to ml-2 in RTL */}
        <span>Text</span>
      </div>
    </div>
  );
};

// Or use RTL components for even more convenience
import { RTLFlex } from '../components/RTLWrapper';

const ModernDashboard = () => (
  <RTLFlex direction="row" className="items-center justify-between">
    <RTLFlex direction="row" className="items-center space-x-3">
      <span className="mr-2">Icon</span>
      <span>Text</span>
    </RTLFlex>
  </RTLFlex>
);

export { ExistingDashboardExample, NewCleanDashboard, ModernDashboard };