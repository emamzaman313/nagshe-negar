# Reels heading and discovery follow-up — 2026-11-26

OpenSEO JS audit c5d25327-c208-42eb-aca6-30141fc3e8b2 after PR20 confirms:
- account, cart and notifications are correctly noindex;
- route-specific meta descriptions are now unique (duplicate-meta-description warning is gone);
- quilt-studio-preview is no longer orphaned;
- /reels has two H1s because the React page renders its own heading after the overlay's fallback H1 was inserted; /reels remains orphaned because it has no inbound navigation link;
- three private-page descriptions are shorter than OpenSEO's 70-character recommendation.

This PR removes the synthetic H1 once the real React H1 appears, adds /reels to the main navigation and the static quilt studio page navigation, and expands the three private route descriptions while keeping noindex. Verify with a production JS-rendered crawl after deployment. Do not treat a Vercel-protected staging crawl as valid SEO evidence.
