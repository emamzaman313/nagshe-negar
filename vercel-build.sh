#!/usr/bin/env bash
set -euo pipefail
cd "$PWD/.vercel-build/naqsh-negar"
node --experimental-strip-types --test supabase/functions/_shared/music-validation.test.ts
npm run build
test -f dist/index.html
