-- Create risk_appetite table
CREATE TABLE public.risk_appetite (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  category TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, category)
);

-- Enable Row Level Security
ALTER TABLE public.risk_appetite ENABLE ROW LEVEL SECURITY;

-- Create policies for risk_appetite
CREATE POLICY "Anyone can view risk appetite" 
ON public.risk_appetite 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create risk appetite" 
ON public.risk_appetite 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update risk appetite" 
ON public.risk_appetite 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete risk appetite" 
ON public.risk_appetite 
FOR DELETE 
USING (true);