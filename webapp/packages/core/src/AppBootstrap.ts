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
import { SessionService } from '@dbeaver/core/root';
import { ThemeService } from '@dbeaver/core/theming';

/**
 * AppBootstrap.init() will be executed between first and second phase of App initialization,
 * when application has registered all dependencies but plugins did'nt initialized.
 * It is required to run this code in front of other initialization steps.
 *
 */
@injectable()
export class AppBootstrap {

  constructor(private exceptionsCatcherService: ExceptionsCatcherService,
              private sessionService: SessionService,
              private themeService: ThemeService,
              private connectionDialogService: ConnectionDialogsService,
              private connectionsManager: ConnectionsManagerService,
              private logViewerMenuService: LogViewerMenuService,
              private navigationTreeContextMenuService: NavigationTreeContextMenuService,
              private nodesManagerService: NodesManagerService,
              private navigationTabsService: NavigationTabsService,
              private connectionSchemaManagerService: ConnectionSchemaManagerService) {
  }

  async init() {
    this.exceptionsCatcherService.subscribe();

    await this.sessionService.init();
    await this.themeService.init();

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
