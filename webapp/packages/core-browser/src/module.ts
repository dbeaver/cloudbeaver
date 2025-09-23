/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IPreloadService, ModuleRegistry } from '@cloudbeaver/core-di';
import { ServiceWorkerService } from './ServiceWorkerService.js';
import { ServiceWorkerBootstrap } from './ServiceWorkerBootstrap.js';
import { LocalStorageSaveService } from './LocalStorageSaveService.js';
import { IndexedDBService } from './IndexedDB/IndexedDBService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-browser',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(IPreloadService, ServiceWorkerBootstrap)
      .addSingleton(IndexedDBService)
      .addSingleton(ServiceWorkerService)
      .addSingleton(LocalStorageSaveService);
  },
});
