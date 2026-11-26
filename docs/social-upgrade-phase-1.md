# Naghsh Negar — Social Upgrade / Phase 1

## Delivered in source overlay

- Authenticated social feed with public/following views.
- Image publishing (JPEG, PNG, WebP up to 10 MiB) and video publishing (MP4, WebM, MOV up to 100 MiB).
- Likes, comments, follows, bookmarks and native share affordance.
- EXIF and supported image metadata removal before image upload.
- Vertical reels with IntersectionObserver-driven autoplay and off-screen pause.
- Admin moderation queue with publish/hide/remove actions and audit log entries.
- Private Supabase Storage bucket with owner-path upload policy and visible-media read policy.
- RLS policies for posts, likes, comments, follows and bookmarks.
- Rate limits for post creation and comments.
- Dependency-free tests for media MIME/extension/size and caption validation.

## Deployment model

The repository keeps its historical source archive and applies source-overlay/ after extraction in both GitHub Actions and Vercel. The compressed overlay is stored as base64 shards under source-overlay-b64/ and restored by scripts/restore-overlay.sh. The overlay is deterministic and includes the social components/styles, validation helper/test and SQL migration. App route changes are applied by guarded, exact-anchor replacements.

## Database migration

source-overlay/supabase/migrations/20261126093000_qnr_social_network.sql

This migration has not been applied to the hosted project because the existing Naghsh Negar Supabase project is paused. Do not claim the social feed is live until the project is restored, the migration is applied, the storage bucket and policies are verified, and a real authenticated upload/read/like/comment flow passes.

## Remaining before production

- Activate the intended Supabase project and apply/verify migrations.
- Configure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in GitHub and Vercel.
- Add media transcoding, thumbnails and adaptive streaming for larger reels.
- Add creator profiles, block/mute controls, notifications and abuse-rate controls.
- Add payment provider credentials and verified webhook processing before enabling real charges.
- Perform browser, Android device, accessibility and security tests.
