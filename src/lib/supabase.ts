import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ovysulfiekqsludeqfnf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92eXN1bGZpZWtxc2x1ZGVxZm5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2NDk0MDEsImV4cCI6MjA2MzIyNTQwMX0.UZOusyeckGf3srFYyEBaD66vqjxdDwyP-cIKEvInT8Y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
}); 