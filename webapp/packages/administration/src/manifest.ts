/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IServiceInjector, PluginManifest } from '@dbeaver/core/di';

import { AdministrationItemService } from './AdministrationItem/AdministrationItemService';
import { AdministrationMenuService } from './AdministrationMenuService';
import { AdministrationScreenService } from './AdministrationScreen/AdministrationScreenService';
import { AdministrationTopAppBarService } from './AdministrationScreen/AdministrationTopAppBar/AdministrationTopAppBarService';

export const manifest: PluginManifest = {
  info: {
    name: 'Administration',
  },

  providers: [
    AdministrationMenuService,
    AdministrationScreenService,
    AdministrationTopAppBarService,
    AdministrationItemService,
  ],

  async initialize(services: IServiceInjector) {
  },
};
