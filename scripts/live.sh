#!/usr/bin/env bash
# Zet de huidige bouw live: bouwt naar build/ en kopieert die naar dist/ (de map die de webserver serveert).
set -euo pipefail

cd "$(dirname "$0")/.."
npm run build
[ -f build/index.html ] || { echo "build/index.html ontbreekt, geen live-zetting." >&2; exit 1; }

mkdir -p dist
find dist -mindepth 1 -delete
cp -r build/. dist/
echo "Live gezet: $(git describe --tags --always 2>/dev/null || echo onbekende versie)"
