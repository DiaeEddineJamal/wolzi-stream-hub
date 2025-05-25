-- Create a watch history table to track what users have watched
CREATE TABLE IF NOT EXISTS public.watch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id TEXT NOT NULL, -- TMDB ID
    content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'tv', 'anime')),
    title TEXT NOT NULL,
    poster_path TEXT,
    watched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    progress INTEGER DEFAULT 0, -- Progress in seconds
    duration INTEGER, -- Total duration in seconds
    progress_percent NUMERIC DEFAULT 0, -- Progress as percentage (0-100)
    season INTEGER, -- Only for TV shows and anime
    episode INTEGER, -- Only for TV shows and anime
    
    UNIQUE (user_id, content_id, content_type, season, episode)
);

-- Add these columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'watch_history' AND column_name = 'duration') THEN
        ALTER TABLE public.watch_history ADD COLUMN duration INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'watch_history' AND column_name = 'progress_percent') THEN
        ALTER TABLE public.watch_history ADD COLUMN progress_percent NUMERIC DEFAULT 0;
    END IF;
    
    -- Update existing constraint to include 'anime'
    ALTER TABLE public.watch_history DROP CONSTRAINT IF EXISTS watch_history_content_type_check;
    ALTER TABLE public.watch_history ADD CONSTRAINT watch_history_content_type_check CHECK (content_type IN ('movie', 'tv', 'anime'));
END $$;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS watch_history_user_id_idx ON public.watch_history (user_id);
CREATE INDEX IF NOT EXISTS watch_history_watched_at_idx ON public.watch_history (watched_at DESC);

-- Set up Row Level Security
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own watch history
CREATE POLICY "Users can view their own watch history"
ON public.watch_history
FOR SELECT
USING (auth.uid() = user_id);

-- Only allow users to add to their own watch history
CREATE POLICY "Users can add to their own watch history"
ON public.watch_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only allow users to update their own watch history
CREATE POLICY "Users can update their own watch history"
ON public.watch_history
FOR UPDATE
USING (auth.uid() = user_id);

-- Only allow users to delete their own watch history
CREATE POLICY "Users can delete their own watch history"
ON public.watch_history
FOR DELETE
USING (auth.uid() = user_id);

-- Create a table for user preferences including active streaming source
CREATE TABLE IF NOT EXISTS public.user_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    active_streaming_source TEXT DEFAULT 'vidjoy',
    theme TEXT DEFAULT 'dark',
    autoplay BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Set up Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Only allow users to see their own preferences
CREATE POLICY "Users can view their own preferences"
ON public.user_preferences
FOR SELECT
USING (auth.uid() = user_id);

-- Only allow users to add their own preferences
CREATE POLICY "Users can add their own preferences"
ON public.user_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Only allow users to update their own preferences
CREATE POLICY "Users can update their own preferences"
ON public.user_preferences
FOR UPDATE
USING (auth.uid() = user_id); 