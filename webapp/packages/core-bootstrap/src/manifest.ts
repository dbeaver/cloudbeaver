/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  ConnectionDialogsService, ConnectionsManagerService,
  MainMenuService, NavigationService, NavigationTreeService,
  NavNodeManagerService, DBObjectService, NavNodeExtensionsService, NavNodeInfoResource, NavTreeResource,
  ConnectionSchemaManagerService, ConnectionInfoResource, ContainerResource, DBDriverResource, NavigationTabsService,
  NavigationTreeContextMenuService,
  SettingsMenuService, LogViewerService, LogViewerMenuService, TopNavService,
  RouterService, ScreenService, AppScreenService, CoreSettingsService
} from '@cloudbeaver/core-app';
import { PluginManifest } from '@cloudbeaver/core-di';
import { CommonDialogService, ContextMenuService, SessionExpireService } from '@cloudbeaver/core-dialogs';
import { NotificationService, ExceptionsCatcherService, EventsSettingsService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { PluginManagerService } from '@cloudbeaver/core-plugin';
import { ProductManagerService, ProductSettingsService } from '@cloudbeaver/core-product';
import {
  SessionService,
  ServerService,
  PermissionsService,
  SessionSettingsService,
  ServerSettingsService,
  ServerConfigResource,
  PermissionsResource,
  SessionResource
} from '@cloudbeaver/core-root';
import { EnvironmentService, GraphQLService } from '@cloudbeaver/core-sdk';
import { LocalStorageSaveService, SettingsService } from '@cloudbeaver/core-settings';
import { ThemeService } from '@cloudbeaver/core-theming';

export const coreManifest: PluginManifest = {
  info: {
    name: 'DBeaver core',
  },
  depends: [],

  providers: [
    ProductSettingsService,
    ProductManagerService,
    PluginManagerService,
    ServerSettingsService,
    ServerConfigResource,
    PermissionsResource,
    SessionResource,
    SessionSettingsService,
    PermissionsService,
    CoreSettingsService,
    CommonDialogService,
    SessionExpireService,
    ConnectionDialogsService,
    ConnectionSchemaManagerService,
    ConnectionInfoResource,
    ContainerResource,
    DBDriverResource,
    ConnectionsManagerService,
    RouterService,
    ScreenService,
    AppScreenService,
    ContextMenuService,
    EnvironmentService,
    ExceptionsCatcherService,
    EventsSettingsService,
    GraphQLService,
    LocalStorageSaveService,
    LocalizationService,
    LogViewerMenuService,
    LogViewerService,
    MainMenuService,
    TopNavService,
    NavigationService,
    NavigationTabsService,
    NavigationTreeContextMenuService,
    NavigationTreeService,
    NavNodeManagerService,
    NavNodeExtensionsService,
    NavNodeInfoResource,
    NavTreeResource,
    DBObjectService,
    NotificationService,
    SessionService,
    SettingsMenuService,
    SettingsService,
    ThemeService,
    ServerService,
  ],

  async initialize() {
    // Note that the initialization of the core occurs in AppBootstrap
    // and it is called before the initialization phase of all manifests
  },

};
