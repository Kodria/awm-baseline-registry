# process context cards

Selective context retained from the reviewed legacy corpus.

<!-- awm-context:CTX-AGENTS-MD-002 -->
<!-- source: AGENTS.md:3-3 sha256:d2c73a3d058346313454535ee365dac50ad424a1a2df4fcb0ca9cff4b2eb07be -->
]`) es vulnerable a ReDoS — el motor reparte la misma racha entre ambos cuantificadores de `n` formas antes de descartar el match, cuadrático en el largo. Empíricamente: `^\s*<!--\s*NAME(?:\s*:\s*[^\r

<!-- awm-context:CTX-AGENTS-MD-003 -->
<!-- source: AGENTS.md:5-5 sha256:cb3f91d54eee30e53e35b2b99905f70f169ed549fd78909d3dac2defc9ed8d3b -->
]*?-->\s*$)`), que resolvió 1.000.000 de caracteres en 3ms con semántica idéntica. **Al escribir o revisar cualquier regex sobre texto de longitud no acotada** (líneas de markdown, comentarios, headers), buscar `\s*` u otro cuantificador tocando un grupo `[^X]*?`, y medir el tiempo de match contra una entrada larga SIN el delimitador de cierre antes de dar el parser por seguro.

## Patrones de documentación

- **verify-cmd-source-before-documenting:** al documentar un comando AWM (storage target, keywords, flags), verificar `cli/src/commands/<cmd>.ts` antes de escribir. La narrativa puede sobrevivir spec-review y code-quality-review sin que nadie chequee el código. *(`awm pin` documentado con keyword y storage location incorrectos, ambos pasaron dos rondas de review. Y en una guía nueva de ~140 líneas: CINCO errores distintos — un comando inventado (`awm registry status`, no existe), un `git init` faltante, un `git push origin` a un remote nunca configurado, un nombre de registry divergente de la sección anterior, y un paso de instalación de bundle nunca mencionado pese a ser necesario. Ninguno lo atrapó la revisión de la task que creó la guía: todos salieron en una QA que ejecutó los comandos reales contra un CLI aislado.)*

- **runbook-as-script:** para workstreams que combinan documentación + verificación manual, escribir el doc como hipótesis y ejecutarlo literalmente como test. Las divergencias se corrigen en el doc (no en el tool); el entregable es un doc verificado contra realidad. Escribir ejemplos de output de CLI sin verificar contra el binario real es la fuente de error más común en documentación de comandos.

- **corregir-la-cita-no-basta-si-la-creencia-vive-en-otro-lado:** cuando un reviewer encuentra que una afirmación es factualmente incorrecta (no un typo — una creencia equivocada sobre cómo funciona el sistema), el fix no es reescribir la línea citada: es grepear el documento completo por la creencia misma (palabras clave del concepto, no la cita exacta) y corregir cada lugar donde aparece, aunque nadie la haya señalado ahí. *(Un criterio de aceptación asumía que agregar un marker a un plan cambiaría la salida de `awm doctor --full` — falso, el adapter de producción solo lee evidencia ya capturada, nunca reparsea planes en vivo. El primer fix corrigió el criterio pero dejó intacta la MISMA afirmación 15 líneas antes, probable origen del error; un segundo reviewer la encontró.)* **Aplica a todo fix que responda a "esto está mal" en vez de "esto tiene un typo".**

## Release / publish

- **El release del CLI es automático en `main` — no hay paso manual de `npm publish`.** `.github/workflows/release.yml` (trigger `push` a `main`) buildea `cli/` y corre `cli/src/release/index.js`: bump por conventional commits + `npm publish` vía OIDC Trusted Publisher + commit de bump con `[skip ci]`. **Antes de decir "publicá a mano" o de proponer un workflow de release paralelo, verificá que `release.yml` ya lo cubre.** El nivel de versión sale del prefijo de conventional commit del merge; regla no-negociable en `CONSTITUTION.md` → "Release del CLI".

- **El commit de bump lleva `[skip ci]`, así que `ci.yml` NUNCA corre contra el árbol con la versión ya bumpeada.** Consecuencia: un test que afirme algo sobre la versión publicada (o sobre cualquier archivo que el release reescriba) queda sin cobertura real hasta el PR siguiente, que llega roto por algo que no hizo. *(Un test estructural fijaba la mayor del CLI en `8` con un literal; el release a `9.0.0` lo dejó rojo en `main` sin que nadie lo viera, y explotó en el primer PR posterior, ajeno al cambio.)* **Al escribir un test sobre metadata que el release muta, afirmar la invariante (que `package.json`, `package-lock.json` y su entrada root coincidan), nunca un valor literal que el próximo bump invalida.**

## Auto-verificación del CLI (dogfooding)

- **`awm` en el PATH puede ser una instalación global publicada, desconectada del working tree que estás editando.** El binario que resuelve `which awm` suele venir de `npm i -g agentic-workflow-manager` con una versión anterior — no del código que acabás de cambiar. Correr `awm sensors run` contra ese binario prueba una versión vieja: un bug ya arreglado localmente puede seguir viéndose roto. **Al auto-verificar este CLI durante su propio desarrollo, siempre `npm run build && node dist/src/index.js <comando>` desde `cli/` — nunca `awm` bare del PATH.**

## Subagentes concurrentes y git

- **Antes de la primera task de un plan multi-repo, verificar `git branch --show-current` contra la rama designada en CADA repo** — no asumir que el checkout está bien solo porque otro repo del mismo plan sí lo está. *(Con 3 repos designados a la misma rama, las Tasks 1-4 del repo de contenido se commitearon enteras sobre `main` local; el repo de CLI sí estaba correcto desde el arranque, lo que generó falsa confianza. Salió a la luz por el stop-hook a mitad de la Task 4, obligando a cirugía: renombrar la rama vieja como backup, recrear la designada desde `origin/main`, cherry-pick de 8 commits, resetear `main` local.)* **El primer comando antes de despachar la primera task de CADA repo es `git branch --show-current`, comparado explícitamente contra la esperada — un chequeo por repo, no uno por sesión.** Además, `.awm/ledger/<branch>.jsonl` está indexado por el NOMBRE de la rama en disco al momento de cada `awm ledger add`: mientras el repo estuvo en `main` por error, todos los hallazgos quedaron en `.awm/ledger/main.jsonl`, invisibles para `awm ledger list`/`recurring`. Un `harness-retro` posterior debe leer AMBOS archivos si hubo corrección de rama a mitad de sesión.

- **Nunca despachar subagentes con acceso a Bash en paralelo sobre el mismo working tree si alguno puede correr `git checkout <ref> -- <path>`** (u otro comando que mute índice/working tree) para "mirar una versión vieja". *(Confirmado: varios subagentes de QA en paralelo sobre el mismo checkout; uno ejecutó `git checkout <commit-base> -- .` y su restore quedó incompleto por carrera con los `git diff` de sus hermanos. Varios archivos revertidos a una versión anterior a tareas ya completadas, silencioso hasta un `git status` de rutina. El historial nunca se corrompió — el daño fue de working tree + índice.)*
  - **Para inspeccionar contenido histórico sin tocar el working tree, usar `git show <ref>:<path>` (lee, no muta)** en vez de `git checkout <ref> -- <path>` (muta). Responde la misma pregunta sin riesgo de dejar el árbol en un estado intermedio.
  - **Si un subagente necesita comparar "antes vs. después" de forma más elaborada que un diff** (ej. correr el binario contra ambas versiones), aislarlo en un worktree separado (`git worktree add`), nunca mutar el checkout compartido.
  - **El controlador debe verificar `git status --short` después de cualquier ronda de subagentes paralelos con acceso a Bash**, antes de confiar en sus reportes. Este chequeo fue lo único que detectó la corrupción; nada en los reportes la mencionaba.
  - **`git commit --amend --reset-author` resetea `AuthorDate` Y `CommitDate` al momento del amend — no solo la identidad.** Un `git rebase --exec` sobre varios commits sin firmar colapsó sus timestamps reales a segundos de diferencia. Un lens de QA posterior, razonando sobre esos timestamps corrompidos, concluyó erróneamente que pasos que tardan tiempo real (sleeps de sonda, ciclos RED/GREEN) nunca ocurrieron — falso positivo con causa raíz identificable. **Si el timing importa para auditoría, revisar el `AuthorDate` real (`git log --format='%ad' --date=iso-strict`) antes de tomar timestamps como prueba, y preferir firmar en el commit original en vez de un rebase masivo posterior.**

## Ledger y trazabilidad

- **`awm ledger add` puede correr dos veces para el mismo hallazgo — leer `awm ledger list` completo, no confiar en el conteo de `awm ledger recurring` a ciegas.** *(≥4 veces en un solo release: entradas con `phase`+`signature`+`desc` byte-idénticos y timestamps a milisegundos, más entradas de prueba que algún subagente dejó al verificar que `awm` respondía.)* El riesgo: `recurring --min 2` cuenta duplicados exactos como 2 ocurrencias reales, empujando de forma espuria un hallazgo trivial a "sistémico" en el triage desatendido de `harness-retro`. Reconciliar contra el contenido real, no contra el resumen en prosa de cada subagente.

- **Depurar contra evidencia real (logs de CI, stack traces) sin invocar `systematic-debugging` deja el ledger vacío aunque haya hallazgos reales — y un ledger vacío con hallazgos reales es en sí mismo el hallazgo de retro.** *(Un ciclo de varias rondas de fixes contra CI real de `windows-latest` (~137 fallos → 0, incluida una reversión arquitectónica) produjo CERO entradas, porque el trabajo se hizo leyendo logs y parcheando directamente. `harness-retro` detectó el vacío contra la evidencia de la sesión y reconstruyó el registro post-hoc.)* **Al confirmar una causa raíz depurando directamente, emitir el `awm ledger add --phase debugging --polarity finding ...` igual** — el skill formaliza el paso, pero la obligación de loguear no depende de invocarlo.

## Layout del repo y de la instalación

- **Este repo** contiene solo el CLI TypeScript (`cli/`). El contenido (skills, bundles, sensor-packs, hooks) vive en repos externos: `awm-baseline-registry` y `awm-documentation-registry`.
- **No hay `registry/` en este repo** ni `~/.awm/cli-source/`. El concepto `cli-source` fue eliminado.
- **Layout de instalación:** `~/.awm/registries/<name>/` — cada registry configurado se clona ahí. Los skills se instalan como symlinks hacia esos paths.
- **Descubrimiento de contenido:** `contentRoots()` devuelve los paths bajo `~/.awm/registries/` según la config. No hay constante fija de `baseRoot` ni de `cliSource`.


<!-- awm-context:CTX-AGENTS-MD-004 -->
<!-- source: AGENTS.md:7-7 sha256:284f222620d9a40839140ec29936ca9b34e7ce65c07e19cc09bc7bafe897d66e -->


<!-- awm-context:CTX-AGENTS-MD-005 -->
<!-- source: AGENTS.md:9-9 sha256:5bb67045dc8bd6a083459edf455d6235aa1f876be55282ca40b793cb38f1be77 -->


<!-- awm-context:CTX-AGENTS-MD-006 -->
<!-- source: AGENTS.md:11-11 sha256:b1980adb0a9bc09de7102fca3f3a1b1ad798242d47d8ccb67da8683befa06738 -->


<!-- awm-context:CTX-AGENTS-MD-007 -->
<!-- source: AGENTS.md:13-13 sha256:452c105b123e37cd24be8f28d1c9fec42cfaa4420c7a7d01ac841ccd9dd31f3e -->


<!-- awm-context:CTX-AGENTS-MD-008 -->
<!-- source: AGENTS.md:15-15 sha256:ed51256aaa0df8f09f8686d69e35b84c28625f8052102cc9dc0521de6b7ad36a -->


<!-- awm-context:CTX-AGENTS-MD-009 -->
<!-- source: AGENTS.md:17-17 sha256:2c4deebee0c9cb0ccf0254f8f6ab0967e7469de0a4a01e7e0736e6eeee3ec92a -->


<!-- awm-context:CTX-AGENTS-MD-010 -->
<!-- source: AGENTS.md:19-19 sha256:1ceb6fa18d32e8bf71672288513fb5311fbc3f7cca7184c77cb82dc7cfbca464 -->


<!-- awm-context:CTX-AGENTS-MD-011 -->
<!-- source: AGENTS.md:21-21 sha256:6e4bb01a73c2520ea57100ce0d314903070b57528f5b515ef67c3910dfb664e6 -->


<!-- awm-context:CTX-AGENTS-MD-012 -->
<!-- source: AGENTS.md:23-23 sha256:4b16a108987ad8a6ae4cf23c253abee84c0292717e5324ed9aec7320b2f38600 -->


<!-- awm-context:CTX-AGENTS-MD-013 -->
<!-- source: AGENTS.md:25-25 sha256:04efe3e72367f20130cbbf8dd1a3e4f3b9cd0c77bc12ad33dab1c3dc47f3189e -->


<!-- awm-context:CTX-AGENTS-MD-014 -->
<!-- source: AGENTS.md:27-27 sha256:495397981ac758a60b92f81915ccbd2c1357ff7e3cada060abd0d1e9aec67408 -->


<!-- awm-context:CTX-AGENTS-MD-015 -->
<!-- source: AGENTS.md:29-34 sha256:f5b03db2d28ae7d74cdeadaa4121e573d31353a67b6e924d736a0510eb630147 -->


<!-- awm-context:CTX-AGENTS-MD-016 -->
<!-- source: AGENTS.md:36-36 sha256:1399b80f46c14217dccef1c410dbf3dbaf40d37cc7d6ab2f983f8be0cfe096a6 -->


<!-- awm-context:CTX-AGENTS-MD-017 -->
<!-- source: AGENTS.md:38-38 sha256:26f163ee383870e5afdb2bf91243524631fe14318d9b58313a0d9977d9733548 -->


<!-- awm-context:CTX-AGENTS-MD-018 -->
<!-- source: AGENTS.md:40-40 sha256:7a4b983029e30ca3f8040bbc7f294a9cbb1d2c13c2fcebfbbf29dc49e7f60efb -->


<!-- awm-context:CTX-AGENTS-MD-019 -->
<!-- source: AGENTS.md:42-42 sha256:6db2dc445576d3bfe3cff449f38ddba0a6f734988e669a141a1969167afebbc0 -->


<!-- awm-context:CTX-AGENTS-MD-020 -->
<!-- source: AGENTS.md:44-44 sha256:4b6e3f529b9dc6e030aaa1cc9d35da3fd2c5a7832123579757b22a5c0cb6192a -->


<!-- awm-context:CTX-AGENTS-MD-021 -->
<!-- source: AGENTS.md:46-46 sha256:74450d986af2198e89597ce65e67131459e7271ea429d0417e5ce9acf824488f -->


<!-- awm-context:CTX-AGENTS-MD-022 -->
<!-- source: AGENTS.md:48-48 sha256:3fa95c62fa1e7da49ea10fe51c64465a11e8f4cb42318764415e371e1bd05b21 -->


<!-- awm-context:CTX-AGENTS-MD-023 -->
<!-- source: AGENTS.md:50-50 sha256:e93e24d1daec4374005ae43d47ab61f4669dc9382036db4445863279da6c43b4 -->


<!-- awm-context:CTX-AGENTS-MD-024 -->
<!-- source: AGENTS.md:52-52 sha256:97bbe866348596c17139daaf63a4c6bdf3b3d2bda49ea0ed178187e148759539 -->


<!-- awm-context:CTX-AGENTS-MD-025 -->
<!-- source: AGENTS.md:54-54 sha256:4e6577fbc9627b846b1531e4cdef5f74c0630316f6999f13351bf7812c065af0 -->


<!-- awm-context:CTX-AGENTS-MD-026 -->
<!-- source: AGENTS.md:56-56 sha256:6b45f96577a1356cb86fadd3eea52f38703bf3cb6f0a0285e22255d990388977 -->


<!-- awm-context:CTX-AGENTS-MD-027 -->
<!-- source: AGENTS.md:58-58 sha256:95d3311008f8e7a67ae81169d7c847d179c5bd97391a3a6c297b2681eda4d069 -->


<!-- awm-context:CTX-AGENTS-MD-028 -->
<!-- source: AGENTS.md:60-60 sha256:7e16f3072c9a4eb72d8ec31cd518b3a0cd424e6eabd8374ef5b95755a9d6067f -->


<!-- awm-context:CTX-AGENTS-MD-029 -->
<!-- source: AGENTS.md:62-64 sha256:09f0c1df4030f5e8bef676fae4b21462979e68d46c701de6aa0e08f3d1982d93 -->


<!-- awm-context:CTX-AGENTS-MD-030 -->
<!-- source: AGENTS.md:66-66 sha256:57efd27b3b95e732daa79782a787aa8ce231940182619115652b76f7dcefe2c8 -->


<!-- awm-context:CTX-AGENTS-MD-031 -->
<!-- source: AGENTS.md:68-71 sha256:d499212caea56cd455300fec78e061b28ac6684f5a01b41f1823fa61776483fe -->


<!-- awm-context:CTX-AGENTS-MD-032 -->
<!-- source: AGENTS.md:73-73 sha256:a0503785a13621de69ae64537637215925ba06f6d0ae2088154e92c58a0f1e70 -->


<!-- awm-context:CTX-AGENTS-MD-033 -->
<!-- source: AGENTS.md:75-75 sha256:d318b8ac28945f2a6317d3884ea5c70046d838628de8fa3e69092169605f5fa1 -->


<!-- awm-context:CTX-AGENTS-MD-034 -->
<!-- source: AGENTS.md:77-77 sha256:18027c3b457486e45470a53abadfd1779e2bc791cce090a0fe2bb93052768b5c -->


<!-- awm-context:CTX-AGENTS-MD-035 -->
<!-- source: AGENTS.md:79-79 sha256:c8c74a68cc717225c70a69b5a423dfbad32e1dcb6cb215232bc47259518feb03 -->


<!-- awm-context:CTX-AGENTS-MD-036 -->
<!-- source: AGENTS.md:81-81 sha256:7092061fbc7accf8d67fc276f8c570c777ca8341f19cdcfd02517870458fe095 -->


<!-- awm-context:CTX-AGENTS-MD-037 -->
<!-- source: AGENTS.md:83-83 sha256:0d8a79e0834bef5075166bc51cb30c95fa56c5d3206be068b54b6b310591f8f5 -->


<!-- awm-context:CTX-AGENTS-MD-038 -->
<!-- source: AGENTS.md:85-85 sha256:e0a36a17ec7ff4a5b1ecc3455d483f543c4a20d56b6c2d104491c746e044429b -->


<!-- awm-context:CTX-AGENTS-MD-039 -->
<!-- source: AGENTS.md:87-87 sha256:9e1ae05cf6a0fbf65e9b905c50a40282c89a45f26423584b063cca58849ee958 -->


<!-- awm-context:CTX-AGENTS-MD-040 -->
<!-- source: AGENTS.md:89-89 sha256:4d2c30811698b9de31daff50c299f28efe9875046bca9b8784418fe61dd33670 -->


<!-- awm-context:CTX-AGENTS-MD-041 -->
<!-- source: AGENTS.md:91-91 sha256:4a5ac5f772500e535ec224333a5d3ebe0835d46b2fc36a086ff52527285551e2 -->


<!-- awm-context:CTX-AGENTS-MD-042 -->
<!-- source: AGENTS.md:93-93 sha256:73f52f9feba6598b74fc83fa9a171de1fea6154a3627dd69a7a6ecd2f7137437 -->


<!-- awm-context:CTX-AGENTS-MD-043 -->
<!-- source: AGENTS.md:95-95 sha256:f93784ae4a5158ede5d2b18d90db9866057de7962fd822c817c06d8c7fe9e0ef -->


<!-- awm-context:CTX-AGENTS-MD-044 -->
<!-- source: AGENTS.md:97-97 sha256:989d3817600cb82413fea3c6707fab7b255374a9732be6bcc68bfb6526f36d9f -->


<!-- awm-context:CTX-AGENTS-MD-045 -->
<!-- source: AGENTS.md:99-99 sha256:c6564d6b4095270aee017452cd1b79d9dd305c474093c2e270da7ab3a6246499 -->


<!-- awm-context:CTX-AGENTS-MD-046 -->
<!-- source: AGENTS.md:101-101 sha256:4d325f99c0fc45652b5aaf23f73f7b809a2499fb43d77b23ca502ce86db90930 -->


<!-- awm-context:CTX-AGENTS-MD-047 -->
<!-- source: AGENTS.md:103-103 sha256:bb3bf04940d5cea934d481109470da20fd419159825bed8ab5a53c16292fd80e -->


<!-- awm-context:CTX-AGENTS-MD-048 -->
<!-- source: AGENTS.md:105-105 sha256:e338342913c58653a830735af8dde8d595a63fc6e26551a8d63c4cd150c23ecd -->


<!-- awm-context:CTX-AGENTS-MD-049 -->
<!-- source: AGENTS.md:107-107 sha256:471f0d29824591d0a51024fa6531bfe5f8d8de2a7205879badd1b76c490745e0 -->


<!-- awm-context:CTX-AGENTS-MD-050 -->
<!-- source: AGENTS.md:109-109 sha256:68bc0fdedab1d2c8a6aecc20ff7cbeded04ea763beb63e4c73bca1979ff406bc -->


<!-- awm-context:CTX-AGENTS-MD-051 -->
<!-- source: AGENTS.md:111-111 sha256:276cb830a00bff595863197f7958bc81e3332a7d14dd1fc5b895616fa77cb4de -->


<!-- awm-context:CTX-AGENTS-MD-052 -->
<!-- source: AGENTS.md:113-113 sha256:6b91962d4e658659263bf7bf4207243f34e5fa1c7ca9a311451b747391be76ff -->


<!-- awm-context:CTX-AGENTS-MD-053 -->
<!-- source: AGENTS.md:115-115 sha256:23849630874c02bd2b7d325da7d1d0cd2496df6e42841e4e23e0dd451757cc84 -->


<!-- awm-context:CTX-AGENTS-MD-054 -->
<!-- source: AGENTS.md:117-121 sha256:4ec918f8055a83a56e136da28fe4f460b53efa91a77d407e54e201e3413751f4 -->


<!-- awm-context:CTX-AGENTS-MD-055 -->
<!-- source: AGENTS.md:123-123 sha256:a56a0cbe3628cac4066f6c399443f78026a75ffac6aeaa841df15a5a24009db7 -->


<!-- awm-context:CTX-AGENTS-MD-056 -->
<!-- source: AGENTS.md:125-125 sha256:fc73da092263228079cd495e6c918b1a222890eeafcbe31a87f94bb487286033 -->


<!-- awm-context:CTX-AGENTS-MD-057 -->
<!-- source: AGENTS.md:127-127 sha256:09e13a6f35c6562642ae3bdd083cdee0346720fc1940b439aa5bd50d1cfe5ad4 -->


<!-- awm-context:CTX-AGENTS-MD-058 -->
<!-- source: AGENTS.md:129-129 sha256:d07a6d428d08ef6bb779e14328a1a242b9e886793b80effea5ce39911b478119 -->


<!-- awm-context:CTX-AGENTS-MD-059 -->
<!-- source: AGENTS.md:131-134 sha256:71f5113f74614c349c26ed3a4d7a363ee840f2bcb6f463c6b85c6f52f4b0c5da -->


<!-- awm-context:CTX-CONSTITUTION-MD-002 -->
<!-- source: CONSTITUTION.md:3-3 sha256:5d884ff62a7b13bc41b53ed8acf65167b7f9b02c96f87b2e4e89c33fc5eda50d -->


<!-- awm-context:CTX-CONSTITUTION-MD-007 -->
<!-- source: CONSTITUTION.md:13-15 sha256:53f0571e64b9c8cc7801f52ac6ea5f4694152fcb50019b858762c615294a0a0d -->


<!-- awm-context:CTX-CONSTITUTION-MD-012 -->
<!-- source: CONSTITUTION.md:25-25 sha256:cacd8ed447557266a54e850aa90d4de325a7a09b2076cad7c8b610ae470edf82 -->


<!-- awm-context:CTX-CONSTITUTION-MD-017 -->
<!-- source: CONSTITUTION.md:35-35 sha256:282d7d3f957159d025a425ec28bfd9914a71be7e469288a06d0a27484446c2a9 -->


<!-- awm-context:CTX-CONSTITUTION-MD-022 -->
<!-- source: CONSTITUTION.md:45-45 sha256:251ee63dfd04d126fe7367fc55b03f1bc04f5ee1d5d6569de91f101a3c12e8e1 -->


<!-- awm-context:CTX-CONSTITUTION-MD-027 -->
<!-- source: CONSTITUTION.md:61-61 sha256:092ffddfd56f7ca51dae1a04499f555e1a1e93a2ebf184c1fb02572a35483da4 -->


<!-- awm-context:CTX-CONSTITUTION-MD-032 -->
<!-- source: CONSTITUTION.md:78-78 sha256:100607092864e785efbe1d34d7a4e92589d95b54ed9b7087742af92d58c3e429 -->


<!-- awm-context:CTX-CONSTITUTION-MD-037 -->
<!-- source: CONSTITUTION.md:88-88 sha256:96d60a7a63e9f8ae9121aa3ab742c52def47eefc85986b54b2ffda6b04b80427 -->


<!-- awm-context:CTX-CONSTITUTION-MD-042 -->
<!-- source: CONSTITUTION.md:98-98 sha256:7331361964c02df93c9b7406f601a72fbd40b35dba6837500ee512bcc3fcdbee -->


<!-- awm-context:CTX-CONSTITUTION-MD-047 -->
<!-- source: CONSTITUTION.md:108-108 sha256:ab5a74f22f9c39d8e72559edf4e142fdd201e12d3cb500368ef283a064cb3b5e -->
