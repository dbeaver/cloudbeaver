/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { PluginBootstrap } from './PluginBootstrap';
import { AdministrationTopAppBarBootstrapService } from './TopNavBar/AdministrationTopAppBarBootstrapService';
import { TopNavService } from './TopNavBar/TopNavService';

export const topAppBarPlugin: PluginManifest = {
  info: {
    name: 'Top App Bar plugin',
  },
  providers: [
    PluginBootstrap,
    TopNavService,
    AdministrationTopAppBarBootstrapService,
  ],
};