-- Insert default day rates into app_settings
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES (
  'day_rates',
  '{
    "risk_manager": {
      "3": 500,
      "4": 600,
      "5": 900
    },
    "security_architect": {
      "3": 600,
      "4": 800,
      "5": 1000
    },
    "soc": {
      "3": 500,
      "4": 600,
      "5": 900
    },
    "security_delivery": {
      "3": 500,
      "4": 600,
      "5": 900
    }
  }'::jsonb,
  'Day rates per role and SFIA grade'
)
ON CONFLICT (setting_key) DO NOTHING;