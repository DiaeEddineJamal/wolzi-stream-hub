# WolziFlix Authentication Fixes

This document outlines the changes made to fix the authentication issues in the WolziFlix application.

## Issue 1: Profile Update Errors

The error "Update failed: new row violates row-level security policy" was caused by missing Row Level Security (RLS) policies on the profiles table.

## Issue 2: Signup Error (HTTP 401 "Invalid API Key")

This was caused by an inconsistent API key between different Supabase client instances.

## Applied Fixes

1. **Updated Supabase Client Configuration**
   - Fixed the Supabase client in `src/lib/supabase.ts` to use the correct API key
   - Ensured consistent configuration across the app

2. **Fixed Profile Creation in Signup**
   - Changed the `insert` format from array to object in `AuthContext.tsx`
   - Fixed date format by using `toISOString()` for better compatibility

3. **Added RLS Policies for Profiles Table**
   - Created a migration file (`supabase/profiles_rls_migration.sql`) with proper RLS policies
   - Added a trigger to automatically create profiles when users sign up

## How to Apply These Fixes

1. Run the SQL migration to set up the correct RLS policies:

```bash
supabase migration up --file profiles_rls_migration.sql
```

2. If you're using the Supabase dashboard, you can apply the SQL directly in the SQL editor with:
   - Go to your Supabase project dashboard
   - Click on "SQL Editor"
   - Paste the contents of `supabase/profiles_rls_migration.sql`
   - Click "Run"

3. The code changes in `lib/supabase.ts` and `contexts/AuthContext.tsx` have already been applied.

## Testing the Fixes

1. Try signing up a new user
2. Verify the user can log in
3. Test updating the user profile (username, avatar)
4. Verify the profile is displayed correctly in the UI

These changes ensure:
- Proper Row Level Security for user data
- Consistent authentication across the application
- Automatic profile creation during signup 