/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { LocaleService } from './LocaleService';
import { PluginBootstrap } from './PluginBootstrap';
import { UserProfileFormAuthenticationPartBootstrap } from './UserProfileForm/UserAuthenticationPart/UserProfileFormAuthenticationPartBootstrap';
import { UserProfileFormAuthenticationPartService } from './UserProfileForm/UserAuthenticationPart/UserProfileFormAuthenticationPartService';
import { UserProfileFormInfoPartBootstrap } from './UserProfileForm/UserInfoPart/UserProfileFormInfoPartBootstrap';
import { UserProfileFormInfoPartService } from './UserProfileForm/UserInfoPart/UserProfileFormInfoPartService';
import { UserProfileFormBootstrap } from './UserProfileForm/UserProfileFormBootstrap';
import { UserProfileFormService } from './UserProfileForm/UserProfileFormService';
import { UserProfileOptionsPanelService } from './UserProfileOptionsPanelService';
import { UserProfileTabsService } from './UserProfileTabsService';

export const userProfilePlugin: PluginManifest = {
  info: {
    name: 'User profile plugin',
  },

  providers: [
    PluginBootstrap,
    LocaleService,
    UserProfileTabsService,
    UserProfileOptionsPanelService,
    UserProfileFormBootstrap,
    UserProfileFormService,
    UserProfileFormInfoPartBootstrap,
    UserProfileFormInfoPartService,
    UserProfileFormAuthenticationPartBootstrap,
    UserProfileFormAuthenticationPartService,
  ],
};
