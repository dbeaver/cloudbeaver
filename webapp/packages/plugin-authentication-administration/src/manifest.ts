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
    () => import('./PluginBootstrap').then(m => m.PluginBootstrap),
    () => import('./Administration/Users/UsersAdministrationService').then(m => m.UsersAdministrationService),
    () => import('./AuthenticationLocaleService').then(m => m.AuthenticationLocaleService),
    () => import('./Administration/Users/UsersTable/CreateUserService').then(m => m.CreateUserService),
    () => import('./Administration/Users/UsersAdministrationNavigationService').then(m => m.UsersAdministrationNavigationService),
    () => import('./Administration/Users/UserForm/AdministrationUserFormService').then(m => m.AdministrationUserFormService),
    () => import('./Administration/Users/Teams/TeamsAdministrationService').then(m => m.TeamsAdministrationService),
    () => import('./Administration/Users/Teams/CreateTeamService').then(m => m.CreateTeamService),
    () => import('./Administration/Users/Teams/TeamsAdministrationNavService').then(m => m.TeamsAdministrationNavService),
    () => import('./Administration/Users/Teams/TeamFormService').then(m => m.TeamFormService),
    () => import('./Administration/Users/Teams/Options/TeamOptionsTabService').then(m => m.TeamOptionsTabService),
    () => import('./Administration/Users/Teams/GrantedUsers/GrantedUsersTabService').then(m => m.GrantedUsersTabService),
    () => import('./Administration/Users/Teams/GrantedConnections/GrantedConnectionsTabService').then(m => m.GrantedConnectionsTabService),
    () => import('./Administration/Users/UsersTable/CreateUserBootstrap').then(m => m.CreateUserBootstrap),
    () => import('./Administration/Users/UserForm/UserFormBaseBootstrap').then(m => m.UserFormBaseBootstrap),
    () => import('./Administration/Users/UserForm/Info/UserFormInfoPartBootstrap').then(m => m.UserFormInfoPartBootstrap),
    () => import('./Administration/Users/UserForm/Origin/UserFormOriginPartBootstrap').then(m => m.UserFormOriginPartBootstrap),
    () =>
      import('./Administration/Users/UserForm/ConnectionAccess/UserFormConnectionAccessPartBootstrap').then(
        m => m.UserFormConnectionAccessPartBootstrap,
      ),
    () => import('./Administration/Users/UserForm/Info/UserFormInfoPartService').then(m => m.UserFormInfoPartService),
    () => import('./AdministrationUsersManagementService').then(m => m.AdministrationUsersManagementService),
  ],
};
