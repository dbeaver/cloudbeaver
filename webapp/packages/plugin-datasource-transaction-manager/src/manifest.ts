/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const datasourceTransactionManagerPlugin: PluginManifest = {
  info: {
    name: 'Datasource transaction manager plugin',
  },

  providers: [
    () => import('./TransactionManagerBootstrap.js').then(m => m.TransactionManagerBootstrap),
    () => import('./TransactionManagerSettingsService.js').then(m => m.TransactionManagerSettingsService),
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./TransactionManagerService.js').then(m => m.TransactionManagerService),
    () => import('./TransactionLog/TransactionLogCountResource.js').then(m => m.TransactionLogCountResource),
    () => import('./TransactionLog/TransactionLogCountEventHandler.js').then(m => m.TransactionLogCountEventHandler),
  ],
};
