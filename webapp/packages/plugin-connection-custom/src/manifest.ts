/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { CustomConnectionPluginBootstrap } from './CustomConnectionPluginBootstrap';
import { CustomConnectionSettingsService } from './CustomConnectionSettingsService';
import { LocaleService } from './LocaleService';

export const customConnectionPluginManifest: PluginManifest = {
  info: {
    name: 'Custom connection plugin',
  },

  providers: [LocaleService, CustomConnectionPluginBootstrap, CustomConnectionSettingsService],
};
