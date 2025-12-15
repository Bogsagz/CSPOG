-- Add security_mentor to the app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'security_mentor';