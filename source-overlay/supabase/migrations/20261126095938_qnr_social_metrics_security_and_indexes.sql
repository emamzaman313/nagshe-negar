-- Secure social metrics behind an invoker view and a narrow private aggregate function.
create or replace function qnr_private.qnr_social_metrics(p_post_ids uuid[])
returns table(post_id uuid, likes_count bigint, comments_count bigint)
language sql
stable
security definer
set search_path=public,qnr_private,pg_temp
as $$
  select p.id,
    (select count(*)::bigint from public.qnr_social_likes l where l.post_id=p.id),
    (select count(*)::bigint from public.qnr_social_comments c where c.post_id=p.id and c.status='published')
  from public.qnr_social_posts p
  where p.id = any(p_post_ids)
    and p.status='published'
    and (
      p.visibility='public'
      or (
        p.visibility='followers'
        and exists (
          select 1 from public.qnr_social_follows f
          where f.follower_id=(select auth.uid()) and f.following_id=p.author_id
        )
      )
    );
$$;
revoke all on function qnr_private.qnr_social_metrics(uuid[]) from public,anon,authenticated;
grant usage on schema qnr_private to anon,authenticated;
grant execute on function qnr_private.qnr_social_metrics(uuid[]) to anon,authenticated;

create or replace view public.qnr_social_post_metrics
with (security_invoker=true)
as
select m.post_id,m.likes_count,m.comments_count
from qnr_private.qnr_social_metrics(
  array(
    select p.id from public.qnr_social_posts p
    where p.status='published'
      and (
        p.visibility='public'
        or (
          p.visibility='followers'
          and exists (
            select 1 from public.qnr_social_follows f
            where f.follower_id=(select auth.uid()) and f.following_id=p.author_id
          )
        )
      )
  )
) m;
grant select on public.qnr_social_post_metrics to anon,authenticated;

-- Cover social foreign keys used for profile, bookmark, moderation and metric lookups.
create index if not exists qnr_social_posts_author_idx on public.qnr_social_posts(author_id);
create index if not exists qnr_social_likes_user_idx on public.qnr_social_likes(user_id);
create index if not exists qnr_social_comments_author_idx on public.qnr_social_comments(author_id);
create index if not exists qnr_social_bookmarks_post_idx on public.qnr_social_bookmarks(post_id);
create index if not exists qnr_social_reports_post_idx on public.qnr_social_reports(post_id);
create index if not exists qnr_social_reports_reviewed_by_idx on public.qnr_social_reports(reviewed_by);

-- Consolidate the two UPDATE policies to avoid duplicate permissive policy evaluation.
drop policy if exists "qnr social post edit own pending" on public.qnr_social_posts;
drop policy if exists "qnr social post admin update" on public.qnr_social_posts;
create policy "qnr social post update own or admin"
on public.qnr_social_posts for update to authenticated
using (
  (author_id=(select auth.uid()) and status in('pending','rejected'))
  or exists(select 1 from public.qnr_user_roles r where r.user_id=(select auth.uid()) and r.role='admin')
)
with check (
  (author_id=(select auth.uid()) and status in('pending','rejected'))
  or exists(select 1 from public.qnr_user_roles r where r.user_id=(select auth.uid()) and r.role='admin')
);
