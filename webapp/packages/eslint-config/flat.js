/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import cloudbeaverPlugin from '@cloudbeaver/eslint-plugin';
import pluginReact from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat['jsx-runtime'],
  eslintConfigPrettier,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    ignores: ['**/lib'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      '@cloudbeaver': cloudbeaverPlugin,
      react: pluginReact,
      'react-hooks': reactHooks,
      '@stylistic': stylistic,
    },
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    settings: {
      react: {
        createClass: 'createReactClass',
        pragma: 'React',
        version: '19',
      },
    },
    rules: {
      ...cloudbeaverPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-undef': 'off',
      'comma-spacing': 'off',
      'default-param-last': 'off',
      'func-call-spacing': 'off',
      'keyword-spacing': 'off',
      'no-duplicate-imports': 'error',
      'object-curly-spacing': 'off',
      'space-before-function-paren': 'off',
      'space-infix-ops': 'off',
      'space-after-keywords': 'off',
      'no-inner-declarations': 'off',
      'no-constant-condition': 'off',
      'space-before-blocks': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-unsafe-finally': 'error',
      'require-await': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
      '@typescript-eslint/dot-notation': 'off',
      '@typescript-eslint/no-throw-literal': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-implied-eval': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-reduce-type-parameter': 'off',
      '@typescript-eslint/promise-function-async': 'off',
      '@typescript-eslint/require-array-sort-compare': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/return-await': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-for-in-array': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { destructuredArrayIgnorePattern: '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@stylistic/semi': ['error', 'always'],
      '@typescript-eslint/consistent-type-assertions': [
        'error',
        {
          assertionStyle: 'as',
          objectLiteralTypeAssertions: 'allow',
        },
      ],
      '@stylistic/member-delimiter-style': [
        'warn',
        {
          multiline: {
            delimiter: 'semi',
            requireLast: true,
          },
          singleline: {
            delimiter: 'semi',
            requireLast: false,
          },
        },
      ],
      '@stylistic/comma-spacing': ['error'],
      '@typescript-eslint/default-param-last': ['error'],
      '@stylistic/func-call-spacing': ['error'],
      '@stylistic/keyword-spacing': ['error'],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/quotes': [
        'error',
        'single',
        {
          avoidEscape: true,
        },
      ],
      '@stylistic/space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always',
        },
      ],
      '@stylistic/space-infix-ops': [
        'error',
        {
          int32Hint: false,
        },
      ],
      '@typescript-eslint/no-confusing-non-null-assertion': ['warn'],
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/prefer-function-type': ['warn'],
      'arrow-spacing': 'error',
      'import/no-duplicates': 'off',
      'import/export': 'off',
      'standard/no-callback-literal': 'off',
      'no-empty': 'off',
      curly: ['error', 'all'],
      'arrow-body-style': ['error', 'as-needed'],
      'function-call-argument-newline': ['error', 'consistent'],
      'prefer-arrow-callback': [
        'error',
        {
          allowNamedFunctions: true,
        },
      ],
      'operator-linebreak': 'off',
      'multiline-ternary': 'off',
      'no-nested-ternary': 'warn',
      'arrow-parens': ['error', 'as-needed'],
      'comma-dangle': [
        'warn',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'only-multiline',
          exports: 'only-multiline',
          functions: 'only-multiline',
        },
      ],
      'max-len': [
        'error',
        {
          code: 150,
          ignoreTrailingComments: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignorePattern: '^export\\s(const\\s\\w+:?.+=.+function\\s|function\\s)\\w+\\s*\\(.*\\{$',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: ['@cloudbeaver/*/src/*'],
        },
      ],
      'react/no-array-index-key': 'warn',
      'react/destructuring-assignment': 'off',
      'react/require-render-return': 'off',
      'react/no-string-refs': 'off',
      'react/no-deprecated': 'off',
      'react/no-direct-mutation-state': 'off',
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react/jsx-no-literals': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-curly-newline': 'off',
      'react/jsx-wrap-multilines': 'off',
      'react/jsx-closing-bracket-location': 'error',
      'react/jsx-closing-tag-location': 'error',
      'react/jsx-boolean-value': 'error',
      'react/self-closing-comp': 'error',
      'react/jsx-curly-brace-presence': ['error', 'never'],
      'react/jsx-fragments': ['off', 'syntax'],
      'react/jsx-equals-spacing': ['error', 'never'],
      'react/jsx-curly-spacing': [
        'error',
        {
          when: 'never',
          children: true,
        },
      ],
      'react/jsx-first-prop-new-line': ['warn', 'multiline'],
      'react/jsx-max-props-per-line': [
        1,
        {
          when: 'multiline',
        },
      ],
      'react/jsx-tag-spacing': [
        'error',
        {
          closingSlash: 'never',
          beforeSelfClosing: 'always',
          afterOpening: 'never',
          beforeClosing: 'never',
        },
      ],
      'react/jsx-sort-props': [
        'error',
        {
          callbacksLast: true,
          shorthandLast: true,
          ignoreCase: true,
          noSortAlphabetically: true,
          reservedFirst: true,
        },
      ],
    },
  },
  {
    files: ['**/*.cjs'],
    ignores: ['**/lib'],
  },
);
