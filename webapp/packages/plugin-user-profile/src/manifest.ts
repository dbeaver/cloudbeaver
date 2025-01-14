/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const userProfilePlugin: PluginManifest = {
  info: {
    name: 'User profile plugin',
  },

  providers: [
    () => import('./PluginBootstrap.js').then(m => m.PluginBootstrap),
    () => import('./LocaleService.js').then(m => m.LocaleService),
    () => import('./UserProfileTabsService.js').then(m => m.UserProfileTabsService),
    () => import('./UserProfileOptionsPanelService.js').then(m => m.UserProfileOptionsPanelService),
    () => import('./UserProfileForm/UserInfoPart/UserProfileFormInfoPartBootstrap.js').then(m => m.UserProfileFormInfoPartBootstrap),
    () =>
      import('./UserProfileForm/UserAuthenticationPart/UserProfileFormAuthenticationPartBootstrap.js').then(
        m => m.UserProfileFormAuthenticationPartBootstrap,
      ),
  ],
};
