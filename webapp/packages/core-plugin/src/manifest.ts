/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { LocaleService } from './LocaleService';
import { PluginManagerService } from './PluginManagerService';
import { SettingsManagerService } from './SettingsManager/SettingsManagerService';

export const corePluginManifest: PluginManifest = {
  info: {
    name: 'Core Plugin',
  },

  providers: [PluginManagerService, SettingsManagerService, LocaleService],
};
