/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

export const pluginDataEditorSettingsManifest: PluginManifest = {
  info: {
    name: 'Plugin data editor settings',
  },

  providers: [
    () => import('./PluginDataEditorSettingsServiceBootstrap.js').then(m => m.PluginDataEditorSettingsServiceBootstrap),
    () => import('./DataEditorSettingsService.js').then(m => m.DataEditorSettingsService),
  ],
};
