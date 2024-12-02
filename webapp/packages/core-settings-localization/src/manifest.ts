/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const coreSettingsLocalizationManifest: PluginManifest = {
  info: {
    name: 'Core Settings Localization',
  },

  providers: [
    () => import('./SettingsLocalizationService.js').then(m => m.SettingsLocalizationService),
    () => import('./LocalizationSettingsManagerService.js').then(m => m.LocalizationSettingsManagerService),
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./SettingsLocalizationBootstrap.js').then(m => m.SettingsLocalizationBootstrap),
  ],
};
