/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  AdministrationLocaleService,
  AdministrationTopAppBarService,
  AdministrationScreenService,
  AdministrationItemService,
  ConfigurationWizardService,
  WizardTopAppBarService,
  AdministrationScreenServiceBootstrap,
  ConfigurationWizardPagesBootstrapService,
  ServerConfigurationService,
} from '@cloudbeaver/core-administration';
import {
  ConnectionDialogsService,
  MainMenuService,
  NavigationTreeService,
  NavNodeManagerService,
  DBObjectService,
  NavNodeExtensionsService,
  NavNodeInfoResource,
  NavTreeResource,
  ConnectionSchemaManagerService,
  NavigationTabsService,
  NavigationTreeContextMenuService,
  SettingsMenuService,
  LogViewerService,
  LogViewerMenuService,
  TopNavService,
  AppScreenService,
  CoreSettingsService,
  AdministrationTopAppBarBootstrapService,
  AppLocaleService,
} from '@cloudbeaver/core-app';
import {
  AuthInfoService,
  AuthProviderService,
  AuthProvidersResource,
  RolesManagerService,
  RolesResource,
  UsersResource,
} from '@cloudbeaver/core-authentication';
import { BlocksLocaleService } from '@cloudbeaver/core-blocks';
import {
  ConnectionsManagerService,
  ConnectionInfoResource,
  ContainerResource,
  DBDriverResource,
  DatabaseAuthModelsResource,
  ConnectionAuthService,
  ConnectionsAdministrationService,
  ConnectionsResource,
  ConnectionsLocaleService,
  DriverPropertiesService,
  ConnectionsAdministrationNavService,
} from '@cloudbeaver/core-connections';
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
  SessionResource,
} from '@cloudbeaver/core-root';
import { RouterService, ScreenService } from '@cloudbeaver/core-routing';
import { EnvironmentService, GraphQLService } from '@cloudbeaver/core-sdk';
import { LocalStorageSaveService, SettingsService } from '@cloudbeaver/core-settings';
import { ThemeService } from '@cloudbeaver/core-theming';
import { ActiveViewService } from '@cloudbeaver/core-view';

export const coreManifest: PluginManifest = {
  info: {
    name: 'DBeaver core',
  },
  depends: [],

  providers: [
    RouterService, // important, should be first because the router starts in load phase first after all plugins register phase
    AdministrationLocaleService,
    AdministrationTopAppBarService,
    AdministrationScreenService,
    AdministrationScreenServiceBootstrap,
    AdministrationItemService,
    AdministrationTopAppBarBootstrapService,
    ConfigurationWizardPagesBootstrapService,
    ConfigurationWizardService,
    ServerConfigurationService,
    WizardTopAppBarService,
    ActiveViewService,
    ProductSettingsService,
    ProductManagerService,
    PluginManagerService,
    AuthInfoService,
    AuthProviderService,
    AuthProvidersResource,
    RolesManagerService,
    RolesResource,
    UsersResource,
    ServerSettingsService,
    ServerConfigResource,
    PermissionsResource,
    SessionResource,
    SessionSettingsService,
    PermissionsService,
    CoreSettingsService,
    CommonDialogService,
    SessionExpireService,
    ConnectionsLocaleService,
    ConnectionDialogsService,
    ConnectionSchemaManagerService,
    ConnectionInfoResource,
    BlocksLocaleService,
    AppLocaleService,
    ContainerResource,
    DBDriverResource,
    DriverPropertiesService,
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
    LogViewerMenuService,
    LogViewerService,
    MainMenuService,
    TopNavService,
    NavigationTabsService,
    DatabaseAuthModelsResource,
    ConnectionAuthService,
    ConnectionsAdministrationNavService,
    ConnectionsAdministrationService,
    ConnectionsResource,
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
