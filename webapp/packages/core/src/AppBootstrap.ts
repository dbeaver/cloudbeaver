/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  ConnectionDialogsService,
  NavigationTabsService, NavigationTreeContextMenuService, LogViewerMenuService, ConnectionSchemaManagerService,
} from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';
import { SessionExpireService } from '@dbeaver/core/dialogs';
import { ExceptionsCatcherService } from '@dbeaver/core/eventsLog';
import { LocalizationService } from '@dbeaver/core/localization';
import { ThemeService } from '@dbeaver/core/theming';


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
  }
}
