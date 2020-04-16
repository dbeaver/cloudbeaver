/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  MainMenuService, ConnectionDialogsService,
} from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';
import { CommonDialogService } from '@dbeaver/core/dialogs';

import { CustomConnectionDialog } from './CustomConnection/CustomConnectionDialog';

@injectable()
export class CustomConnectionPluginBootstrap {

  constructor(private connectionDialogsService: ConnectionDialogsService,
              private mainMenuService: MainMenuService,
              private commonDialogService: CommonDialogService) {
  }

  bootstrap() {
    this.mainMenuService.registerMenuItem(
      this.connectionDialogsService.newConnectionMenuToken,
      {
        id: 'сustomConnection',
        order: 1,
        title: 'app_shared_connectionMenu_custom',
        onClick: () => this.openConnectionsDialog(),
      }
    );
  }

  private async openConnectionsDialog() {
    await this.commonDialogService.open(CustomConnectionDialog, null);
  }

}
