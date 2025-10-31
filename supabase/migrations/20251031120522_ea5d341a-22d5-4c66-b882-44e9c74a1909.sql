-- Remove restrictive RLS policies and add public access for prototype
DROP POLICY IF EXISTS "Users can view their own guardian email" ON public.guardian_emails;
DROP POLICY IF EXISTS "Users can insert their own guardian email" ON public.guardian_emails;
DROP POLICY IF EXISTS "Users can update their own guardian email" ON public.guardian_emails;
DROP POLICY IF EXISTS "Users can delete their own guardian email" ON public.guardian_emails;

-- Allow public access for prototype (anyone can read/write)
CREATE POLICY "Public can view guardian emails"
  ON public.guardian_emails
  FOR SELECT
  USING (true);

CREATE POLICY "Public can insert guardian emails"
  ON public.guardian_emails
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public can update guardian emails"
  ON public.guardian_emails
  FOR UPDATE
  USING (true);

CREATE POLICY "Public can delete guardian emails"
  ON public.guardian_emails
  FOR DELETE
  USING (true);

-- Make user_id nullable since we won't have auth
ALTER TABLE public.guardian_emails ALTER COLUMN user_id DROP NOT NULL;