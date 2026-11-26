-- Central admin-managed music library. Apply only after reviewing this migration on the feature branch.
create table if not exists public.qnr_music_platform_settings (
  id boolean primary key default true check (id = true),
  default_track_id uuid references public.qnr_music_tracks(id) on delete set null,
  enabled boolean not null default true,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.qnr_music_platform_settings enable row level security;
drop policy if exists qnr_music_platform_settings_public_read on public.qnr_music_platform_settings;
create policy qnr_music_platform_settings_public_read on public.qnr_music_platform_settings
 for select to anon, authenticated using (true);
drop policy if exists qnr_music_platform_settings_admin_manage on public.qnr_music_platform_settings;
create policy qnr_music_platform_settings_admin_manage on public.qnr_music_platform_settings
 for all to authenticated using (qnr_private.qnr_is_admin()) with check (qnr_private.qnr_is_admin());
grant select on public.qnr_music_platform_settings to anon, authenticated;
grant insert, update, delete on public.qnr_music_platform_settings to authenticated;
insert into public.qnr_music_platform_settings(id, enabled) values (true, true) on conflict (id) do nothing;

drop policy if exists qnr_music_tracks_admin_library_insert on public.qnr_music_tracks;
create policy qnr_music_tracks_admin_library_insert on public.qnr_music_tracks
 for insert to authenticated with check (
   qnr_private.qnr_is_admin()
   and owner_id = (select auth.uid())
   and source = 'admin_library'
   and status = 'published'
   and visibility = 'public'
   and rights_confirmed = true
 );
drop policy if exists qnr_music_tracks_admin_library_update on public.qnr_music_tracks;
create policy qnr_music_tracks_admin_library_update on public.qnr_music_tracks
 for update to authenticated using (qnr_private.qnr_is_admin())
 with check (qnr_private.qnr_is_admin());

drop policy if exists qnr_music_storage_admin_insert on storage.objects;
create policy qnr_music_storage_admin_insert on storage.objects
 for insert to authenticated with check (
   bucket_id = 'qnr-music'
   and (storage.foldername(name))[1] = 'library'
   and qnr_private.qnr_is_admin()
 );
drop policy if exists qnr_music_storage_admin_update on storage.objects;
create policy qnr_music_storage_admin_update on storage.objects
 for update to authenticated using (
   bucket_id = 'qnr-music' and qnr_private.qnr_is_admin()
 ) with check (
   bucket_id = 'qnr-music' and qnr_private.qnr_is_admin()
 );
drop policy if exists qnr_music_storage_admin_delete on storage.objects;
create policy qnr_music_storage_admin_delete on storage.objects
 for delete to authenticated using (
   bucket_id = 'qnr-music' and qnr_private.qnr_is_admin()
 );
drop policy if exists qnr_music_storage_published_read on storage.objects;
create policy qnr_music_storage_published_read on storage.objects
 for select to anon, authenticated using (
   bucket_id = 'qnr-music' and (
     qnr_private.qnr_is_admin()
     or exists (
       select 1 from public.qnr_music_tracks t
       where t.status = 'published' and t.visibility = 'public'
         and t.rights_confirmed = true
         and (t.audio_path = name or t.cover_path = name)
     )
   )
 );

comment on table public.qnr_music_platform_settings is
 'Singleton settings for the administrator-selected default music track. Playback is client-side only while the app is visible.';
