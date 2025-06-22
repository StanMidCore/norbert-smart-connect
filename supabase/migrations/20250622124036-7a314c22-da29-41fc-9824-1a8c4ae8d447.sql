
-- Créer une table pour gérer le processus d'inscription étape par étape
CREATE TABLE public.signup_process (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  verification_token TEXT,
  verification_expires_at TIMESTAMPTZ,
  payment_completed BOOLEAN NOT NULL DEFAULT false,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.signup_process ENABLE ROW LEVEL SECURITY;

-- Create policies for signup process
CREATE POLICY "insert_signup_process" ON public.signup_process
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "update_signup_process" ON public.signup_process
  FOR UPDATE
  USING (true);

CREATE POLICY "select_signup_process" ON public.signup_process
  FOR SELECT
  USING (true);
