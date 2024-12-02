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
    () => import('./AppAuthService.js').then(m => m.AppAuthService),
    () => import('./AuthConfigurationParametersResource.js').then(m => m.AuthConfigurationParametersResource),
    () => import('./AuthConfigurationsResource.js').then(m => m.AuthConfigurationsResource),
    () => import('./AuthInfoService.js').then(m => m.AuthInfoService),
    () => import('./AuthProviderService.js').then(m => m.AuthProviderService),
    () => import('./AuthProvidersResource.js').then(m => m.AuthProvidersResource),
    () => import('./AuthRolesResource.js').then(m => m.AuthRolesResource),
    () => import('./AuthSettingsService.js').then(m => m.AuthSettingsService),
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./PasswordPolicyService.js').then(m => m.PasswordPolicyService),
    () => import('./TeamMetaParametersResource.js').then(m => m.TeamMetaParametersResource),
    () => import('./TeamsManagerService.js').then(m => m.TeamsManagerService),
    () => import('./TeamsResource.js').then(m => m.TeamsResource),
    () => import('./TeamRolesResource.js').then(m => m.TeamRolesResource),
    () => import('./UserConfigurationBootstrap.js').then(m => m.UserConfigurationBootstrap),
    () => import('./UserInfoMetaParametersResource.js').then(m => m.UserInfoMetaParametersResource),
    () => import('./UserDataService.js').then(m => m.UserDataService),
    () => import('./UserInfoResource.js').then(m => m.UserInfoResource),
    () => import('./UsersOriginDetailsResource.js').then(m => m.UsersOriginDetailsResource),
    () => import('./UserMetaParametersResource.js').then(m => m.UserMetaParametersResource),
    () => import('./UsersMetaParametersResource.js').then(m => m.UsersMetaParametersResource),
    () => import('./TeamInfoMetaParametersResource.js').then(m => m.TeamInfoMetaParametersResource),
    () => import('./UsersResource.js').then(m => m.UsersResource),
  ],
};
