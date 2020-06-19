/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  ConnectionDialogsService,
  NavigationTabsService,
  NavigationTreeContextMenuService,
  LogViewerMenuService,
  ConnectionSchemaManagerService,
  RouterService,
  AppScreenService,
} from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { SessionExpireService } from '@cloudbeaver/core-dialogs';
import { ExceptionsCatcherService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ThemeService } from '@cloudbeaver/core-theming';

/**
 * AppBootstrap.init() will be executed between first and second phase of App initialization,
 * when application has registered all dependencies but plugins did'nt initialized.
 * It is required to run this code in front of other initialization steps.
 *
 */
@injectable()
export class AppBootstrap {

  constructor(
    private exceptionsCatcherService: ExceptionsCatcherService,
    private localizationService: LocalizationService,
    private themeService: ThemeService,
    private routerService: RouterService,
    private appScreenService: AppScreenService,
    private connectionDialogService: ConnectionDialogsService,
    private logViewerMenuService: LogViewerMenuService,
    private sessionExpireService: SessionExpireService,
    private navigationTreeContextMenuService: NavigationTreeContextMenuService,
    private navigationTabsService: NavigationTabsService,
    private connectionSchemaManagerService: ConnectionSchemaManagerService,
  ) { }

  async init() {
    this.exceptionsCatcherService.subscribe();
    this.sessionExpireService.subscribe();

    this.appScreenService.register();
    await this.localizationService.init();
    await this.themeService.init();

    this.connectionSchemaManagerService.registerCallbacks();
    this.navigationTreeContextMenuService.registerMenuItems();
    this.connectionDialogService.registerMenuItems();
    this.logViewerMenuService.registerMenuItems();
  }

  async doAfterPluginsInit() {
    // todo this should be moved to the NavigationTabs component creation phase but now it leads to bugs
    await this.navigationTabsService.restoreTabs();
    this.routerService.start();
  }
}
