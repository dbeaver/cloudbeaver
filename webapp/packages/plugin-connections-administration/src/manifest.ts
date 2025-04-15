/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const connectionPlugin: PluginManifest = {
  info: {
    name: 'Connections Administration plugin',
  },

  providers: [() => import('./ConnectionFormAccess/ConnectionFormAccessTabService.js').then(m => m.ConnectionFormAccessTabService)],
};
