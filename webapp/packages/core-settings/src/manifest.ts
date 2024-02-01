/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { SettingsResolverService } from './SettingsResolverService';
import { SettingsService } from './SettingsService';

export const coreSettingsManifest: PluginManifest = {
  info: {
    name: 'Core Settings',
  },

  providers: [SettingsService, SettingsResolverService],
};
