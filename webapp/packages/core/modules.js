// this file is config file required for build-plugin task
// it tells rollup the list of modules and the order they should be built

module.exports = [
  // asserts are not here. it doesn't contain code

  // The order of modules is important.
  // The module must be built before it is used in another module
  'extensions',
  'di',
  'utils',
  'eventsLog',

  'settings',
  'product',
  'plugin',
  'theming',
  'localization',

  'root',
  'sdk',

  'blocks',
  'dialogs',
  'app',
  '', // root module
];
