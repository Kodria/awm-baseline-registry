#!/usr/bin/env bash
# Fails if any skills/*/SKILL.md changed content vs BASE without also bumping
# its frontmatter `version` field. Cures the "version bump forgotten in the
# same batch as a content edit" pattern (CONSTITUTION.md, "Release de
# contenido"), which recurred repeatedly in this repo's history even with
# that rule already written in prose.
set -euo pipefail

BASE="${1:-origin/main}"

# Tip-to-tip (2-dot), not merge-base (3-dot): on a long-lived branch that gets
# squash-merged into BASE more than once without ever rebasing (this repo's
# multi-release pattern — R1/R2/R3... all landing from the same branch), the
# merge-base stays pinned to wherever the branch first forked, long before
# later merges advanced BASE. A 3-dot diff against that stale merge-base
# re-reports every already-merged, already-released SKILL.md as "changed
# but not bumped" even when it is byte-identical to BASE right now. 2-dot
# answers the question this check actually needs — "does this file differ
# from what's on BASE at this instant" — and degrades to the same result as
# 3-dot in the normal fresh-branch case where BASE hasn't moved.
changed_skills=$(git diff --name-only "$BASE" HEAD -- 'skills/*/SKILL.md' || true)

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
