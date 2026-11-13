/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { EventsSettingsService } from './EventsSettingsService.js';
import { ExceptionsCatcherService } from './ExceptionsCatcherService.js';
import { LocaleService } from './LocaleService.js';
import { NotificationService } from './NotificationService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-events',

  services: () => [EventsSettingsService, NotificationService, ExceptionsCatcherService],
  bootstraps: () => [ExceptionsCatcherService, LocaleService],
});
