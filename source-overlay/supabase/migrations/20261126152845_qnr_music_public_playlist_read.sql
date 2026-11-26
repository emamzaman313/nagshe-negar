-- Public playlists are discoverable without exposing private playlist contents.
grant select on public.qnr_music_playlists to anon;
grant select on public.qnr_music_playlist_items to anon;
drop policy if exists qnr_music_playlists_read on public.qnr_music_playlists;
create policy qnr_music_playlists_read on public.qnr_music_playlists
for select to anon, authenticated
using (owner_id=(select auth.uid()) or visibility='public');
drop policy if exists qnr_music_playlist_items_read on public.qnr_music_playlist_items;
create policy qnr_music_playlist_items_read on public.qnr_music_playlist_items
for select to anon, authenticated
using (
  exists (
    select 1 from public.qnr_music_playlists p
    where p.id=playlist_id and (
      p.owner_id=(select auth.uid())
      or (p.visibility='public' and exists (
        select 1 from public.qnr_music_tracks t
        where t.id=track_id and t.status='published'
          and t.visibility='public' and t.rights_confirmed=true
      ))
    )
  )
);
