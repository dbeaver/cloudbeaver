/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { NotificationService } from './NotificationService.js';
import { LocaleService } from './LocaleService.js';
import { ExceptionsCatcherService } from './ExceptionsCatcherService.js';
import { EventsSettingsService } from './EventsSettingsService.js';

ModuleRegistry.add({
  name: '@cloudbeaver/core-events',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, proxy(ExceptionsCatcherService))
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Dependency, proxy(EventsSettingsService))
      .addSingleton(EventsSettingsService)
      .addSingleton(NotificationService)
      .addSingleton(ExceptionsCatcherService);
  },
});
