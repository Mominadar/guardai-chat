-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create guardian_emails table to store guardian contact information
CREATE TABLE public.guardian_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guardian_email TEXT NOT NULL,
  guardian_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.guardian_emails ENABLE ROW LEVEL SECURITY;

-- Create policies for guardian_emails
CREATE POLICY "Users can view their own guardian email"
ON public.guardian_emails
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own guardian email"
ON public.guardian_emails
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own guardian email"
ON public.guardian_emails
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own guardian email"
ON public.guardian_emails
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_guardian_emails_updated_at
BEFORE UPDATE ON public.guardian_emails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();