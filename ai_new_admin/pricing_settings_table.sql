-- SQL script to create pricing_settings table for AI New Admin Panel
-- This table will store PDF charges and physical shipment charges

-- Create the pricing_settings table
CREATE TABLE IF NOT EXISTS pricing_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(50) UNIQUE NOT NULL,
  setting_value DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  setting_type VARCHAR(20) NOT NULL CHECK (setting_type IN ('pdf_charge', 'physical_shipment')),
  description TEXT,
  currency VARCHAR(3) DEFAULT 'SYP',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(100),
  updated_by VARCHAR(100)
);

-- Create an updated_at trigger function
CREATE OR REPLACE FUNCTION update_pricing_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic updated_at
CREATE TRIGGER pricing_settings_updated_at_trigger
  BEFORE UPDATE ON pricing_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_settings_updated_at();

-- Insert default pricing settings
INSERT INTO pricing_settings (setting_key, setting_value, setting_type, description, currency) VALUES
  ('pdf_charge_default', 5.00, 'pdf_charge', 'Default charge for PDF generation', 'SYP'),
  ('physical_shipment_default', 15.00, 'physical_shipment', 'Default charge for physical shipment', 'SYP')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pricing_settings_type ON pricing_settings (setting_type);
CREATE INDEX IF NOT EXISTS idx_pricing_settings_active ON pricing_settings (is_active);
CREATE INDEX IF NOT EXISTS idx_pricing_settings_key ON pricing_settings (setting_key);

-- Add comments for documentation
COMMENT ON TABLE pricing_settings IS 'Table to store customizable pricing settings for PDF charges and physical shipment costs';
COMMENT ON COLUMN pricing_settings.setting_key IS 'Unique identifier for the pricing setting';
COMMENT ON COLUMN pricing_settings.setting_value IS 'The numerical value of the charge in the specified currency';
COMMENT ON COLUMN pricing_settings.setting_type IS 'Type of charge: pdf_charge or physical_shipment';
COMMENT ON COLUMN pricing_settings.description IS 'Human-readable description of the pricing setting';
COMMENT ON COLUMN pricing_settings.currency IS 'Currency code (ISO 4217) for the pricing value';
COMMENT ON COLUMN pricing_settings.is_active IS 'Whether this pricing setting is currently active';