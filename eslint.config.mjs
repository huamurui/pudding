import js from '@eslint/js'
import typescriptEslint from 'typescript-eslint'
import pluginAstro from 'eslint-plugin-astro'
import prettier from 'eslint-plugin-prettier/recommended'

export default [
  js.configs.recommended,
  ...typescriptEslint.configs.recommended,
  ...pluginAstro.configs.recommended,
  prettier,
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.astro/**',
      '*.config.*',
      'public/**'
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      'prettier/prettier': 'error'
    }
  }
]
