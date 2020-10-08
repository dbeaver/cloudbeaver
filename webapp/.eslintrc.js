module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',

  plugins: [
    '@typescript-eslint',
    'eslint-plugin-import-helpers',
  ],

  extends: [
    // 'airbnb-typescript',
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    'plugin:@typescript-eslint/recommended',
    'standard-with-typescript'
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

  parserOptions: {
    ecmaVersion: 2019,
    sourceType: "module",
    // tsconfigRootDir: __dirname,
    // project: './packages/**/tsconfig.json',
    ecmaFeatures: {
      jsx: true
    }
  },

  rules: {
    'arrow-parens': ['error', 'as-needed', { 'requireForBlockBody': true }],
    'curly': ['error', 'all'],
    'class-methods-use-this': 'off',
    'default-case': 'off',
    'react/require-render-return': 'off',
    'react/no-string-refs': 'off',
    'react/no-deprecated': 'off',
    'react/no-direct-mutation-state': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'react/jsx-no-literals': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-max-props-per-line': [1, { "when": "multiline" }],
    'react/jsx-closing-bracket-location': 'error',
    'react/jsx-closing-tag-location': 'error',
    'react/jsx-tag-spacing': ['error', {
      "closingSlash": "never",
      "beforeSelfClosing": "always",
      "afterOpening": "never",
      "beforeClosing": "never"
    }],
    'react/jsx-boolean-value': 'error',
    'react/jsx-wrap-multilines': ['error', {
      "declaration": "parens-new-line",
      "assignment": "parens-new-line",
      "return": "parens-new-line",
      "arrow": "parens-new-line",
      "condition": "parens-new-line",
      "logical": "parens-new-line",
      "prop": "parens-new-line"
    }],
    'react/self-closing-comp': ["error"],
    'react/jsx-sort-props': ['error', {
      "callbacksLast": true,
      "shorthandLast": true,
      "ignoreCase": true,
      "noSortAlphabetically": true,
      "reservedFirst": true,
    }],
    'react/destructuring-assignment': ['error'],
    'react/jsx-curly-brace-presence': ['error', "never"],
    'react/jsx-curly-newline': ['error'],
    'react/jsx-curly-spacing': ['error', { "when": "never", "children": true }],
    'react/jsx-equals-spacing': ['error', 'never'],
    'react/jsx-first-prop-new-line': ['warn', 'multiline'],
    'react/jsx-fragments': ['error', 'syntax'],
    // 'brace-style': ["error", "1tbs", { "allowSingleLine": false }],
    'operator-linebreak': ['warn', 'before'],
    'consistent-return': 'off',
    'comma-dangle': ['warn', { // the rule enforces consistent use of trailing commas in object and array literals
      'arrays': 'always-multiline',
      'objects': 'always-multiline',
      'imports': 'only-multiline',
      'exports': 'only-multiline',
      'functions': 'only-multiline'
    }],
    "semi": "off",
    'eqeqeq': 'warn',
    'radix': 'off',
    'no-unmodified-loop-condition': 'off',
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
        ignoreTemplateLiterals: true,
        ignorePattern: "^export\\s(const\\s\\w+:?.+=\\s*function\\s|function\\s)\\w+\\s*\\(\\s*\\{$"
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
    'import/no-duplicates': 'off',
    'standard/no-callback-literal': 'off',
    '@typescript-eslint/dot-notation': 'off',
    '@typescript-eslint/no-throw-literal': 'off',
    '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
    '@typescript-eslint/prefer-includes': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/prefer-readonly': 'off',
    '@typescript-eslint/prefer-reduce-type-parameter': 'off',
    '@typescript-eslint/require-array-sort-compare': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/return-await': 'off',

    
    '@typescript-eslint/indent': [
      'warn', 2, {
        'MemberExpression': 1,
        "FunctionDeclaration": {"body": 1, "parameters": 1},
        "FunctionExpression": {"body": 1, "parameters": 1},
        "CallExpression": {"arguments": 1},
        'ArrayExpression': 1,
        'SwitchCase': 1,
        'ObjectExpression': 1,
        'ImportDeclaration': 1,
        "offsetTernaryExpressions": true
      }
    ],
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-base-to-string': 'off',
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    '@typescript-eslint/no-implied-eval': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/promise-function-async': 'off',
    '@typescript-eslint/space-before-function-paren': ["error", { "anonymous": "always", "named": "never", "asyncArrow": "always" }],
    '@typescript-eslint/no-empty-interface': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/triple-slash-reference': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/strict-boolean-expressions': ['off'],
    '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'as', objectLiteralTypeAssertions: 'allow' }],
    // '@typescript-eslint/no-extraneous-class': [],
    "@typescript-eslint/semi": ["error", "always"],
    "@typescript-eslint/member-delimiter-style": ['warn', {
      "multiline": {
        "delimiter": "semi",
        "requireLast": true
      },
      "singleline": {
        "delimiter": "semi",
        "requireLast": false
      }
    }],
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
    'indent': 'off'
  }
}
