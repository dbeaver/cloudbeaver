/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const manifest: PluginManifest = {
  info: {
    name: 'Authentication Administration',
  },

  providers: [
    () => import('./PluginBootstrap.js').then(m => m.PluginBootstrap),
    () => import('./Administration/Users/UsersAdministrationService.js').then(m => m.UsersAdministrationService),
    () => import('./AuthenticationLocaleService.js').then(m => m.AuthenticationLocaleService),
    () => import('./Administration/Users/UsersTable/CreateUserService.js').then(m => m.CreateUserService),
    () => import('./Administration/Users/UsersAdministrationNavigationService.js').then(m => m.UsersAdministrationNavigationService),
    () => import('./Administration/Users/UserForm/AdministrationUserFormService.js').then(m => m.AdministrationUserFormService),
    () => import('./Administration/Users/Teams/TeamsAdministrationService.js').then(m => m.TeamsAdministrationService),
    () => import('./Administration/Users/Teams/CreateTeamService.js').then(m => m.CreateTeamService),
    () => import('./Administration/Users/Teams/TeamsAdministrationNavService.js').then(m => m.TeamsAdministrationNavService),
    () => import('./Administration/Users/Teams/TeamFormService.js').then(m => m.TeamFormService),
    () => import('./Administration/Users/Teams/Options/TeamOptionsTabService.js').then(m => m.TeamOptionsTabService),
    () => import('./Administration/Users/Teams/GrantedUsers/GrantedUsersTabService.js').then(m => m.GrantedUsersTabService),
    () => import('./Administration/Users/Teams/GrantedConnections/GrantedConnectionsTabService.js').then(m => m.GrantedConnectionsTabService),
    () => import('./Administration/Users/UsersTable/CreateUserBootstrap.js').then(m => m.CreateUserBootstrap),
    () => import('./Administration/Users/UserForm/UserFormBaseBootstrap.js').then(m => m.UserFormBaseBootstrap),
    () => import('./Administration/Users/UserForm/Info/UserFormInfoPartBootstrap.js').then(m => m.UserFormInfoPartBootstrap),
    () => import('./Administration/Users/UserForm/Origin/UserFormOriginPartBootstrap.js').then(m => m.UserFormOriginPartBootstrap),
    () =>
      import('./Administration/Users/UserForm/ConnectionAccess/UserFormConnectionAccessPartBootstrap.js').then(
        m => m.UserFormConnectionAccessPartBootstrap,
      ),
    () => import('./Administration/Users/UserForm/Info/UserFormInfoPartService.js').then(m => m.UserFormInfoPartService),
    () => import('./AdministrationUsersManagementService.js').then(m => m.AdministrationUsersManagementService),
    () => import('./Administration/Users/UsersTable/UsersTableOptionsPanelService.js').then(m => m.UsersTableOptionsPanelService),
    () => import('./Administration/Users/Teams/TeamsTable/TeamsTableOptionsPanelService.js').then(m => m.TeamsTableOptionsPanelService),
  ],
};
