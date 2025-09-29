/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { DVResultTraceDetailsService } from './DVResultTraceDetailsService.js';
import { DVResultTraceDetailsBootstrap } from './DVResultTraceDetailsBootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-data-viewer-result-trace-details',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, proxy(DVResultTraceDetailsBootstrap))
      .addSingleton(DVResultTraceDetailsBootstrap)
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(DVResultTraceDetailsService);
  },
});
