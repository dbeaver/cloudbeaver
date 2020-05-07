/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  ConnectionDialogsService,
  ConnectionsManagerService,
  NodesManagerService,
  NavigationTabsService, NavigationTreeContextMenuService, LogViewerMenuService, ConnectionSchemaManagerService,
} from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';
import { ExceptionsCatcherService } from '@dbeaver/core/eventsLog';
import { ThemeService } from '@dbeaver/core/theming';

import { SessionExpireService } from './dialogs';
import { LocalizationService } from './localization';
import { PermissionsService } from './root';

/**
 * AppBootstrap.init() will be executed between first and second phase of App initialization,
 * when application has registered all dependencies but plugins did'nt initialized.
 * It is required to run this code in front of other initialization steps.
 *
 */
@injectable()
export class AppBootstrap {

  constructor(private exceptionsCatcherService: ExceptionsCatcherService,
              private localizationService: LocalizationService,
              private themeService: ThemeService,
              private connectionDialogService: ConnectionDialogsService,
              private connectionsManager: ConnectionsManagerService,
              private logViewerMenuService: LogViewerMenuService,
              private sessionExpireService: SessionExpireService,
              private navigationTreeContextMenuService: NavigationTreeContextMenuService,
              private nodesManagerService: NodesManagerService,
              private navigationTabsService: NavigationTabsService,
              private connectionSchemaManagerService: ConnectionSchemaManagerService,
              private permissionsService: PermissionsService) {
  }

  async init() {
    this.exceptionsCatcherService.subscribe();
    this.sessionExpireService.subscribe();

    await this.localizationService.init();
    await this.themeService.init();
    await this.permissionsService.update();

    this.connectionSchemaManagerService.registerCallbacks();
    this.navigationTreeContextMenuService.registerMenuItems();
    this.connectionDialogService.registerMenuItems();
    this.logViewerMenuService.registerMenuItems();

    await this.connectionsManager.restoreConnections();

    await this.nodesManagerService.updateRootChildren();
  }

  async doAfterPluginsInit() {
    // todo this should be moved to the NavigationTabs component creation phase but now it leads to bugs
    await this.navigationTabsService.restoreTabs();
  }
}
