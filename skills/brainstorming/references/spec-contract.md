# Design Specification Contract

Write `docs/plans/YYYY-MM-DD-<topic>-design.md` unless the user chooses another
location. For multi-file or risky work, open with concise, stable-ID EARS
requirements; trivial one-file changes use a one-line intent instead. Do not leave
open ambiguity before design sections.

Use EARS templates and prioritize `IF <trigger>, THEN THE <system> SHALL
<response>` for unwanted behavior: it specifies edge cases, invalid inputs, and
error paths early. Give every requirement a stable ID and make each one 1:1 testable.

Self-review after writing and fix inline:

1. **Placeholder scan:** no TBD, TODO, incomplete section, or vague requirement.
2. **Internal consistency:** no contradictory sections; architecture matches features.
3. **Scope check:** focused for one plan or explicitly decomposed.
4. **Ambiguity check:** every plausible interpretation is made explicit.
5. **EARS/ID check:** every requirement is EARS, testable, and has a stable ID.

Ask for explicit user approval after the review. If changes are requested, revise and re-review; do not proceed to implementation or planning until approved.
