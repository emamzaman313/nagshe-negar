-- Cover all foreign keys introduced by the music platform.
create index if not exists qnr_music_audit_actor_idx on public.qnr_music_audit(actor_id);
create index if not exists qnr_music_playlist_items_added_by_idx on public.qnr_music_playlist_items(added_by);
create index if not exists qnr_music_playlist_items_track_idx on public.qnr_music_playlist_items(track_id);
create index if not exists qnr_music_preferences_last_track_idx on public.qnr_music_preferences(last_track_id);
create index if not exists qnr_profile_music_track_idx on public.qnr_profile_music(track_id);
