import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'vite.config.js', 'vite.config.d.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // A provider and its hook live in one file here, which is the usual
      // React arrangement. The cost is that Fast Refresh does a full reload
      // for those three files rather than a hot swap; the rule is about
      // developer experience, not correctness.
      'react-refresh/only-export-components': [
        'error',
        { allowExportNames: ['useLanguage', 'useTheme', 'useToast'] },
      ],
    },
  },
])
