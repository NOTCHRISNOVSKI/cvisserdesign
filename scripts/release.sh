#!/usr/bin/env bash
# Maakt een release volgens Semantic Versioning: ./scripts/release.sh <patch|minor|major>
set -euo pipefail

bump="${1:-}"
case "$bump" in patch|minor|major) ;; *) echo "Gebruik: $0 <patch|minor|major>" >&2; exit 1 ;; esac

[ "$(git branch --show-current)" = main ] || { echo "Release alleen vanaf main." >&2; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "Werkmap is niet schoon; commit eerst je wijzigingen." >&2; exit 1; }

git fetch --tags -q
last="$(git describe --tags --abbrev=0 --match 'v*' 2>/dev/null || echo v0.0.0)"
if [ "$last" != v0.0.0 ] && [ -z "$(git log "$last"..HEAD --oneline)" ]; then
  echo "Geen nieuwe commits sinds $last." >&2; exit 1
fi

IFS=. read -r major minor patch <<<"${last#v}"
case "$bump" in
  major) major=$((major + 1)); minor=0; patch=0 ;;
  minor) minor=$((minor + 1)); patch=0 ;;
  patch) patch=$((patch + 1)) ;;
esac
new="v$major.$minor.$patch"

if [ -f package.json ]; then
  npm version "${new#v}" --no-git-tag-version >/dev/null
  git add package.json package-lock.json 2>/dev/null || true
  git commit -q -m "Release $new" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
fi

git tag -a "$new" -m "Release $new"
git push origin main "$new"
gh release create "$new" --title "$new" --generate-notes
echo "Release $new gepubliceerd."
