/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

export const pluginSettingsDefaultAdministrationManifest: PluginManifest = {
  info: {
    name: 'Plugin Default Settings Administration',
  },

  providers: [
    () => import('./SettingsDefaultBootstrap.js').then(m => m.SettingsDefaultAdministrationBootstrap),
    () => import('./LocaleService.js').then(m => m.LocaleService),
  ],
};
