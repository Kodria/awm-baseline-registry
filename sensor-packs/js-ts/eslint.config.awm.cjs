// AWM ESLint config — ESLint v8 format (.eslintrc compatible).
// It preserves the project's TypeScript parser/plugin configuration while
// supplying a small JavaScript-only safety baseline.
// Usage: npx eslint . --config eslint.config.awm.cjs --format json

module.exports = {
  extends: ['./.eslintrc.js'],
  ignorePatterns: ['dist/', 'build/', 'coverage/'],
  rules: {
    'no-unreachable': 'error',
  },
  overrides: [{
    files: ['**/*.js', '**/*.cjs', '**/*.mjs'],
    rules: {
      'no-unused-vars': ['error', { vars: 'all', args: 'after-used' }],
      'no-undef': 'error',
    },
  }],
};
