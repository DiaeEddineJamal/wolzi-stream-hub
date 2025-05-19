# WolziFlix Profile System Fix

This document provides instructions to fix the profile loading issues and image upload functionality in the WolziFlix application.

## Current Issues

1. Profile page shows only a loading spinner after login
2. Profile picture upload functionality doesn't work
3. Watchlist and favorites sections may not load properly

## Root Causes

1. Missing or incorrect Row Level Security (RLS) policies on the profiles table
2. Storage bucket for avatars might not be properly configured
3. Data inconsistency between what the app expects and what's in the database

## Fix Steps

### 1. Run the SQL Migrations

Log into your Supabase dashboard and execute the following SQL in the SQL Editor:

```sql
-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for the profiles table
-- Allow users to view their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Allow users to create their own profile
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Create avatars storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the avatars bucket
-- Allow public access to images
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatars
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);

-- Allow users to update their own avatar
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- Allow users to delete their own avatar
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid() = owner);

-- If using the auto-create trigger, add this as well:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, created_at, updated_at)
    VALUES (new.id, new.raw_user_meta_data->>'username', now(), now());
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

### 2. Create Missing Profiles for Existing Users

If you have existing users without profiles, run this SQL to create them:

```sql
-- Create profiles for existing users without one
INSERT INTO public.profiles (id, username, created_at, updated_at)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'username', email),
    now(),
    now()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
);
```

### 3. Update Your Code

We've already updated the following files:

- `src/contexts/AuthContext.tsx`: Fixed UserProfile interface to match database
- `src/lib/supabase.ts`: Updated with proper authentication settings
- Added debug logging to help diagnose any remaining issues

### 4. Test the Fix

1. Log out and log back in
2. Try to access your profile page
3. Try uploading a profile picture
4. Check if watchlist and favorites now load properly

## Troubleshooting

If you still experience issues:

1. Check the browser console for errors
2. Verify that profiles exist in your Supabase database
3. Ensure the storage bucket has the correct policies

## Contact Support

If issues persist, please contact support with:
- Screenshots of any errors
- Browser console logs
- Database configuration information 