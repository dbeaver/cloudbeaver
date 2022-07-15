/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { coreAdministrationManifest } from '@cloudbeaver/core-administration';
import {
  ConnectionDialogsService,
  MainMenuService,
  NavigationTreeService,
  NavNodeManagerService,
  DBObjectResource,
  NavNodeViewService,
  NavNodeExtensionsService,
  NavNodeInfoResource,
  SqlGeneratorsBootstrap,
  SqlGeneratorsResource,
  NavTreeResource,
  ConnectionSchemaManagerService,
  NavigationTabsService,
  NavNodeContextMenuService,
  LogViewerService,
  LogViewerBootstrap,
  TopNavService,
  AppScreenService,
  CoreSettingsService,
  AdministrationTopAppBarBootstrapService,
  AppLocaleService,
  SessionExpiredDialogService,
  SessionExpireWarningDialogService,
  ConnectionSchemaManagerBootstrap,
  NavigationTreeBootstrap,
  ToolsPanelService,
  QuotasService,
  ElementsTreeToolsMenuService,
} from '@cloudbeaver/core-app';
import { coreAuthenticationManifest } from '@cloudbeaver/core-authentication';
import { BlocksLocaleService } from '@cloudbeaver/core-blocks';
import { coreConnectionsManifest } from '@cloudbeaver/core-connections';
import type { PluginManifest } from '@cloudbeaver/core-di';
import { CommonDialogService, ContextMenuService } from '@cloudbeaver/core-dialogs';
import { NotificationService, ExceptionsCatcherService, EventsSettingsService } from '@cloudbeaver/core-events';
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

    providers: [
      AdministrationTopAppBarBootstrapService,
      CoreSettingsService,
      QuotasService,
      CommonDialogService,
      SessionExpireWarningDialogService,
      SessionExpiredDialogService,
      ConnectionDialogsService,
      ConnectionSchemaManagerBootstrap,
      ConnectionSchemaManagerService,
      BlocksLocaleService,
      AppLocaleService,
      AppScreenService,
      ContextMenuService,
      ExceptionsCatcherService,
      EventsSettingsService,
      LogViewerBootstrap,
      LogViewerService,
      MainMenuService,
      TopNavService,
      NavigationTabsService,
      NavNodeContextMenuService,
      NavigationTreeService,
      NavNodeManagerService,
      NavNodeViewService,
      NavNodeExtensionsService,
      NavNodeInfoResource,
      SqlGeneratorsBootstrap,
      SqlGeneratorsResource,
      ElementsTreeToolsMenuService,
      NavigationTreeBootstrap,
      NavTreeResource,
      DBObjectResource,
      NotificationService,
      ToolsPanelService,
    ],
  },
  coreRoutingManifest, // important, should be first because the router starts in load phase first after all plugins register phase
  coreThemingManifest,
  coreLocalizationManifest,
  coreSettingsManifest,
  coreProjectsManifest,
  coreAdministrationManifest,
  coreSDKManifest,
  coreAuthenticationManifest,
  coreUIManifest,
  coreViewManifest,
  coreVersionManifest,
  coreVersionUpdateManifest,
  coreRootManifest,
  coreConnectionsManifest,
  corePluginManifest,
  coreProductManifest,
];
