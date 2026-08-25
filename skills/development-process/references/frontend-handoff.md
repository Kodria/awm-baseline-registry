# Frontend Handoff

For UI Design pending or `**Design artifacts:**`, verify both skills before routing:

```bash
MISSING=""
for skill in ui-design frontend-craft; do
  FOUND=""
  for d in "$HOME/.agents/skills/$skill" ".agents/skills/$skill" \
           "$HOME/.claude/skills/$skill" ".claude/skills/$skill"; do
    [ -d "$d" ] && FOUND="$d" && break
  done
  [ -z "$FOUND" ] && MISSING="$MISSING $skill"
done
[ -n "$MISSING" ] && echo "missing:$MISSING"
```

If either is absent, stop and instruct:

> This work needs the `frontend` bundle, which is not installed. Run `awm update && awm init` and select the frontend bundle for this project, then resume.

Do not improvise the phase without both skills.
