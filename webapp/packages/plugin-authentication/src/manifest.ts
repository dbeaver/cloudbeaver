/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IServiceInjector, PluginManifest } from '@cloudbeaver/core-di';

import { RolesManagerService } from './Administration/RolesManagerService';
import { RolesResource } from './Administration/RolesResource';
import { UsersAdministrationService } from './Administration/Users/UsersAdministrationService';
import { UsersResource } from './Administration/UsersResource';
import { AuthenticationLocaleService } from './AuthenticationLocaleService';
import { AuthenticationService } from './AuthenticationService';
import { AuthInfoService } from './AuthInfoService';
import { AuthMenuService } from './AuthMenuService';
import { AuthProviderService } from './AuthProviderService';
import { AuthProvidersResource } from './AuthProvidersResource';
import { Bootstrap } from './Bootstrap';
import { AuthDialogService } from './Dialog/AuthDialogService';

export const manifest: PluginManifest = {
  info: {
    name: 'Authentication',
  },

  providers: [
    AuthenticationService,
    AuthInfoService,
    AuthProviderService,
    AuthProvidersResource,
    AuthDialogService,
    AuthMenuService,
    UsersAdministrationService,
    RolesManagerService,
    AuthenticationLocaleService,
    RolesResource,
    UsersResource,
  ],

  async initialize(services: IServiceInjector) {
    services
      .resolveServiceByClass(Bootstrap)
      .bootstrap();
  },
};
