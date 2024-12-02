/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const sqlEditorPagePluginManifest: PluginManifest = {
  info: {
    name: 'Sql Editor Page plugin',
  },

  providers: [
    () => import('./PluginBootstrap.js').then(m => m.PluginBootstrap),
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./Screen/SqlEditorScreenBootstrap.js').then(m => m.SqlEditorScreenBootstrap),
    () => import('./Screen/SqlEditorScreenService.js').then(m => m.SqlEditorScreenService),
  ],
};
