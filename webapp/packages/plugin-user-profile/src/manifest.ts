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
    () => import('./PluginBootstrap').then(m => m.PluginBootstrap),
    () => import('./LocaleService').then(m => m.LocaleService),
    () => import('./UserProfileTabsService').then(m => m.UserProfileTabsService),
    () => import('./UserProfileOptionsPanelService').then(m => m.UserProfileOptionsPanelService),
    () => import('./UserProfileForm/UserProfileFormBootstrap').then(m => m.UserProfileFormBootstrap),
    () => import('./UserProfileForm/UserProfileFormService').then(m => m.UserProfileFormService),
    () => import('./UserProfileForm/UserInfoPart/UserProfileFormInfoPartBootstrap').then(m => m.UserProfileFormInfoPartBootstrap),
    () => import('./UserProfileForm/UserInfoPart/UserProfileFormInfoPartService').then(m => m.UserProfileFormInfoPartService),
    () =>
      import('./UserProfileForm/UserAuthenticationPart/UserProfileFormAuthenticationPartBootstrap').then(
        m => m.UserProfileFormAuthenticationPartBootstrap,
      ),
    () =>
      import('./UserProfileForm/UserAuthenticationPart/UserProfileFormAuthenticationPartService').then(
        m => m.UserProfileFormAuthenticationPartService,
      ),
  ],
};
