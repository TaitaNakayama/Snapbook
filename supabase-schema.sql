-- ============================================
-- Snapbook: Supabase SQL Schema + RLS Policies
-- ============================================
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- 1) TABLES
-- ---------

create table public.scrapbooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  name_a text not null,
  name_b text not null,
  created_at timestamptz not null default now()
);

create table public.memories (
  id uuid primary key default gen_random_uuid(),
  scrapbook_id uuid not null references public.scrapbooks(id) on delete cascade,
  date date,
  note text not null default '',
  song_title text,
  song_artist text,
  song_url text,
  created_at timestamptz not null default now()
);

create table public.memory_photos (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories(id) on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

-- Indexes for common queries
create index idx_scrapbooks_user_id on public.scrapbooks(user_id);
create index idx_memories_scrapbook_id on public.memories(scrapbook_id);
create index idx_memory_photos_memory_id on public.memory_photos(memory_id);

-- 2) ROW LEVEL SECURITY
-- ---------------------

alter table public.scrapbooks enable row level security;
alter table public.memories enable row level security;
alter table public.memory_photos enable row level security;

-- Scrapbooks: user can CRUD only their own
create policy "Users can view own scrapbooks"
  on public.scrapbooks for select
  using (auth.uid() = user_id);

create policy "Users can create own scrapbooks"
  on public.scrapbooks for insert
  with check (auth.uid() = user_id);

create policy "Users can update own scrapbooks"
  on public.scrapbooks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own scrapbooks"
  on public.scrapbooks for delete
  using (auth.uid() = user_id);

-- Memories: access through scrapbook ownership
create policy "Users can view memories of own scrapbooks"
  on public.memories for select
  using (
    exists (
      select 1 from public.scrapbooks
      where scrapbooks.id = memories.scrapbook_id
        and scrapbooks.user_id = auth.uid()
    )
  );

create policy "Users can create memories in own scrapbooks"
  on public.memories for insert
  with check (
    exists (
      select 1 from public.scrapbooks
      where scrapbooks.id = memories.scrapbook_id
        and scrapbooks.user_id = auth.uid()
    )
  );

create policy "Users can update memories in own scrapbooks"
  on public.memories for update
  using (
    exists (
      select 1 from public.scrapbooks
      where scrapbooks.id = memories.scrapbook_id
        and scrapbooks.user_id = auth.uid()
    )
  );

create policy "Users can delete memories in own scrapbooks"
  on public.memories for delete
  using (
    exists (
      select 1 from public.scrapbooks
      where scrapbooks.id = memories.scrapbook_id
        and scrapbooks.user_id = auth.uid()
    )
  );

-- Memory photos: access through memory -> scrapbook ownership
create policy "Users can view photos of own memories"
  on public.memory_photos for select
  using (
    exists (
      select 1 from public.memories
      join public.scrapbooks on scrapbooks.id = memories.scrapbook_id
      where memories.id = memory_photos.memory_id
        and scrapbooks.user_id = auth.uid()
    )
  );

create policy "Users can create photos in own memories"
  on public.memory_photos for insert
  with check (
    exists (
      select 1 from public.memories
      join public.scrapbooks on scrapbooks.id = memories.scrapbook_id
      where memories.id = memory_photos.memory_id
        and scrapbooks.user_id = auth.uid()
    )
  );

create policy "Users can update photos in own memories"
  on public.memory_photos for update
  using (
    exists (
      select 1 from public.memories
      join public.scrapbooks on scrapbooks.id = memories.scrapbook_id
      where memories.id = memory_photos.memory_id
        and scrapbooks.user_id = auth.uid()
    )
  );

create policy "Users can delete photos in own memories"
  on public.memory_photos for delete
  using (
    exists (
      select 1 from public.memories
      join public.scrapbooks on scrapbooks.id = memories.scrapbook_id
      where memories.id = memory_photos.memory_id
        and scrapbooks.user_id = auth.uid()
    )
  );

-- 3) STORAGE BUCKET + POLICIES
-- ----------------------------
-- Create the storage bucket (run in SQL editor)
insert into storage.buckets (id, name, public)
  values ('snapbook-photos', 'snapbook-photos', true);

-- Storage policies: users can manage files under their own user_id prefix
create policy "Users can upload own photos"
  on storage.objects for insert
  with check (
    bucket_id = 'snapbook-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view own photos"
  on storage.objects for select
  using (
    bucket_id = 'snapbook-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete own photos"
  on storage.objects for delete
  using (
    bucket_id = 'snapbook-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Public read access for photos (so images render without auth tokens)
create policy "Public read access for snapbook photos"
  on storage.objects for select
  using (bucket_id = 'snapbook-photos');
