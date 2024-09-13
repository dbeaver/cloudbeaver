/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const coreAuthenticationManifest: PluginManifest = {
  info: {
    name: 'Core Authentication',
  },

  providers: [
    () => import('./AppAuthService').then(m => m.AppAuthService),
    () => import('./AuthConfigurationParametersResource').then(m => m.AuthConfigurationParametersResource),
    () => import('./AuthConfigurationsResource').then(m => m.AuthConfigurationsResource),
    () => import('./AuthInfoService').then(m => m.AuthInfoService),
    () => import('./AuthProviderService').then(m => m.AuthProviderService),
    () => import('./AuthProvidersResource').then(m => m.AuthProvidersResource),
    () => import('./AuthRolesResource').then(m => m.AuthRolesResource),
    () => import('./AuthSettingsService').then(m => m.AuthSettingsService),
    () => import('./LocaleService').then(m => m.LocaleService),
    () => import('./PasswordPolicyService').then(m => m.PasswordPolicyService),
    () => import('./TeamMetaParametersResource').then(m => m.TeamMetaParametersResource),
    () => import('./TeamsManagerService').then(m => m.TeamsManagerService),
    () => import('./TeamsResource').then(m => m.TeamsResource),
    () => import('./TeamInfoMetaParametersResource').then(m => m.TeamInfoMetaParametersResource),
    () => import('./TeamRolesResource').then(m => m.TeamRolesResource),
    () => import('./UserConfigurationBootstrap').then(m => m.UserConfigurationBootstrap),
    () => import('./UserDataService').then(m => m.UserDataService),
    () => import('./UserInfoResource').then(m => m.UserInfoResource),
    () => import('./UserMetaParametersResource').then(m => m.UserMetaParametersResource),
    () => import('./UserInfoMetaParametersResource').then(m => m.UserInfoMetaParametersResource),
    () => import('./UsersMetaParametersResource').then(m => m.UsersMetaParametersResource),
    () => import('./UsersOriginDetailsResource').then(m => m.UsersOriginDetailsResource),
    () => import('./UsersResource').then(m => m.UsersResource),
  ],
};
