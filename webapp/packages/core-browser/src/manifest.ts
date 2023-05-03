/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { BrowserSettingsService } from './BrowserSettingsService';
import { CookiesService } from './CookiesService';
import { ServiceWorkerBootstrap } from './ServiceWorkerBootstrap';
import { ServiceWorkerService } from './ServiceWorkerService';

export const coreBrowserManifest: PluginManifest = {
  info: {
    name: 'Core Browser',
  },

  providers: [
    BrowserSettingsService,
    CookiesService,
    ServiceWorkerBootstrap,
    ServiceWorkerService,
  ],
};
