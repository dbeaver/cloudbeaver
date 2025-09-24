/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { TransactionManagerBootstrap } from './TransactionManagerBootstrap.js';
import { TransactionManagerSettingsService } from './TransactionManagerSettingsService.js';
import { TransactionManagerService } from './TransactionManagerService.js';
import { TransactionLogCountResource } from './TransactionLog/TransactionLogCountResource.js';
import { LocaleService } from './LocaleService.js';
import { TransactionLogCountEventHandler } from './TransactionLog/TransactionLogCountEventHandler.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-datasource-transaction-manager',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Dependency, proxy(TransactionManagerSettingsService))
      .addSingleton(Dependency, proxy(TransactionLogCountResource))
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, TransactionManagerBootstrap)
      .addSingleton(TransactionLogCountEventHandler)
      .addSingleton(TransactionManagerSettingsService)
      .addSingleton(TransactionManagerService)
      .addSingleton(TransactionLogCountResource);
  },
});
