-- Create table to store user-defined table items
CREATE TABLE public.table_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_type TEXT NOT NULL CHECK (table_type IN ('Vectors', 'Assets', 'Adversarial actions', 'Local Objectives', 'Strategic Objectives')),
  item_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.table_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no authentication required)
CREATE POLICY "Anyone can view table items" 
ON public.table_items 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create table items" 
ON public.table_items 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update table items" 
ON public.table_items 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete table items" 
ON public.table_items 
FOR DELETE 
USING (true);

-- Create index for faster queries by table type
CREATE INDEX idx_table_items_table_type ON public.table_items(table_type);