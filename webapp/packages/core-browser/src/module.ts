/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { IndexedDBService } from './IndexedDB/IndexedDBService.js';
import { LocalStorageSaveService } from './LocalStorageSaveService.js';
import { ServiceWorkerBootstrap } from './ServiceWorkerBootstrap.js';
import { ServiceWorkerService } from './ServiceWorkerService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-browser',

  services: () => [IndexedDBService, ServiceWorkerService, LocalStorageSaveService],
  preloads: () => [ServiceWorkerBootstrap],
});
