/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { MainMenuService, ConnectionDialogsService, EMainMenu } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { PermissionsService, EPermission } from '@cloudbeaver/core-root';

import { ConnectionDialog } from './ConnectionDialog/ConnectionDialog';
import { TemplateConnectionsResource } from './TemplateConnectionsResource';

@injectable()
export class TemplateConnectionPluginBootstrap {

  constructor(
    private connectionDialogsService: ConnectionDialogsService,
    private mainMenuService: MainMenuService,
    private templateConnectionsResource: TemplateConnectionsResource,
    private commonDialogService: CommonDialogService,
    private notificationService: NotificationService,
    private permissionsService: PermissionsService
  ) {
  }

  bootstrap() {
    this.loadTemplateConnections();
    this.mainMenuService.registerMenuItem(EMainMenu.mainMenuConnectionsPanel, {
      id: 'mainMenuConnect',
      order: 2,
      title: 'basicConnection_main_menu_item',
      onClick: () => this.openConnectionsDialog(),
      isHidden: () => !this.permissionsService.has(EPermission.public),
      isDisabled: () => this.isDisabled(),
    });
  }

  private async openConnectionsDialog() {
    this.loadTemplateConnections();
    await this.commonDialogService.open(ConnectionDialog, null);
  }

  private isDisabled() {
    this.loadTemplateConnections();
    return !this.templateConnectionsResource.data.length;
  }

  private async loadTemplateConnections() {
    try {
      await this.templateConnectionsResource.loadAll();
    } catch (error) {
      this.notificationService.logException(error, 'Template Connections loading failed');
    }
  }
}
