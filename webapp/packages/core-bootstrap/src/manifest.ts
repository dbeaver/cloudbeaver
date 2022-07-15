/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { coreAdministrationManifest } from '@cloudbeaver/core-administration';
import { coreAppManifest } from '@cloudbeaver/core-app';
import { coreAuthenticationManifest } from '@cloudbeaver/core-authentication';
import { coreBlocksManifest } from '@cloudbeaver/core-blocks';
import { coreBrowserManifest } from '@cloudbeaver/core-browser';
import { coreConnectionsManifest } from '@cloudbeaver/core-connections';
import type { PluginManifest } from '@cloudbeaver/core-di';
import { codeDialogsManifest } from '@cloudbeaver/core-dialogs';
import { coreEventsManifest } from '@cloudbeaver/core-events';
import { coreLocalizationManifest } from '@cloudbeaver/core-localization';
import { corePluginManifest } from '@cloudbeaver/core-plugin';
import { coreProductManifest } from '@cloudbeaver/core-product';
import { coreProjectsManifest } from '@cloudbeaver/core-projects';
import { coreRootManifest } from '@cloudbeaver/core-root';
import { coreRoutingManifest } from '@cloudbeaver/core-routing';
import { coreSDKManifest } from '@cloudbeaver/core-sdk';
import { coreSettingsManifest } from '@cloudbeaver/core-settings';
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

    providers: [ ],
  },
  coreRoutingManifest, // important, should be first because the router starts in load phase first after all plugins register phase
  coreThemingManifest,
  coreLocalizationManifest,
  coreBlocksManifest,
  coreSettingsManifest,
  coreEventsManifest,
  coreSDKManifest,
  coreRootManifest,
  corePluginManifest,
  coreBrowserManifest,
  coreProductManifest,
  coreProjectsManifest,
  coreAuthenticationManifest,
  coreUIManifest,
  coreViewManifest,
  coreVersionManifest,
  coreVersionUpdateManifest,
  coreConnectionsManifest,
  coreAdministrationManifest,
  codeDialogsManifest,
  coreAppManifest,
];
