/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { MainMenuService, ConnectionDialogsService } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { PermissionsService, EPermission } from '@cloudbeaver/core-root';

import { ConnectionDialog } from './ConnectionDialog/ConnectionDialog';
import { TemplateDataSourceListResource } from './DataSourcesResource';

@injectable()
export class BasicConnectionPluginBootstrap {

  constructor(
    private connectionDialogsService: ConnectionDialogsService,
    private mainMenuService: MainMenuService,
    private templateDataSourceListResource: TemplateDataSourceListResource,
    private commonDialogService: CommonDialogService,
    private notificationService: NotificationService,
    private permissionsService: PermissionsService
  ) {
  }

  bootstrap() {
    this.loadDbSources();
    this.mainMenuService.registerMenuItem(
      this.connectionDialogsService.newConnectionMenuToken,
      {
        id: 'mainMenuConnect',
        order: 2,
        title: 'basicConnection_main_menu_item',
        onClick: () => this.openConnectionsDialog(),
        isHidden: () => !this.permissionsService.has(EPermission.public),
        isDisabled: () => !this.templateDataSourceListResource.data.length,
      }
    );
  }

  private async openConnectionsDialog() {
    this.loadDbSources();
    await this.commonDialogService.open(ConnectionDialog, null);
  }

  private async loadDbSources() {
    try {
      await this.templateDataSourceListResource.loadAll();
    } catch (error) {
      this.notificationService.logException(error, 'Template Data Sources loading failed');
    }
  }
}
