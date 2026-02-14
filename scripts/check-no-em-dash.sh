#!/usr/bin/env bash
# Fail if em dash (U+2014) exists in tracked source/copy files.
# Excludes: node_modules, .git, lockfiles. Run from repo root.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
FOUND=0
while IFS= read -r f; do
  [ -z "$f" ] && continue
  [ -f "$f" ] || continue
  if grep -q '—' "$f" 2>/dev/null; then
    echo "Em dash found: $f"
    FOUND=1
  fi
done < <(git ls-files '*.tsx' '*.ts' '*.md' '*.mdx' '*.py' 2>/dev/null | grep -E '^(frontend/src|backend/app|backend/scripts|docs)/' | grep -v node_modules || true)
if [ "$FOUND" -eq 1 ]; then
  echo "Fail: remove em dashes (U+2014) from the listed files."
  exit 1
fi
echo "OK: no em dashes in tracked source/copy files."
exit 0
