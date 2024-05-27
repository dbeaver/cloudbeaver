/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const coreRoutingManifest: PluginManifest = {
  info: {
    name: 'Core Routing',
  },

  providers: [
    () => import('./Screen/ScreenService').then(m => m.ScreenService),
    () => import('./RouterService').then(m => m.RouterService),
    () => import('./WindowsService').then(m => m.WindowsService),
  ],
};
