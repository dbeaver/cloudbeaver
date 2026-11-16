/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { UsersResource } from './UsersResource.js';
import { UsersGrantedTeamsResource } from './UsersGrantedTeamsResource.js';
import { UsersOriginDetailsResource } from './UsersOriginDetailsResource.js';
import { UsersMetaParametersResource } from './UsersMetaParametersResource.js';
import { UserInfoResource } from './UserInfoResource.js';
import { UserMetaParametersResource } from './UserMetaParametersResource.js';
import { UserInfoMetaParametersResource } from './UserInfoMetaParametersResource.js';
import { UserDataService } from './UserDataService.js';
import { UserConfigurationService } from './UserConfiguration/UserConfigurationService.js';
import { LocalUserDataStorage } from './LocalUserDataStorage.js';
import { UserConfigurationStorage } from './UserConfiguration/UserConfigurationStorage.js';
import { UserConfigurationResource } from './UserConfiguration/UserConfigurationResource.js';
import { UserConfigurationBootstrap } from './UserConfigurationBootstrap.js';
import { TeamsResource } from './TeamsResource.js';
import { TeamsManagerService } from './TeamsManagerService.js';
import { TeamRolesResource } from './TeamRolesResource.js';
import { TeamInfoMetaParametersResource } from './TeamInfoMetaParametersResource.js';
import { TeamMetaParametersResource } from './TeamMetaParametersResource.js';
import { LocaleService } from './LocaleService.js';
import { PasswordPolicyService } from './PasswordPolicyService.js';
import { AuthRolesResource } from './AuthRolesResource.js';
import { AuthSettingsService } from './AuthSettingsService.js';
import { AuthProvidersResource } from './AuthProvidersResource.js';
import { AuthProviderService } from './AuthProviderService.js';
import { AuthInfoService } from './AuthInfoService.js';
import { AuthConfigurationsResource } from './AuthConfigurationsResource.js';
import { AuthConfigurationParametersResource } from './AuthConfigurationParametersResource.js';
import { AppAuthService } from './AppAuthService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/core-authentication',

  services: () => [
    AppAuthService,
    UsersResource,
    UsersGrantedTeamsResource,
    UsersOriginDetailsResource,
    UsersMetaParametersResource,
    UserInfoResource,
    UserConfigurationResource,
    UserMetaParametersResource,
    UserInfoMetaParametersResource,
    UserDataService,
    UserConfigurationService,
    LocalUserDataStorage,
    UserConfigurationStorage,
    TeamsResource,
    TeamsManagerService,
    TeamRolesResource,
    TeamInfoMetaParametersResource,
    TeamMetaParametersResource,
    PasswordPolicyService,
    AuthRolesResource,
    AuthSettingsService,
    AuthProvidersResource,
    AuthProviderService,
    AuthInfoService,
    AuthConfigurationsResource,
    AuthConfigurationParametersResource,
  ],
  bootstraps: () => [LocaleService, UserConfigurationBootstrap],
});
