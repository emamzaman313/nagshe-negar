#!/usr/bin/env bash
set -euo pipefail
cd "$PWD/.vercel-build/naqsh-negar"
npm run build
test -f dist/index.html
