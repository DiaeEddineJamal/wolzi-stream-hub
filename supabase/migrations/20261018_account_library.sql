begin;
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text check (length(username)<=80), avatar_url text,
  created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
  media_id text not null,media_type text not null check (media_type in ('movie','tv','anime')),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  added_at timestamptz not null default now(),unique(user_id,media_id,media_type)
);
create table if not exists public.watch_history (
  id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null,content_type text not null check (content_type in ('movie','tv','anime')),
  title text not null,poster_path text,watched_at timestamptz not null default now(),
  progress integer not null default 0 check (progress>=0),duration integer check (duration>0),
  progress_percent numeric not null default 0 check (progress_percent between 0 and 100),
  season integer,episode integer,
  unique nulls not distinct (user_id,content_id,content_type,season,episode)
);
create index if not exists watch_history_recent on public.watch_history(user_id,watched_at desc);
create index if not exists watchlist_recent on public.watchlist(user_id,added_at desc);
alter table public.profiles enable row level security;
alter table public.watchlist enable row level security;
alter table public.watch_history enable row level security;
revoke all on public.profiles,public.watchlist,public.watch_history from anon;
grant select,insert,update,delete on public.profiles,public.watchlist,public.watch_history to authenticated;
create policy admax_profile_owner on public.profiles for all to authenticated using ((select auth.uid())=id) with check ((select auth.uid())=id);
create policy admax_watchlist_owner on public.watchlist for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy admax_history_owner on public.watch_history for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp','image/gif']) on conflict(id) do nothing;
create policy admax_avatar_read on storage.objects for select to public using (bucket_id='avatars');
create policy admax_avatar_owner on storage.objects for all to authenticated using (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text) with check (bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text);
commit;
