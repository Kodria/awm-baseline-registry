#!/usr/bin/env bash
# Fails if any skills/*/SKILL.md changed content vs BASE without also bumping
# its frontmatter `version` field. Cures the "version bump forgotten in the
# same batch as a content edit" pattern (CONSTITUTION.md, "Release de
# contenido"), which recurred repeatedly in this repo's history even with
# that rule already written in prose.
set -euo pipefail

BASE="${1:-origin/main}"
TARGET="${2:-HEAD}"

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
mapfile -t changed_skills < <(git diff --name-only "$BASE" "$TARGET" -- 'skills/*/SKILL.md' || true)

fail=0
for f in "${changed_skills[@]}"; do
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

# A skill's frontmatter version is only half of the delivery contract. The
# bundle containing it is what `awm list` exposes, and its duplicated version
# in catalog.json must advance in the same change. Work out affected bundles
# from their live manifests rather than maintaining a second hard-coded map.
if [ "${#changed_skills[@]}" -gt 0 ]; then
  mapfile -t affected_bundles < <(node --input-type=module - "${changed_skills[@]}" <<'NODE'
import fs from 'node:fs';
import path from 'node:path';

const changed = new Set(process.argv.slice(2).map(file => path.basename(path.dirname(file))));
for (const entry of fs.readdirSync('bundles', { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const manifest = JSON.parse(fs.readFileSync(path.join('bundles', entry.name, 'bundle.json'), 'utf8'));
  const names = manifest.skills.map(skill => typeof skill === 'string' ? skill : skill.name);
  if (names.some(name => changed.has(name))) console.log(entry.name);
}
NODE
)

  for bundle in "${affected_bundles[@]}"; do
    bundle_path="bundles/$bundle/bundle.json"
    old_bundle_version=$(git show "$BASE:$bundle_path" 2>/dev/null | node -e '
      let text = ""; process.stdin.on("data", chunk => text += chunk); process.stdin.on("end", () => {
        try { console.log(JSON.parse(text).version ?? "MISSING-VERSION"); } catch { console.log("MISSING-VERSION"); }
      });' || echo "MISSING-VERSION")
    new_bundle_version=$(node -e "console.log(JSON.parse(require('node:fs').readFileSync('$bundle_path', 'utf8')).version ?? 'MISSING-VERSION')")
    catalog_version=$(node -e "const c=JSON.parse(require('node:fs').readFileSync('catalog.json','utf8')); console.log(c.bundles.find(b=>b.name==='$bundle')?.version ?? 'MISSING-VERSION')")

    if [ "$new_bundle_version" = "MISSING-VERSION" ] || [ "$catalog_version" = "MISSING-VERSION" ]; then
      echo "FAIL: $bundle must declare its version in both $bundle_path and catalog.json."
      fail=1
    elif [ "$new_bundle_version" != "$catalog_version" ]; then
      echo "FAIL: $bundle version differs: $bundle_path=$new_bundle_version, catalog.json=$catalog_version."
      fail=1
    elif [ "$old_bundle_version" = "$new_bundle_version" ]; then
      echo "FAIL: skills in $bundle changed but its bundle version did not advance ($new_bundle_version)."
      fail=1
    fi
  done
fi

if [ "$fail" -eq 1 ]; then
  echo ""
  echo "Every edited SKILL.md and each affected bundle/catalog version must advance in the same batch — see CONSTITUTION.md, 'Release de contenido'."
  exit 1
fi

echo "OK: every edited SKILL.md and affected bundle/catalog version advanced."
