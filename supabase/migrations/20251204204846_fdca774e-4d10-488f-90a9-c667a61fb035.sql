-- Create attack_mitigations table (global repository)
CREATE TABLE public.attack_mitigations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mitigation_id text NOT NULL UNIQUE, -- MITRE ID e.g., M1047
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create attack_detections table (global repository)
CREATE TABLE public.attack_detections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  detection_id text NOT NULL UNIQUE, -- MITRE ID e.g., DS0015
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create junction table for technique-mitigation links
CREATE TABLE public.attack_technique_mitigations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technique_id text NOT NULL, -- MITRE technique ID e.g., T1566.001
  mitigation_id uuid NOT NULL REFERENCES public.attack_mitigations(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(technique_id, mitigation_id)
);

-- Create junction table for technique-detection links
CREATE TABLE public.attack_technique_detections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technique_id text NOT NULL, -- MITRE technique ID e.g., T1566.001
  detection_id uuid NOT NULL REFERENCES public.attack_detections(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(technique_id, detection_id)
);

-- Enable RLS
ALTER TABLE public.attack_mitigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attack_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attack_technique_mitigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attack_technique_detections ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Everyone can view (global repository)
CREATE POLICY "Everyone can view mitigations" ON public.attack_mitigations
  FOR SELECT USING (true);

CREATE POLICY "Everyone can view detections" ON public.attack_detections
  FOR SELECT USING (true);

CREATE POLICY "Everyone can view technique mitigations" ON public.attack_technique_mitigations
  FOR SELECT USING (true);

CREATE POLICY "Everyone can view technique detections" ON public.attack_technique_detections
  FOR SELECT USING (true);

-- Only security admins can manage the repository
CREATE POLICY "Security admins can insert mitigations" ON public.attack_mitigations
  FOR INSERT WITH CHECK (user_is_security_admin());

CREATE POLICY "Security admins can update mitigations" ON public.attack_mitigations
  FOR UPDATE USING (user_is_security_admin());

CREATE POLICY "Security admins can delete mitigations" ON public.attack_mitigations
  FOR DELETE USING (user_is_security_admin());

CREATE POLICY "Security admins can insert detections" ON public.attack_detections
  FOR INSERT WITH CHECK (user_is_security_admin());

CREATE POLICY "Security admins can update detections" ON public.attack_detections
  FOR UPDATE USING (user_is_security_admin());

CREATE POLICY "Security admins can delete detections" ON public.attack_detections
  FOR DELETE USING (user_is_security_admin());

CREATE POLICY "Security admins can manage technique mitigations" ON public.attack_technique_mitigations
  FOR ALL USING (user_is_security_admin());

CREATE POLICY "Security admins can manage technique detections" ON public.attack_technique_detections
  FOR ALL USING (user_is_security_admin());

-- Create updated_at triggers
CREATE TRIGGER update_attack_mitigations_updated_at
  BEFORE UPDATE ON public.attack_mitigations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attack_detections_updated_at
  BEFORE UPDATE ON public.attack_detections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_attack_technique_mitigations_technique ON public.attack_technique_mitigations(technique_id);
CREATE INDEX idx_attack_technique_detections_technique ON public.attack_technique_detections(technique_id);