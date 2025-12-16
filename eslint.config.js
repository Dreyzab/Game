import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import boundaries from 'eslint-plugin-boundaries'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'server/dist', 'src/shared/api/__generated__/**']),
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    plugins: {
      boundaries,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    settings: {
      'import/resolver': {
        typescript: {
          project: './tsconfig.app.json',
        },
      },
      'boundaries/include': ['src/**/*'],
      'boundaries/ignore': ['src/shared/api/__generated__/**'],
      'boundaries/elements': [
        { type: 'shared', pattern: 'src/shared' },
        { type: 'entities', pattern: 'src/entities/(*)', capture: ['entityName'] },
        { type: 'features', pattern: 'src/features/(*)', capture: ['featureName'] },
        { type: 'processes', pattern: 'src/processes/(*)', capture: ['processName'] },
        { type: 'widgets', pattern: 'src/widgets/(*)', capture: ['widgetName'] },
        { type: 'pages', pattern: 'src/pages' },
        { type: 'app', pattern: 'src/app' },
        { type: 'app', pattern: 'src/*.{ts,tsx}', mode: 'full' },
      ],
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'react-refresh/only-export-components': 'warn',
      'boundaries/element-types': [
        'warn',
        {
          default: 'disallow',
          rules: [
            { from: 'shared', allow: ['shared'] },
            { from: 'entities', allow: ['entities', 'shared'] },
            { from: 'features', allow: ['entities', 'shared'] },
            { from: 'processes', allow: ['features', 'entities', 'shared'] },
            { from: 'widgets', allow: ['features', 'entities', 'shared'] },
            { from: 'pages', allow: ['*'] },
            { from: 'app', allow: ['*'] },
          ],
        },
      ],
      'boundaries/entry-point': [
        'warn',
        {
          default: 'allow',
          rules: [
            {
              target: ['features'],
              disallow: ['**/!(index).{ts,tsx}'],
              message:
                'Deep import into features запрещён — импортируй из ближайшего index.ts(x)',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['server/**/*.{ts,tsx}', 'vite.config.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'prefer-const': 'off',
    },
  },
])
