# Naghsh Negar — Design system and product upgrade log

Updated: 2026-11-26

## Product guardrails
- Preserve the existing quilt/block designer, brand identity, and current user workflows.
- Persian-first copy and RTL layout across web and Capacitor Android.
- A feature is complete only when UI, server logic, database permissions, and end-to-end tests agree.
- Do not treat a hidden button as authorization. Supabase RLS and server-side role checks are authoritative.
- Do not claim marketplace payments or seller payouts are live until gateway webhooks, idempotency, refunds, and reconciliation are tested.

## Current design foundation
Design direction: premium craft studio — forest green, jade, warm cream, muted gold, coral and lilac accents; spacious layouts; clear hierarchy; restrained motion; strong focus states; dark mode.

| Token | Light | Dark |
|---|---|---|
| Background | #F7F5EF | #111C18 |
| Surface | #FFFDF8 | #192720 |
| Primary | #28634F | #75B89A |
| Secondary | #E5EEE7 | #25382E |
| Accent / Gold | #E6B85C | #D6AA57 |
| Coral | #C97562 | #E28A75 |
| Lilac | #8D9BC4 | #AAB7E3 |
| Foreground | #18352D | #E9F0E9 |

Typography: Vazirmatn for Persian UI. Controls: 44px default, 36px small, 48px large. Radius base: 1rem. Keyboard focus ring: 2px with 2px offset.

## Design tool artifacts
- Figma editable admin dashboard: https://www.figma.com/design/5yXin1gDXPG05rxie2rADX
- MagicPath moderation workflow canvas: project 476649359304441856
- DS Manager system: https://manager.shadcndesign.com/overview?system=9307c99e-ce0d-4a1e-8fcc-740637183d81
- The DS Manager system is version 3 and has not yet been published to the component registry. Publishing is a user action. The Figma Starter plan reached its MCP call limit during visual screenshot verification, so the dashboard is editable but its final screenshot comparison remains pending.

## Implemented admin moderation capabilities
- Distinct tabs for image posts, video reels, reports, and comments.
- Queue metrics for pending posts, pending reels, pending images, and open reports.
- Signed private-media previews for pending content and report-linked media.
- Approve, reject with reason, hide, review/dismiss report, and hide/restore comments via the admin moderation RPC.
- Admin-only Storage read policy for pending social media; pending content remains private.
- Audit actions are written to qnr_audit_log by the server-side moderation function.
- The public RPC is SECURITY INVOKER and delegates to a SECURITY DEFINER function in qnr_private, with an auth.uid() and admin-role check.

## Current delivery evidence
- Main branch commit: 7ce52e5e141e5505316e939d7a3f42253dba55c9
- Visual refinement PR #11 merged: https://github.com/emamzaman313/nagshe-negar/pull/11
- Android APK workflow run 45809585991 for the visual refinement branch: success (including npm build, Capacitor sync, Gradle APK build, and artifact upload).
- Vercel production deployment dpl_2b4tpXmReKwYnACEL3zy8u49unDq: READY, production, main, commit 7ce52e5.
- The production alias https://naghsh-negar.vercel.app now serves the new 89.90 kB CSS bundle containing the moderation visual-pass tokens, patchwork hero treatment, responsive cards, and reduced-motion styles.
- Supabase security advisor still reports Leaked Password Protection disabled. This is an outstanding Auth configuration item.
- The production site still needs a human visual walkthrough with a real administrator account to verify all moderation controls and private media previews in the browser.

## Next product opportunities (prioritized shortlist)
1. Creator studio with drafts, scheduled publishing, and post analytics.
2. Reels moderation with a dedicated queue, media preview, reasoned decisions, and audit history.
3. Copyright/music attribution and takedown workflow for user-uploaded videos.
4. Creator verification badges and a trusted-maker profile.
5. Quilting pattern version history with fork/remix attribution.
6. Collaborative quilt projects with invitations, roles, and shared block libraries.
7. Pattern-to-material calculator estimating fabric, dimensions, and waste.
8. Fabric stash inventory with color, yardage, storage location, and project reservation.
9. Marketplace seller onboarding with KYC-ready approval states and seller dashboard.
10. Product moderation, stock reservation, order fulfillment, and cancellation workflows.
11. Saved collections and Pinterest-style boards for patterns and inspiration.
12. Learning paths with progress, project submissions, and instructor feedback.
13. Community challenges, seasonal prompts, and judged showcases.
14. Real-time messaging with attachments, read receipts, and safety/report controls.
15. Admin service-health dashboard for Supabase, storage, email delivery, background jobs, and deployment status.

## Immediate backlog
1. Verify moderation RPC flows against a real admin account and a non-admin account.
2. Test signed URLs for pending image and video content, expiry, and unauthorized access.
3. Verify report-linked preview and all comment moderation actions.
4. Run E2E checks on mobile widths and the Android WebView.
5. Fix leaked-password protection in Supabase Auth.
6. Finish the full admin audit: users/roles, sellers/products, orders/refunds, notifications, settings, backup/restore.
7. Add the creator studio and collaborative quilt project workflows after the admin audit.


## 2026-11-26 — PR16 premium visual pass 3

- Branch: `design/premium-visual-pass-3`.
- Expanded the shared craft-studio foundation: deeper layered shadows, more consistent control sizing, better focus/empty/loading surfaces, responsive spacing and reduced-motion behavior.
- Social feed and reels: redesigned the hero as a textile-inspired editorial banner, sticky segmented navigation, richer composer, three-column desktop feed (two-column tablet, one-column mobile), tactile cards and improved dark mode.
- Admin moderation: refined hero, metrics, sticky tabs, card hierarchy and decision actions; kept all moderation RPC and private-media behavior unchanged.
- Fabric stash: textile-pattern swatches, more tactile inventory cards, stronger metric surfaces and responsive form treatment.
- These are CSS-only changes applied by the existing source overlay to both web and Capacitor builds. No database schema, RLS or Storage policy changes are required.
- Design system DS Manager advanced to version 5: radius 1rem, layered shadow ramp, 38/46/52px sm/default/lg controls, medium weight 550, focus ring offset 3px/strength 85%, and letter spacing -0.01em. Contrast audit: no failing pairs; muted foreground on muted is 5.15:1 light and 6.53:1 dark.
- DS Manager system remains unpublished pending the user's Publish action: https://manager.shadcndesign.com/overview?publish=9307c99e-ce0d-4a1e-8fcc-740637183d81
- Figma MCP Starter call limit was reached, so no Figma capture or editable screen changes could be completed in this pass. The existing file remains: https://www.figma.com/design/5yXin1gDXPG05rxie2rADX
- Product Design's full screenshot-based audit requires ChatGPT Work mode; this standard chat cannot execute that workflow.
- Webflow returned zero connected sites; no Webflow site was edited. Thrixel and GSA Per Diem are not relevant to this product's quilting UI.
