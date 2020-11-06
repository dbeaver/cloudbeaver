/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PluginManifest } from '@cloudbeaver/core-di';

import { CreateUserService } from './Administration/Users/CreateUserService';
import { UserFormBaseBootstrap } from './Administration/Users/UserForm/UserFormBaseBootstrap';
import { UserFormService } from './Administration/Users/UserForm/UserFormService';
import { UsersAdministrationNavigationService } from './Administration/Users/UsersAdministrationNavigationService';
import { UsersAdministrationService } from './Administration/Users/UsersAdministrationService';
import { AuthenticationLocaleService } from './AuthenticationLocaleService';
import { AuthenticationService } from './AuthenticationService';
import { AuthMenuService } from './AuthMenuService';
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
    CreateUserService,
    UsersAdministrationNavigationService,
    UserFormService,
    UserFormBaseBootstrap,
  ],
};
