-- RLS does not protect TRUNCATE or trigger privileges; remove default non-row grants.
revoke truncate, references, trigger on table
  public.qnr_social_public_profiles,
  public.qnr_social_posts,
  public.qnr_social_follows,
  public.qnr_social_likes,
  public.qnr_social_comments,
  public.qnr_social_bookmarks,
  public.qnr_social_reports
from anon, authenticated;
