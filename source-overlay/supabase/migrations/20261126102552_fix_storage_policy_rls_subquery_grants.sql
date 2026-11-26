-- qnr_social_posts SELECT policy and storage policies contain subqueries
-- against qnr_user_roles. No anon SELECT policy exists on qnr_user_roles,
-- so granting the table privilege does not expose role rows to anonymous users.
GRANT SELECT ON TABLE public.qnr_user_roles TO anon;
