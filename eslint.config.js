//  @ts-check

import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
  {
    rules: {
      'import/no-cycle': 'off',
      'import/order': 'off',
      'sort-imports': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/require-await': 'off',
      'pnpm/json-enforce-catalog': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
    },
  },
  {
    ignores: [
      'eslint.config.js',
      'prettier.config.js',
      // Orchestrator lives outside the app typecheck/lint graph (Bun globals).
      'scripts/**',
      // Supabase-generated / vendored types — not hand-maintained
      'src/integrations/supabase/database-generated.types.ts',
      'src/routeTree.gen.ts',
      '.output/**',
      '.vercel/**',
    ],
  },
]
