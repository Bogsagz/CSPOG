-- Create projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Anyone can view projects" 
ON public.projects 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update projects" 
ON public.projects 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete projects" 
ON public.projects 
FOR DELETE 
USING (true);

-- Add project_id to table_items
ALTER TABLE public.table_items 
ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

-- Create index for faster queries by project
CREATE INDEX idx_table_items_project_id ON public.table_items(project_id);

-- Create saved threats table
CREATE TABLE public.saved_threats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  threat_statement TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_threats ENABLE ROW LEVEL SECURITY;

-- Create policies for saved threats
CREATE POLICY "Anyone can view saved threats" 
ON public.saved_threats 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create saved threats" 
ON public.saved_threats 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can delete saved threats" 
ON public.saved_threats 
FOR DELETE 
USING (true);

-- Create index for faster queries by project
CREATE INDEX idx_saved_threats_project_id ON public.saved_threats(project_id);