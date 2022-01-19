/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { AppAuthService } from './AppAuthService';
import { AuthConfigurationParametersResource } from './AuthConfigurationParametersResource';
import { AuthConfigurationsResource } from './AuthConfigurationsResource';
import { AuthInfoService } from './AuthInfoService';
import { AuthProviderService } from './AuthProviderService';
import { AuthProvidersResource } from './AuthProvidersResource';
import { AuthSettingsService } from './AuthSettingsService';
import { RolesManagerService } from './RolesManagerService';
import { RolesResource } from './RolesResource';
import { UserDataService } from './UserDataService';
import { UserInfoResource } from './UserInfoResource';
import { UserMetaParametersResource } from './UserMetaParametersResource';
import { UsersResource } from './UsersResource';

export const manifest: PluginManifest = {
  info: {
    name: 'Core Authentication',
  },

  providers: [
    AppAuthService,
    AuthInfoService,
    AuthProviderService,
    AuthProvidersResource,
    AuthSettingsService,
    AuthConfigurationsResource,
    AuthConfigurationParametersResource,
    RolesManagerService,
    RolesResource,
    UserDataService,
    UserInfoResource,
    UsersResource,
    UserMetaParametersResource,
  ],
};
