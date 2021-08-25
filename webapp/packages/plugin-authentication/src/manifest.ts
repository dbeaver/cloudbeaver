/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { AuthProviderConfigurationParametersResource } from './Administration/IdentityProviders/AuthProviderConfigurationParametersResource';
import { AuthProviderConfigurationsResource } from './Administration/IdentityProviders/AuthProviderConfigurationsResource';
import { ConfigurationFormService } from './Administration/IdentityProviders/ConfigurationFormService';
import { ConfigurationsAdministrationNavService } from './Administration/IdentityProviders/ConfigurationsAdministrationNavService';
import { ConfigurationsAdministrationService } from './Administration/IdentityProviders/ConfigurationsAdministrationService';
import { CreateConfigurationService } from './Administration/IdentityProviders/CreateConfigurationService';
import { ConfigurationOptionsTabService } from './Administration/IdentityProviders/Options/ConfigurationOptionsTabService';
import { ServerConfigurationAuthenticationBootstrap } from './Administration/ServerConfiguration/ServerConfigurationAuthenticationBootstrap';
import { CreateUserService } from './Administration/Users/CreateUserService';
import { UserFormBaseBootstrap } from './Administration/Users/UserForm/UserFormBaseBootstrap';
import { UserFormService } from './Administration/Users/UserForm/UserFormService';
import { UsersAdministrationNavigationService } from './Administration/Users/UsersAdministrationNavigationService';
import { UsersAdministrationService } from './Administration/Users/UsersAdministrationService';
import { AuthenticationLocaleService } from './AuthenticationLocaleService';
import { AuthenticationService } from './AuthenticationService';
import { AuthDialogService } from './Dialog/AuthDialogService';
import { PluginBootstrap } from './PluginBootstrap';
import { UserMenuService } from './UserMenu/UserMenuService';

export const manifest: PluginManifest = {
  info: {
    name: 'Authentication',
  },

  providers: [
    AuthenticationService,
    AuthDialogService,
    PluginBootstrap,
    UsersAdministrationService,
    AuthenticationLocaleService,
    CreateUserService,
    UsersAdministrationNavigationService,
    ServerConfigurationAuthenticationBootstrap,
    UserFormService,
    UserFormBaseBootstrap,
    UserMenuService,
    ConfigurationsAdministrationService,
    AuthProviderConfigurationsResource,
    CreateConfigurationService,
    ConfigurationsAdministrationNavService,
    ConfigurationFormService,
    ConfigurationOptionsTabService,
    AuthProviderConfigurationParametersResource,
  ],
};
