/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const coreEventsManifest: PluginManifest = {
  info: {
    name: 'Core Events',
  },

  providers: [
    () => import('./NotificationService.js').then(m => m.NotificationService),
    () => import('./ExceptionsCatcherService.js').then(m => m.ExceptionsCatcherService),
    () => import('./EventsSettingsService.js').then(m => m.EventsSettingsService),
    () => import('./LocaleService.js').then(m => m.LocaleService),
  ],
};
