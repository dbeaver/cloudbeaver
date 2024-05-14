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
    () => import('./LocaleService').then(m => m.LocaleService),
    () => import('./Administration/Connections/ConnectionsAdministrationService').then(m => m.ConnectionsAdministrationService),
    () => import('./Administration/Connections/ConnectionsAdministrationNavService').then(m => m.ConnectionsAdministrationNavService),
    () => import('./Administration/Connections/CreateConnectionService').then(m => m.CreateConnectionService),
    () => import('./Administration/Connections/CreateConnection/Manual/ConnectionManualService').then(m => m.ConnectionManualService),
    () => import('./Administration/Connections/CreateConnection/CreateConnectionBaseBootstrap').then(m => m.CreateConnectionBaseBootstrap),
    () => import('./ConnectionForm/ConnectionAccess/ConnectionAccessTabService').then(m => m.ConnectionAccessTabService),
  ],
};
