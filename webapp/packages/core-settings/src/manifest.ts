/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { LocaleService } from './LocaleService';
import { SettingsManagerService } from './SettingsManager/SettingsManagerService';
import { SettingsProviderService } from './SettingsProviderService';
import { SettingsResolverService } from './SettingsResolverService';

export const coreSettingsManifest: PluginManifest = {
  info: {
    name: 'Core Settings',
  },

  providers: [SettingsManagerService, SettingsResolverService, LocaleService, SettingsProviderService],
};
