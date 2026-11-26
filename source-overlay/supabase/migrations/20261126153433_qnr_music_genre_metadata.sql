alter table public.qnr_music_tracks add column if not exists genre text;
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='qnr_music_genre_length'
      and conrelid='public.qnr_music_tracks'::regclass
  ) then
    alter table public.qnr_music_tracks
      add constraint qnr_music_genre_length
      check (genre is null or char_length(genre)<=60);
  end if;
end;
$$;
