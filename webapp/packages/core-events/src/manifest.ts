/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { EventsSettingsService } from './EventsSettingsService';
import { ExceptionsCatcherService } from './ExceptionsCatcherService';
import { NotificationService } from './NotificationService';



export const manifest: PluginManifest = {
  info: {
    name: 'Core Events',
  },

  providers: [
    NotificationService,
    ExceptionsCatcherService,
    EventsSettingsService,
  ],
};
