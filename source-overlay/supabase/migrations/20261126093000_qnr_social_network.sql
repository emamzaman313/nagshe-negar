-- Naghsh Negar social layer v1. Private media, moderation-first publishing, RLS.
create table public.qnr_social_public_profiles(
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'هنرمند نقش‌نگار',
 avatar_path text,
 updated_at timestamptz not null default now()
);
create table public.qnr_social_posts(
 id uuid primary key default gen_random_uuid(),
 author_id uuid not null references auth.users(id) on delete cascade,
 media_path text not null unique,
 media_type text not null check(media_type in('image','video')),
 caption text not null check(char_length(btrim(caption)) between 1 and 2200),
 visibility text not null default 'public' check(visibility in('public','followers')),
 status text not null default 'pending' check(status in('pending','published','rejected','hidden')),
 moderation_note text,
 published_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table public.qnr_social_follows(
 follower_id uuid not null references auth.users(id) on delete cascade,
 following_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(follower_id,following_id), check(follower_id<>following_id)
);
create table public.qnr_social_likes(
 post_id uuid not null references public.qnr_social_posts(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(post_id,user_id)
);
create table public.qnr_social_comments(
 id uuid primary key default gen_random_uuid(),
 post_id uuid not null references public.qnr_social_posts(id) on delete cascade,
 author_id uuid not null references auth.users(id) on delete cascade,
 body text not null check(char_length(btrim(body)) between 1 and 1200),
 status text not null default 'published' check(status in('published','hidden')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.qnr_social_bookmarks(
 user_id uuid not null references auth.users(id) on delete cascade,
 post_id uuid not null references public.qnr_social_posts(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id,post_id)
);
create table public.qnr_social_reports(
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null references auth.users(id) on delete cascade,
 post_id uuid not null references public.qnr_social_posts(id) on delete cascade,
 reason text not null check(reason in('spam','harassment','copyright','unsafe','other')),
 details text not null default '' check(char_length(details)<=1000),
 status text not null default 'open' check(status in('open','reviewed','dismissed')),
 reviewed_by uuid references auth.users(id) on delete set null,
 reviewed_at timestamptz, created_at timestamptz not null default now(),
 unique(reporter_id,post_id)
);
create index qnr_social_feed_idx on public.qnr_social_posts(status,visibility,published_at desc,created_at desc);
create index qnr_social_comments_idx on public.qnr_social_comments(post_id,created_at desc) where status='published';
create index qnr_social_following_idx on public.qnr_social_follows(following_id,follower_id);
create index qnr_social_reports_idx on public.qnr_social_reports(status,created_at desc);

alter table public.qnr_social_public_profiles enable row level security;
alter table public.qnr_social_posts enable row level security;
alter table public.qnr_social_follows enable row level security;
alter table public.qnr_social_likes enable row level security;
alter table public.qnr_social_comments enable row level security;
alter table public.qnr_social_bookmarks enable row level security;
alter table public.qnr_social_reports enable row level security;

create policy "qnr social public profile read" on public.qnr_social_public_profiles for select to anon,authenticated using(true);
create policy "qnr social profile insert own" on public.qnr_social_public_profiles for insert to authenticated with check(user_id=(select auth.uid()));
create policy "qnr social profile update own" on public.qnr_social_public_profiles for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));

create policy "qnr social post read" on public.qnr_social_posts for select to anon,authenticated using(
 (status='published' and visibility='public')
 or (status='published' and visibility='followers' and exists(select 1 from public.qnr_social_follows f where f.follower_id=(select auth.uid()) and f.following_id=author_id))
 or author_id=(select auth.uid())
 or exists(select 1 from public.qnr_user_roles r where r.user_id=(select auth.uid()) and r.role='admin')
);
create policy "qnr social post insert own" on public.qnr_social_posts for insert to authenticated with check(author_id=(select auth.uid()) and status='pending');
create policy "qnr social post edit own pending" on public.qnr_social_posts for update to authenticated using(author_id=(select auth.uid()) and status in('pending','rejected')) with check(author_id=(select auth.uid()) and status in('pending','rejected'));
create policy "qnr social post admin update" on public.qnr_social_posts for update to authenticated using(exists(select 1 from public.qnr_user_roles r where r.user_id=(select auth.uid()) and r.role='admin')) with check(exists(select 1 from public.qnr_user_roles r where r.user_id=(select auth.uid()) and r.role='admin'));
create policy "qnr social post delete" on public.qnr_social_posts for delete to authenticated using(author_id=(select auth.uid()) or exists(select 1 from public.qnr_user_roles r where r.user_id=(select auth.uid()) and r.role='admin'));

create policy "qnr social follows read own" on public.qnr_social_follows for select to authenticated using(follower_id=(select auth.uid()) or following_id=(select auth.uid()));
create policy "qnr social follows insert own" on public.qnr_social_follows for insert to authenticated with check(follower_id=(select auth.uid()) and follower_id<>following_id);
create policy "qnr social follows delete own" on public.qnr_social_follows for delete to authenticated using(follower_id=(select auth.uid()));
create policy "qnr social likes read own" on public.qnr_social_likes for select to authenticated using(user_id=(select auth.uid()));
create policy "qnr social likes insert own" on public.qnr_social_likes for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.qnr_social_posts p where p.id=post_id and p.status='published'));
create policy "qnr social likes delete own" on public.qnr_social_likes for delete to authenticated using(user_id=(select auth.uid()));

