-- Update the layer column to be an integer type
ALTER TABLE public.security_controls 
ALTER COLUMN layer TYPE integer USING layer::integer;