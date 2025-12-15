-- Update risk levels to Orange Book terminology
UPDATE app_settings 
SET setting_value = '["Averse", "Minimal", "Cautious", "Open", "Eager"]'::jsonb,
    description = 'Risk appetite levels from Orange Book (HM Treasury)',
    updated_at = now()
WHERE setting_key = 'risk_levels';

-- Update existing risk appetite records to use new terminology
UPDATE risk_appetite SET risk_level = 'Averse' WHERE risk_level = 'Minor';
UPDATE risk_appetite SET risk_level = 'Minimal' WHERE risk_level = 'Moderate';
UPDATE risk_appetite SET risk_level = 'Cautious' WHERE risk_level = 'Major';
UPDATE risk_appetite SET risk_level = 'Open' WHERE risk_level = 'Significant';
UPDATE risk_appetite SET risk_level = 'Eager' WHERE risk_level = 'Critical';