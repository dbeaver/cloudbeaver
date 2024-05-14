/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const sqlEditorTabPluginManifest: PluginManifest = {
  info: {
    name: 'Sql Editor Navigation Tab Plugin',
  },

  providers: [
    () => import('./SqlEditorBootstrap').then(m => m.SqlEditorBootstrap),
    () => import('./SqlEditorTabService').then(m => m.SqlEditorTabService),
    () => import('./SqlEditorNavigatorService').then(m => m.SqlEditorNavigatorService),
    () => import('./LocaleService').then(m => m.LocaleService),
  ],
};
