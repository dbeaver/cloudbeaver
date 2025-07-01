/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const coreThemingManifest: PluginManifest = {
  info: {
    name: 'Core Theming',
  },

  providers: [
    () => import('./ThemeService.js').then(m => m.ThemeService),
    () => import('./ThemeSettingsService.js').then(m => m.ThemeSettingsService),
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./ThemeSettingsManagementService.js').then(m => m.ThemeSettingsManagementService),
    () => import('./SystemThemeService.js').then(m => m.SystemThemeService),
  ],
};
