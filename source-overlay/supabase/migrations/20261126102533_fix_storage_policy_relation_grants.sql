-- Storage SELECT policies query these relations from storage.objects.
-- Keep RLS enabled; grants only make the referenced relations queryable.
GRANT SELECT ON TABLE public.qnr_gallery_posts TO anon, authenticated;
GRANT SELECT ON TABLE public.qnr_social_follows TO anon, authenticated;
