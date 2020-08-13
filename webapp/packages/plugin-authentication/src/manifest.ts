/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IServiceInjector, PluginManifest } from '@cloudbeaver/core-di';

import { UsersAdministrationService } from './Administration/Users/UsersAdministrationService';
import { AuthenticationLocaleService } from './AuthenticationLocaleService';
import { AuthenticationService } from './AuthenticationService';
import { AuthMenuService } from './AuthMenuService';
import { Bootstrap } from './Bootstrap';
import { AuthDialogService } from './Dialog/AuthDialogService';

export const manifest: PluginManifest = {
  info: {
    name: 'Authentication',
  },

  providers: [
    AuthenticationService,
    AuthDialogService,
    AuthMenuService,
    UsersAdministrationService,
    AuthenticationLocaleService,
  ],

  async initialize(services: IServiceInjector) {
    services
      .resolveServiceByClass(Bootstrap)
      .bootstrap();
  },
};
