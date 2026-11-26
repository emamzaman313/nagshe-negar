-- Rights-aware music library, playlists, profile soundtrack and persistent player preferences.
create table if not exists public.qnr_music_tracks (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(btrim(title)) between 1 and 120),
 artist text not null check (char_length(btrim(artist)) between 1 and 120),
 album text, description text, audio_path text not null unique, cover_path text unique,
 duration_seconds integer check (duration_seconds is null or duration_seconds between 1 and 36000),
 mime_type text not null check (mime_type in ('audio/mpeg','audio/mp4','audio/aac','audio/ogg','audio/wav','audio/flac')),
 file_size_bytes bigint not null check (file_size_bytes between 1 and 52428800),
 sha256 text check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
 license_type text not null check (license_type in ('original','cc0','cc-by','cc-by-sa','licensed','public-domain')),
 license_url text, rights_holder text not null check (char_length(btrim(rights_holder)) between 1 and 160),
 rights_confirmed boolean not null default false check (rights_confirmed=true),
 source text not null default 'user_upload' check (source in ('user_upload','admin_library')),
 visibility text not null default 'public' check (visibility in ('public','private')),
 status text not null default 'pending' check (status in ('pending','published','rejected','disabled')),
 moderation_note text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), published_at timestamptz,
 constraint qnr_music_license_url_required check (license_type not in ('cc-by','cc-by-sa','licensed') or (license_url is not null and length(btrim(license_url))>8))
);
create index if not exists qnr_music_tracks_public_idx on public.qnr_music_tracks(published_at desc,created_at desc) where status='published' and visibility='public' and rights_confirmed=true;
create index if not exists qnr_music_tracks_owner_idx on public.qnr_music_tracks(owner_id,created_at desc);
create table if not exists public.qnr_music_playlists (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(char_length(btrim(title)) between 1 and 100), description text,
 visibility text not null default 'private' check(visibility in ('public','private')),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create index if not exists qnr_music_playlists_owner_idx on public.qnr_music_playlists(owner_id,updated_at desc);
create table if not exists public.qnr_music_playlist_items (
 playlist_id uuid not null references public.qnr_music_playlists(id) on delete cascade,
 track_id uuid not null references public.qnr_music_tracks(id) on delete cascade,
 position integer not null default 0 check(position>=0), added_by uuid not null references auth.users(id) on delete cascade,
 added_at timestamptz not null default now(),primary key(playlist_id,track_id)
);
create index if not exists qnr_music_playlist_items_order_idx on public.qnr_music_playlist_items(playlist_id,position,added_at);
create table if not exists public.qnr_profile_music (
 user_id uuid primary key references auth.users(id) on delete cascade,
 track_id uuid not null references public.qnr_music_tracks(id) on delete cascade,
 visibility text not null default 'public' check(visibility in ('public','followers','private')),
 updated_at timestamptz not null default now()
);
create table if not exists public.qnr_music_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 music_enabled boolean not null default true,autoplay_enabled boolean not null default false,
 volume numeric(3,2) not null default 0.65 check(volume between 0 and 1),
 last_track_id uuid references public.qnr_music_tracks(id) on delete set null,
 last_position_seconds integer not null default 0 check(last_position_seconds>=0),updated_at timestamptz not null default now()
);
create table if not exists public.qnr_music_audit (
 id bigint generated always as identity primary key,actor_id uuid references auth.users(id) on delete set null,
 track_id uuid,action text not null,before_state jsonb,after_state jsonb,created_at timestamptz not null default now()
);
create index if not exists qnr_music_audit_track_idx on public.qnr_music_audit(track_id,created_at desc);
alter table public.qnr_social_posts add column if not exists soundtrack_track_id uuid references public.qnr_music_tracks(id) on delete set null;
create index if not exists qnr_social_posts_soundtrack_idx on public.qnr_social_posts(soundtrack_track_id) where soundtrack_track_id is not null;
alter table public.qnr_music_tracks enable row level security;
alter table public.qnr_music_playlists enable row level security;
alter table public.qnr_music_playlist_items enable row level security;
alter table public.qnr_profile_music enable row level security;
alter table public.qnr_music_preferences enable row level security;
alter table public.qnr_music_audit enable row level security;
grant select on public.qnr_music_tracks to anon,authenticated;
grant insert,update,delete on public.qnr_music_tracks to authenticated;
grant select,insert,update,delete on public.qnr_music_playlists to authenticated;
grant select,insert,update,delete on public.qnr_music_playlist_items to authenticated;
grant select,insert,update,delete on public.qnr_profile_music to authenticated;
grant select,insert,update on public.qnr_music_preferences to authenticated;
grant select on public.qnr_music_audit to authenticated;
drop policy if exists qnr_music_tracks_read on public.qnr_music_tracks;
create policy qnr_music_tracks_read on public.qnr_music_tracks for select to anon,authenticated using(owner_id=(select auth.uid()) or (status='published' and visibility='public' and rights_confirmed=true) or qnr_private.qnr_is_admin());
drop policy if exists qnr_music_tracks_insert_own on public.qnr_music_tracks;
create policy qnr_music_tracks_insert_own on public.qnr_music_tracks for insert to authenticated with check(owner_id=(select auth.uid()) and status='pending' and rights_confirmed=true and source='user_upload');
drop policy if exists qnr_music_tracks_update_own_pending on public.qnr_music_tracks;
create policy qnr_music_tracks_update_own_pending on public.qnr_music_tracks for update to authenticated using((owner_id=(select auth.uid()) and status in ('pending','rejected')) or qnr_private.qnr_is_admin()) with check((owner_id=(select auth.uid()) and status in ('pending','rejected') and rights_confirmed=true) or qnr_private.qnr_is_admin());
drop policy if exists qnr_music_tracks_delete_own_pending on public.qnr_music_tracks;
create policy qnr_music_tracks_delete_own_pending on public.qnr_music_tracks for delete to authenticated using((owner_id=(select auth.uid()) and status in ('pending','rejected')) or qnr_private.qnr_is_admin());
drop policy if exists qnr_music_playlists_read on public.qnr_music_playlists;
create policy qnr_music_playlists_read on public.qnr_music_playlists for select to authenticated using(owner_id=(select auth.uid()) or visibility='public');
drop policy if exists qnr_music_playlists_insert_own on public.qnr_music_playlists;
create policy qnr_music_playlists_insert_own on public.qnr_music_playlists for insert to authenticated with check(owner_id=(select auth.uid()));
drop policy if exists qnr_music_playlists_update_own on public.qnr_music_playlists;
create policy qnr_music_playlists_update_own on public.qnr_music_playlists for update to authenticated using(owner_id=(select auth.uid())) with check(owner_id=(select auth.uid()));
drop policy if exists qnr_music_playlists_delete_own on public.qnr_music_playlists;
create policy qnr_music_playlists_delete_own on public.qnr_music_playlists for delete to authenticated using(owner_id=(select auth.uid()));
drop policy if exists qnr_music_playlist_items_read on public.qnr_music_playlist_items;
create policy qnr_music_playlist_items_read on public.qnr_music_playlist_items for select to authenticated using(exists(select 1 from public.qnr_music_playlists p where p.id=playlist_id and (p.owner_id=(select auth.uid()) or p.visibility='public')));
drop policy if exists qnr_music_playlist_items_insert_owner on public.qnr_music_playlist_items;
create policy qnr_music_playlist_items_insert_owner on public.qnr_music_playlist_items for insert to authenticated with check(added_by=(select auth.uid()) and exists(select 1 from public.qnr_music_playlists p where p.id=playlist_id and p.owner_id=(select auth.uid())) and exists(select 1 from public.qnr_music_tracks t where t.id=track_id and (t.owner_id=(select auth.uid()) or (t.status='published' and t.visibility='public' and t.rights_confirmed=true))));
drop policy if exists qnr_music_playlist_items_delete_owner on public.qnr_music_playlist_items;
create policy qnr_music_playlist_items_delete_owner on public.qnr_music_playlist_items for delete to authenticated using(exists(select 1 from public.qnr_music_playlists p where p.id=playlist_id and p.owner_id=(select auth.uid())));
drop policy if exists qnr_profile_music_read on public.qnr_profile_music;
create policy qnr_profile_music_read on public.qnr_profile_music for select to anon,authenticated using(user_id=(select auth.uid()) or visibility='public' or (visibility='followers' and exists(select 1 from public.qnr_social_follows f where f.follower_id=(select auth.uid()) and f.following_id=user_id)));
drop policy if exists qnr_profile_music_insert_own on public.qnr_profile_music;
create policy qnr_profile_music_insert_own on public.qnr_profile_music for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.qnr_music_tracks t where t.id=track_id and (t.owner_id=(select auth.uid()) or (t.status='published' and t.visibility='public' and t.rights_confirmed=true))));
drop policy if exists qnr_profile_music_update_own on public.qnr_profile_music;
create policy qnr_profile_music_update_own on public.qnr_profile_music for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()) and exists(select 1 from public.qnr_music_tracks t where t.id=track_id and (t.owner_id=(select auth.uid()) or (t.status='published' and t.visibility='public' and t.rights_confirmed=true))));
drop policy if exists qnr_profile_music_delete_own on public.qnr_profile_music;
create policy qnr_profile_music_delete_own on public.qnr_profile_music for delete to authenticated using(user_id=(select auth.uid()));
drop policy if exists qnr_music_preferences_own on public.qnr_music_preferences;
create policy qnr_music_preferences_own on public.qnr_music_preferences for all to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
drop policy if exists qnr_music_audit_admin_read on public.qnr_music_audit;
create policy qnr_music_audit_admin_read on public.qnr_music_audit for select to authenticated using(qnr_private.qnr_is_admin());
create or replace function qnr_private.qnr_music_track_audit() returns trigger language plpgsql security definer set search_path='' as $$
declare v_actor uuid:=auth.uid();v_id uuid;
begin
 v_id:=case when tg_op='DELETE' then old.id else new.id end;
 insert into public.qnr_music_audit(actor_id,track_id,action,before_state,after_state)
 values(v_actor,v_id,lower(tg_op),
 case when tg_op in ('UPDATE','DELETE') then jsonb_build_object('status',old.status,'visibility',old.visibility,'title',old.title,'license_type',old.license_type) else null end,
 case when tg_op in ('INSERT','UPDATE') then jsonb_build_object('status',new.status,'visibility',new.visibility,'title',new.title,'license_type',new.license_type) else null end);
 if tg_op='DELETE' then return old; end if;return new;
