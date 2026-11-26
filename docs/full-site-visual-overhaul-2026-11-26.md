# Full-site visual overhaul — 2026-11-26

## Why this change exists
The prior visual pass mainly affected the social feed, moderation console, fabric stash and a standalone quilt-studio preview page. The live homepage still used the older restrained layout and the user correctly reported that the main site's graphics did not visibly change enough.

## Implementation
- Add `premium-overhaul.css` to the shared overlay and import it after `premium-foundation.css` so the existing React/Capacitor app receives the visual pass.
- Refresh the actual homepage hero, navigation, pathway cards, editorial cards, home note and page intros.
- Refresh designer, gallery, content/course, account, shop/cart, support and admin surfaces using existing class names. No React behavior, routes, authentication or database operations are changed.
- Improve mobile layouts and keep the established forest/jade/cream/gold/coral/lilac identity, Persian RTL and brand assets.
- Add tactile patchwork geometry, elevated cards, glass navigation, clear hierarchy and restrained hover/motion states.

## Scope and limitations
This is a CSS-only visual system pass against the class names in the deployed stylesheet. It does not create new functionality or turn the static quilt-studio preview into a 3D editor. Validate Vite build, Android Capacitor build, production route checks, and mobile viewport after staging.
