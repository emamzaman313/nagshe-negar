# Quilt studio visual preview — 2026-11-26

## Thrixel asset
- Project: Naghsh Negar — 3D Quilt Studio
- Original model: 3a86d031-0515-4d58-a119-d558cc35e5ce, 8,300 triangles, 62 named mesh parts.
- Optimized derivative: 581907b4-56ee-4a6b-9fac-150881c0e529, 6,004 triangles across the same 62 parts.
- Full GLB download (WebP textures, 1024 px cap): https://api.thrixel.com/api/v1/581907b4-56ee-4a6b-9fac-150881c0e529/download?format=glb&textures=webp&draco=false&quality=full&texture_size=1024 — reported size 1.7 MB.
- Thrixel preview PNG copied into source-overlay/public/assets/quilt-blocks/eight-point-star-preview.png.

## Site deliverable
- Adds a standalone, Persian RTL, responsive editorial page at /quilt-studio-preview.html.
- Uses the real Thrixel preview image, brand palette, semantic headings, canonical and Open Graph metadata.
- Links to the existing /designer and /gallery routes.
- Adds the page to the sitemap and shared overlay list, so it is included in the Vercel web build and Capacitor public assets.
- This is a visual showcase/entry page, not an interactive 3D editor. The GLB itself is not yet embedded in the app; interactive per-patch recolouring remains a separate implementation step.

## SEO research (OpenSEO)
- Keyword research ran for three English seeds in the project's default US market (the API currently offers only en/es for that market; Persian fa is not available).
- Saved nine English keywords. Strongest relevant findings: quilt block patterns (5,400 monthly searches, KD 2), free quilt block patterns (1,300, KD 7), modern quilt patterns (4,400, KD 7), quilt patterns for beginners (4,400, KD 0), free quilt design software (320, KD 22). Values are US-market estimates and must not be presented as Persian search volumes.
- Content direction: a dedicated quilt-pattern library with individual pages for beginner blocks, star blocks, free printable patterns, and a transparent product page explaining the online designer.

## Verification
- PR CI and production checks are required before marking this page live.
- The page should return 200; the PNG should return image/png; inspect the mobile layout and verify the two CTAs navigate to the intended app routes.
