/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { VersionService } from './VersionService.js';
import { VersionResource } from './VersionResource.js';
import { VersionLocaleService } from './VersionLocaleService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/core-version',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, VersionLocaleService)
      .addSingleton(Dependency, proxy(VersionResource))
      .addSingleton(VersionService)
      .addSingleton(VersionResource);
  },
});
