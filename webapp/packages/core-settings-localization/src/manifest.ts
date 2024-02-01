/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { LocaleService } from './LocaleService';
import { LocalizationSettingsManagerService } from './LocalizationSettingsManagerService';
import { SettingsLocalizationService } from './SettingsLocalizationService';

export const coreSettingsLocalizationManifest: PluginManifest = {
  info: {
    name: 'Core Settings Localization',
  },

  providers: [SettingsLocalizationService, LocalizationSettingsManagerService, LocaleService],
};
