/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
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
import { CreateTeamService } from './Administration/Users/Teams/CreateTeamService';
import { GrantedConnectionsTabService } from './Administration/Users/Teams/GrantedConnections/GrantedConnectionsTabService';
import { GrantedUsersTabService } from './Administration/Users/Teams/GrantedUsers/GrantedUsersTabService';
import { TeamOptionsTabService } from './Administration/Users/Teams/Options/TeamOptionsTabService';
import { TeamFormService } from './Administration/Users/Teams/TeamFormService';
import { TeamsAdministrationNavService } from './Administration/Users/Teams/TeamsAdministrationNavService';
import { TeamsAdministrationService } from './Administration/Users/Teams/TeamsAdministrationService';
import { ConnectionAccessTabBootstrap } from './Administration/Users/UserForm/ConnectionAccess/ConnectionAccessTabBootstrap';
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
    UserFormBaseBootstrap,
    AuthConfigurationsAdministrationService,
    CreateAuthConfigurationService,
    AuthConfigurationsAdministrationNavService,
    AuthConfigurationFormService,
    AuthConfigurationOptionsTabService,
    TeamsAdministrationService,
    CreateTeamService,
    TeamsAdministrationNavService,
    TeamFormService,
    TeamOptionsTabService,
    GrantedUsersTabService,
    GrantedConnectionsTabService,
    ConnectionAccessTabBootstrap,
  ],
};
