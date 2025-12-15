-- Create risk decision documents table
CREATE TABLE public.risk_decision_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  risk_id UUID NOT NULL REFERENCES saved_risks(id) ON DELETE CASCADE,
  background TEXT,
  preferred_option_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create RDD options table
CREATE TABLE public.rdd_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rdd_id UUID NOT NULL REFERENCES risk_decision_documents(id) ON DELETE CASCADE,
  approach TEXT NOT NULL CHECK (approach IN ('Accept', 'Avoid', 'Mitigate', 'Transfer')),
  description TEXT,
  business_impacts TEXT,
  residual_likelihood TEXT,
  residual_impact TEXT,
  secondary_risk_statement TEXT,
  resource_impacts TEXT,
  additional_benefits TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key for preferred option
ALTER TABLE public.risk_decision_documents
ADD CONSTRAINT fk_preferred_option
FOREIGN KEY (preferred_option_id) REFERENCES rdd_options(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.risk_decision_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rdd_options ENABLE ROW LEVEL SECURITY;

-- RLS Policies for risk_decision_documents
CREATE POLICY "Members can view project RDDs"
ON public.risk_decision_documents
FOR SELECT
USING (user_has_project_access(auth.uid(), project_id));

CREATE POLICY "Authorized members can create RDDs"
ON public.risk_decision_documents
FOR INSERT
WITH CHECK (user_can_write_tables(auth.uid(), project_id));

CREATE POLICY "Authorized members can update RDDs"
ON public.risk_decision_documents
FOR UPDATE
USING (user_can_write_tables(auth.uid(), project_id));

CREATE POLICY "Authorized members can delete RDDs"
ON public.risk_decision_documents
FOR DELETE
USING (user_can_write_tables(auth.uid(), project_id));

-- RLS Policies for rdd_options
CREATE POLICY "Members can view RDD options"
ON public.rdd_options
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM risk_decision_documents rdd
  WHERE rdd.id = rdd_options.rdd_id
  AND user_has_project_access(auth.uid(), rdd.project_id)
));

CREATE POLICY "Authorized members can create RDD options"
ON public.rdd_options
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM risk_decision_documents rdd
  WHERE rdd.id = rdd_options.rdd_id
  AND user_can_write_tables(auth.uid(), rdd.project_id)
));

CREATE POLICY "Authorized members can update RDD options"
ON public.rdd_options
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM risk_decision_documents rdd
  WHERE rdd.id = rdd_options.rdd_id
  AND user_can_write_tables(auth.uid(), rdd.project_id)
));

CREATE POLICY "Authorized members can delete RDD options"
ON public.rdd_options
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM risk_decision_documents rdd
  WHERE rdd.id = rdd_options.rdd_id
  AND user_can_write_tables(auth.uid(), rdd.project_id)
));

-- Create indexes for better performance
CREATE INDEX idx_rdd_project_id ON public.risk_decision_documents(project_id);
CREATE INDEX idx_rdd_risk_id ON public.risk_decision_documents(risk_id);
CREATE INDEX idx_rdd_options_rdd_id ON public.rdd_options(rdd_id);