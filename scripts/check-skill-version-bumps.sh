#!/usr/bin/env bash
# Fails if any skills/*/SKILL.md changed content vs BASE without also bumping
# its frontmatter `version` field. Cures the "version bump forgotten in the
# same batch as a content edit" pattern (CONSTITUTION.md, "Release de
# contenido"), which recurred repeatedly in this repo's history even with
# that rule already written in prose.
set -euo pipefail

BASE="${1:-origin/main}"

changed_skills=$(git diff --name-only "$BASE"...HEAD -- 'skills/*/SKILL.md' || true)

fail=0
for f in $changed_skills; do
  # Deleted files (e.g. a retired skill) aren't this check's concern.
  [ -f "$f" ] || continue

  old_version=$(git show "$BASE:$f" 2>/dev/null | grep -m1 '^version:' || echo "NEW-FILE")
  new_version=$(grep -m1 '^version:' "$f" || echo "MISSING-VERSION")

  if [ "$new_version" = "MISSING-VERSION" ]; then
    echo "FAIL: $f has no 'version:' frontmatter field."
    fail=1
  elif [ "$old_version" = "$new_version" ]; then
    echo "FAIL: $f changed but its frontmatter version is unchanged ($new_version)."
    fail=1
  fi
done

if [ "$fail" -eq 1 ]; then
  echo ""
  echo "Every SKILL.md edited in this diff must bump its frontmatter 'version' in the same batch — see CONSTITUTION.md, 'Release de contenido'."
  exit 1
fi

echo "OK: every edited SKILL.md bumped its version."
