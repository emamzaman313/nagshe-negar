create or replace function qnr_private.qnr_validate_social_soundtrack()
returns trigger language plpgsql set search_path='' as $$
begin
 if new.soundtrack_track_id is null then return new; end if;
 if new.media_type <> 'video' then raise exception 'A soundtrack can only be attached to a video post.'; end if;
 if not exists(select 1 from public.qnr_music_tracks t where t.id=new.soundtrack_track_id and t.status='published' and t.visibility='public' and t.rights_confirmed=true) then
   raise exception 'The selected soundtrack must be a published public track with confirmed rights.';
 end if;
 return new;
end;$$;
revoke all on function qnr_private.qnr_validate_social_soundtrack() from public,anon,authenticated;
drop trigger if exists qnr_social_soundtrack_guard on public.qnr_social_posts;
create trigger qnr_social_soundtrack_guard before insert or update of soundtrack_track_id,media_type on public.qnr_social_posts for each row execute function qnr_private.qnr_validate_social_soundtrack();
