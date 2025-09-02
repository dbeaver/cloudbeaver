import sortImports from '@trivago/prettier-plugin-sort-imports';

/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import("prettier").Config}
 */
const config = {
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  endOfLine: 'lf',
  printWidth: 150,
  arrowParens: 'avoid',
    // plugins: [sortImports],
  importOrderParserPlugins: ['typescript', 'jsx', 'decorators-legacy'],
  importOrder: ['^@dbeaver/(.*)$', '^@cloudbeaver/(.*)$', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  importOrderCaseInsensitive: true,
};

export default config;
