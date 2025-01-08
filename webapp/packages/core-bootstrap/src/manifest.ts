/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { coreAdministrationManifest } from '@cloudbeaver/core-administration';
import { coreAppManifest } from '@cloudbeaver/core-app';
import { coreAuthenticationManifest } from '@cloudbeaver/core-authentication';
import { coreBlocksManifest } from '@cloudbeaver/core-blocks';
import { coreBrowserManifest } from '@cloudbeaver/core-browser';
import { coreBrowserCookiesManifest } from '@cloudbeaver/core-browser-cookies';
import { coreBrowserSettingsManifest } from '@cloudbeaver/core-browser-settings';
import { coreClientActivityManifest } from '@cloudbeaver/core-client-activity';
import { coreConnectionsManifest } from '@cloudbeaver/core-connections';
import { coreDIManifest, type PluginManifest } from '@cloudbeaver/core-di';
import { coreDialogsManifest } from '@cloudbeaver/core-dialogs';
import { coreEventsManifest } from '@cloudbeaver/core-events';
import { coreLinksManifest } from '@cloudbeaver/core-links';
import { coreLocalizationManifest } from '@cloudbeaver/core-localization';
import { coreNavigationTree } from '@cloudbeaver/core-navigation-tree';
import { coreProductManifest } from '@cloudbeaver/core-product';
import { coreProjectsManifest } from '@cloudbeaver/core-projects';
import { coreResourceManifest } from '@cloudbeaver/core-resource';
import { resourceManagerManifest } from '@cloudbeaver/core-resource-manager';
import { coreRootManifest } from '@cloudbeaver/core-root';
import { coreRoutingManifest } from '@cloudbeaver/core-routing';
import { coreSDKManifest } from '@cloudbeaver/core-sdk';
import { coreServerLocalization } from '@cloudbeaver/core-server-localization';
import { coreSessionLocalization } from '@cloudbeaver/core-session-localization';
import { coreSettingsManifest } from '@cloudbeaver/core-settings';
import { coreSettingsLocalizationManifest } from '@cloudbeaver/core-settings-localization';
import { coreSettingsUserManifest } from '@cloudbeaver/core-settings-user';
import { coreStorageManifest } from '@cloudbeaver/core-storage';
import { coreTaskManagerManifest } from '@cloudbeaver/core-task-manager';
import { coreThemingManifest } from '@cloudbeaver/core-theming';
import { coreUIManifest } from '@cloudbeaver/core-ui';
import { coreVersionManifest } from '@cloudbeaver/core-version';
import { coreVersionUpdateManifest } from '@cloudbeaver/core-version-update';
import { coreViewManifest } from '@cloudbeaver/core-view';

export const coreManifests: PluginManifest[] = [
  {
    info: {
      name: 'DBeaver core',
    },
    depends: [],

    providers: [],
  },
  coreDIManifest,
  coreRoutingManifest, // important, should be first because the router starts in load phase first after all plugins register phase
  coreBrowserManifest,
  coreThemingManifest,
  coreLocalizationManifest,
  coreSettingsLocalizationManifest,
  coreSessionLocalization,
  coreServerLocalization,
  coreBlocksManifest,
  coreSettingsManifest,
  coreStorageManifest,
  coreEventsManifest,
  coreResourceManifest,
  coreSDKManifest,
  coreRootManifest,
  coreLinksManifest,
  coreBrowserSettingsManifest,
  coreBrowserCookiesManifest,
  coreProductManifest,
  coreProjectsManifest,
  coreAuthenticationManifest,
  coreUIManifest,
  coreViewManifest,
  coreVersionManifest,
  coreVersionUpdateManifest,
  coreConnectionsManifest,
  coreAdministrationManifest,
  coreDialogsManifest,
  resourceManagerManifest,
  coreAppManifest,
  coreClientActivityManifest,
  coreNavigationTree,
  coreSettingsUserManifest,
  coreTaskManagerManifest,
];
