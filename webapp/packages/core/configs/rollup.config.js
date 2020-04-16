const path = require('path');

import {configBuilder, defaultBuilderOptions} from '../../../configs/rollup.config';

const options = defaultBuilderOptions;
options.babelConfig = path.join(__dirname, '../../../configs/babel-rollup.config.js');

const baseConfig = configBuilder(options);

const modules = [
  // asserts are not here. it doesn't contain code

  // The order of modules is important.
  // The module must be built before it is used in another module
  '/di',
  '/utils',
  '/eventsLog',

  '/settings',
  '/theming',
  '/localization',

  '/root',
  '/sdk',

  '/blocks',
  '/dialogs',
  '/app',
  '', // root module
]

const config = modules.map(module => {
  const moduleConfig = {...baseConfig};
  moduleConfig.input = `src${module}/index.ts`;
  moduleConfig.output = [
    {
      dir: `dist${module}`,
      format: 'esm',
    },
  ];
  moduleConfig.external = [
    ...baseConfig.external,
    ...modules
      .filter(name => name !== module && name !== '')
      .map(name => `@dbeaver/core${name}`),
  ];
  return moduleConfig;
})

export default config;
