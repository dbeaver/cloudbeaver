/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  ConnectionDialogsService, ConnectionsManagerService,
  MainMenuService, NavigationService, NavigationTreeService, NodesManagerService,
  ConnectionSchemaManagerService, NavigationTabsService,
  NavigationTreeContextMenuService,
  SettingsMenuService, LogViewerService, LogViewerMenuService,
} from '@dbeaver/core/app';
import { PluginManifest } from '@dbeaver/core/di';
import { CommonDialogService, ContextMenuService, SessionExpireService } from '@dbeaver/core/dialogs';
import { NotificationService, ExceptionsCatcherService } from '@dbeaver/core/eventsLog';
import { LocalizationService } from '@dbeaver/core/localization';
import { SessionService, ServerService } from '@dbeaver/core/root';
import { EnvironmentService, GraphQLService } from '@dbeaver/core/sdk';
import { LocalStorageSaveService, SettingsService } from '@dbeaver/core/settings';
import { ThemeService } from '@dbeaver/core/theming';

export const coreManifest: PluginManifest = {
  info: {
    name: 'DBeaver core',
  },
  depends: [],

  providers: [
    CommonDialogService,
    SessionExpireService,
    ConnectionDialogsService,
    ConnectionSchemaManagerService,
    ConnectionsManagerService,
    ContextMenuService,
    EnvironmentService,
    ExceptionsCatcherService,
    GraphQLService,
    LocalStorageSaveService,
    LocalizationService,
    LogViewerMenuService,
    LogViewerService,
    MainMenuService,
    NavigationService,
    NavigationTabsService,
    NavigationTreeContextMenuService,
    NavigationTreeService,
    NodesManagerService,
    NotificationService,
    SessionService,
    SettingsMenuService,
    SettingsService,
    ThemeService,
    ServerService,
  ],

  async initialize(services) {
    // Note that the initialization of the core occurs in AppBootstrap
    // and it is called before the initialization phase of all manifests
  },

};
