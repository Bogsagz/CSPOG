-- Create table for user feedback (bug reports and feature requests)
CREATE TABLE public.user_feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  feedback_type text NOT NULL CHECK (feedback_type IN ('bug', 'feature')),
  title text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Everyone can view feedback
CREATE POLICY "Everyone can view feedback" ON public.user_feedback
  FOR SELECT USING (true);

-- Users can create their own feedback
CREATE POLICY "Users can create feedback" ON public.user_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own feedback
CREATE POLICY "Users can delete their own feedback" ON public.user_feedback
  FOR DELETE USING (auth.uid() = user_id);