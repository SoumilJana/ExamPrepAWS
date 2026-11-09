-- Create user_sync table
CREATE TABLE IF NOT EXISTS public.user_sync (
  sync_key TEXT PRIMARY KEY,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  active_exam JSONB DEFAULT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create completed_exams table
CREATE TABLE IF NOT EXISTS public.completed_exams (
  id TEXT PRIMARY KEY,
  sync_key TEXT NOT NULL REFERENCES public.user_sync(sync_key) ON DELETE CASCADE,
  exam_number INT NOT NULL,
  seed BIGINT NOT NULL,
  result JSONB NOT NULL,
  answers JSONB NOT NULL,
  flagged_question_ids TEXT[] NOT NULL DEFAULT '{}',
  start_time BIGINT NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 90,
  is_submitted BOOLEAN NOT NULL DEFAULT true,
  submitted_at BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_completed_exams_sync_key ON public.completed_exams(sync_key);
CREATE INDEX IF NOT EXISTS idx_completed_exams_submitted_at ON public.completed_exams(submitted_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completed_exams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Allow anon and auth access to user_sync" ON public.user_sync;
DROP POLICY IF EXISTS "Allow anon and auth access to completed_exams" ON public.completed_exams;

-- Create open RLS policies for client sync by sync_key
CREATE POLICY "Allow anon and auth access to user_sync"
  ON public.user_sync
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow anon and auth access to completed_exams"
  ON public.completed_exams
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Grant privileges
GRANT ALL ON public.user_sync TO anon, authenticated;
GRANT ALL ON public.completed_exams TO anon, authenticated;
