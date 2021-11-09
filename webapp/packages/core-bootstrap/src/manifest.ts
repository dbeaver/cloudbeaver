/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  AdministrationLocaleService,
  AdministrationSettingsService,
  AdministrationTopAppBarService,
  AdministrationScreenService,
  AdministrationItemService,
  ConfigurationWizardService,
  WizardTopAppBarService,
  AdministrationScreenServiceBootstrap
} from '@cloudbeaver/core-administration';
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
  SettingsMenuService,
  LogViewerService,
  LogViewerBootstrap,
  TopNavService,
  AppScreenService,
  CoreSettingsService,
  AdministrationTopAppBarBootstrapService,
  AppLocaleService,
  SessionExpiredDialogService,
  SessionExpireWarningDialogService
} from '@cloudbeaver/core-app';
import { coreAuthenticationManifest } from '@cloudbeaver/core-authentication';
import { BlocksLocaleService } from '@cloudbeaver/core-blocks';
import {
  ConnectionExecutionContextResource,
  ConnectionExecutionContextService,
  ConnectionsManagerService,
  ConnectionInfoResource,
  ContainerResource,
  DBDriverResource,
  NetworkHandlerResource,
  DatabaseAuthModelsResource,
  ConnectionsLocaleService,
} from '@cloudbeaver/core-connections';
import type { PluginManifest } from '@cloudbeaver/core-di';
import { CommonDialogService, ContextMenuService } from '@cloudbeaver/core-dialogs';
import { NotificationService, ExceptionsCatcherService, EventsSettingsService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { PluginManagerService } from '@cloudbeaver/core-plugin';
import { ProductManagerService, ProductSettingsService } from '@cloudbeaver/core-product';
import {
  NetworkStateService,
  SessionService,
  ServerService,
  PermissionsService,
  SessionSettingsService,
  ServerSettingsService,
  ServerConfigResource,
  FeaturesResource,
  PermissionsResource,
  SessionDataResource,
  SessionResource,
  SessionExpireService
} from '@cloudbeaver/core-root';
import { RouterService, ScreenService } from '@cloudbeaver/core-routing';
import { EnvironmentService, GraphQLService } from '@cloudbeaver/core-sdk';
import { LocalStorageSaveService, SettingsService } from '@cloudbeaver/core-settings';
import { ThemeService } from '@cloudbeaver/core-theming';
import { coreUIManifest } from '@cloudbeaver/core-ui';
import { coreViewManifest } from '@cloudbeaver/core-view';

export const coreManifests: PluginManifest[] = [
  {
    info: {
      name: 'DBeaver core',
    },
    depends: [],

    providers: [
      RouterService, // important, should be first because the router starts in load phase first after all plugins register phase
      NetworkStateService,
      AdministrationLocaleService,
      AdministrationSettingsService,
      AdministrationTopAppBarService,
      AdministrationScreenService,
      AdministrationScreenServiceBootstrap,
      AdministrationItemService,
      AdministrationTopAppBarBootstrapService,
      ConfigurationWizardService,
      WizardTopAppBarService,
      ProductSettingsService,
      ProductManagerService,
      PluginManagerService,
      ServerSettingsService,
      ServerConfigResource,
      FeaturesResource,
      PermissionsResource,
      SessionResource,
      SessionDataResource,
      SessionSettingsService,
      PermissionsService,
      CoreSettingsService,
      CommonDialogService,
      SessionExpireService,
      SessionExpireWarningDialogService,
      SessionExpiredDialogService,
      ConnectionsLocaleService,
      ConnectionDialogsService,
      ConnectionSchemaManagerService,
      ConnectionInfoResource,
      BlocksLocaleService,
      AppLocaleService,
      ContainerResource,
      DBDriverResource,
      NetworkHandlerResource,
      ConnectionExecutionContextResource,
      ConnectionExecutionContextService,
      ConnectionsManagerService,
      ScreenService,
      AppScreenService,
      ContextMenuService,
      EnvironmentService,
      ExceptionsCatcherService,
      EventsSettingsService,
      GraphQLService,
      LocalStorageSaveService,
      LocalizationService,
      LogViewerBootstrap,
      LogViewerService,
      MainMenuService,
      TopNavService,
      NavigationTabsService,
      DatabaseAuthModelsResource,
      NavNodeContextMenuService,
      NavigationTreeService,
      NavNodeManagerService,
      NavNodeViewService,
      NavNodeExtensionsService,
      NavNodeInfoResource,
      SqlGeneratorsBootstrap,
      SqlGeneratorsResource,
      NavTreeResource,
      DBObjectResource,
      NotificationService,
      SessionService,
      SettingsMenuService,
      SettingsService,
      ThemeService,
      ServerService,
    ],
  },
  coreAuthenticationManifest,
  coreUIManifest,
  coreViewManifest,
];
