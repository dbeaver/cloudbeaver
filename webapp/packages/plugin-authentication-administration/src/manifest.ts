/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { ServerConfigurationAuthenticationBootstrap } from './Administration/ServerConfiguration/ServerConfigurationAuthenticationBootstrap';
import { CreateTeamService } from './Administration/Users/Teams/CreateTeamService';
import { GrantedConnectionsTabService } from './Administration/Users/Teams/GrantedConnections/GrantedConnectionsTabService';
import { GrantedUsersTabService } from './Administration/Users/Teams/GrantedUsers/GrantedUsersTabService';
import { TeamOptionsTabService } from './Administration/Users/Teams/Options/TeamOptionsTabService';
import { TeamFormService } from './Administration/Users/Teams/TeamFormService';
import { TeamsAdministrationNavService } from './Administration/Users/Teams/TeamsAdministrationNavService';
import { TeamsAdministrationService } from './Administration/Users/Teams/TeamsAdministrationService';
import { AdministrationUserFormService } from './Administration/Users/UserForm/AdministrationUserFormService';
import { UserFormConnectionAccessPartBootstrap } from './Administration/Users/UserForm/ConnectionAccess/UserFormConnectionAccessPartBootstrap';
import { UserFormInfoPartBootstrap } from './Administration/Users/UserForm/Info/UserFormInfoPartBootstrap';
import { UserFormInfoPartService } from './Administration/Users/UserForm/Info/UserFormInfoPartService';
import { UserFormOriginPartBootstrap } from './Administration/Users/UserForm/Origin/UserFormOriginPartBootstrap';
import { UserFormBaseBootstrap } from './Administration/Users/UserForm/UserFormBaseBootstrap';
import { UsersAdministrationNavigationService } from './Administration/Users/UsersAdministrationNavigationService';
import { UsersAdministrationService } from './Administration/Users/UsersAdministrationService';
import { CreateUserBootstrap } from './Administration/Users/UsersTable/CreateUserBootstrap';
import { CreateUserService } from './Administration/Users/UsersTable/CreateUserService';
import { AdministrationUsersManagementService } from './AdministrationUsersManagementService';
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
    AdministrationUserFormService,
    TeamsAdministrationService,
    CreateTeamService,
    TeamsAdministrationNavService,
    TeamFormService,
    TeamOptionsTabService,
    GrantedUsersTabService,
    GrantedConnectionsTabService,
    CreateUserBootstrap,
    UserFormBaseBootstrap,
    UserFormInfoPartBootstrap,
    UserFormOriginPartBootstrap,
    UserFormConnectionAccessPartBootstrap,
    UserFormInfoPartService,
    AdministrationUsersManagementService,
  ],
};
