module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'airbnb-base',
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
  ],

  plugins: [
    'import',
    '@typescript-eslint',
    'eslint-plugin-import-helpers',
    'jest',
  ],

  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
    },
    typescript: {
      directory: './',
    },
    react: {
      createClass: 'createReactClass',
      pragma: 'React',
      version: 'detect',
    },
  },

  rules: {
    'arrow-parens': ['error', 'as-needed', { 'requireForBlockBody': true }],
    'curly': ['error', 'all'],
    'class-methods-use-this': 'off',
    'default-case': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'react/jsx-no-literals': 'off',
    'react/react-in-jsx-scope': 'off',
    'brace-style': 'off', // prefer 1tbs or stroustrup styles, avoid allman style
    'operator-linebreak': 'warn',
    'consistent-return': 'off',
    'comma-dangle': ['warn', { // the rule enforces consistent use of trailing commas in object and array literals
      'arrays': 'always-multiline',
      'objects': 'always-multiline',
      'imports': 'only-multiline',
      'exports': 'only-multiline',
      'functions': 'only-multiline'
    }],
    'eqeqeq': 'warn',
    'radix': 'off',
    'no-use-before-define': 'off',
    'no-constant-condition': 'off',
    'no-console': 'off',
    'no-dupe-class-members': 'off',
    'no-unreachable': 'off',
    'no-unused-expressions': 'off',
    'no-nested-ternary': 'warn',
    'no-empty': 'off',
    'no-return-assign': 'off',
    'no-continue': 'off',
    'no-shadow': 'off',
    'no-restricted-syntax': 'off',
    'no-underscore-dangle': 'off',
    'no-undef': 'off',
    'no-plusplus': 'off',
    'no-param-reassign': 'off',
    'no-await-in-loop': 'off',
    'no-restricted-globals': 'off',
    'no-useless-constructor': 'off',
    'max-classes-per-file': 'off',
    'arrow-body-style': ['error', 'as-needed'],
    'function-call-argument-newline': ['error', 'consistent'],
    'max-len': [
      'error',
      {
        code: 120,
        ignoreTrailingComments: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true
      }
    ],
    'lines-between-class-members': 'off',
    'require-atomic-updates': 'off',
    'prefer-destructuring': 'off',
    'prefer-arrow-callback': [
      'error',
      {
        'allowNamedFunctions': true
      }
    ],
    'padded-blocks': 'off',
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/triple-slash-reference': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'import/named': 'off',
    'import/export': 'off',
    'import/extensions': 'off',
    'import/no-unresolved': 'off',
    // import/no-extraneous-dependencies off because peer dependencies are moved to builder
    // todo probably there is a way to tune this (see packageDir option in documentation)
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
    'import/no-cycle': 'off',
    'import-helpers/order-imports': [
      'warn',
      {
        newlinesBetween: 'always',
        groups: ['module', '/^@/', '/^~/', ['parent', 'sibling', 'index']],
        alphabetize: { order: 'asc', ignoreCase: true },
      },
    ],
    'indent': [
      'warn', 2, {
        'FunctionDeclaration': { 'parameters': 'first' },
        'FunctionExpression': { 'parameters': 'first' },
        'CallExpression': { 'arguments': 'first' },
        'ArrayExpression': 1,
        'SwitchCase': 1
      }
    ],
  },

  env: {
    'jest/globals': true,
  },
}
