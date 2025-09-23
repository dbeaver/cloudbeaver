/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { UserProfileTabsService } from './UserProfileTabsService.js';
import { UserProfileOptionsPanelService } from './UserProfileOptionsPanelService.js';
import { UserProfileFormInfoPartBootstrap } from './UserProfileForm/UserInfoPart/UserProfileFormInfoPartBootstrap.js';
import { UserProfileFormAuthenticationPartBootstrap } from './UserProfileForm/UserAuthenticationPart/UserProfileFormAuthenticationPartBootstrap.js';
import { PluginBootstrap } from './PluginBootstrap.js';
import { LocaleService } from './LocaleService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-user-profile',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, PluginBootstrap)
      .addSingleton(Bootstrap, proxy(UserProfileFormAuthenticationPartBootstrap))
      .addSingleton(Bootstrap, proxy(UserProfileFormInfoPartBootstrap))
      .addSingleton(UserProfileTabsService)
      .addSingleton(UserProfileOptionsPanelService)
      .addSingleton(UserProfileFormInfoPartBootstrap)
      .addSingleton(UserProfileFormAuthenticationPartBootstrap);
  },
});
