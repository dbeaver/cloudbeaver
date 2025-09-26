/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { StorageService } from './StorageService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-storage',

  configure: serviceCollection => {
    serviceCollection.addSingleton(StorageService);
  },
});
