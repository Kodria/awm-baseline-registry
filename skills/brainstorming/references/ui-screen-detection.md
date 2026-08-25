# UI Screen Detection

Apply this only when all signals hold: direct interaction, new screens or significant
layout, and enough visual complexity. After design approval, ask whether to use UI
design. If accepted, add exactly:

```markdown
## UI Screens

| Screen | Description | Device | Status |
|--------|-------------|--------|--------|
| [name] | [description] | [MOBILE/DESKTOP/TABLET] | pending |
```

If the user skips or no screens qualify, omit the section and route to
`writing-plans`. Route to `ui-design` only when the table has at least one row where `Status` is exactly `pending` (lowercase).