create policy "qnr social comments read" on public.qnr_social_comments for select to anon,authenticated using(
 (status='published' and exists(select 1 from public.qnr_social_posts p where p.id=post_id and p.status='published' and (p.visibility='public' or (p.visibility='followers' and exists(select 1 from public.qnr_social_follows f where f.follower_id=(select auth.uid()) and f.following_id=p.author_id))))
 or author_id=(select auth.uid())
 or exists(select 1 from public.qnr_user_roles r where r.user_id=(select auth.uid()) and r.role='admin')
);
create policy "qnr social comments insert own" on public.qnr_social_comments for insert to authenticated with check(author_id=(select auth.uid()) and exists(select 1 from public.qnr_social_posts p where p.id=post_id and p.status='published' and (p.visibility='public' or (p.visibility='followers' and exists(select 1 from public.qnr_social_follows f where f.follower_id=(select auth.uid()) and f.following_id=p.author_id)))));
create policy "qnr social comments update own" on public.qnr_social_comments for update to authenticated using(author_id=(select auth.uid())) with check(author_id=(select auth.uid()));
create policy "qnr social comments delete" on public.qnr_social_comments for delete to authenticated using(author_id=(select auth.uid()) or exists(select 1 from public.qnr_user_roles r where r.user_id=(select auth.uid()) and r.role='admin'));

create policy "qnr social bookmarks read own" on public.qnr_social_bookmarks for select to authenticated using(user_id=(select auth.uid()));
create policy "qnr social bookmarks insert own" on public.qnr_social_bookmarks for insert to authenticated with check(user_id=(select auth.uid()) and exists(select 1 from public.qnr_social_posts p where p.id=post_id and p.status='published'));
create policy "qnr social bookmarks delete own" on public.qnr_social_bookmarks for delete to authenticated using(user_id=(select auth.uid()));
create policy "qnr social reports insert own" on public.qnr_social_reports for insert to authenticated with check(reporter_id=(select auth.uid()) and exists(select 1 from public.qnr_social_posts p where p.id=post_id and p.status='published'));
create policy "qnr social reports read own admin" on public.qnr_social_reports for select to authenticated using(reporter_id=(select auth.uid()) or exists(select 1 from public.qnr_user_roles r where r.user_id=(select auth.uid()) and r.role='admin'));
create policy "qnr social reports admin update" on public.qnr_social_reports for update to authenticated using(exists(select 1 from public.qnr_user_roles r where r.user_id=(select auth.uid()) and r.role='admin')) with check(exists(select 1 from public.qnr_user_roles r where r.user_id=(select auth.uid()) and r.role='admin'));

create or replace function public.qnr_sync_social_public_profile() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into public.qnr_social_public_profiles(user_id,display_name,avatar_path,updated_at)
 values(new.id,coalesce(nullif(btrim(new.display_name),''),'هنرمند نقش‌نگار'),new.avatar_path,now())
 on conflict(user_id) do update set display_name=excluded.display_name,avatar_path=excluded.avatar_path,updated_at=now();
 return new;
end; $$;
revoke all on function public.qnr_sync_social_public_profile() from public,anon,authenticated;
create trigger qnr_profiles_sync_social_public_profile after insert or update of display_name,avatar_path on public.qnr_profiles for each row execute function public.qnr_sync_social_public_profile();
insert into public.qnr_social_public_profiles(user_id,display_name,avatar_path)
select id,coalesce(nullif(btrim(display_name),''),'هنرمند نقش‌نگار'),avatar_path from public.qnr_profiles
on conflict(user_id) do update set display_name=excluded.display_name,avatar_path=excluded.avatar_path,updated_at=now();

create or replace view public.qnr_social_post_metrics with (security_invoker=false) as
select p.id post_id,(select count(*)::bigint from public.qnr_social_likes l where l.post_id=p.id) likes_count,
 (select count(*)::bigint from public.qnr_social_comments c where c.post_id=p.id and c.status='published') comments_count
from public.qnr_social_posts p where p.status='published' and (p.visibility='public' or (p.visibility='followers' and exists(select 1 from public.qnr_social_follows f where f.follower_id=(select auth.uid()) and f.following_id=p.author_id)));

grant select on public.qnr_social_public_profiles to anon,authenticated;
grant insert,update on public.qnr_social_public_profiles to authenticated;
grant select,insert,update,delete on public.qnr_social_posts to authenticated;
grant select on public.qnr_social_posts to anon;
grant select,insert,delete on public.qnr_social_follows,public.qnr_social_likes,public.qnr_social_bookmarks to authenticated;
grant select,insert,update,delete on public.qnr_social_comments to authenticated;
grant select on public.qnr_social_comments to anon;
grant select,insert,update on public.qnr_social_reports to authenticated;
grant select on public.qnr_social_post_metrics to anon,authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('qnr-social-media','qnr-social-media',false,104857600,array['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime'])
on conflict(id) do update set public=false,file_size_limit=104857600,allowed_mime_types=excluded.allowed_mime_types;
create policy "qnr social media upload own" on storage.objects for insert to authenticated with check(bucket_id='qnr-social-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "qnr social media update own" on storage.objects for update to authenticated using(bucket_id='qnr-social-media' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='qnr-social-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy "qnr social media read published or own" on storage.objects for select to anon,authenticated using(bucket_id='qnr-social-media' and ((storage.foldername(name))[1]=(select auth.uid())::text or exists(select 1 from public.qnr_social_posts p where p.media_path=name and p.status='published' and (p.visibility='public' or (p.visibility='followers' and exists(select 1 from public.qnr_social_follows f where f.follower_id=(select auth.uid()) and f.following_id=p.author_id))))));
create policy "qnr social media delete own" on storage.objects for delete to authenticated using(bucket_id='qnr-social-media' and (storage.foldername(name))[1]=(select auth.uid())::text);
