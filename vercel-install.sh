#!/usr/bin/env bash
set -euo pipefail

ROOT="$PWD"
ARCHIVE="$ROOT/naqsh-negar-source.zip"
if [[ ! -f "$ARCHIVE" ]]; then
  echo "Missing naqsh-negar-source.zip in deployment source" >&2
  exit 1
fi

rm -rf "$ROOT/.vercel-build"
mkdir -p "$ROOT/.vercel-build"
unzip -q "$ARCHIVE" -d "$ROOT/.vercel-build"
PROJECT="$ROOT/.vercel-build/naqsh-negar"
test -f "$PROJECT/package.json"
cd "$PROJECT"
npm ci
