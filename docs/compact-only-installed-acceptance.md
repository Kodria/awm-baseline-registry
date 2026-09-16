# R1 installed acceptance (RF-2.5)

`tests/r16-compact-only-cli-acceptance.mjs` has three distinct evidence levels:

- Explicit prerelease source identity permits negative controls only. The genuine consumed registry is an exact stable tag served through a disposable HTTPS Git transport, with a locally trusted one-day certificate. CLI/currentness/sensor commands execute normally. A valid plan with CLI 9.7.1 against minimum 9.8.0, and any tested CLI against deliberately incompatible minimum 99.0.0, must block with `ADMISSION_REGISTRY_CLI_INCOMPATIBLE`, `registry:baseline`, actual/required versions, and zero dispatch. This is not released installed acceptance.
- `AWM_R16_INSTALLED_ACCEPTANCE=1` requires actual CLI 9.8.0 and an empirical certified npm 10.8.3 project-owned test sensor. It must admit the matched candidate tag, preserving the CLI-derived digest, with currentness `current` and sensors `pass`. `AWM_R16_OLD_CLI_BIN` must identify a separate unmodified published 9.7.1 installation: its existing public preflight must diagnose baseline's 9.8.0 minimum and block. Published 9.7.1 has no `plan admit`, so it is never falsely claimed to execute that new command. Both validation CI and the actual tag-producing job require this gate. Until that CLI release exists, the matched gate is BLOCKED, never simulated PASS.
- After the registry candidate is published, additionally set `AWM_R16_PUBLISHED_ACCEPTANCE=1` and `AWM_R16_RELEASE_TAG=vX.Y.Z`. This clones the genuine public registry remote, checks out the exact requested release tag, requires its commit to equal the candidate checkout, and repeats strict admission. A local fixture tag does not satisfy this publication gate. Run from the exact released registry checkout with the released CLI in a fresh process.

The runner never dispatches an agent, initializes a journal, changes the installed old CLI, or writes to the candidate checkout. It isolates HOME/AWM_HOME, registry configuration, fixture repositories, certificates and project files, then removes only its own temporary directory. Interactive admission intentionally does not claim unattended session custody or #148 migration completion.

Example public-release verification, only after publication:

```sh
AWM_R16_INSTALLED_ACCEPTANCE=1 \
AWM_R16_PUBLISHED_ACCEPTANCE=1 \
AWM_R16_RELEASE_TAG=vX.Y.Z \
AWM_R16_OLD_CLI_BIN=/absolute/path/to/separate/9.7.1/node_modules/.bin/awm \
node --test tests/r16-compact-only-cli-acceptance.mjs
```

Retain the bounded CLI/source/installed commit provenance and independent verdicts in the issue evidence. Do not retain disposable TLS private keys or source/prompt bodies.

## Source checkpoint (not publication)

On 2026-09-16 the missing installed-gate structural assertion produced actual RED, then the corrected contract/regression set passed 39 tests. Real compiled CLI source `fa52e6f3b04a68f159f2b6ff7d99c575fbcfc13d` (actual version 9.7.1, explicitly prerelease) passed all three R16 CLI tests, including genuine current-tag incompatible minimums 9.8.0/99.0.0 with named component diagnostics. The separate unmodified installed published CLI 9.7.1 also failed its public strict preflight's baseline 9.8.0 compatibility check. No dispatch occurred. Compatible installed/public-remote admission remains BLOCKED pending actual release, not included in those PASS claims.
