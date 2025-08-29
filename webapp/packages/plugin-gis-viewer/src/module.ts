/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry, Bootstrap } from '@cloudbeaver/core-di';
import { LocaleService } from './LocaleService.js';
import { GISViewerBootstrap } from './GISViewerBootstrap.js';

ModuleRegistry.add({
  name: '@cloudbeaver/plugin-gis-viewer',

  configure: serviceCollection => {
    serviceCollection.addSingleton(Bootstrap, GISViewerBootstrap).addSingleton(Bootstrap, LocaleService);
  },
});
