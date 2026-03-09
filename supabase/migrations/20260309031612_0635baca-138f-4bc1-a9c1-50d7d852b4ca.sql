
-- Add completed_at timestamp to appointments for tracking completion time
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS completed_at timestamptz;
