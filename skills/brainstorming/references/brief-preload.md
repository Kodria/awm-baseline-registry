# Brief Preload

Use Brief Preload only for an `awm: product-brief` with `mode: brief`; do not
preload discovery, assessment, or extraction artifacts. Re-run `readiness-gate`:
`ready` enters preload; `draft` reports its gaps and treats it as notes unless the
user insists, in which case every reported gap remains unanswered.

Map the brief before questions:

| Brief section | Feeds into |
|---|---|
| `N#` business needs/cases | Context and purpose |
| `RF-x.y` / `RNF-x.y` | `## Requirements` in EARS, retaining IDs |
| Out of scope | Non-goals |
| Open `DA-#` decisions | First clarifying questions |

Before asking any clarifying question, check whether the brief answers it. Record
the answer and its brief ID; do NOT ask it again. Preload changes starting material,
not obligations: it never exempts technical validation, design approval, or spec self-review.
If no eligible brief is available, report the limitation and use normal
clarification.
