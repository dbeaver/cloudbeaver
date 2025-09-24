/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry, proxy, Dependency } from '@cloudbeaver/core-di';
import { UsersResource } from './UsersResource.js';
import { UsersOriginDetailsResource } from './UsersOriginDetailsResource.js';
import { UsersMetaParametersResource } from './UsersMetaParametersResource.js';
import { UserInfoResource } from './UserInfoResource.js';
import { UserMetaParametersResource } from './UserMetaParametersResource.js';
import { UserInfoMetaParametersResource } from './UserInfoMetaParametersResource.js';
import { UserDataService } from './UserDataService.js';
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

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, UserConfigurationBootstrap)
      .addSingleton(Dependency, proxy(AppAuthService))
      .addSingleton(Dependency, proxy(UsersResource))
      .addSingleton(Dependency, proxy(UsersOriginDetailsResource))
      .addSingleton(Dependency, proxy(UsersMetaParametersResource))
      .addSingleton(Dependency, proxy(UserInfoResource))
      .addSingleton(Dependency, proxy(UserMetaParametersResource))
      .addSingleton(Dependency, proxy(UserInfoMetaParametersResource))
      .addSingleton(Dependency, proxy(TeamsResource))
      .addSingleton(Dependency, proxy(TeamRolesResource))
      .addSingleton(Dependency, proxy(TeamInfoMetaParametersResource))
      .addSingleton(Dependency, proxy(TeamMetaParametersResource))
      .addSingleton(Dependency, proxy(AuthRolesResource))
      .addSingleton(Dependency, proxy(AuthProvidersResource))
      .addSingleton(Dependency, proxy(AuthConfigurationsResource))
      .addSingleton(Dependency, proxy(AuthConfigurationParametersResource))
      .addSingleton(AppAuthService)
      .addSingleton(UsersResource)
      .addSingleton(UsersOriginDetailsResource)
      .addSingleton(UsersMetaParametersResource)
      .addSingleton(UserInfoResource)
      .addSingleton(UserMetaParametersResource)
      .addSingleton(UserInfoMetaParametersResource)
      .addSingleton(UserDataService)
      .addSingleton(TeamsResource)
      .addSingleton(TeamsManagerService)
      .addSingleton(TeamRolesResource)
      .addSingleton(TeamInfoMetaParametersResource)
      .addSingleton(TeamMetaParametersResource)
      .addSingleton(PasswordPolicyService)
      .addSingleton(AuthRolesResource)
      .addSingleton(AuthSettingsService)
      .addSingleton(AuthProvidersResource)
      .addSingleton(AuthProviderService)
      .addSingleton(AuthInfoService)
      .addSingleton(AuthConfigurationsResource)
      .addSingleton(AuthConfigurationParametersResource);
  },
});
