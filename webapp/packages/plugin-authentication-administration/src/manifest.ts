/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { AuthConfigurationFormService } from './Administration/IdentityProviders/AuthConfigurationFormService';
import { AuthConfigurationsAdministrationNavService } from './Administration/IdentityProviders/AuthConfigurationsAdministrationNavService';
import { AuthConfigurationsAdministrationService } from './Administration/IdentityProviders/AuthConfigurationsAdministrationService';
import { CreateAuthConfigurationService } from './Administration/IdentityProviders/CreateAuthConfigurationService';
import { AuthConfigurationOptionsTabService } from './Administration/IdentityProviders/Options/AuthConfigurationOptionsTabService';
import { ServerConfigurationAuthenticationBootstrap } from './Administration/ServerConfiguration/ServerConfigurationAuthenticationBootstrap';
import { CreateMetaParameterService } from './Administration/Users/MetaParameters/CreateMetaParameterService';
import { CreateRoleService } from './Administration/Users/Roles/CreateRoleService';
import { GrantedConnectionsTabService } from './Administration/Users/Roles/GrantedConnections/GrantedConnectionsTabService';
import { GrantedUsersTabService } from './Administration/Users/Roles/GrantedUsers/GrantedUsersTabService';
import { RoleOptionsTabService } from './Administration/Users/Roles/Options/RoleOptionsTabService';
import { RoleFormService } from './Administration/Users/Roles/RoleFormService';
import { RolesAdministrationNavService } from './Administration/Users/Roles/RolesAdministrationNavService';
import { RolesAdministrationService } from './Administration/Users/Roles/RolesAdministrationService';
import { UserFormBaseBootstrap } from './Administration/Users/UserForm/UserFormBaseBootstrap';
import { UserFormService } from './Administration/Users/UserForm/UserFormService';
import { UsersAdministrationNavigationService } from './Administration/Users/UsersAdministrationNavigationService';
import { UsersAdministrationService } from './Administration/Users/UsersAdministrationService';
import { CreateUserService } from './Administration/Users/UsersTable/CreateUserService';
import { AuthenticationLocaleService } from './AuthenticationLocaleService';
import { PluginBootstrap } from './PluginBootstrap';

export const manifest: PluginManifest = {
  info: {
    name: 'Authentication Administration',
  },

  providers: [
    PluginBootstrap,
    UsersAdministrationService,
    AuthenticationLocaleService,
    CreateUserService,
    UsersAdministrationNavigationService,
    ServerConfigurationAuthenticationBootstrap,
    UserFormService,
    CreateMetaParameterService,
    UserFormBaseBootstrap,
    AuthConfigurationsAdministrationService,
    CreateAuthConfigurationService,
    AuthConfigurationsAdministrationNavService,
    AuthConfigurationFormService,
    AuthConfigurationOptionsTabService,
    RolesAdministrationService,
    CreateRoleService,
    RolesAdministrationNavService,
    RoleFormService,
    RoleOptionsTabService,
    GrantedUsersTabService,
    GrantedConnectionsTabService,
  ],
};
