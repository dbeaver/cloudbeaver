/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import noSyncComponentImport from './noSyncComponentImport.js';
import formPartContract from './formPartContract.js';
import serviceVariableName from './serviceVariableName.js';
import statementSpacing from './statementSpacing.js';
import requireFunctionDeclarationsInComponents from './requireFunctionDeclarationsInComponents.js';
import noConditionalEmptyObjectSpread from './noConditionalEmptyObjectSpread.js';

const plugin = {
  meta: {
    name: '@cloudbeaver/eslint-plugin',
    version: '1.0.0',
  },
  configs: {},
  rules: {
    'no-sync-component-import': noSyncComponentImport,
    'form-part-contract': formPartContract,
    'service-variable-name': serviceVariableName,
    'statement-spacing': statementSpacing,
    'require-function-declarations-in-components': requireFunctionDeclarationsInComponents,
    'no-conditional-empty-object-spread': noConditionalEmptyObjectSpread,
  },
};

Object.assign(plugin.configs, {
  recommended: {
    plugins: { '@cloudbeaver': plugin },
    rules: {
      '@cloudbeaver/no-sync-component-import': 'error',
      '@cloudbeaver/form-part-contract': 'error',
      '@cloudbeaver/service-variable-name': 'error',
      '@cloudbeaver/statement-spacing': 'error',
      '@cloudbeaver/require-function-declarations-in-components': 'error',
      '@cloudbeaver/no-conditional-empty-object-spread': 'error',
    },
  },
});

export default plugin;
