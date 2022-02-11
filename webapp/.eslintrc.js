module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',

  plugins: [
    '@typescript-eslint',
    'eslint-plugin-import-helpers'
  ],

  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    'plugin:@typescript-eslint/recommended'
  ],

  settings: {
    react: {
      createClass: 'createReactClass',
      pragma: 'React',
      version: 'detect',
    },
  },

  parserOptions: {
    ecmaVersion: 2019,
    sourceType: "module",
    tsconfigRootDir: __dirname,
    project: './tsconfig.eslint.json',
    ecmaFeatures: {
      jsx: true
    }
  },

  rules: {
    "comma-spacing": "off",
    "default-param-last": "off",
    "func-call-spacing": "off",
    "keyword-spacing": "off",
    "no-duplicate-imports": "off",
    "object-curly-spacing": "off",
    "quotes": "off",
    "space-before-function-paren": "off",
    "space-infix-ops": "off",
    "space-after-keywords": "off",
    "no-inner-declarations": "off",
    "no-constant-condition": "off",
    "no-trailing-spaces": "error",
    "space-before-blocks": "error",

    "@typescript-eslint/indent": ["error", 2],
    '@typescript-eslint/no-invalid-void-type': 'off',
    '@typescript-eslint/dot-notation': 'off',
    '@typescript-eslint/no-throw-literal': 'off',
    '@typescript-eslint/no-base-to-string': 'off',
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-implied-eval': 'off',
    '@typescript-eslint/no-misused-promises': 'off',
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/prefer-reduce-type-parameter': 'off',
    '@typescript-eslint/promise-function-async': 'off',
    '@typescript-eslint/require-array-sort-compare': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/return-await': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/no-for-in-array': 'off',

    '@typescript-eslint/no-use-before-define': 'off',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    "@typescript-eslint/semi": ["error", "always"],
    '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'as', objectLiteralTypeAssertions: 'allow' }],
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

    "@typescript-eslint/comma-spacing": ["error"],
    "@typescript-eslint/default-param-last": ["error"],
    "@typescript-eslint/func-call-spacing": ["error"],
    "@typescript-eslint/keyword-spacing": ["error"],
    "@typescript-eslint/no-duplicate-imports": ["error"],
    "@typescript-eslint/object-curly-spacing": ["error", 'always'],
    "@typescript-eslint/quotes": ["error", "single", { "avoidEscape": true }],
    "@typescript-eslint/space-before-function-paren": ["error" , {"anonymous": "always", "named": "never", "asyncArrow": "always"}],
    "@typescript-eslint/space-infix-ops": ["error", { "int32Hint": false }],
    "@typescript-eslint/no-confusing-non-null-assertion": ["warn"],
    "@typescript-eslint/no-confusing-void-expression": "off",
    "@typescript-eslint/no-unnecessary-boolean-literal-compare": ["warn"],
    "@typescript-eslint/no-unnecessary-condition": ["warn", {"allowConstantLoopConditions": true}],
    "@typescript-eslint/no-unnecessary-type-arguments": ["warn"],
    "@typescript-eslint/non-nullable-type-assertion-style": ["warn"],
    "@typescript-eslint/prefer-function-type": ["warn"],
    "@typescript-eslint/prefer-includes": ["warn"],
    "@typescript-eslint/prefer-readonly": ["warn"],


    'arrow-spacing': 'error',
    'import/no-duplicates': 'off',
    'import/export': 'off',
    'standard/no-callback-literal': 'off',
    'no-empty': 'off',
    'curly': ['error', 'all'],
    'arrow-body-style': ['error', 'as-needed'],
    'function-call-argument-newline': ['error', 'consistent'],
    'prefer-arrow-callback': [
      'error',
      {
        'allowNamedFunctions': true
      }
    ],
    'operator-linebreak': ['warn', 'before'],
    'multiline-ternary': 'off',
    'no-nested-ternary': 'warn',
    'arrow-parens': ['error', 'as-needed'],
    'comma-dangle': ['warn', { // the rule enforces consistent use of trailing commas in object and array literals
      'arrays': 'always-multiline',
      'objects': 'always-multiline',
      'imports': 'only-multiline',
      'exports': 'only-multiline',
      'functions': 'only-multiline'
    }],
    'max-len': [
      'error',
      {
        code: 120,
        ignoreTrailingComments: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignorePattern: "^export\\s(const\\s\\w+:?.+=.+function\\s|function\s)\\w+\\s*\\(.*\\{$"
      }
    ],
    'import-helpers/order-imports': [
      'warn',
      {
        newlinesBetween: 'always',
        groups: ['module', '/^@/', '/^~/', ['parent', 'sibling', 'index']],
        alphabetize: { order: 'asc', ignoreCase: true },
      },
    ],

    'react/destructuring-assignment': 'off',
    'react/require-render-return': 'off',
    'react/no-string-refs': 'off',
    'react/no-deprecated': 'off',
    'react/no-direct-mutation-state': 'off',
    'react/prop-types': 'off',
    'react/display-name': 'off',
    'react/jsx-no-literals': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/jsx-closing-bracket-location': 'error',
    'react/jsx-closing-tag-location': 'error',
    'react/jsx-boolean-value': 'error',
    'react/self-closing-comp': "error",
    'react/jsx-curly-newline': 'error',
    'react/jsx-curly-brace-presence': ['error', "never"],
    'react/jsx-fragments': ['off', 'syntax'],
    'react/jsx-equals-spacing': ['error', 'never'],
    'react/jsx-curly-spacing': ['error', { "when": "never", "children": true }],
    'react/jsx-first-prop-new-line': ['warn', 'multiline'],
    'react/jsx-max-props-per-line': [1, { "when": "multiline" }],
    'react/jsx-tag-spacing': ['error', {
      "closingSlash": "never",
      "beforeSelfClosing": "always",
      "afterOpening": "never",
      "beforeClosing": "never"
    }],
    'react/jsx-wrap-multilines': ['error', {
      "declaration": "parens-new-line",
      "assignment": "parens-new-line",
      "return": "parens-new-line",
      "arrow": "parens-new-line",
      "condition": "parens-new-line",
      "logical": "parens-new-line",
      "prop": "parens-new-line"
    }],
    'react/jsx-sort-props': ['error', {
      "callbacksLast": true,
      "shorthandLast": true,
      "ignoreCase": true,
      "noSortAlphabetically": true,
      "reservedFirst": true,
    }],
  }
}
