/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const userProfileSettingsPlugin: PluginManifest = {
  info: {
    name: 'User profile settings plugin',
  },

  providers: [
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./UserProfileSettingsPluginBootstrap.js').then(m => m.UserProfileSettingsPluginBootstrap),
  ],
};
