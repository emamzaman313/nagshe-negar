#!/usr/bin/env bash
set -euo pipefail

ROOT="$PWD"
ARCHIVE="$ROOT/naqsh-negar-source.zip"
OVERLAY="$ROOT/source-overlay"
BUILD_ROOT="$ROOT/.vercel-build"
PROJECT="$BUILD_ROOT/naqsh-negar"

if [[ ! -s "$ARCHIVE" ]]; then
  echo "Missing or empty naqsh-negar-source.zip in deployment source" >&2
  exit 1
fi
if [[ ! -f "$OVERLAY/apply-overlay.mjs" ]]; then
  echo "Missing source-overlay/apply-overlay.mjs; refusing to build an incomplete site" >&2
  exit 1
fi

unzip -tq "$ARCHIVE"
rm -rf "$BUILD_ROOT"
mkdir -p "$BUILD_ROOT"
unzip -q "$ARCHIVE" -d "$BUILD_ROOT"
test -f "$PROJECT/package.json"

# Apply the checked-in plain-text overlay directly. Do not use the legacy
# source-overlay-b64 shards: those shards are malformed and caused the 404.
node "$OVERLAY/apply-overlay.mjs" "$PROJECT"

test -f "$PROJECT/src/app/SocialPage.tsx"
test -f "$PROJECT/src/app/social.css"
test -f "$PROJECT/supabase/migrations/20261126093000_qnr_social_network.sql"

cd "$PROJECT"
npm ci
