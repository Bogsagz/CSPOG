-- Add 'security_delivery' to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'security_delivery';