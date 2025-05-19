-- Create a watch history table to track what users have watched
CREATE TABLE IF NOT EXISTS public.watch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content_id TEXT NOT NULL, -- TMDB ID
    content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'tv')),
    title TEXT NOT NULL,
    poster_path TEXT,
    watched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    progress INTEGER DEFAULT 0, -- Progress in seconds
    season INTEGER, -- Only for TV shows
    episode INTEGER, -- Only for TV shows
    
    UNIQUE (user_id, content_id, content_type, season, episode)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS watch_history_user_id_idx ON public.watch_history (user_id);

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