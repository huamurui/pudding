import js from '@eslint/js'
import typescriptEslint from 'typescript-eslint'
import pluginAstro from 'eslint-plugin-astro'

export default [
  js.configs.recommended,
  ...typescriptEslint.configs.recommended,
  ...pluginAstro.configs.recommended,
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.astro/**',
      '*.config.*',
      'public/**'
    ],
    rules: {
      // 基础规则
      semi: ['warn', 'never'],
      quotes: ['warn', 'single'], 
      'quote-props': ['warn', 'as-needed'],
      'no-trailing-spaces': 'warn',
      'comma-dangle': ['warn', 'never'], 
      'object-curly-spacing': ['warn', 'always'], 
      'array-bracket-spacing': ['warn', 'never'],
      'space-before-function-paren': ['warn', 'never'], 
      'arrow-spacing': ['warn', { before: true, after: true }], 
      'indent': ['warn', 2, { SwitchCase: 1 }],
      'max-len': ['warn', { code: 120, tabWidth: 2 }], 
      
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      'astro/no-unused-define-vars-in-style': 'error'
    }
  }
]
