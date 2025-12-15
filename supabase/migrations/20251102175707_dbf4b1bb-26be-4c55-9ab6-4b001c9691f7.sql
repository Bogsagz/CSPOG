-- Add columns for base and modified risk assessments
ALTER TABLE public.saved_risks
ADD COLUMN base_likelihood TEXT,
ADD COLUMN base_impact TEXT,
ADD COLUMN modified_likelihood TEXT,
ADD COLUMN modified_impact TEXT;

-- Update existing risks to extract base likelihood and impact from risk_statement
UPDATE public.saved_risks
SET 
  base_likelihood = CASE
    WHEN risk_statement ~ 'Likelihood:\s*([^,]+),' THEN 
      TRIM(regexp_replace(regexp_replace(risk_statement, '.*Likelihood:\s*([^,]+),.*', '\1'), '\(.*', ''))
    ELSE NULL
  END,
  base_impact = CASE
    WHEN risk_statement ~ 'Impact:\s*([^)]+)\)' THEN 
      TRIM(regexp_replace(risk_statement, '.*Impact:\s*([^)]+)\).*', '\1'))
    ELSE NULL
  END
WHERE base_likelihood IS NULL;