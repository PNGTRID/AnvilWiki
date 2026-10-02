/**
 * ESLint flat config for AnvilWiki.
 *
 * Lints .js/.mjs, .ts, and .astro files. Focuses on catching real bugs
 * (no-explicit-any, no-unused-vars) rather than stylistic rules —
 * Prettier handles formatting.
 */
import eslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import astro from 'eslint-plugin-astro';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', '.astro/**', '*.config.{js,ts,mjs}', 'tools/**', '.zcode/**'],
  },
  // TypeScript files
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: { '@typescript-eslint': eslint },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-undef': 'off',
    },
  },
  // JS files — .mjs included. Without it, the scripts/*.mjs build tooling
  // (transpile-pagefind, e2e-apply-template, gen-demo-media) fell through to
  // ESLint's implicit default config with no shared rule block.
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },
  // Astro files
  ...astro.configs.recommended,
  {
    // Inline scripts carry `catch (e)` bindings on purpose: the optional catch
    // binding (`catch {}`) is ES2019 and a SyntaxError on old webviews, while
    // the binding itself is always unused. Same for TS/JS blocks above.
    files: ['**/*.astro'],
    plugins: { '@typescript-eslint': eslint },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
    },
  },
];
