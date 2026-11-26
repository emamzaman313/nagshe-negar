-- Admins need to preview private media while reviewing pending posts and reels.
-- This does not make pending media public: the policy applies only to authenticated
-- sessions that pass the server-side admin role check.
drop policy if exists "qnr social media admin moderation read" on storage.objects;
create policy "qnr social media admin moderation read"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'qnr-social-media'
  and qnr_private.qnr_is_admin()
);
