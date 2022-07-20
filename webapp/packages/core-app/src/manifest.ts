/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { AppLocaleService } from './AppLocaleService';
import { AppScreenBootstrap } from './AppScreen/AppScreenBootstrap';
import { AppScreenService } from './AppScreen/AppScreenService';
import { CoreSettingsService } from './CoreSettingsService';


export const coreAppManifest: PluginManifest = {
  info: {
    name: 'Core App',
  },

  providers: [
    AppScreenService,
    AppScreenBootstrap,
    CoreSettingsService,
    AppLocaleService,
  ],
};
