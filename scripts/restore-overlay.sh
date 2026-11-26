#!/usr/bin/env bash
set -euo pipefail
tmp_file="$(mktemp)"
trap 'rm -f "$tmp_file"' EXIT
cat source-overlay-b64/part* | base64 --decode > "$tmp_file"
unzip -tq "$tmp_file"
unzip -q -o "$tmp_file" -d .
test -f source-overlay/apply-overlay.mjs
