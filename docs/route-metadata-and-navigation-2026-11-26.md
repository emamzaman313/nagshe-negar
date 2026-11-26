# Route metadata and internal navigation — 2026-11-26

OpenSEO JS-rendered audit 9d02a645-f2a0-4392-8306-72b8986fdb5e found 9 duplicate meta descriptions, /reels with no H1, /shop/parche with two H1 headings, and the static quilt studio page as an orphan. The route metadata layer now includes unique titles/descriptions for guide, learn, shop/parche, support, privacy, account, cart and notifications. Account, cart and notifications are marked noindex and canonical is removed.

The metadata layer adds a normal internal anchor to the existing main navigation for /quilt-studio-preview.html so the static page is discoverable from the app. It adds a visible H1 on /reels when missing and demotes additional H1 elements to H2 on /shop/parche while preserving their computed typography.

After merge, rerun JS-rendered audit and verify:
- duplicate meta-description warnings reduced;
- account/cart/notifications are non-indexable;
- /reels has exactly one H1;
- /shop/parche has exactly one H1;
- quilt-studio-preview is no longer an orphan.
This is client-side correction; SSR/prerender remains the longer-term crawl reliability improvement.
