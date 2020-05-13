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

import { BasicConnectionService } from './BasicConnectionService';
import { ConnectionDialog } from './ConnectionDialog/ConnectionDialog';

@injectable()
export class BasicConnectionPluginBootstrap {

  constructor(
    private connectionDialogsService: ConnectionDialogsService,
    private mainMenuService: MainMenuService,
    private basicConnectionService: BasicConnectionService,
    private commonDialogService: CommonDialogService,
  ) {
  }

  bootstrap() {
    this.basicConnectionService.dbSources.load();
    this.mainMenuService.registerMenuItem(
      this.connectionDialogsService.newConnectionMenuToken,
      {
        id: 'mainMenuConnect',
        order: 2,
        title: 'basicConnection_main_menu_item',
        onClick: () => this.openConnectionsDialog(),
        isDisabled: () => !this.basicConnectionService.dbSources.data.length,
      }
    );
  }

  private async openConnectionsDialog() {
    await this.commonDialogService.open(ConnectionDialog, null);
  }
}
