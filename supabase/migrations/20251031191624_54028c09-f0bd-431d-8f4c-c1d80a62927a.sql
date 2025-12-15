-- Create app_settings table for configurable application values
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  description text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read settings
CREATE POLICY "All authenticated users can read app settings"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (true);

-- Only security admins can update settings
CREATE POLICY "Security admins can update app settings"
  ON public.app_settings FOR UPDATE
  TO authenticated
  USING (user_is_security_admin())
  WITH CHECK (user_is_security_admin());

-- Only security admins can insert settings
CREATE POLICY "Security admins can insert app settings"
  ON public.app_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_is_security_admin());

-- Create updated_at trigger
CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default configuration values
INSERT INTO public.app_settings (setting_key, setting_value, description) VALUES
  ('working_hours_per_week', '40', 'Number of working hours per week for time allocation'),
  ('uk_public_holidays', 
   '[
     {"date": "2025-01-01", "name": "New Year''s Day"},
     {"date": "2025-04-18", "name": "Good Friday"},
     {"date": "2025-04-21", "name": "Easter Monday"},
     {"date": "2025-05-05", "name": "Early May Bank Holiday"},
     {"date": "2025-05-26", "name": "Spring Bank Holiday"},
     {"date": "2025-08-25", "name": "Summer Bank Holiday"},
     {"date": "2025-12-25", "name": "Christmas Day"},
     {"date": "2025-12-26", "name": "Boxing Day"},
     {"date": "2026-01-01", "name": "New Year''s Day"},
     {"date": "2026-04-03", "name": "Good Friday"},
     {"date": "2026-04-06", "name": "Easter Monday"},
     {"date": "2026-05-04", "name": "Early May Bank Holiday"},
     {"date": "2026-05-25", "name": "Spring Bank Holiday"},
     {"date": "2026-08-31", "name": "Summer Bank Holiday"},
     {"date": "2026-12-25", "name": "Christmas Day"},
     {"date": "2026-12-28", "name": "Boxing Day (substitute)"}
   ]'::jsonb,
   'UK Public Holidays for 2025-2026'),
  ('timeline_activities',
   '[
     {"name": "Security Ownership", "infoAssurerDays": 2, "securityArchitectDays": 0.5, "socAnalystDays": 0},
     {"name": "Business Impact Analysis", "infoAssurerDays": 10, "securityArchitectDays": 1, "socAnalystDays": 0},
     {"name": "Gov Assure Profiling", "infoAssurerDays": 2, "securityArchitectDays": 0.5, "socAnalystDays": 0},
     {"name": "Obligations Discovery", "infoAssurerDays": 5, "securityArchitectDays": 2, "socAnalystDays": 1},
     {"name": "3rd Party Assessments", "infoAssurerDays": 10, "securityArchitectDays": 2, "socAnalystDays": 1},
     {"name": "Intellectual Property Assessments", "infoAssurerDays": 10, "securityArchitectDays": 2, "socAnalystDays": 1},
     {"name": "Threat Assessment", "infoAssurerDays": 1, "securityArchitectDays": 5, "socAnalystDays": 2},
     {"name": "Initial Threat Model", "infoAssurerDays": 2, "securityArchitectDays": 10, "socAnalystDays": 2},
     {"name": "DPIA Part 1", "infoAssurerDays": 10, "securityArchitectDays": 2, "socAnalystDays": 0},
     {"name": "Risk Appetite Capture", "infoAssurerDays": 5, "securityArchitectDays": 1, "socAnalystDays": 0},
     {"name": "Initial Risk Assessment", "infoAssurerDays": 10, "securityArchitectDays": 4, "socAnalystDays": 2},
     {"name": "DPIA Part 2", "infoAssurerDays": 10, "securityArchitectDays": 2, "socAnalystDays": 0},
     {"name": "Data Sharing Agreements", "infoAssurerDays": 10, "securityArchitectDays": 4, "socAnalystDays": 2},
     {"name": "Cyber Security Requirements Generation", "infoAssurerDays": 5, "securityArchitectDays": 15, "socAnalystDays": 10},
     {"name": "Cyber Governance Process Definition", "infoAssurerDays": 5, "securityArchitectDays": 2, "socAnalystDays": 2},
     {"name": "Continual Assurance Process Definition", "infoAssurerDays": 5, "securityArchitectDays": 2, "socAnalystDays": 5},
     {"name": "End Security Discovery", "infoAssurerDays": 0, "securityArchitectDays": 0, "socAnalystDays": 0, "isMilestone": true},
     {"name": "Deeper Threat Modelling", "infoAssurerDays": 5, "securityArchitectDays": 20, "socAnalystDays": 5},
     {"name": "Security Controls Definition", "infoAssurerDays": 5, "securityArchitectDays": 20, "socAnalystDays": 5},
     {"name": "Cyber Testing – ITHC", "infoAssurerDays": 5, "securityArchitectDays": 5, "socAnalystDays": 5},
     {"name": "Cyber Testing – Static Analysis", "infoAssurerDays": 5, "securityArchitectDays": 5, "socAnalystDays": 5},
     {"name": "Cyber Testing – Dynamic Analysis", "infoAssurerDays": 5, "securityArchitectDays": 5, "socAnalystDays": 5},
     {"name": "Security Monitoring Requirements", "infoAssurerDays": 2, "securityArchitectDays": 10, "socAnalystDays": 10},
     {"name": "Compliance Document Completion", "infoAssurerDays": 20, "securityArchitectDays": 10, "socAnalystDays": 5},
     {"name": "Risk Profile Acceptance", "infoAssurerDays": 20, "securityArchitectDays": 10, "socAnalystDays": 5}
   ]'::jsonb,
   'Timeline activities with effort estimates in days');

-- Create index for faster lookups
CREATE INDEX idx_app_settings_key ON public.app_settings(setting_key);