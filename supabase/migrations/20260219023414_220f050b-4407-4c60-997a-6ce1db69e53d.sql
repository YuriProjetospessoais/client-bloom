
-- Add payment_method column to appointments
ALTER TABLE public.appointments
ADD COLUMN payment_method text NOT NULL DEFAULT 'in_person';

-- Add payment_status column
ALTER TABLE public.appointments
ADD COLUMN payment_status text NOT NULL DEFAULT 'pending';

-- Add stripe_session_id for tracking
ALTER TABLE public.appointments
ADD COLUMN stripe_session_id text;
