// AWM ESLint config — extiende la configuración del proyecto con reglas cuyos
// mensajes son legibles para un LLM (flat config, ESLint v9+).
// Uso: npx eslint . --config eslint.config.awm.mjs --format json
//
// `awm sensors init` copia este archivo a la raíz del proyecto, así que la
// configuración del proyecto vive junto a él. Heredarla no es un extra: sin sus
// `ignores` el sensor lintea `dist/`, `build/` y `coverage/`, y devuelve cientos
// de hallazgos sobre código generado mientras el código fuente pasa limpio.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

// Los nombres que ESLint reconoce para flat config, en su mismo orden de
// resolución. Fijar uno solo hacía que cualquier proyecto que usara otro de los
// seis quedara sin heredar nada.
const CONFIG_FILENAMES = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  'eslint.config.mts',
  'eslint.config.cts',
];

const projectConfigPath = CONFIG_FILENAMES.map((name) => path.join(projectRoot, name)).find(
  (candidate) => fs.existsSync(candidate),
);

let projectConfig = [];

if (projectConfigPath === undefined) {
  // Se avisa por stderr a propósito: stdout lleva el JSON que el sensor parsea.
  console.warn(
    `[awm] no se encontró configuración de ESLint en ${projectRoot} ` +
      `(buscados: ${CONFIG_FILENAMES.join(', ')}). El sensor corre solo con las ` +
      `reglas de AWM, y sin los \`ignores\` del proyecto puede reportar hallazgos ` +
      `en directorios generados.`,
  );
} else {
  let projectModule;
  try {
    projectModule = await import(pathToFileURL(projectConfigPath).href);
  } catch (error) {
    // Tragarse este error dejaba al sensor corriendo sin `ignores` sobre un
    // proyecto que SÍ tiene configuración: el informe salía lleno de hallazgos
    // falsos y nada indicaba por qué. Es preferible que el sensor falle y se vea.
    throw new Error(
      `[awm] no se pudo cargar ${path.basename(projectConfigPath)}: ${error.message}. ` +
        `Una configuración en TypeScript necesita un loader — ESLint la resuelve por su ` +
        `cuenta, pero este archivo la importa con Node. Si es tu caso, apuntá el sensor ` +
        `a tu propia configuración editando \`lint.cmd\` en \`.awm/sensors.json\`.`,
      { cause: error },
    );
  }

  const exported = projectModule.default;
  if (exported === undefined || exported === null) {
    throw new Error(
      `[awm] ${path.basename(projectConfigPath)} no tiene \`export default\`: ESLint v9 ` +
        `espera el flat config como export por defecto.`,
    );
  }

  // `tseslint.config(...)` y los presets devuelven arrays anidados.
  projectConfig = Array.isArray(exported) ? exported.flat(Infinity) : [exported];
}

export default [
  ...projectConfig,
  {
    // Las reglas base de ESLint se aplican solo a JavaScript. En TypeScript son
    // falsos positivos estructurales, no hallazgos: `no-undef` no ve los tipos
    // ambientales (`NodeJS.Timeout`, el namespace `React`) porque no existen en
    // tiempo de ejecución, y `no-unused-vars` marca como no usados los nombres
    // de parámetro de una firma dentro de una interfaz. typescript-eslint
    // documenta desactivar ambas en `.ts` por esa razón. Un bloque sin `files`
    // se aplicaba al final y pisaba justamente eso: en `agent-vps-mobile` los 47
    // hallazgos restantes tras arreglar la herencia eran todos de esta clase.
    //
    // En TypeScript manda la configuración del proyecto — y `tsc`, que es el
    // sensor `typecheck` y sabe de tipos.
    files: ['**/*.js', '**/*.jsx', '**/*.mjs', '**/*.cjs'],
    rules: {
      // `_`-prefixed args/vars are intentionally unused (callback signatures,
      // destructure-and-drop). This is the canonical ESLint convention.
      'no-unused-vars': ['error', { vars: 'all', args: 'after-used', argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-unreachable': 'error',
    },
  },
];
