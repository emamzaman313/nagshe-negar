#!/usr/bin/env bash
set -euo pipefail

DEPLOY_ROOT="$PWD"
SOURCE_ROOT="$DEPLOY_ROOT"

if [[ ! -f "$SOURCE_ROOT/naqsh-negar-source.zip" ]]; then
  mkdir -p "$DEPLOY_ROOT/.vercel-source"
  curl --fail --location --silent --show-error \
    https://codeload.github.com/emamzaman313/nagshe-negar/zip/refs/heads/main \
    --output "$DEPLOY_ROOT/.vercel-source/repository.zip"
  unzip -q -o "$DEPLOY_ROOT/.vercel-source/repository.zip" -d "$DEPLOY_ROOT/.vercel-source"
  SOURCE_ROOT="$DEPLOY_ROOT/.vercel-source/nagshe-negar-main"
fi

(
  cd "$SOURCE_ROOT"
  bash scripts/restore-overlay.sh
)

mkdir -p "$DEPLOY_ROOT/.vercel-build"
unzip -q -o "$SOURCE_ROOT/naqsh-negar-source.zip" -d "$DEPLOY_ROOT/.vercel-build"
node "$SOURCE_ROOT/source-overlay/apply-overlay.mjs" "$DEPLOY_ROOT/.vercel-build/naqsh-negar"

cd "$DEPLOY_ROOT/.vercel-build/naqsh-negar"
npm ci
