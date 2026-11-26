-- Allow authenticated administrators to preview pending social media in the private bucket.
-- Public users continue to read only media attached to published posts.
drop policy if exists "qnr social media admin moderation read" on storage.objects;
create policy "qnr social media admin moderation read"
on storage.objects for select to authenticated
using (bucket_id = 'qnr-social-media' and qnr_private.qnr_is_admin());
