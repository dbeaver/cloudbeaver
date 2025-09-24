/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { PluginBootstrap } from './PluginBootstrap.js';
import { AuthenticationLocaleService } from './AuthenticationLocaleService.js';
import { UsersTableOptionsPanelService } from './Administration/Users/UsersTable/UsersTableOptionsPanelService.js';
import { CreateUserService } from './Administration/Users/UsersTable/CreateUserService.js';
import { AdministrationUsersManagementService } from './AdministrationUsersManagementService.js';
import { CreateUserBootstrap } from './Administration/Users/UsersTable/CreateUserBootstrap.js';
import { UsersAdministrationService } from './Administration/Users/UsersAdministrationService.js';
import { UserFormBaseBootstrap } from './Administration/Users/UserForm/UserFormBaseBootstrap.js';
import { UsersAdministrationNavigationService } from './Administration/Users/UsersAdministrationNavigationService.js';
import { UserFormOriginPartBootstrap } from './Administration/Users/UserForm/Origin/UserFormOriginPartBootstrap.js';
import { UserFormInfoPartService } from './Administration/Users/UserForm/Info/UserFormInfoPartService.js';
import { UserFormInfoPartBootstrap } from './Administration/Users/UserForm/Info/UserFormInfoPartBootstrap.js';
import { UserFormConnectionAccessPartBootstrap } from './Administration/Users/UserForm/ConnectionAccess/UserFormConnectionAccessPartBootstrap.js';
import { TeamsTableOptionsPanelService } from './Administration/Users/Teams/TeamsTable/TeamsTableOptionsPanelService.js';
import { AdministrationUserFormService } from './Administration/Users/UserForm/AdministrationUserFormService.js';
import { CreateTeamService } from './Administration/Users/Teams/TeamsTable/CreateTeamService.js';
import { TeamsAdministrationFormService } from './Administration/Users/Teams/TeamsForm/TeamsAdministrationFormService.js';
import { TeamOptionsTabService } from './Administration/Users/Teams/TeamsForm/Options/TeamOptionsTabService.js';
import { GrantedUsersTabService } from './Administration/Users/Teams/TeamsForm/GrantedUsers/GrantedUsersTabService.js';
import { GrantedConnectionsTabService } from './Administration/Users/Teams/TeamsForm/GrantedConnections/GrantedConnectionsTabService.js';
import { TeamsAdministrationNavService } from './Administration/Users/Teams/TeamsAdministrationNavService.js';
import { TeamsAdministrationService } from './Administration/Users/Teams/TeamsAdministrationService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-authentication-administration',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, PluginBootstrap)
      .addSingleton(Bootstrap, CreateUserBootstrap)
      .addSingleton(Bootstrap, UserFormBaseBootstrap)
      .addSingleton(Bootstrap, UserFormOriginPartBootstrap)
      .addSingleton(Bootstrap, UserFormInfoPartBootstrap)
      .addSingleton(Bootstrap, UserFormConnectionAccessPartBootstrap)
      .addSingleton(Bootstrap, proxy(UsersAdministrationService))
      .addSingleton(Bootstrap, TeamOptionsTabService)
      .addSingleton(Bootstrap, AuthenticationLocaleService)
      .addSingleton(Bootstrap, GrantedUsersTabService)
      .addSingleton(Bootstrap, GrantedConnectionsTabService)
      .addSingleton(TeamsAdministrationService)
      .addSingleton(UsersTableOptionsPanelService)
      .addSingleton(CreateUserService)
      .addSingleton(AdministrationUsersManagementService)
      .addSingleton(UsersAdministrationService)
      .addSingleton(UsersAdministrationNavigationService)
      .addSingleton(UserFormInfoPartService)
      .addSingleton(TeamsTableOptionsPanelService)
      .addSingleton(AdministrationUserFormService)
      .addSingleton(CreateTeamService)
      .addSingleton(TeamsAdministrationFormService)
      .addSingleton(TeamsAdministrationNavService);
  },
});
