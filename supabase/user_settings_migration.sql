-- Create user_settings table
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme VARCHAR(20) DEFAULT 'dark',
  autoplay BOOLEAN DEFAULT true,
  default_quality VARCHAR(20) DEFAULT 'auto',
  subtitles_enabled BOOLEAN DEFAULT true,
  subtitle_size INTEGER DEFAULT 100,
  notifications_enabled BOOLEAN DEFAULT true,
  preferred_streaming_source VARCHAR(50) DEFAULT 'auto',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Add RLS policies
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own settings
CREATE POLICY user_settings_select ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own settings
CREATE POLICY user_settings_insert ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own settings
CREATE POLICY user_settings_update ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS user_settings_user_id_idx ON public.user_settings(user_id);

-- Allow public access for authenticated users
GRANT SELECT, INSERT, UPDATE ON public.user_settings TO authenticated;
-- No sequence needed since we're using UUID with uuid_generate_v4() instead of SERIAL 