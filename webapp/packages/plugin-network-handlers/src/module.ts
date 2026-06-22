/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { NetworkHandlerResource } from './NetworkHandlerResource.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-network-handlers',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Dependency, proxy(NetworkHandlerResource))
      .addSingleton(NetworkHandlerResource)
      .addSingleton(Bootstrap, LocaleService);
  },
});
