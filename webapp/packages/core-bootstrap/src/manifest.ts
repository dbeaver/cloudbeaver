/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
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
  AdministrationScreenServiceBootstrap
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
  LogViewerBootstrap,
  TopNavService,
  AppScreenService,
  CoreSettingsService,
  AdministrationTopAppBarBootstrapService,
  AppLocaleService,
  SessionExpiredDialogService,
  SessionExpireWarningDialogService
} from '@cloudbeaver/core-app';
import {
  AppAuthService,
  AuthInfoService,
  AuthProviderService,
  AuthProvidersResource,
  RolesManagerService,
  RolesResource,
  UserInfoResource,
  UsersResource
} from '@cloudbeaver/core-authentication';
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
  ConnectionAuthService,
  ConnectionsAdministrationService,
  ConnectionsResource,
  ConnectionsLocaleService,
  ConnectionsAdministrationNavService,
  CreateConnectionService,
  ConnectionManualService,
  ConnectionSearchService,
  CreateConnectionBaseBootstrap,
  ConnectionFormService,
  ConnectionOptionsTabService,
  ConnectionDriverPropertiesTabService,
  ConnectionSSHTabService,
  ConnectionOriginInfoTabService,
  ConnectionAccessTabService
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
  PermissionsResource,
  SessionDataResource,
  SessionResource,
  SessionExpireService
} from '@cloudbeaver/core-root';
import { RouterService, ScreenService } from '@cloudbeaver/core-routing';
import { EnvironmentService, GraphQLService } from '@cloudbeaver/core-sdk';
import { LocalStorageSaveService, SettingsService } from '@cloudbeaver/core-settings';
import { ThemeService } from '@cloudbeaver/core-theming';
import { NavigationService, OptionsPanelService, ClipboardBootstrap, ClipboardService } from '@cloudbeaver/core-ui';
import { ActiveViewService } from '@cloudbeaver/core-view';

export const coreManifest: PluginManifest = {
  info: {
    name: 'DBeaver core',
  },
  depends: [],

  providers: [
    RouterService, // important, should be first because the router starts in load phase first after all plugins register phase
    NetworkStateService,
    AdministrationLocaleService,
    AdministrationTopAppBarService,
    AdministrationScreenService,
    AdministrationScreenServiceBootstrap,
    AdministrationItemService,
    AdministrationTopAppBarBootstrapService,
    ConfigurationWizardService,
    WizardTopAppBarService,
    ActiveViewService,
    ProductSettingsService,
    ProductManagerService,
    PluginManagerService,
    AppAuthService,
    AuthInfoService,
    AuthProviderService,
    AuthProvidersResource,
    RolesManagerService,
    RolesResource,
    UserInfoResource,
    UsersResource,
    ServerSettingsService,
    ServerConfigResource,
    PermissionsResource,
    SessionResource,
    SessionDataResource,
    SessionSettingsService,
    PermissionsService,
    CoreSettingsService,
    CommonDialogService,
    ClipboardService,
    ClipboardBootstrap,
    SessionExpireService,
    SessionExpireWarningDialogService,
    SessionExpiredDialogService,
    ConnectionsLocaleService,
    ConnectionFormService,
    ConnectionOptionsTabService,
    ConnectionSSHTabService,
    ConnectionOriginInfoTabService,
    ConnectionAccessTabService,
    ConnectionDriverPropertiesTabService,
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
    NavigationService,
    OptionsPanelService,
    GraphQLService,
    LocalStorageSaveService,
    LocalizationService,
    LogViewerBootstrap,
    LogViewerService,
    MainMenuService,
    TopNavService,
    NavigationTabsService,
    DatabaseAuthModelsResource,
    ConnectionAuthService,
    ConnectionsAdministrationNavService,
    ConnectionManualService,
    ConnectionSearchService,
    CreateConnectionBaseBootstrap,
    CreateConnectionService,
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
};
