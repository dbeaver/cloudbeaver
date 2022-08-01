/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { PermissionsService, EPermission } from '@cloudbeaver/core-root';
import { MainMenuService, EMainMenu } from '@cloudbeaver/plugin-top-app-bar';

import { ConnectionDialog } from './ConnectionDialog/ConnectionDialog';
import { TemplateConnectionsResource } from './TemplateConnectionsResource';

@injectable()
export class TemplateConnectionPluginBootstrap extends Bootstrap {
  constructor(
    private readonly mainMenuService: MainMenuService,
    private readonly templateConnectionsResource: TemplateConnectionsResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
    private readonly permissionsService: PermissionsService
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.mainMenuService.onConnectionClick.addHandler(this.loadTemplateConnections.bind(this));
    this.mainMenuService.registerMenuItem(EMainMenu.mainMenuConnectionsPanel, {
      id: 'mainMenuConnect',
      order: 1,
      titleGetter: this.getMenuTitle.bind(this),
      onClick: this.openConnectionsDialog.bind(this),
      isHidden: () => !this.permissionsService.has(EPermission.public) || !this.templateConnectionsResource.data.length,
    });
  }

  load(): void | Promise<void> { }

  private getMenuTitle(): string {
    if (this.templateConnectionsResource.isLoading()) {
      return 'ui_processing_loading';
    }
    return 'basicConnection_main_menu_item';
  }

  private async openConnectionsDialog() {
    this.loadTemplateConnections();
    await this.commonDialogService.open(ConnectionDialog, null);
  }

  private async loadTemplateConnections() {
    try {
      await this.templateConnectionsResource.load();
    } catch (error: any) {
      this.notificationService.logException(error, 'Template Connections loading failed');
    }
  }
}
