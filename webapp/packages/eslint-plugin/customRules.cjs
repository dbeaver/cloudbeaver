/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

const noSyncComponentImport = require('./noSyncComponentImport.cjs');

module.exports = {
  meta: {
    name: '@cloudbeaver/eslint-plugin',
    version: '1.0.0',
  },
  configs: {
    recommended: {
      plugins: ['@cloudbeaver'],
      rules: {
        '@cloudbeaver/no-sync-component-import': 'error',
      },
    },
  },
  rules: { 'no-sync-component-import': noSyncComponentImport },
};
