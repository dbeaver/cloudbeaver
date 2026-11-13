/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { TransactionLogCountEventHandler } from './TransactionLog/TransactionLogCountEventHandler.js';
import { TransactionLogCountResource } from './TransactionLog/TransactionLogCountResource.js';
import { TransactionManagerBootstrap } from './TransactionManagerBootstrap.js';
import { TransactionManagerService } from './TransactionManagerService.js';
import { TransactionManagerSettingsService } from './TransactionManagerSettingsService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-datasource-transaction-manager',

  services: () => [TransactionLogCountEventHandler, TransactionManagerSettingsService, TransactionManagerService, TransactionLogCountResource],
  bootstraps: () => [LocaleService, TransactionManagerBootstrap],
});
