/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { WindowsService } from './WindowsService.js';
import { ScreenService } from './Screen/ScreenService.js';
import { RouterService } from './RouterService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/core-routing',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, proxy(RouterService))
      .addSingleton(RouterService)
      .addSingleton(WindowsService)
      .addSingleton(ScreenService);
  },
});
