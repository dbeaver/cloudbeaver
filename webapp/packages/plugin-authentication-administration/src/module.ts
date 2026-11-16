/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { TeamsAdministrationNavService } from './Administration/Users/Teams/TeamsAdministrationNavService.js';
import { TeamsAdministrationService } from './Administration/Users/Teams/TeamsAdministrationService.js';
import { GrantedConnectionsTabService } from './Administration/Users/Teams/TeamsForm/GrantedConnections/GrantedConnectionsTabService.js';
import { GrantedUsersTabService } from './Administration/Users/Teams/TeamsForm/GrantedUsers/GrantedUsersTabService.js';
import { TeamOptionsTabService } from './Administration/Users/Teams/TeamsForm/Options/TeamOptionsTabService.js';
import { TeamsAdministrationFormService } from './Administration/Users/Teams/TeamsForm/TeamsAdministrationFormService.js';
import { CreateTeamService } from './Administration/Users/Teams/TeamsTable/CreateTeamService.js';
import { TeamsTableOptionsPanelService } from './Administration/Users/Teams/TeamsTable/TeamsTableOptionsPanelService.js';
import { AdministrationUserFormService } from './Administration/Users/UserForm/AdministrationUserFormService.js';
import { UserFormConnectionAccessPartBootstrap } from './Administration/Users/UserForm/ConnectionAccess/UserFormConnectionAccessPartBootstrap.js';
import { UserFormInfoPartBootstrap } from './Administration/Users/UserForm/Info/UserFormInfoPartBootstrap.js';
import { UserFormInfoPartService } from './Administration/Users/UserForm/Info/UserFormInfoPartService.js';
import { UserFormOriginPartBootstrap } from './Administration/Users/UserForm/Origin/UserFormOriginPartBootstrap.js';
import { UserFormBaseBootstrap } from './Administration/Users/UserForm/UserFormBaseBootstrap.js';
import { UsersAdministrationNavigationService } from './Administration/Users/UsersAdministrationNavigationService.js';
import { UsersAdministrationService } from './Administration/Users/UsersAdministrationService.js';
import { CreateUserBootstrap } from './Administration/Users/UsersTable/CreateUserBootstrap.js';
import { CreateUserService } from './Administration/Users/UsersTable/CreateUserService.js';
import { UsersTableOptionsPanelService } from './Administration/Users/UsersTable/UsersTableOptionsPanelService.js';
import { AdministrationUsersManagementService } from './AdministrationUsersManagementService.js';
import { AuthenticationLocaleService } from './AuthenticationLocaleService.js';
import { PluginBootstrap } from './PluginBootstrap.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-authentication-administration',

  services: () => [
    TeamsAdministrationService,
    UsersTableOptionsPanelService,
    CreateUserService,
    AdministrationUsersManagementService,
    UsersAdministrationService,
    UsersAdministrationNavigationService,
    UserFormInfoPartService,
    TeamsTableOptionsPanelService,
    AdministrationUserFormService,
    CreateTeamService,
    TeamsAdministrationFormService,
    TeamsAdministrationNavService,
  ],
  bootstraps: () => [
    PluginBootstrap,
    CreateUserBootstrap,
    UserFormBaseBootstrap,
    UserFormOriginPartBootstrap,
    UserFormInfoPartBootstrap,
    UserFormConnectionAccessPartBootstrap,
    UsersAdministrationService,
    TeamOptionsTabService,
    AuthenticationLocaleService,
    GrantedUsersTabService,
    GrantedConnectionsTabService,
  ],
});
