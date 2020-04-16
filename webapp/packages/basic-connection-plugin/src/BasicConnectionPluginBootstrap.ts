/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { MainMenuService, ConnectionDialogsService } from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';
import { CommonDialogService } from '@dbeaver/core/dialogs';
import { NotificationService } from '@dbeaver/core/eventsLog';

import { BasicConnectionService } from './BasicConnectionService';
import { ConnectionDialog } from './ConnectionDialog/ConnectionDialog';

@injectable()
export class BasicConnectionPluginBootstrap {

  private hasPreconfiguredConnection = false;

  constructor(private connectionDialogsService: ConnectionDialogsService,
              private mainMenuService: MainMenuService,
              private basicConnectionService: BasicConnectionService,
              private notificationService: NotificationService,
              private commonDialogService: CommonDialogService) {
  }

  bootstrap() {
    this.loadDbSources();
    this.mainMenuService.registerMenuItem(
      this.connectionDialogsService.newConnectionMenuToken,
      {
        id: 'mainMenuConnect',
        order: 2,
        title: 'Preconfigured',
        onClick: () => this.openConnectionsDialog(),
        isDisabled: () => !this.hasPreconfiguredConnection,
      }
    );
  }

  private async openConnectionsDialog() {
    await this.commonDialogService.open(ConnectionDialog, null);
  }

  private async loadDbSources() {
    try {
      const sources = await this.basicConnectionService.loadDBSourcesAsync();
      this.hasPreconfiguredConnection = !!sources.length;
    } catch (error) {
      this.notificationService.logException(error, 'DBSources loading failed');
    }
  }

}
