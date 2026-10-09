/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import noSyncComponentImport from './noSyncComponentImport.js';
import serviceVariableName from './serviceVariableName.js';

const plugin = {
  meta: {
    name: '@cloudbeaver/eslint-plugin',
    version: '1.0.0',
  },
  configs: {},
  rules: {
    'no-sync-component-import': noSyncComponentImport,
    'service-variable-name': serviceVariableName,
  },
};

Object.assign(plugin.configs, {
  recommended: {
    plugins: { '@cloudbeaver': plugin },
    rules: {
      '@cloudbeaver/no-sync-component-import': 'error',
      '@cloudbeaver/service-variable-name': 'error',
    },
  },
});

export default plugin;
