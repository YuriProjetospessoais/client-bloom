
ALTER TABLE public.companies
  ALTER COLUMN referral_code SET DEFAULT public.generate_referral_code();