end;$$;
revoke all on function qnr_private.qnr_music_track_audit() from public,anon,authenticated;
drop trigger if exists qnr_music_track_audit_trigger on public.qnr_music_tracks;
create trigger qnr_music_track_audit_trigger after insert or update or delete on public.qnr_music_tracks for each row execute function qnr_private.qnr_music_track_audit();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('qnr-music','qnr-music',false,52428800,array['audio/mpeg','audio/mp4','audio/aac','audio/ogg','audio/wav','audio/flac','image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists qnr_music_storage_read on storage.objects;
create policy qnr_music_storage_read on storage.objects for select to anon,authenticated using(bucket_id='qnr-music' and exists(select 1 from public.qnr_music_tracks t where (t.audio_path=name or t.cover_path=name) and (t.owner_id=(select auth.uid()) or (t.status='published' and t.visibility='public' and t.rights_confirmed=true) or qnr_private.qnr_is_admin())));
drop policy if exists qnr_music_storage_insert_own_pending on storage.objects;
create policy qnr_music_storage_insert_own_pending on storage.objects for insert to authenticated with check(bucket_id='qnr-music' and (storage.foldername(name))[1]=(select auth.uid())::text and exists(select 1 from public.qnr_music_tracks t where t.owner_id=(select auth.uid()) and t.status='pending' and (t.audio_path=name or t.cover_path=name)));
drop policy if exists qnr_music_storage_delete_own_pending on storage.objects;
create policy qnr_music_storage_delete_own_pending on storage.objects for delete to authenticated using(bucket_id='qnr-music' and exists(select 1 from public.qnr_music_tracks t where (t.audio_path=name or t.cover_path=name) and ((t.owner_id=(select auth.uid()) and t.status in ('pending','rejected')) or qnr_private.qnr_is_admin())));
comment on table public.qnr_music_tracks is 'Rights-declared audio library. Public playback requires admin publication and a private-bucket signed URL.';
comment on table public.qnr_music_audit is 'Audit history for music track moderation and metadata changes.';
