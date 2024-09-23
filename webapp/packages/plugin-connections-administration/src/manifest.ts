/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const connectionPlugin: PluginManifest = {
  info: {
    name: 'Connections Administration plugin',
  },

  providers: [
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./Administration/Connections/ConnectionsAdministrationService.js').then(m => m.ConnectionsAdministrationService),
    () => import('./Administration/Connections/ConnectionsAdministrationNavService.js').then(m => m.ConnectionsAdministrationNavService),
    () => import('./Administration/Connections/CreateConnectionService.js').then(m => m.CreateConnectionService),
    () => import('./Administration/Connections/CreateConnection/Manual/ConnectionManualService.js').then(m => m.ConnectionManualService),
    () => import('./Administration/Connections/CreateConnection/CreateConnectionBaseBootstrap.js').then(m => m.CreateConnectionBaseBootstrap),
    () => import('./ConnectionForm/ConnectionAccess/ConnectionAccessTabService.js').then(m => m.ConnectionAccessTabService),
  ],
};
