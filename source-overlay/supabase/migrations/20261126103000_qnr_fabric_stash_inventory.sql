-- Personal fabric inventory for quilting makers.
create table if not exists public.qnr_fabric_stash (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  fabric_type text not null default 'cotton' check (fabric_type in ('cotton','linen','silk','wool','blend','other')),
  color_name text not null default '' check (char_length(color_name) <= 50),
  color_hex text not null default '#648b78' check (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  pattern text not null default '' check (char_length(pattern) <= 80),
  quantity numeric(10,2) not null default 1 check (quantity >= 0 and quantity <= 100000),
  unit text not null default 'meter' check (unit in ('meter','yard','piece','fat_quarter')),
  width_cm numeric(8,2) check (width_cm is null or width_cm between 0 and 10000),
  location text not null default '' check (char_length(location) <= 100),
  notes text not null default '' check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists qnr_fabric_stash_user_updated_idx
  on public.qnr_fabric_stash (user_id, updated_at desc);
alter table public.qnr_fabric_stash enable row level security;
create policy "qnr fabric stash read own"
  on public.qnr_fabric_stash for select to authenticated
  using (user_id = (select auth.uid()));
create policy "qnr fabric stash insert own"
  on public.qnr_fabric_stash for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "qnr fabric stash update own"
  on public.qnr_fabric_stash for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "qnr fabric stash delete own"
  on public.qnr_fabric_stash for delete to authenticated
  using (user_id = (select auth.uid()));
grant select, insert, update, delete on public.qnr_fabric_stash to authenticated;
