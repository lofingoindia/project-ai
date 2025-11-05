import React, { useState, useEffect } from 'react';
import { DollarSign, Truck, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import { useLanguage } from '../contexts/LanguageContext';
import { db } from '../lib/supabase';
import type { PricingSettings } from '../types';

interface PricingSettingsModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

const PricingSettingsModal: React.FC<PricingSettingsModalProps> = ({ isOpen }) => {
  const { t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState<'pdf' | 'shipment'>('pdf');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pricingData, setPricingData] = useState<PricingSettings[]>([]);
  
  // Form data
  const [pdfCharge, setPdfCharge] = useState('');
  const [shipmentCharge, setShipmentCharge] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPricingSettings();
    }
  }, [isOpen]);

  const loadPricingSettings = async () => {
    setLoading(true);
    try {
      const settings = await db.getPricingSettings();
      setPricingData(settings);
      
      // Set form values
      const pdfSetting = settings.find((s: PricingSettings) => s.setting_type === 'pdf_charge');
      const shipmentSetting = settings.find((s: PricingSettings) => s.setting_type === 'physical_shipment');
      
      setPdfCharge(pdfSetting?.setting_value?.toString() || '');
      setShipmentCharge(shipmentSetting?.setting_value?.toString() || '');
    } catch (error) {
      console.error('Error loading pricing settings:', error);
      toast.error(t('messages.settings.failedToLoadPricing'));
    } finally {
      setLoading(false);
    }
  };

  const handleSavePdfCharge = async () => {
    if (!pdfCharge || isNaN(Number(pdfCharge)) || Number(pdfCharge) < 0) {
      toast.error(t('messages.settings.validPdfChargeRequired'));
      return;
    }

    setSaving(true);
    try {
      await db.updatePricingSetting(
        'pdf_charge_default',
        Number(pdfCharge),
        'pdf_charge',
        'Default charge for PDF generation'
      );
      toast.success(t('messages.settings.pricingUpdated'));
      await loadPricingSettings(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating PDF charge:', error);
      toast.error(t('messages.settings.failedToUpdatePricing'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveShipmentCharge = async () => {
    if (!shipmentCharge || isNaN(Number(shipmentCharge)) || Number(shipmentCharge) < 0) {
      toast.error(t('messages.settings.validShipmentChargeRequired'));
      return;
    }

    setSaving(true);
    try {
      await db.updatePricingSetting(
        'physical_shipment_default',
        Number(shipmentCharge),
        'physical_shipment',
        'Default charge for physical shipment'
      );
      toast.success(t('messages.settings.pricingUpdated'));
      await loadPricingSettings(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating shipment charge:', error);
      toast.error(t('messages.settings.failedToUpdatePricing'));
    } finally {
      setSaving(false);
    }
  };

  const getCurrentValue = (type: 'pdf_charge' | 'physical_shipment') => {
    const setting = pricingData.find((s: PricingSettings) => s.setting_type === type);
    return setting ? `${setting.setting_value.toFixed(2)} SYP` : t('messages.settings.notSet');
  };

  if (!isOpen) return null;

  return (
    <div className={`w-full ${isRTL ? 'text-right' : 'text-left'}`}>
      {/* Header */}
      <div className={`flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('messages.settings.pricingSettings')}
        </h2>
      </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex" dir={isRTL ? 'rtl' : 'ltr'}>
            <button
              onClick={() => setActiveTab('pdf')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'pdf'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              } ${isRTL ? 'border-l' : 'border-r'} border-gray-200 dark:border-gray-700`}
            >
              <div className={`flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <FileText size={16} />
                {t('messages.settings.tabPdfCharges')}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('shipment')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
                activeTab === 'shipment'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className={`flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Truck size={16} />
                {t('messages.settings.tabPhysicalShipment')}
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className={`grid grid-cols-1 lg:grid-cols-2 gap-8 ${isRTL ? 'space-x-reverse' : ''}`}>
              {/* PDF Charges Section */}
              <div className={`space-y-4 p-6 rounded-lg border-2 transition-all duration-200 ${
                activeTab === 'pdf' 
                  ? 'border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t('messages.settings.pdfCharges')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t('messages.settings.pdfChargeDescription')}
                  </p>
                </div>

                {/* Current Value */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('messages.settings.currentPdfCharge')}:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {getCurrentValue('pdf_charge')}
                    </span>
                  </div>
                </div>

                {/* Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('messages.settings.pdfChargeAmount')}
                  </label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                      <DollarSign size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={pdfCharge}
                      onChange={(e) => setPdfCharge(e.target.value)}
                      className={`block w-full ${isRTL ? 'pr-10 text-right' : 'pl-10'} py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200`}
                      placeholder={t('messages.settings.enterAmount')}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSavePdfCharge}
                  disabled={saving || !pdfCharge}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <FileText size={16} />
                      {t('messages.settings.savePdfCharge')}
                    </>
                  )}
                </button>
              </div>

              {/* Physical Shipment Section */}
              <div className={`space-y-4 p-6 rounded-lg border-2 transition-all duration-200 ${
                activeTab === 'shipment' 
                  ? 'border-blue-200 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10' 
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t('messages.settings.physicalShipment')}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t('messages.settings.physicalShipmentDescription')}
                  </p>
                </div>

                {/* Current Value */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('messages.settings.currentShipmentCharge')}:
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {getCurrentValue('physical_shipment')}
                    </span>
                  </div>
                </div>

                {/* Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('messages.settings.physicalShipmentAmount')}
                  </label>
                  <div className="relative">
                    <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
                      <DollarSign size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={shipmentCharge}
                      onChange={(e) => setShipmentCharge(e.target.value)}
                      className={`block w-full ${isRTL ? 'pr-10 text-right' : 'pl-10'} py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200`}
                      placeholder={t('messages.settings.enterAmount')}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={handleSaveShipmentCharge}
                  disabled={saving || !shipmentCharge}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors duration-200"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Truck size={16} />
                      {t('messages.settings.saveShipmentCharge')}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
    </div>
  );
};

export default PricingSettingsModal;
