/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const sqlEditorNewPlugin: PluginManifest = {
  info: {
    name: 'Sql Editor New Plugin',
  },

  providers: [
    () => import('./PluginBootstrap').then(m => m.PluginBootstrap),
    () => import('./SQLEditor/SQLCodeEditorPanel/SQLCodeEditorPanelService').then(m => m.SQLCodeEditorPanelService),
    () => import('./LocaleService').then(m => m.LocaleService),
  ],
};
